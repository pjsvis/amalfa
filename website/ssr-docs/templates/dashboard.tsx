/**
 * Dashboard Page Template
 *
 * SSR-rendered dashboard with DataStar SSE hydration.
 * Btop-inspired terminal aesthetic: maximum data density, minimum wasted space.
 */

import { Layout, ServiceRow, StatRow } from "./base.tsx";

export interface DashboardData {
  stats: {
    nodes: number;
    edges: number;
    vectors: number;
    size_mb: number;
  };
  services: Array<{
    name: string;
    status: "running" | "stopped";
    pid?: string;
  }>;
  harvest: {
    cached: number;
    timeouts: number;
    too_large: number;
    errors: number;
  };
  uptime: number;
  version: string;
}

export function DashboardPage(data: DashboardData): string {
  const { stats, services, harvest, uptime, version } = data;

  const servicesTable = `
    <table id="services-table" role="table" aria-label="Service status">
      <thead>
        <tr role="row">
          <th role="columnheader" aria-label="Service name">SERVICE</th>
          <th role="columnheader" aria-label="Status">STATUS</th>
          <th role="columnheader" aria-label="Process ID">PID</th>
          <th role="columnheader" aria-label="Actions">ACTIONS</th>
        </tr>
      </thead>
      <tbody id="services-list" role="rowgroup" aria-live="polite">
        ${services.map((s) => ServiceRow(s)).join("")}
      </tbody>
    </table>
  `;

  const graphTable = `
    <table id="graph-stats-table" role="table" aria-label="Graph statistics">
      <tbody>
        ${StatRow({ label: "Nodes", value: stats.nodes })}
        ${StatRow({ label: "Edges", value: stats.edges })}
        ${StatRow({ label: "Vectors", value: stats.vectors })}
        ${StatRow({ label: "DB Size", value: stats.size_mb.toFixed(2), unit: "MB" })}
      </tbody>
    </table>
  `;

  return Layout({
    title: "dashboard",
    pageId: "dashboard",
    children: `
      <div class="dashboard-stack">
        <!-- Compact Stats -->
        <div class="dashboard-section compact-list">
          <h2 class="section-title">STATUS</h2>
          <div class="compact-stats">
            <span><strong>UPTIME:</strong> ${uptime}s</span>
            <span><strong>STATUS:</strong> <span class="status-running">ONLINE</span></span>
            <span><strong>VERSION:</strong> ${version}</span>
            <span><strong>MODEL:</strong> BAAI/bge-small-en-v1.5</span>
          </div>
        </div>

        <!-- Harvest Stats -->
        <div class="dashboard-section compact-list">
          <h2 class="section-title">HARVEST</h2>
          <div class="compact-stats">
            <span><strong>CACHED:</strong> <span class="status-running">${harvest.cached}</span></span>
            <span><strong>TIMEOUTS:</strong> <span class="status-stopped">${harvest.timeouts}</span></span>
            <span><strong>TOO-LARGE:</strong> ${harvest.too_large}</span>
            <span><strong>ERRORS:</strong> <span class="status-stopped">${harvest.errors}</span></span>
          </div>
        </div>

        <!-- Graph Stats -->
        <div class="dashboard-section">
          <h2 class="section-title">🧠 GRAPH</h2>
          ${graphTable}
        </div>

        <!-- Services Table -->
        <div class="dashboard-section">
          <h2 class="section-title">📡 DAEMONS</h2>
          ${servicesTable}
        </div>

        <!-- logs -->
        <div class="dashboard-section logs-section">
          <h2 class="section-title">📜 LOGS</h2>
          <pre id="log-stream" class="log-output" role="log" aria-live="polite" aria-label="System log stream">
[SYS] Initializing...
[SYS] SSE connected
          </pre>
        </div>
      </div>
    `,
    sseUrl: "/api/stream",
  });
}

export default DashboardPage;
