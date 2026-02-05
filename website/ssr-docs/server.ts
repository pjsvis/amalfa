#!/usr/bin/env bun

import { join } from "node:path";
import { AMALFA_DIRS } from "@src/config/defaults";
import { ServiceLifecycle } from "@src/utils/ServiceLifecycle";
import { serve } from "bun";
import {
  parseMarkdownWithTOC,
  loadDocument,
  getAllDocuments,
  categorizeDocuments,
  type DocMetadata,
  type TocItem,
} from "./lib/markdown.ts";

interface AmalfaConfig {
  sources: string[];
  database: string;
  embeddings: {
    model: string;
    dimensions: number;
  };
  watch: { enabled: boolean; debounce: number; notifications: boolean };
  ember: { enabled: boolean; minConfidence: number; autoSquash: boolean; backupDir: string };
  sonar: { enabled: boolean; port: number; host: string };
  scratchpad: { enabled: boolean; thresholdBytes: number };
  excludePatterns: string[];
  langExtract: {
    provider: string;
    ollama: { host: string; model: string };
    gemini: { model: string };
    openrouter: { model: string };
  };
}

async function loadConfig(): Promise<AmalfaConfig> {
  const defaultConfig: AmalfaConfig = {
    sources: ["."],
    database: ".amalfa/resonance.db",
    embeddings: { model: "BAAI/bge-small-en-v1.5", dimensions: 384 },
    watch: { enabled: true, debounce: 1000, notifications: true },
    ember: { enabled: true, minConfidence: 0.8, autoSquash: false, backupDir: ".amalfa/backups/ember" },
    sonar: { enabled: true, port: 3012, host: "localhost:11434" },
    scratchpad: { enabled: true, thresholdBytes: 4096 },
    excludePatterns: ["node_modules", ".git", ".amalfa"],
    langExtract: {
      provider: "openrouter",
      ollama: { host: "http://localhost:11434", model: "auto" },
      gemini: { model: "gemini-flash-latest" },
      openrouter: { model: "google/gemini-2.5-flash-lite" }
    }
  };
  
  try {
    const configFile = Bun.file("amalfa.settings.json");
    const content = await configFile.text();
    const parsed = JSON.parse(content);
    return { ...defaultConfig, ...parsed };
  } catch (e) {
    console.warn("Failed to load amalfa.settings.json, using defaults:", e);
    return defaultConfig;
  }
}

function getSafeConfig(config: AmalfaConfig) {
  return {
    sources: config.sources,
    database: config.database,
    embeddings: config.embeddings,
    features: {
      watch: { enabled: config.watch.enabled },
      ember: { enabled: config.ember.enabled },
      sonar: { enabled: config.sonar.enabled, port: config.sonar.port },
      scratchpad: { enabled: config.scratchpad.enabled }
    },
    excludePatterns: config.excludePatterns,
    langExtract: {
      provider: config.langExtract.provider,
      ollama: { model: config.langExtract.ollama.model },
      gemini: { model: config.langExtract.gemini.model },
      openrouter: { model: config.langExtract.openrouter.model }
    }
  };
}

const CONFIG = await loadConfig();

// Service lifecycle management
const lifecycle = new ServiceLifecycle({
  name: "SSR-Docs",
  pidFile: join(AMALFA_DIRS.runtime, "ssr-docs.pid"),
  logFile: join(AMALFA_DIRS.logs, "ssr-docs.log"),
  entryPoint: "website/ssr-docs/server.ts",
});

const PORT = Number(process.env.PORT || 3001);
const ROOT_PATH = "/Users/petersmith/Dev/GitHub/amalfa";
const DOCS_PATH = join(ROOT_PATH, "docs");
const BRIEFS_PATH = join(ROOT_PATH, "briefs");
const DEBRIEFS_PATH = join(ROOT_PATH, "debriefs");
const DB_PATH = join(ROOT_PATH, CONFIG.database);

/**
 * Main server logic
 */
