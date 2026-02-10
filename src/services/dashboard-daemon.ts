import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getDbPath } from "@src/cli/utils";
import { AMALFA_DIRS } from "@src/config/defaults";
import { telemetry } from "@src/services/PipelineTelemetry";
import { JsonlUtils } from "@src/utils/JsonlUtils";
import { getLogger } from "@src/utils/Logger";
import { Glob } from "bun";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { streamSSE } from "hono/streaming";
import * as R from "remeda";

const log = getLogger("Dashboard");
const PORT = 3013;
const PID_FILE = join(AMALFA_DIRS.runtime, "dashboard.pid");

interface RunEntry {
  timestamp: string;
  command: string;
  status: string;
  duration?: number;
}

export class DashboardDaemon {
  private server: ReturnType<typeof Bun.serve> | null = null;
  private app: Hono;

  constructor() {
    this.app = new Hono();
    this.setupRoutes();
  }

  private setupRoutes() {
    // 1. Static Assets (PolyVis UI)
    this.app.use("/public/*", serveStatic({ root: "./" }));
    // Root assets for legacy support
    this.app.use("/css/*", serveStatic({ root: "./public" }));
    this.app.use("/js/*", serveStatic({ root: "./public" }));

    // 2. Main Dashboard (New Terminal UI)
    this.app.get("/", (c) => {
      const html = readFileSync("website/dashboard.html", "utf-8");
      return c.html(html);
    });

    // 3. Legacy Dashboard
    this.app.get("/legacy", (c) => {
      const html = readFileSync("public/index.html", "utf-8");
      return c.html(html);
    });

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

    // 12. Datastar SSE Stream
    this.app.get("/api/stream", async (c) => {
      return streamSSE(c, async (stream) => {
        log.info("SSE Stream Connected");

        const pushUpdate = async () => {
          try {
            const stats = await this.getSystemStats();
            const services = await this.getServiceStatus();
            const harvestSize = await this.getHarvestStats();
            const uptime = process.uptime().toFixed(0);
            const timestamp = new Date().toLocaleTimeString();

            // 1. Uptime & Header
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #uptime\n<span id="uptime">${uptime}s</span>`,
            });

            // 2. Services Table
            const servicesHtml = services
              .map(
                (s) => `
                        <tr>
                            <td>${s.name}</td>
                            <td class="${s.status === "running" ? "status-running" : "status-stopped"}">${s.status.toUpperCase()}</td>
                            <td class="dim">${s.pid || "---"}</td>
                            <td>
                                <span class="btn-action" data-on-click="@post('/api/services/${s.name}/${s.status === "running" ? "stop" : "start"}')">${s.status === "running" ? "stop" : "start"}</span>
                                <span class="btn-action" data-on-click="@post('/api/services/${s.name}/restart')">rst</span>
                            </td>
                        </tr>`,
              )
              .join("");
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #services-list\n<tbody id="services-list">${servicesHtml}</tbody>`,
            });

            // 3. Graph Stats
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #stat-nodes\n<span id="stat-nodes">${stats.database.nodes}</span>`,
            });
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #stat-edges\n<span id="stat-edges">${stats.database.edges}</span>`,
            });
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #stat-vectors\n<span id="stat-vectors">${stats.database.vectors}</span>`,
            });
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #stat-size\n<span id="stat-size">${stats.database.size_mb.toFixed(2)}</span>`,
            });

            // 4. Harvest Stats
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #harvest-cached\n<span id="harvest-cached" class="status-running">${harvestSize.cached}</span>`,
            });
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #harvest-timeouts\n<span id="harvest-timeouts" class="status-stopped">${harvestSize.skipped.timeouts}</span>`,
            });
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #harvest-too-large\n<span id="harvest-too-large">${harvestSize.skipped.too_large}</span>`,
            });
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #harvest-errors\n<span id="harvest-errors" class="status-stopped">${harvestSize.skipped.errors}</span>`,
            });

            // 4.5 Pipeline Telemetry
            const pipelineStats = telemetry.getStats();
            const pipelineHtml = Object.entries(pipelineStats)
              .map(([name, s]) => {
                const color =
                  s.status === "active"
                    ? "status-running"
                    : s.status === "error"
                      ? "status-stopped"
                      : "dim";
                return `
                <div class="pipeline-row" style="display: flex; justify-content: space-between; margin-bottom: 0.5ch; font-size: 11px;">
                    <span>${name.toUpperCase()}</span>
                    <span class="${color}">${s.metric} (${s.status.toUpperCase()})</span>
                </div>`;
              })
              .join("");

            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #pipeline-stats\n<div id="pipeline-stats">${pipelineHtml}</div>`,
            });

            // 5. Footer Timestamp
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #timestamp\n<span id="timestamp">TIMESTAMP: ${timestamp}</span>`,
            });
            // 6. Logs
            const recentLogs = await this.getRecentLogs();
            await stream.writeSSE({
              event: "datastar-merge-fragments",
              data: `selector #log-stream\n<pre id="log-stream" style="font-size: 11px; max-height: 20ch; overflow-y: auto;">${recentLogs}</pre>`,
            });
          } catch (e) {
            log.error({ err: e }, "SSE Update Failed");
          }
        };

        // Initial push
        await pushUpdate();

        // Heartbeat/Interval
        const interval = setInterval(pushUpdate, 2000);

        stream.onAbort(() => {
          log.info("SSE Stream Disconnected");
          clearInterval(interval);
        });

        // Keep-alive
        while (true) {
          await new Promise((resolve) => setTimeout(resolve, 30000));
          await stream.writeSSE({ event: "ping", data: "" });
        }
      });
    });

    // 13. Terminal CLI Proxy
    this.app.post("/api/cli", async (c) => {
      try {
        const body = await c.req.json();
        const command = body.command?.trim();

        if (!command) return c.json({ success: false, error: "Empty command" });

        log.info({ command }, "Executing CLI command from dashboard");

        const args = command.split(/\s+/);
        const proc = Bun.spawn(["bun", "src/cli.ts", ...args], {
          stdout: "pipe",
          stderr: "pipe",
        });

        const output = await new Response(proc.stdout).text();
        const error = await new Response(proc.stderr).text();
        await proc.exited;

        // We can return a fragment to show the result in the log stream immediately
        // Or just rely on the log stream to pick it up if the command logs to file.
        // Most CLI commands don't log to daemon.log, so let's push a fragment.

        const resultHtml = `[CLI] > ${command}\n${output}${error ? `\n[ERR] ${error}` : ""}`;

        return streamSSE(c, async (stream) => {
          await stream.writeSSE({
            event: "datastar-merge-fragments",
            data: `selector #log-stream\n<pre id="log-stream" style="font-size: 11px; max-height: 20ch; overflow-y: auto;">${resultHtml}\n---</pre>`,
          });
        });
      } catch (e) {
        return c.json({ success: false, error: String(e) }, 500);
      }
    });
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
    const entries = await JsonlUtils.readAll<RunEntry>(runsFile);
    if (R.isEmpty(entries)) return [];
    return entries.slice(-10).reverse();
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

  private async getRecentLogs(bytes = 3000) {
    try {
      const logFile = join(AMALFA_DIRS.logs, "daemon.log");
      if (!existsSync(logFile)) return "[SYS] No harvester logs found.";

      const file = Bun.file(logFile);
      const size = file.size;
      const start = Math.max(0, size - bytes);
      const text = await file.slice(start).text();
      const lines = text.split("\n");

      // If we sliced in the middle of a line, drop the first partial line
      if (start > 0 && lines.length > 1) {
        lines.shift();
      }

      return lines.join("\n").trim() || "[SYS] Log empty.";
    } catch (e) {
      return `[ERR] Failed to read logs: ${String(e)}`;
    }
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
