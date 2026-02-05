# Website DOM Map & Capability Spec

**Generated:** 2026-02-05
**Purpose:** Authoritative mapping of web pages for E2E testing and agent reference

---

## Two Web Properties

| Property | Port | Purpose | Server |
|----------|------|---------|--------|
| Dashboard | 3013 | Service management, real-time monitoring | `src/services/dashboard-daemon.ts` |
| SSR Docs | 3001 | Documentation browser, knowledge graph | `website/ssr-docs/server.ts` |

---

## Dashboard (Port 3013)

### URL Structure
```
http://localhost:3013/
```

### DOM Structure

```
body
├── header
│   ├── .brand              → "AMALFA"
│   ├── text                → " | SYSTEM DASHBOARD"
│   └── nav
│       ├── a.active        → "SYSTEM"
│       ├── a               → "GRAPH" (/sigma-explorer/)
│       └── a               → "DOCS" (/docs/)
│
├── main
│   ├── .lhs (sidebar)
│   │   ├── #system-health
│   │   │   ├── .widget-title  → "SYSTEM HEALTH"
│   │   │   ├── #health-metrics
│   │   │   │   ├── .status-running  → "ONLINE"
│   │   │   │   ├── #uptime     → "Xs" (SSE updates)
│   │   │   │   └── .dim        → "v1.5.1-alpha"
│   │   │   │
│   │   │   └── NAVIGATION
│   │   │       ├── a          → "Mainframe (Legacy)"
│   │   │       └── a          → "Lexicon"
│   │   │
│   │   └── #navigation-widget
│   │       └── .widget-title  → "NAVIGATION"
│   │
│   └── .rhs (main content)
│       ├── #services-block
│       │   ├── .widget-header
│       │   │   └── .widget-title → "📡 ACTIVE DAEMONS"
│       │   │
│       │   └── #services-table
│       │       └── tbody#services-list
│       │           └── tr
│       │               ├── td      → Service name
│       │               ├── td.status-running → "RUNNING"
│       │               ├── td.dim   → PID
│       │               └── td
│       │                   ├── .btn-action (start/stop)
│       │                   └── .btn-action (restart)
│       │
│       ├── #graph-stats-block
│       │   ├── .widget-title  → "🧠 GRAPH INTEGRITY"
│       │   └── #stats-table
│       │       ├── #stat-nodes  → node count
│       │       ├── #stat-edges  → edge count
│       │       ├── #stat-vectors → vector count
│       │       └── #stat-size   → "X.XX MB"
│       │
│       ├── #harvest-block
│       │   ├── .widget-title  → "🚜 HARVEST TELEMETRY"
│       │   ├── #harvest-cached.status-running → count
│       │   ├── #harvest-timeouts.status-stopped → count
│       │   ├── #harvest-too-large → count
│       │   └── #harvest-errors.status-stopped → count
│       │
│       └── #logs-block
│           ├── .widget-title  → "📜 SYSTEM LOGS"
│           └── pre#log-stream → SSE log stream
│
└── footer
    ├── .dim   → "DESIGN: TERMINAL-BRUTALIST | OH-107 COMPLIANT"
    └── #timestamp → "TIMESTAMP: HH:MM:SS"
```

### Interactive Elements (DataStar refs)

| Ref | Element | Action |
|-----|---------|--------|
| `@post('/api/services/:name/:action')` | .btn-action | Start/stop/restart service |
| `@get('/api/stream')` | body[data-on-load] | Initial SSE connection |

### API Endpoints

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/stream` | SSE events (datastar-merge-fragments) |
| GET | `/api/stats` | JSON: {nodes, edges, vectors, size_mb} |
| GET | `/api/services` | JSON: [{name, status, pid}] |
| POST | `/api/services/:name/:action` | {success, output} |
| GET | `/health` | JSON: {status, uptime} |

### SSE Events

| Event | Data Format |
|-------|-------------|
| datastar-merge-fragments | `selector #uptime\n<span>...</span>` |
| datastar-merge-fragments | `selector #services-list\n<tbody>...</tbody>` |
| ping | (keep-alive) |

---

## SSR Docs (Port 3001)

### URL Structure
```
http://localhost:3001/              → Dashboard
http://localhost:3001/ssr-docs      → Docs index
http://localhost:3001/ssr-docs/doc/:file → Rendered markdown
http://localhost:3001/api/config   → Safe config JSON
http://localhost:3001/api/stats     → Stats JSON
http://localhost:3001/api/search   → Search results JSON
```

### Dashboard DOM (`/`)

