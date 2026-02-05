# SSR Documentation Server (Port 3001)

**Purpose:** Server-side rendered markdown documentation browser with knowledge graph integration.

## What This Is

A unified web server providing:
- **Dashboard**: Knowledge graph metrics, semantic search, recent activity
- **Docs Browser**: SSR markdown rendering with table of contents
- **Config Display**: Real-time configuration from `amalfa.settings.json`
- **API Endpoints**: Stats, search, and document parsing

## Architecture

- **Server**: `website/ssr-docs/server.ts` (Bun + Hono.js)
- **Rendering**: Server-side JSX → HTML (Hono's JSX support)
- **Client**: DataStar (SSE reactivity), vanilla JS for navigation
- **Content**: Markdown files from `docs/` and `briefs/`
- **Data**: SQLite knowledge graph (`.amalfa/resonance.db`)

## Stack

```
Bun Runtime
    ↓
Hono.js (HTTP framework)
    ├─ SSR Templates (JSX → HTML)
    ├─ API Routes (JSON)
    └─ Static Assets
    ↓
DataStar (Client-side reactivity via SSE)
```

## Server-Side Rendering Pattern

The server uses Hono's JSX support for HTML generation:

```typescript
function renderDashboard(): string {
  return <html>
    <head><title>terminal | dashboard</title></head>
    <body>
      <header><span class="brand">terminal</span></header>
      <main>{/* Widgets */}</main>
    </body>
  </html>;
}
```

## Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/` | Dashboard with stats, search, recent activity |
| `/ssr-docs` | Documentation index |
| `/ssr-docs/doc/:file` | SSR rendered markdown document |
| `/ssr-docs/api/doc/:file` | JSON (HTML + TOC) for client nav |
| `/api/config` | Safe config from `amalfa.settings.json` |
| `/api/stats` | System metrics (nodes, edges, cache) |
| `/api/search` | Semantic search results |

## Component Categories

### Layout Components
- `Header` - Brand, navigation, status
- `Sidebar` - Document navigation tree
- `Main` - Content area with independent scrolling
- `Footer` - Version, status, timestamp

### Content Blocks
- `StatWidget` - Single metric display (nodes, edges, etc.)
- `ServiceStatus` - Daemon status indicators
- `SearchBar` - Query input with results dropdown
- `ActivityList` - Recent briefs/debriefs with filtering

### Long-form Blocks
- `DocViewer` - SSR markdown with TOC sidebar
- `ConfigTable` - Key-value configuration display
- `LogViewer` - Terminal-style log output

## Running

```bash
bun run website/ssr-docs/server.ts serve
# Server at http://localhost:3001
```

## Configuration

Reads from `amalfa.settings.json` as single source of truth:
- Sources: document scanning paths
- Database: SQLite location
- Embeddings: model name, dimensions
- Features: Watch, Ember, Sonar, Scratchpad

## Testing

E2E tests verify:
- Dashboard loads with correct title
- Stats display (nodes, edges, vectors)
- Configuration panel shows SSOT values
- Search returns results
- Documentation navigation works
- No console errors

```bash
# Start server first
bun run website/ssr-docs/server.ts serve

# Run tests
bun run test:e2e
```

## Related Files

- `website/ssr-docs/server.ts` - Main server
- `website/ssr-docs/lib/markdown.ts` - Markdown parsing with TOC
- `playbooks/e2e-web-testing-playbook.md` - Testing patterns
