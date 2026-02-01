import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getDbPath } from "@src/cli/utils";
import { AMALFA_DIRS } from "@src/config/defaults";
import { getLogger } from "@src/utils/Logger";
import { Glob } from "bun";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const log = getLogger("Dashboard");
const PORT = 3013;
const PID_FILE = join(AMALFA_DIRS.runtime, "dashboard.pid");

export class DashboardDaemon {
	private server: ReturnType<typeof Bun.serve> | null = null;
	private app: Hono;

	constructor() {
		this.app = new Hono();
		this.setupRoutes();
	}

	private setupRoutes() {
		// 1. Static Assets (PolyVis UI)
		// Serve everything in ./public as root assets (css, js, etc)
		this.app.use("/*", serveStatic({ root: "./public" }));

		// 2. Dynamic Docs Index
		this.app.get("/index.json", async (c) => {
			const docs = await this.discoverDocs();
			return c.json(docs);
		});

		// 3. Documentation Content Serving
		// Map /docs/* to the project root so we can access ./docs and ./briefs
		// The app fetches /docs/${filename}. We strip /docs prefix to map to root relative paths.
		this.app.use(
			"/docs/*",
			serveStatic({
				root: "./",
				rewriteRequestPath: (path) => path.replace(/^\/docs/, ""),
			}),
		);

		// 4. Serve Database for Graph Explorer
		this.app.get("/resonance.db", async (c) => {
			const dbPath = await getDbPath();
			const fileData = readFileSync(dbPath);

			return c.body(fileData, 200, {
				"Content-Type": "application/x-sqlite3",
				"Content-Length": fileData.length.toString(),
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET",
			});
		});

		// API endpoints (Stats)
		this.app.get("/api/stats", async (c) => {
			const stats = await this.getSystemStats();
			return c.json(stats);
		});

		this.app.get("/api/services", async (c) => {
			const services = await this.getServiceStatus();
			return c.json(services);
		});

		// Service Management
		this.app.post("/api/services/:name/:action", async (c) => {
			const name = c.req.param("name");
			const action = c.req.param("action");

			const map: Record<string, string> = {
				"Vector Daemon": "vector",
				"Reranker Daemon": "reranker",
				"Sonar Agent": "sonar",
				Harvester: "watcher",
				Dashboard: "dashboard",
			};

			const cliCmd = map[name];
			if (!cliCmd || !["start", "stop", "restart"].includes(action)) {
				return c.json({ error: "Invalid service or action" }, 400);
			}

			try {
				const cmd = ["bun", "src/cli.ts", cliCmd, action];
				const proc = Bun.spawn(cmd, {
					stdout: "pipe",
					stderr: "pipe",
				});

				// We don't wait for 'start' commands that might be long-running,
				// but 'amalfa daemon start' usually daemonizes and exits.
				const output = await new Response(proc.stdout).text();
				await proc.exited;

				return c.json({ success: true, output });
			} catch (e) {
				return c.json({ error: String(e) }, 500);
			}
		});

		this.app.get("/api/harvest", async (c) => {
			const harvest = await this.getHarvestStats();
			return c.json(harvest);
		});

		this.app.get("/api/runs", async (c) => {
			const runs = await this.getRecentRuns();
			return c.json(runs);
		});

		// Health check
		this.app.get("/health", (c) =>
			c.json({ status: "ok", uptime: process.uptime() }),
		);

		// Health check (alias for frontend compatibility)
		this.app.get("/api/health", (c) =>
			c.json({ status: "ok", uptime: process.uptime() }),
		);
	}

	private async discoverDocs() {
		const files: { file: string; title: string; category: string }[] = [];
		const glob = new Glob("**/*.md");

		// Scan docs/
		for (const file of glob.scanSync("./docs")) {
			if (file.includes("node_modules")) continue;
			files.push({
				file: `docs/${file}`,
				title: file.split("/").pop()?.replace(".md", "") || file,
				category: "docs",
			});
		}

		// Scan briefs/
		for (const file of glob.scanSync("./briefs")) {
			files.push({
				file: `briefs/${file}`,
				title: file.split("/").pop()?.replace(".md", "") || file,
				category: "briefs",
			});
		}

		return files;
	}

