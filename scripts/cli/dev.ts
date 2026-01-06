import { extname, join } from "node:path";
import { ServiceLifecycle } from "../../src/utils/ServiceLifecycle";

// Configuration
const PUBLIC_DIR = "public";

const args = process.argv.slice(2);
const command = args[0] || "serve";

// --- Service Lifecycle ---

const lifecycle = new ServiceLifecycle({
	name: "Dev Server",
	pidFile: ".dev.pid",
	logFile: ".dev.log",
	entryPoint: "scripts/cli/dev.ts",
});

// --- Server Logic (Interactive Dev Environment) ---

async function runServer() {
	console.log("🚀 Starting Polyvis Development Environment...");

	// 0.5 Clean stale build artifacts
	const cssPath = join(PUBLIC_DIR, "css", "app.css");
	const cssFile = Bun.file(cssPath);
	console.log("🧹 Cleaning stale CSS artifact...");
	await Bun.write(cssFile, "");
	if (await cssFile.exists()) {
		try {
			await Bun.spawn(["rm", cssPath]).exited;
		} catch {}
	}

	// 0.6 Ensure valid initial build
	console.log("🔨 Running initial CSS build...");
	await Bun.spawn(["bun", "run", "build:css"], {
		stdout: "inherit",
		stderr: "inherit",
	}).exited;

	// 1. Start Watchers
	console.log("🎨 Starting CSS Watcher...");
	const cssWatcher = Bun.spawn(["bun", "run", "watch:css"], {
		stdout: "inherit",
		stderr: "inherit",
	});

	console.log("📜 Starting JS Watcher...");
	const jsWatcher = Bun.spawn(["bun", "run", "watch:js"], {
		stdout: "inherit",
		stderr: "inherit",
	});

	// 2. Start Web Server
	const PORT = parseInt(process.env.PORT || "3000", 10);
	console.log(`🌍 Starting Web Server at http://localhost:${PORT}...`);

	const server = Bun.serve({
		port: PORT,
		async fetch(req) {
			const url = new URL(req.url);
			let path = url.pathname;
			if (path === "/") path = "/index.html";

			const filePath = join(PUBLIC_DIR, path);
			const file = Bun.file(filePath);

			// API: Graph Health Metrics
			if (path === "/api/health") {
				try {
					const { DatabaseFactory } = await import(
						"../../src/resonance/DatabaseFactory"
					);
					const settings = await import("../../polyvis.settings.json");
					const db = DatabaseFactory.connect(
						settings.default.paths.database.resonance,
						{ readonly: true },
					);

					const N = (
						db
							.query(
								"SELECT COUNT(*) as c FROM nodes WHERE type != 'root' AND type != 'domain'",
							)
							.get() as { c: number }
					).c;
					const E = (
						db.query("SELECT COUNT(*) as c FROM edges").get() as { c: number }
					).c;
					const nodes = db
						.query(
							"SELECT id FROM nodes WHERE type != 'root' AND type != 'domain'",
						)
						.all() as { id: string }[];
					const edges = db.query("SELECT source, target FROM edges").all() as {
						source: string;
						target: string;
					}[];

					db.close();

					const avgDegree = (2 * E) / N;
					const maxEdges = (N * (N - 1)) / 2;
					const density = maxEdges > 0 ? E / maxEdges : 0;

					const adj = new Map<string, string[]>();
					nodes.forEach((n) => {
						adj.set(n.id, []);
					});
					edges.forEach((e) => {
						if (adj.has(e.source)) adj.get(e.source)?.push(e.target);
						if (adj.has(e.target)) adj.get(e.target)?.push(e.source);
					});

					const visited = new Set<string>();
					let components = 0;
					let giantCompSize = 0;

					for (const node of nodes) {
						if (visited.has(node.id)) continue;
						let size = 0;
						const stack = [node.id];
						visited.add(node.id);
						while (stack.length > 0) {
							const curr = stack.pop();
							if (!curr) continue;
							size++;
							const neighbors = adj.get(curr) || [];
							for (const neighbor of neighbors) {
								if (!visited.has(neighbor)) {
									visited.add(neighbor);
									stack.push(neighbor);
								}
							}
						}
						components++;
						if (size > giantCompSize) giantCompSize = size;
					}

					return new Response(
						JSON.stringify({
							nodes: N,
							edges: E,
							density: Number(density.toFixed(4)),
							avgDegree: Number(avgDegree.toFixed(2)),
							components: components,
							giantCompPercent: Number(((giantCompSize / N) * 100).toFixed(1)),
						}),
						{ headers: { "Content-Type": "application/json" } },
					);
				} catch (e) {
					console.error("API Health Error:", e);
					return new Response(
						JSON.stringify({ error: "Failed to analyze graph" }),
						{ status: 500 },
					);
				}
			}

			return file.exists().then(async (exists) => {
				if (exists) return new Response(file);
				const htmlPath = `${filePath}.html`;
				if (await Bun.file(htmlPath).exists())
					return new Response(Bun.file(htmlPath));
				if (!extname(path)) {
					const indexPath = join(filePath, "index.html");
					if (await Bun.file(indexPath).exists())
						return new Response(Bun.file(indexPath));
				}
				return new Response("404 Not Found", { status: 404 });
			});
		},
	});

	// Handle cleanup on exit
	const cleanup = () => {
		console.log("\n🛑 Shutting down...");
		cssWatcher.kill();
		jsWatcher.kill();
		server.stop();
		process.exit(0);
	};

	process.on("SIGINT", cleanup);
	process.on("SIGTERM", cleanup);
}

// --- Dispatch ---

await lifecycle.run(command, runServer);
