/**
 * API Server with SSE Support
 * Bun.serve server providing real-time updates via Server-Sent Events
 */

import { serve } from "bun";
import { existsSync } from "fs";
import { extname, join } from "path";

// Simulated stats store (replace with actual database queries in production)
const statsStore = {
  nodes: 1247,
  edges: 3892,
  uptime: 0,
};

// Simulated services
const servicesStore = [
  { name: "amalfa-daemon", status: "running", pid: 1234 },
  { name: "amalfa-watcher", status: "running", pid: 1235 },
  { name: "amalfa-indexer", status: "running", pid: 1236 },
  { name: "graph-engine", status: "stopped", pid: null },
];

// Ingestion runs log
const runsLog: Array<{ timestamp: number; files: number; duration: number }> = [
  { timestamp: Date.now() - 60000, files: 47, duration: 2340 },
  { timestamp: Date.now() - 120000, files: 23, duration: 1200 },
  { timestamp: Date.now() - 180000, files: 89, duration: 4500 },
];

// Generate stats HTML fragment
function renderStats(stats: typeof statsStore): string {
  return `
    <span data-stat="nodes">${stats.nodes}</span>
    <span data-stat="edges">${stats.edges}</span>
    <span data-stat="uptime" style="color: var(--accent)">ONLINE</span>
  `;
}

// Generate services HTML fragment
function renderServices(services: typeof servicesStore): string {
  return services
    .map(
      (svc) => `
    <div class="svc-row">
      <div>
        <div class="svc-name">${svc.name}</div>
        <div class="svc-meta">
          <span class="status-dot ${
            svc.status === "running" ? "running" : "stopped"
          }"></span>
          <span>${svc.status.toUpperCase()}</span>
          ${svc.pid ? `<span>PID:${svc.pid}</span>` : ""}
        </div>
      </div>
      <div style="display:flex; gap:4px">
        <button class="btn-xs" data-svc="${svc.name}" data-action="stop">STOP</button>
        <button class="btn-xs" data-svc="${svc.name}" data-action="start">START</button>
        <button class="btn-xs" data-svc="${svc.name}" data-action="restart">RST</button>
      </div>
    </div>
  `,
    )
    .join("");
}

// Generate runs log HTML fragment
function renderRuns(runs: typeof runsLog): string {
  if (runs.length === 0) {
    return '<div class="empty-state">No recent activity.</div>';
  }

  return `
    <table>
      <thead>
        <tr>
          <th width="80">STATUS</th>
          <th width="150">TIMESTAMP</th>
          <th width="100">FILES</th>
          <th width="100">DURATION</th>
          <th>CONTEXT</th>
        </tr>
      </thead>
      <tbody>
        ${runs
          .map(
            (run) => `
          <tr>
            <td style="color:var(--accent)">SUCCESS</td>
            <td>${new Date(run.timestamp).toLocaleTimeString()}</td>
            <td>${run.files}</td>
            <td>${run.duration}ms</td>
            <td style="opacity:0.5">--</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

// Tick function to simulate real-time updates
function tick() {
  statsStore.uptime++;
  statsStore.nodes += Math.floor(Math.random() * 3) - 1;
  statsStore.edges += Math.floor(Math.random() * 10) - 3;

  // Randomly update service status
  if (Math.random() > 0.9) {
    const idx = Math.floor(Math.random() * servicesStore.length);
    const svc = servicesStore[idx]!;
    if (svc.status === "running") {
      svc.status = Math.random() > 0.95 ? "stopped" : "running";
    } else {
      svc.status = "running";
    }
  }
}

const PORT = process.env.PORT || 3000;

console.log(`API Server running on http://localhost:${PORT}`);
console.log(`SSE endpoint: http://localhost:${PORT}/api/stream`);

serve({
  port: PORT,
  routes: {
    // SSE endpoint for real-time updates
    "/api/stream": (req) => {
      let controller: ReadableStreamDefaultController | null = null;
      let interval: ReturnType<typeof setInterval> | null = null;

      const stream = new ReadableStream({
        start(ctrl) {
          controller = ctrl;
          const encoder = new TextEncoder();

          // Send initial data
          ctrl.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                stats: statsStore,
                services: servicesStore,
                runs: runsLog.slice(-10),
              })}\n\n`,
            ),
          );

          // Start tick interval
          interval = setInterval(() => {
            tick();
            ctrl.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  stats: statsStore,
                  services: servicesStore,
                  runs: runsLog.slice(-10),
                })}\n\n`,
              ),
            );
          }, 2000);
        },
        cancel() {
          if (interval) clearInterval(interval);
          if (controller) controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    },

    // JSON endpoints (fallback for initial load)
    "/api/stats": () => {
      return new Response(JSON.stringify(statsStore), {
        headers: { "Content-Type": "application/json" },
      });
    },

    "/api/services": () => {
      return new Response(JSON.stringify(servicesStore), {
        headers: { "Content-Type": "application/json" },
      });
    },

    "/api/runs": () => {
      return new Response(JSON.stringify(runsLog.slice(-10)), {
        headers: { "Content-Type": "application/json" },
      });
    },

    // Fragment endpoints for HTMX-style partial updates
    "/api/fragment/stats": () => {
      return new Response(renderStats(statsStore), {
        headers: { "Content-Type": "text/html" },
      });
    },

    "/api/fragment/services": () => {
      return new Response(renderServices(servicesStore), {
        headers: { "Content-Type": "text/html" },
      });
    },

    "/api/fragment/runs": () => {
      return new Response(renderRuns(runsLog), {
        headers: { "Content-Type": "text/html" },
      });
    },

    // Service control endpoint
    "/api/services/:name/:action": (req) => {
      const name = req.params.name;
      const action = req.params.action;

      // In production, this would actually control the services
      console.log(`Service control: ${name} ${action}`);

      return new Response(JSON.stringify({ success: true, name, action }), {
        headers: { "Content-Type": "application/json" },
      });
    },

    // Static file serving from public/
    "/*": (req) => {
      let path = new URL(req.url).pathname;

      // Default to index-star.html for root
      if (path === "/") path = "/index-star.html";

      const filePath = join(process.cwd(), "public", path);

      if (existsSync(filePath) && !extname(filePath).startsWith(".")) {
        return new Response(filePath);
      }

      return new Response("Not Found", { status: 404 });
    },
  },
});
