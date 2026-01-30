import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { getLogger } from "@src/utils/Logger";
import { existsSync, writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { AMALFA_DIRS } from "@src/config/defaults";
import { join } from "node:path";

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
		// Static assets
		this.app.use("/assets/*", serveStatic({ root: "./public" }));
		this.app.use("/graph.html", serveStatic({ path: "./public/graph.html" }));
		this.app.use("/docs.html", serveStatic({ path: "./public/docs.html" }));

		// Summary page (root)
		this.app.get("/", async (c) => {
			const stats = await this.getSystemStats();
			return c.html(this.renderSummary(stats));
		});

		// API endpoints
		this.app.get("/api/stats", async (c) => {
			const stats = await this.getSystemStats();
			return c.json(stats);
		});

		this.app.get("/api/services", async (c) => {
			const services = await this.getServiceStatus();
			return c.json(services);
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
	}

	private async getSystemStats() {
		const { ResonanceDB } = await import("@src/resonance/db");
		const db = new ResonanceDB();
		const stats = db.getStats();
		db.close();

		return {
			database: {
				nodes: stats.nodes,
				edges: stats.edges,
				vectors: stats.vectors,
				size_mb: (stats.db_size_bytes / (1024 * 1024)).toFixed(2),
			},
			timestamp: new Date().toISOString(),
		};
	}

	private async getServiceStatus() {
		const services = [
			{ name: "Vector Daemon", port: 3010, pidFile: ".amalfa/pids/vector.pid" },
			{
				name: "Reranker Daemon",
				port: 3011,
				pidFile: ".amalfa/pids/reranker.pid",
			},
			{ name: "Sonar Agent", port: 3012, pidFile: ".amalfa/pids/sonar.pid" },
			{ name: "Dashboard", port: 3013, pidFile: PID_FILE },
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

	private renderSummary(stats: any) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Amalfa Dashboard</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
  <style>
    body { padding: 2rem; }
    .grid { margin-bottom: 2rem; }
    .card { padding: 1.5rem; background: var(--pico-card-background-color); border-radius: var(--pico-border-radius); }
    .metric { font-size: 2rem; font-weight: bold; color: var(--pico-primary); }
    .label { font-size: 0.875rem; color: var(--pico-muted-color); text-transform: uppercase; }
    .status-running { color: #4caf50; }
    .status-stopped { color: #f44336; }
  </style>
</head>
<body>
  <header>
    <h1>🎯 Amalfa Monitoring Dashboard</h1>
    <p>Real-time system health and service status</p>
  </header>

  <main>
    <section>
      <h2>Database Statistics</h2>
      <div class="grid">
        <div class="card">
          <div class="label">Nodes</div>
          <div class="metric">${stats.database.nodes}</div>
        </div>
        <div class="card">
          <div class="label">Edges</div>
          <div class="metric">${stats.database.edges}</div>
        </div>
        <div class="card">
          <div class="label">Embeddings</div>
          <div class="metric">${stats.database.embeddings}</div>
        </div>
        <div class="card">
          <div class="label">DB Size</div>
          <div class="metric">${stats.database.size_mb.toFixed(2)} MB</div>
        </div>
      </div>
    </section>

    <section>
      <h2>Quick Links</h2>
      <div class="grid">
        <a href="/graph.html" role="button">📊 Graph Visualization</a>
        <a href="/docs.html" role="button">📚 Document Browser</a>
        <a href="/api/stats" role="button" class="secondary">🔌 API Stats</a>
        <a href="/api/services" role="button" class="secondary">⚙️ Service Status</a>
      </div>
    </section>

    <section>
      <h2>Services</h2>
      <div id="services">Loading...</div>
    </section>

    <section>
      <h2>Harvest Cache</h2>
      <div id="harvest">Loading...</div>
    </section>
  </main>

  <script>
    // Fetch service status
    fetch('/api/services')
      .then(r => r.json())
      .then(services => {
        document.getElementById('services').innerHTML = services.map(s => 
          \`<article>
            <strong>\${s.name}</strong> 
            <span class="status-\${s.status}">\${s.status}</span>
            <small>Port: \${s.port}\${s.pid ? \` | PID: \${s.pid}\` : ''}</small>
          </article>\`
        ).join('');
      });

    // Fetch harvest stats
    fetch('/api/harvest')
      .then(r => r.json())
      .then(harvest => {
        document.getElementById('harvest').innerHTML = \`
          <div class="grid">
            <div class="card">
              <div class="label">Cached Files</div>
              <div class="metric">\${harvest.cached}</div>
            </div>
            <div class="card">
              <div class="label">Timeouts</div>
              <div class="metric">\${harvest.skipped.timeouts}</div>
            </div>
            <div class="card">
              <div class="label">Too Large</div>
              <div class="metric">\${harvest.skipped.too_large}</div>
            </div>
            <div class="card">
              <div class="label">Errors</div>
              <div class="metric">\${harvest.skipped.errors}</div>
            </div>
          </div>
        \`;
      });

    // Auto-refresh every 5 seconds
    setInterval(() => location.reload(), 5000);
  </script>
</body>
</html>`;
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
