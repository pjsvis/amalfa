---
title: Website Prototype Phase 1 - Simplification Stack
status: DRAFT
date: 2026-02-05
tags: [brief, website, prototype, bun, hono, jsx, datastar]
---

# Website Prototype Phase 1

## Objective

Prototype a unified website using **Bun + Hono + JSX SSR + DataStar** with live database connection, leveraging existing assets while simplifying the architecture.

## Current State

### Existing Assets
| Asset | Location | Purpose |
|-------|----------|---------|
| SSR Docs | `website/ssr-docs/server.ts` | Markdown rendering, Bun.serve |
| Terminal CSS | `website/ssr-docs/public/terminal-style.css` | ANSI palette, monospace |
| Dashboard | `website/dashboard.html` | Static HTML, Datastar loaded |
| Graph Viz | `website/sigma-explorer/` | Static graph visualization |

### Known Issues
1. Fragmented server setup (Python legacy removed, Bun on 3001)
2. No JSX server-side rendering (templates are string concatenation)
3. Graph viz disconnected from live database
4. Search is text-only, no vector integration

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Bun Runtime                              │
├─────────────────────────────────────────────────────────────┤
│  Hono Server (port 3001)                                    │
│  ├── GET /              -> index.tsx (Home + Search)        │
│  ├── GET /docs          -> docs.tsx (Navigation + Content)   │
│  ├── GET /graph         -> graph.tsx (Sigma + Live Data)     │
│  ├── GET /api/*         -> REST endpoints                    │
│  └── SSR Pages          -> .tsx files with JSX               │
├─────────────────────────────────────────────────────────────┤
│  SQLite Database (readonly for safety)                       │
│  ├── Nodes (1,719)                                          │
│  ├── Edges (6,329)                                          │
│  └── Vector Embeddings (384-dim)                            │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack Decision

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | Bun 1.x | Already in use, fast SQLite |
| Router | Hono | Type-safe, middleware support, JSX built-in |
| Templating | Hono JSX | SSR components, no client bundle |
| Interactivity | DataStar | Signals + HTMX patterns, ~5KB |
| Styling | Extend terminal.css | Existing ANSI palette |

## Key Learnings to Apply

### From SSR Docs (`website/ssr-docs/`)
- ✅ Bun.markdown.html() works reliably
- ✅ TOC generation from headings is straightforward
- ✅ Client-side nav with fetch + history API is lightweight
- ❌ String-template pages are unwieldy (replace with JSX)

### From Dashboard (`website/dashboard.html`)
- ✅ Datastar signals work for live updates
- ✅ Terminal palette is cohesive
- ✅ 3-panel grid layout is functional
- ❌ Static HTML requires manual refresh
- ❌ No live database connection

### From Graph Viz (`website/sigma-explorer/`)
- Sigma.js handles large graphs well
- Need live node/edge loading from SQLite
- Layout should be minimal (no canvas overhead)

## Implementation Plan

### Phase 1: Foundation
1. Add Hono JSX configuration
2. Create `website/pages/` directory with `.tsx` pages
3. Move `terminal-style.css` to shared location
4. Verify Bun + Hono + JSX SSR works

**Deliverable**: Home page with search bar, stats panel

### Phase 2: Docs Integration
1. Port `markdown.ts` logic to JSX components
2. Create `docs.tsx` with sidebar navigation
3. Implement markdown rendering via Bun.markdown.html()
4. Add client-side nav (DataStar or vanilla)

**Deliverable**: Working docs browser, replace `/ssr-docs`

### Phase 3: Graph Exploration
1. Create typed DB query layer for nodes/edges
2. Build `graph.tsx` with Sigma.js integration
3. Add entity search and detail views
4. Connect to live SQLite

**Deliverable**: Live graph browser, replace `/sigma-explorer`

### Phase 4: Search Enhancement
1. Add vector search endpoint (FastEmbed integration)
2. Create search results component with scoring
3. Implement autocomplete with DataStar

**Deliverable**: Semantic search replacing text-only search

## Success Criteria

- [ ] Homepage loads in < 100ms
- [ ] Docs navigation works without page reload
- [ ] Graph visualization shows live node count
- [ ] Vector search returns meaningful results
- [ ] Zero client-side React bundle
- [ ] Single server process (Bun + Hono)

## File Changes

```
website/
├── server.ts              (NEW - Hono entry point)
├── pages/
│   ├── index.tsx          (NEW - Home + Search)
│   ├── docs.tsx          (NEW - Docs browser)
│   └── graph.tsx         (NEW - Graph explorer)
├── components/
│   ├── Layout.tsx        (NEW - Header + Footer)
│   ├── Search.tsx        (NEW - Search bar + results)
│   ├── Stats.tsx         (NEW - Dashboard stats)
│   └── Nav.tsx           (NEW - Sidebar navigation)
├── lib/
│   ├── db.ts             (NEW - Typed DB queries)
│   └── markdown.ts       (EXISTING - adapt)
├── public/
│   └── terminal-style.css (EXISTING - extend)
└── static/                (EXISTING - keep for reference)
    ├── dashboard.html
    └── sigma-explorer/
```

## Constraints

1. **No breaking changes** - Keep existing routes functional until replacement
2. **Read-only database** - Prototype uses readonly SQLite connection
3. **Minimal CSS** - Extend existing terminal.css, no frameworks
4. **Type safety** - Full TypeScript, no `any`

## Open Questions

1. Should `/api/*` endpoints use Hono's REST or continue with Bun.serve patterns?
2. How to handle authentication for write operations (future)?
3. Deployment strategy (local only for now)?

## Next Steps

1. Confirm architecture decision
2. Set up Hono + JSX in existing `server.ts`
3. Create prototype `index.tsx`
4. Test with live database connection

---

**Author**: pjstarifa
**Review**: TBD
**Approved**: TBD