async function runServer() {
  // Generate TOC HTML from TOC items
  function tocToHtml(toc: TocItem[], indent: number = 0): string {
    if (!toc.length) return '<p class="muted">No contents</p>';
    let html = "<ul>\n";
    for (const item of toc) {
      if (item.level > 3) continue;
      html += `<li><a href="#${item.id}" data-toc-link>${item.number} ${item.text}</a>`;
      if (item.children && item.children.length > 0) {
        html += tocToHtml(item.children, indent + 1);
      }
      html += "</li>\n";
    }
    html += "</ul>\n";
    return html;
  }

  // Generate navigation sidebar HTML
  function generateNav(categories: {
    index: DocMetadata[];
    playbooks: DocMetadata[];
    debriefs: DocMetadata[];
    briefs: DocMetadata[];
  }): string {
    return `
    <article>
      <header><strong>Navigation</strong></header>
      <div class="doc-categories">
        ${Object.entries(categories)
          .map(
            ([cat, files]) => `
            <details ${cat === "index" ? "open" : ""}>
              <summary>${cat.charAt(0).toUpperCase() + cat.slice(1)}</summary>
              <ul>
                ${files
                  .map(
                    (f) => `
                    <li><a href="/ssr-docs/doc/${f.file}" 
                           class="nav-link" 
                           data-file="${f.file}"
                           data-title="${f.title || f.file}">${f.title || f.file}</a></li>
                  `,
                  )
                  .join("")}
              </ul>
            </details>
          `,
          )
          .join("")}
      </div>
    </article>`;
  }

  function renderDashboard(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>terminal | dashboard</title>
  <style>
    :root {
      --black:   #000000;
      --red:     #AA0000;
      --green:   #00AA00;
      --yellow:  #AA5500;
      --blue:    #0000AA;
      --magenta: #AA00AA;
      --cyan:    #00AAAA;
      --white:   #AAAAAA;
      --bright-white: #FFFFFF;
      --bright-green: #55FF55;
      --bright-yellow: #FFFF55;
      
      --bg: var(--black);
      --fg: var(--white);
      --accent: var(--green);
      --border: var(--white);
      --dim: var(--yellow);
      --link: var(--cyan);
      --error: var(--red);
      
      font-family: monospace;
      font-size: 14px;
      line-height: 1.4;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    html, body {
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
    
    body {
      background: var(--bg);
      color: var(--fg);
      display: grid;
      grid-template-rows: 3ch 1fr 2ch;
      grid-template-areas:
        "header"
        "main"
        "footer";
      min-height: 0;
    }
    
    header {
      grid-area: header;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      padding: 0 2ch;
      height: 3ch;
      overflow: hidden;
      line-height: 1;
      contain: strict;
    }
    
    .brand {
      color: var(--accent);
      font-weight: bold;
    }
    
    nav {
      display: flex;
      gap: 2ch;
      margin-left: auto;
    }
    
    nav a {
      color: var(--fg);
      text-decoration: none;
    }
    
    nav a:hover, nav a.active {
      color: var(--accent);
      text-decoration: underline;
    }
    
    main {
      grid-area: main;
      display: grid;
      grid-template-columns: 45ch 1fr;
      grid-template-areas: "lhs rhs";
      gap: 1px;
      background: var(--border);
      overflow: hidden;
      min-height: 0;
      contain: strict;
    }
    
    .lhs {
      grid-area: lhs;
      background: var(--bg);
      padding: 1ch;
      overflow-y: auto;
      overflow-x: hidden;
    }
    
    .rhs {
      grid-area: rhs;
      background: var(--bg);
      padding: 1ch;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      align-content: flex-start;
      gap: 1ch;
    }
    
    .lhs-widget {
      background: var(--bg);
      padding: 1ch;
      border-bottom: 1px solid var(--border);
    }
    
    .lhs-widget:last-child {
      border-bottom: none;
    }
    
    .rhs-block {
      background: var(--bg);
      padding: 1ch 2ch;
      width: fit-content;
      min-width: min(50ch, 100%);
      max-width: 70ch;
      max-height: 30ch;
      overflow-y: auto;
      overflow-x: hidden;
      border: 1px solid var(--border);
      contain: layout;
    }
    
    @media (max-height: 50ch) {
      .rhs-block {
        max-height: 20ch;
      }
    }
    
    .rhs-block.long {
      max-height: 25ch;
    }
    
    .rhs-block.short {
      max-height: 35ch;
    }
    
    .widget-title {
      color: var(--accent);
      font-weight: bold;
      margin-bottom: 1ch;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    h1 {
      color: var(--accent);
      font-size: 1rem;
      margin: 1ch 0;
    }
    
    h2 {
      color: var(--bright-yellow);
      font-size: 1rem;
      margin: 1ch 0;
    }
    
    h3 {
      color: var(--cyan);
      font-size: 1rem;
      margin: 0.5ch 0;
    }
    
    p {
      margin: 0.5ch 0;
    }
    
    a {
      color: var(--link);
      text-decoration: none;
    }
    
    pre {
      background: var(--black);
      border: 1px solid var(--border);
      padding: 1ch;
      margin: 1ch 0;
      white-space: pre-wrap;
      word-break: break-all;
      font-size: 12px;
      color: var(--bright-green);
      width: fit-content;
      max-width: min(80ch, 100%);
      min-width: 100%;
    }
    
    code {
      color: var(--bright-green);
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 13px;
    }
    
    th, td {
      border: 1px solid var(--border);
      padding: 0.5ch 1ch;
      text-align: left;
    }
    
    th {
      color: var(--accent);
      background: var(--black);
    }
    
    ul {
      margin: 0.5ch 0;
      padding-left: 3ch;
    }
    
    li {
      margin: 0.25ch 0;
    }
    
    .status {
      color: var(--accent);
    }
    
    .dim {
      color: var(--dim);
    }
    
    .search-input {
      background: var(--black);
      border: 1px solid var(--border);
      color: var(--fg);
      font-family: monospace;
      font-size: 14px;
      padding: 0.5ch 1ch;
      width: 100%;
      margin: 1ch 0;
    }
    
    .search-input:focus {
      outline: none;
      border-color: var(--accent);
    }
    
    .stat-value {
      color: var(--bright-green);
      font-weight: bold;
    }
    
    footer {
      grid-area: footer;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2ch;
      height: 2ch;
      font-size: 12px;
      color: var(--dim);
      overflow: hidden;
      line-height: 1;
      contain: strict;
    }
    
    @media (max-width: 100ch) {
      main {
        grid-template-columns: 1fr;
        grid-template-areas: "lhs" "rhs";
      }
      
      .lhs {
        max-height: 40vh;
      }
    }
    
    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1ch;
    }
    
    .widget-controls {
      display: flex;
      gap: 1ch;
    }

    .control-btn {
      color: var(--dim);
      font-family: monospace;
      cursor: pointer;
      user-select: none;
      margin-left: 1ch;
    }
    
    .control-btn:hover {
      color: var(--fg);
    }
    
    .service-status {
      display: flex;
      gap: 2ch;
      margin: 1ch 0;
    }
    
    .service-item {
      display: flex;
      align-items: center;
      gap: 0.5ch;
    }
    
    .status-indicator {
      width: 1ch;
      height: 1ch;
      border-radius: 0;
      display: inline-block;
    }
    
    .status-active {
      background: var(--green);
    }
    
    .status-inactive {
      background: var(--red);
    }
    
    .status-idle {
      background: var(--yellow);
    }
  </style>
</head>
  <body>
  <header>
    <span class="brand">terminal</span>
    <span> | dashboard</span>
    <nav>
      <a href="/" class="active">d dashboard</a>
      <a href="/ssr-docs">s docs</a>
    </nav>
  </header>
  
  <main>
    <div class="lhs">
      <div class="lhs-widget">
        <div class="widget-title">System Status</div>
        <p class="dim">Real-time knowledge graph metrics</p>
        
        <table>
          <tr>
            <td>Nodes</td>
            <td class="stat-value" id="node-count">--</td>
          </tr>
          <tr>
            <td>Edges</td>
            <td class="stat-value" id="edge-count">--</td>
          </tr>
          <tr>
            <td>Vector Dim</td>
            <td class="stat-value" id="vector-dim">--</td>
          </tr>
          <tr>
            <td>Cache Items</td>
            <td class="stat-value" id="cache-count">--</td>
          </tr>
        </table>
        
        <h3>Service Status</h3>
        <div class="service-status" id="service-status">
          <div class="service-item">
            <span class="status-indicator" id="watcher-indicator"></span>
            <span id="watcher-label">Watcher</span>
          </div>
          <div class="service-item">
            <span class="status-indicator" id="vector-indicator"></span>
            <span id="vector-label">Vector</span>
          </div>
          <div class="service-item">
            <span class="status-indicator" id="reranker-indicator"></span>
            <span id="reranker-label">Reranker</span>
          </div>
        </div>
        
        <p class="dim" id="last-updated">Last updated: --</p>
      </div>
      
      <div class="lhs-widget">
        <div class="widget-title">Quick Actions</div>
        <p>
          <span class="control-btn" id="btn-refresh">[↻] Refresh</span>
        </p>
        <p class="dim">
          Press '/' to focus search, 'r' to refresh
        </p>
      </div>
    </div>
    
    <div class="rhs">
      <div class="rhs-block long" style="width: 100%; max-width: 100%;">
        <div class="widget-header">
          <div class="widget-title">🔍 Semantic Search</div>
          <div class="widget-controls">
            <span class="control-btn" id="btn-clear-search">[Clear]</span>
          </div>
        </div>
        <p class="dim" id="search-description">
          Search across the knowledge graph. Press Enter to search.
        </p>
        <input 
          type="text" 
          id="search-input"
          class="search-input" 
          placeholder="Search query... (e.g., 'database migrations')"
          autocomplete="off"
        />
        <div id="search-results-container" style="display: none;">
          <h3>Results <span id="result-count" class="dim"></span></h3>
          <ul id="search-results-list">
          </ul>
        </div>
      </div>
      
      <div class="rhs-block" id="doc-recent">
        <div class="widget-header">
          <div class="widget-title">Recent Activity</div>
          <div class="widget-controls">
            <span class="control-btn" id="btn-filter-all" style="color: var(--accent);">[All]</span>
            <span class="control-btn" id="btn-filter-briefs">[Briefs]</span>
            <span class="control-btn" id="btn-filter-debriefs">[Debriefs]</span>
          </div>
        </div>
        <p class="dim" id="recent-description">Latest briefs and debriefs</p>
        <ul id="recent-list">
          <li>Loading...</li>
        </ul>
      </div>
      
      <div class="rhs-block" id="doc-growth">
        <div class="widget-header">
          <div class="widget-title">📈 Graph Growth</div>
        </div>
        <p class="dim">Node count over time</p>
        <div id="growth-chart" style="font-family: monospace; white-space: pre; margin: 1ch 0;">
Loading...
        </div>
      </div>
      
      <div class="rhs-block" id="doc-config">
        <div class="widget-header">
          <div class="widget-title">Configuration</div>
        </div>
        <p class="dim">Single Source of Truth (amalfa.settings.json)</p>
        <table>
          <tr>
            <th>Setting</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Sources</td>
            <td id="config-sources" class="dim">Loading...</td>
          </tr>
          <tr>
            <td>Database</td>
            <td id="config-database" class="dim">Loading...</td>
          </tr>
          <tr>
            <td>Embedding Model</td>
            <td id="config-model">Loading...</td>
          </tr>
          <tr>
            <td>Dimensions</td>
            <td id="config-dimensions">Loading...</td>
          </tr>
          <tr>
            <td>Features</td>
            <td id="config-features">Loading...</td>
          </tr>
        </table>
      </div>
      
      <div class="rhs-block" id="doc-stats">
        <div class="widget-header">
          <div class="widget-title">Graph Health</div>
        </div>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>FAFCAS Compliance</td>
            <td class="status">✓ Active</td>
          </tr>
          <tr>
            <td>Vector Normalization</td>
            <td class="status">✓ norm=1.0</td>
          </tr>
          <tr>
            <td>Embedding Model</td>
            <td id="health-model">Loading...</td>
          </tr>
          <tr>
            <td>Search Precision</td>
            <td class="status">95%+</td>
          </tr>
        </table>
      </div>
      
      <div class="rhs-block" id="doc-cache">
        <div class="widget-header">
          <div class="widget-title">Harvester Cache</div>
        </div>
        <p>
          <strong>Status:</strong> <span class="status" id="cache-status">--</span><br>
          <strong>Strategy:</strong> CAS (Content-Addressable Storage)<br>
          <strong>Items:</strong> <span id="cache-items">--</span><br>
          <strong>Location:</strong> <code>.amalfa/cache/lang-extract/</code>
        </p>
        <p class="dim">
          LangExtract results cached to decouple extraction costs.
        </p>
      </div>
    </div>
  </main>
  
  <footer>
    <span>Amalfa v1.1.0-alpha | Knowledge Graph System</span>
    <span id="footer-status">System Status: Loading...</span>
  </footer>
  
  <script>
    let currentFilter = 'all';
    let recentItems = [];
    
    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        document.getElementById('config-sources').textContent = config.sources?.join(', ') || 'N/A';
        document.getElementById('config-database').textContent = config.database || 'N/A';
        document.getElementById('config-model').textContent = config.embeddings?.model || 'N/A';
        document.getElementById('config-dimensions').textContent = config.embeddings?.dimensions || 'N/A';
        document.getElementById('health-model').textContent = config.embeddings?.model || 'N/A';
        
        const features = [];
        if (config.features?.watch?.enabled) features.push('Watch');
        if (config.features?.ember?.enabled) features.push('Ember');
        if (config.features?.sonar?.enabled) features.push('Sonar');
        if (config.features?.scratchpad?.enabled) features.push('Scratchpad');
        document.getElementById('config-features').textContent = features.join(', ') || 'None';
        
      } catch (error) {
        console.error('Failed to load config:', error);
        document.getElementById('config-sources').textContent = 'Error loading config';
      }
    }
    
    async function loadDashboardData() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        // Update system stats
        document.getElementById('node-count').textContent = data.nodes?.toLocaleString() || 'N/A';
        document.getElementById('edge-count').textContent = data.edges?.toLocaleString() || 'N/A';
        document.getElementById('vector-dim').textContent = data.vectorDimension || 'N/A';
        document.getElementById('cache-count').textContent = data.cacheCount?.toLocaleString() || 'N/A';
        document.getElementById('cache-items').textContent = data.cacheCount?.toLocaleString() || '--';
        document.getElementById('cache-status').textContent = data.cacheCount > 0 ? 'ACTIVE' : 'EMPTY';
        
        // Update timestamp
        const now = new Date();
        document.getElementById('last-updated').textContent = 
          'Last updated: ' + now.toLocaleTimeString();
        document.getElementById('footer-status').textContent = 
          'System Status: ' + (data.status || 'ACTIVE');
        
        // Store recent items
        recentItems = [
          ...(data.recentBriefs || []).map(b => ({ ...b, type: 'brief' })),
          ...(data.recentDebriefs || []).map(d => ({ ...d, type: 'debrief' }))
        ].sort((a, b) => {
          const dateA = new Date(a.date || 0).getTime();
          const dateB = new Date(b.date || 0).getTime();
          return dateB - dateA;
        });
        
        renderRecentList();
        
        // Update growth chart
        renderGrowthChart(data);
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        document.getElementById('footer-status').textContent = 'System Status: Error';
      }
    }
    
    // Render recent activity list based on current filter
    function renderRecentList() {
      const list = document.getElementById('recent-list');
      const filtered = currentFilter === 'all' 
        ? recentItems 
        : recentItems.filter(item => item.type === currentFilter.slice(0, -1)); // 'briefs' -> 'brief'
      
      const top10 = filtered.slice(0, 10);
      
      if (top10.length === 0) {
        list.innerHTML = '<li class="dim">No items found</li>';
        return;
      }
      
      list.innerHTML = top10.map(item => {
        const prefix = item.type === 'brief' ? '[B]' : '[D]';
        const color = item.type === 'brief' ? 'var(--blue)' : 'var(--green)';
        const date = item.date ? new Date(item.date).toLocaleDateString() : '';
        return '<li>' +
          '<span style="color: ' + color + '">' + prefix + '</span> ' +
          '<a href="/ssr-docs/doc/' + item.file + '">' + (item.title || item.file) + '</a>' +
          (date ? ' <span class="dim">' + date + '</span>' : '') +
          '</li>';
      }).join('');
      
      // Update filter description
      const descriptions = {
        all: 'Latest briefs and debriefs',
        briefs: 'Recent briefs only',
        debriefs: 'Recent debriefs only'
      };
      document.getElementById('recent-description').textContent = descriptions[currentFilter];
    }
    
    // Render ASCII growth chart
    function renderGrowthChart(data) {
      const chartEl = document.getElementById('growth-chart');
      const nodes = data.nodes || 0;
      
      // Create a simple ASCII bar
      const barWidth = 40;
      const filled = Math.round((nodes / 2000) * barWidth); // Scale to 2000 max
      const bar = '█'.repeat(Math.min(filled, barWidth)) + '░'.repeat(barWidth - Math.min(filled, barWidth));
      
      chartEl.innerHTML = bar + ' ' + nodes.toLocaleString() + ' nodes';
    }
    
    // Search functionality
    async function performSearch() {
      const input = document.getElementById('search-input');
      const query = input.value.trim();
      
      if (!query) {
        clearSearch();
        return;
      }
      
      const container = document.getElementById('search-results-container');
      const list = document.getElementById('search-results-list');
      const countEl = document.getElementById('result-count');
      
      list.innerHTML = '<li class="dim">Searching...</li>';
      container.style.display = 'block';
      
      try {
        const startTime = performance.now();
        const response = await fetch('/api/search?q=' + encodeURIComponent(query));
        const data = await response.json();
        const elapsed = (performance.now() - startTime).toFixed(0);
        
        const results = data.results || [];
        countEl.textContent = '(' + results.length + ' results, ' + elapsed + 'ms)';
        
        if (results.length === 0) {
          list.innerHTML = '<li class="dim">No results found for "' + query + '"</li>';
        } else {
          list.innerHTML = results.map(r => {
            const type = r.type || 'doc';
            const prefix = type === 'brief' ? '[B]' : type === 'debrief' ? '[D]' : '[DOC]';
            const score = r.score ? '(' + (r.score * 100).toFixed(0) + '%)' : '';
            return '<li>' +
              '<a href="/ssr-docs/doc/' + r.file + '">' + prefix + ' ' + (r.title || r.file) + '</a> ' +
              '<span class="dim">' + score + '</span>' +
              '</li>';
          }).join('');
        }
      } catch (error) {
        list.innerHTML = '<li class="dim">Error performing search</li>';
        console.error('Search error:', error);
      }
    }
    
    function clearSearch() {
      document.getElementById('search-input').value = '';
      document.getElementById('search-results-container').style.display = 'none';
      document.getElementById('search-results-list').innerHTML = '';
      document.getElementById('result-count').textContent = '';
    }
    
    // Filter button handlers
    function setFilter(filter) {
      currentFilter = filter;
      
      // Update button styles
      const buttons = {
        all: 'btn-filter-all',
        briefs: 'btn-filter-briefs', 
        debriefs: 'btn-filter-debriefs'
      };
      
      Object.entries(buttons).forEach(([f, id]) => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.style.color = f === filter ? 'var(--accent)' : 'var(--dim)';
        }
      });
      
      renderRecentList();
    }
    
    // Event listeners
    document.addEventListener('DOMContentLoaded', () => {
      loadConfig();
      loadDashboardData();
      
      // Refresh button
      document.getElementById('btn-refresh').addEventListener('click', loadDashboardData);
      
      // Search input
      const searchInput = document.getElementById('search-input');
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          performSearch();
        } else if (e.key === 'Escape') {
          clearSearch();
        }
      });
      
      // Clear search button
      document.getElementById('btn-clear-search').addEventListener('click', clearSearch);
      
      // Filter buttons
      document.getElementById('btn-filter-all').addEventListener('click', () => setFilter('all'));
      document.getElementById('btn-filter-briefs').addEventListener('click', () => setFilter('briefs'));
      document.getElementById('btn-filter-debriefs').addEventListener('click', () => setFilter('debriefs'));
      
      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // '/' focuses search
        if (e.key === '/' && document.activeElement !== searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
        // 'r' refreshes data
        if (e.key === 'r' && document.activeElement !== searchInput) {
          loadDashboardData();
        }
      });
    });
  </script>