```
body
├── header
│   ├── .brand              → "terminal"
│   ├── text                → " | dashboard"
│   └── nav
│       ├── a.active        → "d dashboard"
│       └── a                → "s docs"
│
├── main
│   ├── .lhs (sidebar)
│   │   └── .lhs-widget#system-health
│   │       ├── .widget-title  → "System Status"
│   │       ├── table
│   │       │   ├── #node-count → number
│   │       │   ├── #edge-count → number
│   │       │   ├── #vector-dim → 384
│   │       │   └── #cache-count → number
│   │       │
│   │       ├── .service-status
│   │       │   ├── #watcher-indicator
│   │       │   ├── #vector-indicator
│   │       │   └── #reranker-indicator
│   │       │
│   │       └── #last-updated → "Last updated: HH:MM:SS"
│   │
│   │   └── .lhs-widget#quick-actions
│   │       └── #btn-refresh → "[↻] Refresh"
│   │
│   └── .rhs (main content)
│       ├── .rhs-block#search
│       │   ├── .widget-title  → "🔍 Semantic Search"
│       │   ├── #search-input  → input[type="text"]
│       │   └── #search-results-container
│       │       ├── #result-count
│       │       └── #search-results-list
│       │
│       ├── .rhs-block#doc-recent
│       │   ├── .widget-title  → "Recent Activity"
│       │   ├── #btn-filter-all
│       │   ├── #btn-filter-briefs
│       │   ├── #btn-filter-debriefs
│       │   └── #recent-list → li items
│       │
│       ├── .rhs-block#doc-growth
│       │   ├── .widget-title  → "📈 Graph Growth"
│       │   └── #growth-chart  → ASCII bar chart
│       │
│       ├── .rhs-block#doc-config
│       │   ├── .widget-title  → "Configuration"
│       │   ├── #config-sources → sources list
│       │   ├── #config-database → db path
│       │   ├── #config-model → model name
│       │   ├── #config-dimensions → dimensions
│       │   └── #config-features → feature list
│       │
│       ├── .rhs-block#doc-health
│       │   ├── .widget-title  → "Graph Health"
│       │   └── table
│       │       ├── #health-model → model name
│       │       └── status indicators
│       │
│       └── .rhs-block#doc-cache
│           ├── .widget-title  → "Harvester Cache"
│           ├── #cache-status → ACTIVE/EMPTY
│           └── #cache-items → count
│
└── footer
    ├── text → "Amalfa v1.1.0-alpha | Knowledge Graph System"
    └── #footer-status → "System Status: ACTIVE"
```

### Documentation Page DOM (`/ssr-docs/doc/:file`)

```
body
├── header
│   ├── .brand              → "terminal"
│   ├── text                → " | docs"
│   └── nav
│       ├── a               → "d dashboard"
│       └── a.active        → "s docs"
│
├── #workspace
│   ├── #nav-sidebar
│   │   └── article
│   │       ├── header      → "Navigation"
│   │       └── .doc-categories
│   │           └── details
│   │               ├── summary  → Category name
│   │               └── ul > li > a.nav-link
│   │                   ├── href      → "/ssr-docs/doc/:file"
│   │                   ├── data-file → ":file"
│   │                   └── data-title → "Document Title"
│   │
│   ├── #doc-content.markdown
│   │   └── (SSR rendered HTML from markdown)
│   │
│   └── #doc-toc
│       └── details[open]
│           └── summary      → "Contents"
│           └── ul > li > a  → TOC links
│
└── footer
    └── #page-status → "Viewing: :file"
```

### API Endpoints

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/config` | Safe config JSON |
| GET | `/api/stats` | Stats JSON (nodes, edges, etc.) |
| GET | `/api/search?q=` | Search results JSON |
| GET | `/ssr-docs/api/doc/:file` | JSON: {html, toc, metadata} |

---

## Capability Spec

### Dashboard (Port 3013)

| Capability | Status | E2E Test |
|------------|--------|----------|
| Page loads | ✅ | `testDashboardLoads` |
| Header renders | ✅ | `testDashboardLoads` |
| System health widget | ✅ | `testSystemHealthWidget` |
| Services table | ✅ | `testServicesTable` |
| Graph stats | ✅ | `testGraphStats` |
| Navigation links | ✅ | `testNavigationLinks` |
| SSE uptime updates | ✅ | `testSSEStream` |
| Console errors | ✅ | `testConsoleErrors` |
| Service actions | ✅ | `testServiceActionsExist` |
| Start service | ⏸ | Manual - affects system |
| Stop service | ⏸ | Manual - affects system |
| Restart service | ⏸ | Manual - affects system |
| Log stream displays | ✅ | Implicit in SSE test |

### SSR Docs (Port 3001)

| Capability | Status | E2E Test |
|------------|--------|----------|
| Page loads | ⏸ | Not yet implemented |
| Dashboard title | ⏸ | |
| Stats display | ⏸ | |
| Config panel | ⏸ | |
| Search input | ⏸ | |
| Search results | ⏸ | |
| Recent activity | ⏸ | |
| Graph growth chart | ⏸ | |
| Docs index | ⏸ | |
| Doc navigation | ⏸ | |
| TOC display | ⏸ | |
| Client nav (no reload) | ⏸ | |
| Back/forward support | ⏸ | |

### Legend
- ✅ Implemented
- ⏸ Pending
- ❌ Not working

---

## Generated Maps

Maps can be regenerated with:
```bash
agent-browser open http://localhost:3013
agent-browser snapshot -i -o website/dashboard-map.json

agent-browser open http://localhost:3001
agent-browser snapshot -i -o website/ssr-docs-map.json
```

**Important:** Maps may drift from reality. Use for reference, verify with tests.