	private async getSystemStats() {
		const { ResonanceDB } = await import("@src/resonance/db");
		// const { getDbPath } = await import("@src/cli/utils"); // Now imported top-level
		const dbPath = await getDbPath();
		const db = new ResonanceDB(dbPath);
		const stats = db.getStats();
		db.close();

		return {
			database: {
				nodes: stats.nodes,
				edges: stats.edges,
				vectors: stats.vectors,
				size_mb: stats.db_size_bytes / (1024 * 1024),
			},
			timestamp: new Date().toISOString(),
		};
	}

	private async getServiceStatus() {
		const services = [
			{
				name: "Vector Daemon",
				port: 3010,
				pidFile: ".amalfa/runtime/vector-daemon.pid",
			},
			{
				name: "Reranker Daemon",
				port: 3011,
				pidFile: ".amalfa/runtime/reranker-daemon.pid",
			},
			{ name: "Sonar Agent", port: 3012, pidFile: ".amalfa/runtime/sonar.pid" },
			{ name: "Dashboard", port: 3013, pidFile: PID_FILE },
			{ name: "Harvester", port: 0, pidFile: ".amalfa/runtime/daemon.pid" },
		];

		return services.map((svc) => ({
			name: svc.name,
			port: svc.port,
			status: existsSync(svc.pidFile) ? "running" : "stopped",
			pid: existsSync(svc.pidFile)
				? readFileSync(svc.pidFile, "utf-8").trim()
				: null,
		}));
	}

	private async getHarvestStats() {
		const manifestPath = ".amalfa/harvest-skipped.json";
		const cacheDir = ".amalfa/cache/lang-extract";

		let manifest = { timeouts: [], too_large: [], errors: [] };
		if (existsSync(manifestPath)) {
			manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
		}

		let cacheCount = 0;
		if (existsSync(cacheDir)) {
			const { readdirSync } = await import("node:fs");
			cacheCount = readdirSync(cacheDir).filter((f) =>
				f.endsWith(".json"),
			).length;
		}

		return {
			cached: cacheCount,
			skipped: {
				timeouts: manifest.timeouts.length,
				too_large: manifest.too_large.length,
				errors: manifest.errors.length,
			},
			manifest,
		};
	}

	private async getRecentRuns() {
		const runsFile = ".amalfa/runs.jsonl";
		if (!existsSync(runsFile)) return [];

		const lines = readFileSync(runsFile, "utf-8")
			.split("\n")
			.filter((l) => l.trim());

		return lines
			.slice(-10)
			.reverse()
			.map((line) => JSON.parse(line));
	}

	public async start() {
		if (this.server) {
			log.warn("Dashboard already running");
			return;
		}

		// Check if port is in use
		if (existsSync(PID_FILE)) {
			const pid = readFileSync(PID_FILE, "utf-8").trim();
			log.warn({ pid }, "Dashboard may already be running");
		}

		this.server = Bun.serve({
			port: PORT,
			fetch: this.app.fetch,
		});

		// Write PID file
		writeFileSync(PID_FILE, String(process.pid));

		log.info({ port: PORT, pid: process.pid }, "Dashboard started");
		console.log(`\n🎯 Dashboard running at http://localhost:${PORT}\n`);
	}

	public async stop() {
		if (!this.server) {
			log.warn("Dashboard not running");
			return;
		}

		this.server.stop();
		this.server = null;

		// Remove PID file
		if (existsSync(PID_FILE)) {
			unlinkSync(PID_FILE);
		}

		log.info("Dashboard stopped");
	}

	public isRunning(): boolean {
		return this.server !== null;
	}
}

// CLI entry point
if (import.meta.main) {
	const daemon = new DashboardDaemon();
	await daemon.start();

	// Graceful shutdown
	process.on("SIGINT", async () => {
		await daemon.stop();
		process.exit(0);
	});

	process.on("SIGTERM", async () => {
		await daemon.stop();
		process.exit(0);
	});
}