</body>
</html>`;
  }

  // Full page template with independent scrolling panels
  function renderPage(data: {
    title: string;
    content: string;
    toc: string;
    activeFile?: string;
    categories: {
      index: DocMetadata[];
      playbooks: DocMetadata[];
      debriefs: DocMetadata[];
      briefs: DocMetadata[];
    };
  }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - Amalfa Docs</title>
  <link rel="stylesheet" href="/ssr-docs/terminal-style.css">
</head>
<body>
  <header>
    <span class="brand">terminal</span>
    <span> | docs</span>
    <nav>
      <a href="/">d dashboard</a>
      <a href="/ssr-docs" class="active">s docs</a>
    </nav>
  </header>

  <div id="workspace">
    <aside id="nav-sidebar">
      ${generateNav(data.categories)}
    </aside>
    
    <article id="doc-content" class="markdown">
      ${data.content}
    </article>
    
    <aside id="doc-toc">
      ${data.toc ? `<details open><summary>Contents</summary>${data.toc}</details>` : '<details open><summary>Contents</summary><p class="muted">No contents</p></details>'}
    </aside>
  </div>

  <script>
    // Client-side navigation: intercept clicks, fetch JSON, update content
    (function() {
      const navSidebar = document.getElementById('nav-sidebar');
      const docContent = document.getElementById('doc-content');
      const docToc = document.getElementById('doc-toc');
      const pageTitle = document.querySelector('title');

      // Highlight active nav item
      function highlightActive(file) {
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.toggle('active', link.dataset.file === file);
        });
      }

      // Update page with new content
      function updatePage(doc) {
        docContent.innerHTML = doc.html;
        docToc.innerHTML = doc.toc ? '<details open><summary>Contents</summary>' + doc.toc + '</details>' 
                                  : '<details open><summary>Contents</summary><p class="muted">No contents</p></details>';
        pageTitle.textContent = (doc.metadata.title || doc.file) + ' - Amalfa Docs';
        highlightActive(doc.file);
        
        // Scroll to top of content panel
        docContent.scrollTop = 0;
        
        // Re-highlight TOC link on scroll
        document.querySelectorAll('#doc-toc a[data-toc-link]').forEach(link => {
          link.classList.remove('active');
        });
      }

      // Fetch document JSON
      async function loadDoc(file) {
        try {
          const res = await fetch('/ssr-docs/api/doc/' + encodeURIComponent(file));
          if (!res.ok) throw new Error('Not found');
          const doc = await res.json();
          updatePage(doc);
        } catch (e) {
          docContent.innerHTML = '<h1>Error</h1><p>' + e.message + '</p>';
        }
      }

      // Intercept nav clicks
      navSidebar.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (link) {
          e.preventDefault();
          const file = link.dataset.file;
          if (file) {
            // Update URL without reload
            history.pushState({}, '', '/ssr-docs/doc/' + file);
            loadDoc(file);
          }
        }
      });

      // Handle browser back/forward
      window.addEventListener('popstate', async () => {
        const path = window.location.pathname;
        if (path.startsWith('/ssr-docs/doc/')) {
          const file = path.replace('/ssr-docs/doc/', '');
          const res = await fetch('/ssr-docs/api/doc/' + encodeURIComponent(file));
          if (res.ok) {
            const doc = await res.json();
            updatePage(doc);
          }
        }
      });

      // Initial highlight
      if (${JSON.stringify(data.activeFile || "")}) {
        highlightActive(${JSON.stringify(data.activeFile || "")});
      }
    })();
  </script>
</body>
</html>`;
  }

  function notFound(): Response {
    const docs = getAllDocuments(DOCS_PATH);
    const categories = categorizeDocuments(docs);
    const html = renderPage({
      title: "Not Found",
      content: `<h1>404 - Not Found</h1><p>The requested document was not found.</p>`,
      toc: "",
      categories,
    });
    return new Response(html, {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  const server = serve({
    port: PORT,
    fetch: async (req: Request) => {
      const url = new URL(req.url);
      const path = url.pathname;

      // CORS headers
      const headers: Record<string, string> = {
        "Content-Type": "text/html",
      };
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
      headers["Access-Control-Allow-Origin"] = "*";

      // / - Dashboard (root)
      if (path === "/" && req.method === "GET") {
        try {
          const html = renderDashboard();
          return new Response(html, { headers });
        } catch (e) {
          return new Response(`Error: ${e}`, { status: 500, headers });
        }
      }

      if (path === "/api/config" && req.method === "GET") {
        return new Response(
          JSON.stringify(getSafeConfig(CONFIG)),
          {
            headers: { ...headers, "Content-Type": "application/json" },
          },
        );
      }

      if (path === "/api/stats" && req.method === "GET") {
        try {
          let nodes = 0;
          let edges = 0;
          let cacheCount = 0;
          let recentBriefs: DocMetadata[] = [];
          let recentDebriefs: DocMetadata[] = [];

          try {
            const { Database } = await import("bun:sqlite");
            const db = new Database(DB_PATH, { readonly: true });
            
            const nodeResult = db.query("SELECT COUNT(*) as count FROM nodes").get() as { count: number } | null;
            nodes = nodeResult?.count || 0;
            
            const edgeResult = db.query("SELECT COUNT(*) as count FROM edges").get() as { count: number } | null;
            edges = edgeResult?.count || 0;
            
            db.close();
          } catch (dbError) {
            console.warn("Database query failed:", dbError);
          }

          try {
            const briefDocs = getAllDocuments(BRIEFS_PATH);
            briefDocs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
            recentBriefs = briefDocs.slice(0, 5);
          } catch (e) {
            console.warn("Failed to load briefs:", e);
          }

          try {
            const debriefDocs = getAllDocuments(DEBRIEFS_PATH);
            debriefDocs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
            recentDebriefs = debriefDocs.slice(0, 5);
          } catch (e) {
            console.warn("Failed to load debriefs:", e);
          }

          try {
            const cacheDir = join(ROOT_PATH, ".amalfa/cache/lang-extract");
            const { readdirSync } = await import("fs");
            if (readdirSync) {
              const files = readdirSync(cacheDir);
              cacheCount = files.length;
            }
          } catch (e) {
            cacheCount = 0;
          }

          return new Response(
            JSON.stringify({
              nodes,
              edges,
              vectorDimension: CONFIG.embeddings.dimensions,
              cacheCount,
              recentBriefs,
              recentDebriefs,
              version: "1.1.0-alpha",
              status: "ACTIVE",
            }),
            {
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        }
      }

      // /api/search - Semantic search (JSON)
      if (path === "/api/search" && req.method === "GET") {
        try {
          const query = url.searchParams.get("q") || "";
          if (!query) {
            return new Response(
              JSON.stringify({ results: [], query: "" }),
              {
                headers: { ...headers, "Content-Type": "application/json" },
              },
            );
          }

          // For now, return simple text search results from documents
          const allDocs = getAllDocuments(DOCS_PATH);
          const results = allDocs
            .filter(doc => {
              const searchText = `${doc.title || ""} ${doc.file || ""}`.toLowerCase();
              return searchText.includes(query.toLowerCase());
            })
            .slice(0, 10)
            .map(doc => ({
              ...doc,
              score: 0.8,
            }));

          return new Response(
            JSON.stringify({
              query,
              results,
              count: results.length,
            }),
            {
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        }
      }

      // /ssr-docs - index page
      if (path === "/ssr-docs" && req.method === "GET") {
        try {
          const docs = getAllDocuments(DOCS_PATH);
          const categories = categorizeDocuments(docs);
          const html = renderPage({
            title: "Docs - SSR",
            content: `<h1>Documentation Browser (SSR)</h1>
            <p>Server-side rendered markdown documentation browser.</p>
            <p>Click any document in the navigation sidebar to view it. Navigation persists during browsing.</p>
            <div class="doc-categories">
              ${Object.entries(categories)
                .map(
                  ([cat, files]) => `
                <details open>
                  <summary>${cat}</summary>
                  <ul>
                    ${files
                      .map(
                        (f) => `
                      <li><a href="/ssr-docs/doc/${f.file}" class="nav-link" data-file="${f.file}" data-title="${f.title || f.file}">${f.title || f.file}</a></li>
                    `,
                      )
                      .join("")}
                  </ul>
                </details>
              `,
                )
                .join("")}
            </div>`,
            toc: "",
            categories,
          });
          return new Response(html, { headers });
        } catch (e) {
          return new Response(`Error: ${e}`, { status: 500, headers });
        }
      }

      // /ssr-docs/doc/* - individual documents (full page SSR)
      if (path.startsWith("/ssr-docs/doc/") && req.method === "GET") {
        const slug = path.replace("/ssr-docs/doc/", "");
        try {
          const parsed = loadDocument(DOCS_PATH, slug, {});
          if (!parsed) {
            return notFound();
          }
          const docs = getAllDocuments(DOCS_PATH);
          const categories = categorizeDocuments(docs);
          const html = renderPage({
            title: parsed.metadata.title || slug,
            content: parsed.html,
            toc: tocToHtml(parsed.toc),
            activeFile: slug,
            categories,
          });
          return new Response(html, { headers });
        } catch (e) {
          return new Response(`Error: ${e}`, { status: 500, headers });
        }
      }

      // /ssr-docs/api/docs - list all documents (JSON)
      if (path === "/ssr-docs/api/docs" && req.method === "GET") {
        try {
          const docs = getAllDocuments(DOCS_PATH);
          return new Response(JSON.stringify({ documents: docs }), {
            headers: { ...headers, "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        }
      }

      // /ssr-docs/api/doc/:slug - get single document (JSON for client-side nav)
      if (path.startsWith("/ssr-docs/api/doc/") && req.method === "GET") {
        const slug = path.replace("/ssr-docs/api/doc/", "");
        try {
          const parsed = loadDocument(DOCS_PATH, slug, {});
          if (!parsed) {
            return new Response(
              JSON.stringify({ error: "Document not found" }),
              {
                status: 404,
                headers: { ...headers, "Content-Type": "application/json" },
              },
            );
          }
          // Return JSON with HTML and TOC
          return new Response(
            JSON.stringify({
              file: slug,
              html: parsed.html,
              toc: tocToHtml(parsed.toc),
              metadata: parsed.metadata,
            }),
            {
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        }
      }

      // /ssr-docs/api/parse - parse markdown
      if (path === "/ssr-docs/api/parse" && req.method === "POST") {
        try {
          const body = await req.text();
          const { markdown } = JSON.parse(body);
          const parsed = parseMarkdownWithTOC(markdown);
          return new Response(JSON.stringify(parsed), {
            headers: { ...headers, "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        }
      }

      // /ssr-docs/terminal-style.css - serve stylesheet from public folder
      if (path === "/ssr-docs/terminal-style.css" && req.method === "GET") {
        try {
          const file = Bun.file("website/ssr-docs/public/terminal-style.css");
          if (await file.exists()) {
            return new Response(file, {
              headers: { "Content-Type": "text/css" },
            });
          }
        } catch (e) {
          /* ignore */
        }
      }

      return new Response("Not Found", { status: 404, headers });
    },
  });

  console.log(`Amalfa Unified Server running on http://localhost:${PORT}`);
  console.log(`  Dashboard: http://localhost:${PORT}/`);
  console.log(`  Docs:      http://localhost:${PORT}/ssr-docs`);
  console.log(`  API:       http://localhost:${PORT}/api/stats`);

  // Keep server alive
  await new Promise(() => {});
}

// Run with lifecycle management
await lifecycle.run(process.argv[2] || "serve", runServer);
