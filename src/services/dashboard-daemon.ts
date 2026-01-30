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
		const { getDbPath } = await import("@src/cli/utils");
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
			{ name: "Squash", port: 0, pidFile: ".amalfa/runtime/squash.pid" },
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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      padding: 1rem; 
      font-size: 0.875rem;
      line-height: 1.4;
    }
    h1 { 
      font-size: 1.25rem; 
      margin-bottom: 0.5rem;
    }
    h2 { 
      font-size: 1rem; 
      margin: 0.75rem 0 0.5rem 0;
      border-bottom: 1px solid var(--pico-muted-border-color);
      padding-bottom: 0.25rem;
    }
    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .stat-box {
      padding: 0.5rem;
      background: var(--pico-card-background-color);
      border-radius: 4px;
      text-align: center;
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--pico-muted-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--pico-primary);
      font-family: 'Courier New', monospace;
    }
    table {
      width: 100%;
      font-size: 0.8rem;
      margin: 0;
    }
    table th {
      padding: 0.25rem 0.5rem;
      text-align: left;
      font-size: 0.75rem;
    }
    table td {
      padding: 0.25rem 0.5rem;
    }
    .status-running { color: #4caf50; font-weight: bold; }
    .status-stopped { color: #999; }
    .links {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    .links a {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      text-decoration: none;
      border-radius: 4px;
      background: var(--pico-primary);
      color: white;
    }
    .compact-section {
      margin-bottom: 1rem;
    }
    small { font-size: 0.7rem; color: var(--pico-muted-color); }
    code { font-size: 0.75rem; background: var(--pico-muted-border-color); padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>🎯 Amalfa Dashboard</h1>
  
  <div class="compact-section">
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-label">Nodes</div>
        <div class="stat-value">${stats.database.nodes}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Edges</div>
        <div class="stat-value">${stats.database.edges}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Vectors</div>
        <div class="stat-value">${stats.database.vectors}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">DB Size</div>
        <div class="stat-value">${stats.database.size_mb.toFixed(1)}<small>MB</small></div>
      </div>
    </div>
  </div>

  <div class="compact-section">
    <h2>Services</h2>
    <table id="services">
      <thead>
        <tr><th>Service</th><th>Port</th><th>Status</th><th>PID</th></tr>
      </thead>
      <tbody><tr><td colspan="4">Loading...</td></tr></tbody>
    </table>
  </div>

  <div class="compact-section">
    <h2>Command Reference</h2>
    <table>
      <thead><tr><th>Action</th><th>Command</th></tr></thead>
      <tbody>
        <tr><td><strong>Manage All</strong></td><td><code>amalfa servers [start|stop|restart]</code></td></tr>
        <tr><td><strong>Stop All</strong></td><td><code>amalfa stop-all</code></td></tr>
        <tr><td><strong>Manage Service</strong></td><td><code>amalfa [vector|reranker|sonar] [start|stop]</code></td></tr>
        <tr><td><strong>Harvest</strong></td><td><code>amalfa harvest [path]</code></td></tr>
      </tbody>
    </table>
  </div>

  <div class="compact-section">
    <h2>Harvest Cache</h2>
    <div id="harvest">Loading...</div>
  </div>

  <div class="compact-section">
    <h2>Recent Activity</h2>
    <div id="runs">Loading...</div>
  </div>

  <div class="links">
    <a href="/graph.html">📊 Graph</a>
    <a href="/docs.html">📚 Docs</a>
    <a href="/api/stats">🔌 API</a>
  </div>

  <script>
    // Fetch service status
    fetch('/api/services')
      .then(r => r.json())
      .then(services => {
        const rows = services.map(s => 
          '<tr><td>' + s.name + '</td><td>' + (s.port || '-') + '</td><td class="status-' + s.status + '">' + (s.status === 'running' ? '🟢' : '⚪️') + ' ' + s.status + '</td><td>' + (s.pid || '-') + '</td></tr>'
        ).join('');
        document.getElementById('services').innerHTML = '<thead><tr><th>Service</th><th>Port</th><th>Status</th><th>PID</th></tr></thead><tbody>' + rows + '</tbody>';
      });

    // Fetch harvest stats
    fetch('/api/harvest')
      .then(r => r.json())
      .then(harvest => {
        document.getElementById('harvest').innerHTML = '<table><tr><td><strong>' + harvest.cached + '</strong> cached</td><td><strong>' + harvest.skipped.timeouts + '</strong> timeouts</td><td><strong>' + harvest.skipped.too_large + '</strong> too large</td><td><strong>' + harvest.skipped.errors + '</strong> errors</td></tr></table>';
      });

    // Fetch recent runs
    fetch('/api/runs')
      .then(r => r.json())
      .then(runs => {
        if (runs.length === 0) {
          document.getElementById('runs').innerHTML = '<p><em>No activity yet</em></p>';
          return;
        }
        const rows = runs.map(r => {
          const time = new Date(r.timestamp).toLocaleString();
          const duration = r.duration_ms ? (r.duration_ms / 1000).toFixed(1) + 's' : '-';
          const status = r.errors > 0 ? '\u274c ' + r.errors : '\u2705';
          return '<tr><td><small>' + time + '</small></td><td><strong>' + r.operation + '</strong></td><td>' + (r.files_processed || '-') + '</td><td>' + duration + '</td><td>' + status + '</td></tr>';
        }).join('');
        document.getElementById('runs').innerHTML = '<table><thead><tr><th>Time</th><th>Op</th><th>Files</th><th>Duration</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table>';
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
