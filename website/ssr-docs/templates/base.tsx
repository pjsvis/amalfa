/**
 * Base HTML Template with SSR Support
 * 
 * Provides:
 * - Aria landmarks for agent-browser E2E mapping
 * - DataStar initialization for reactivity
 * - Terminal-brutalist styling
 * - SSOT configuration injection
 */

export interface LayoutProps {
  title: string;
  pageId: string;
  children?: Children;
  sseUrl?: string;
  config?: SafeConfig;
  stats?: SystemStats;
}

interface SafeConfig {
  sources: string[];
  database: string;
  embeddings: { model: string; dimensions: number };
  features: Record<string, { enabled: boolean }>;
}

interface SystemStats {
  nodes: number;
  edges: number;
  vectors: number;
  size_mb: number;
}

type Children = string;

export function Layout({
  title,
  pageId,
  children,
  sseUrl = "/api/stream",
  config,
  stats,
}: LayoutProps): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>amalfa | ${title}</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🟢</text></svg>">
  <link rel="stylesheet" href="/css/terminal.css">
  <link rel="stylesheet" href="/css/tailwind.css">
  <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.0-RC.7/bundles/datastar.js"></script>
</head>
<body data-on-load="${sseUrl}" role="document">
  <!-- Header -->
  <header id="header" role="banner" aria-label="Site header">
    <div class="brand">AMALFA</div>
    <nav id="nav" role="navigation" aria-label="Main navigation">
      <a href="/" ${pageId === "dashboard" ? 'class="active"' : ""} aria-label="Dashboard">DASHBOARD</a>
      <a href="/lexicon" ${pageId === "lexicon" ? 'class="active"' : ""} aria-label="Lexicon">LEXICON</a>
      <a href="/doc" ${pageId === "doc" ? 'class="active"' : ""} aria-label="Documentation">DOCS</a>
      <span class="nav-separator" aria-hidden="true">|</span>
      <a href="/brutalisimo" ${pageId === "brutalisimo" ? 'class="active"' : ""} aria-label="Brutalisimo Test">BRUTALISIMO</a>
      <a href="/brutalisimo-doc" ${pageId === "brutalisimo-doc" ? 'class="active"' : ""} aria-label="Brutalisimo Doc Browser">DOC-BRUTAL</a>
    </nav>
    <div class="meta" aria-label="Version">v1.5.1</div>
  </header>

  <!-- Main Content -->
  <main id="main" role="main" aria-label="${title}">
    <section id="content" aria-label="Primary content">
      ${children || ""}
    </section>
  </main>

  <!-- Footer -->
  <footer id="footer" role="contentinfo" aria-label="Site footer">
    <span class="design" aria-label="Design system">TERMINAL-BRUTALIST | FAFCAS</span>
    <span class="timestamp" aria-label="Current time" data-sse-update="timestamp"></span>
  </footer>

  <!-- DataStar Bootstrapping -->
  <script>
    window.AMALFA_CONFIG = ${config ? JSON.stringify(config) : "null"};
    window.AMALFA_STATS = ${stats ? JSON.stringify(stats) : "null"};
  </script>
</body>
</html>`;
}

/**
 * Left Panel (LHS) Layout Component
 */
export function LeftPanel({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children?: Children;
}): string {
  return `
<aside class="lhs-panel" id="${id}" role="complementary" aria-label="${title}">
  <div class="panel-header" aria-label="${title} header">
    <span class="panel-title">${title}</span>
  </div>
  <div class="panel-content" aria-label="${title} content">
    ${children || ""}
  </div>
</aside>`;
}

/**
 * Right Panel (RHS) Layout Component  
 */
export function RightPanel({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children?: Children;
}): string {
  return `
<aside class="rhs-panel" id="${id}" role="complementary" aria-label="${title}">
  <div class="panel-header" aria-label="${title} header">
    <span class="panel-title">${title}</span>
  </div>
  <div class="panel-content" aria-label="${title} content">
    ${children || ""}
  </div>
</aside>`;
}

/**
 * Main Content Area with LHS Panel
 */
export function MainLayout({
  lhs,
  rhs,
}: {
  lhs?: string;
  rhs?: string;
}): string {
  return `
<div class="main-layout">
  ${lhs ? lhs : ""}
  <div class="main-content" role="main" aria-label="Primary content">
    ${rhs || ""}
  </div>
</div>`;
}

/**
 * Widget Component for Dashboard Metrics
 */
export function Widget({
  id,
  title,
  value,
  status = "neutral",
}: {
  id: string;
  title: string;
  value: string | number;
  status?: "running" | "stopped" | "neutral";
}): string {
  return `
<div class="widget" id="${id}" role="region" aria-label="${title} widget">
  <div class="widget-header">
    <span class="widget-title">${title}</span>
  </div>
  <div class="widget-value status-${status}" aria-live="polite" aria-label="${title}: ${value}">
    ${value}
  </div>
</div>`;
}

/**
 * Navigation Link Component
 */
export function NavLink({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}): string {
  return `
<a href="${href}" 
   class="nav-link ${active ? "active" : ""}" 
   role="navigation" 
   aria-label="${label}"
   aria-current="${active ? "page" : "false"}">
  <span class="nav-icon" aria-hidden="true">${icon}</span>
  <span class="nav-label">${label}</span>
</a>`;
}

/**
 * Service Row Component
 */
export function ServiceRow({
  name,
  status,
  pid,
}: {
  name: string;
  status: "running" | "stopped";
  pid?: string;
}): string {
  return `
<tr class="service-row" role="row" aria-label="Service: ${name}">
  <td role="cell" aria-label="Service name">${name}</td>
  <td role="cell" aria-label="Status" class="status-${status}">
    <span aria-hidden="true">${status === "running" ? "●" : "○"}</span>
    ${status.toUpperCase()}
  </td>
  <td role="cell" aria-label="PID">${pid || "—"}</td>
  <td role="cell" aria-label="Actions" class="actions-cell">
    <button class="btn-action" 
            data-action="start" 
            data-service="${name}"
            aria-label="Start ${name}"
            ${status === "running" ? 'disabled' : ""}>START</button>
    <button class="btn-action" 
            data-action="stop" 
            data-service="${name}"
            aria-label="Stop ${name}"
            ${status === "stopped" ? 'disabled' : ""}>STOP</button>
  </td>
</tr>`;
}

/**
 * Stat Row Component
 */
export function StatRow({
  label,
  value,
  unit = "",
}: {
  label: string;
  value: string | number;
  unit?: string;
}): string {
  return `
<tr class="stat-row" role="row">
  <th role="cell" aria-label="${label}">${label}</th>
  <td role="cell" aria-label="Value" class="stat-value">
    <span id="stat-${label.toLowerCase()}">${value}</span>${unit ? `<span class="unit">${unit}</span>` : ""}
  </td>
</tr>`;
}
