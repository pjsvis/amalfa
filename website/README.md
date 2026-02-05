# SSR Documentation Website (Port 3001)

**Purpose:** Real-time system monitoring, documentation, and lexicon browsing for AMALFA.

## What This Is

A terminal-brutalist web interface providing:
- **Dashboard**: System health, uptime, version, service status
- **Lexicon**: Entity browser for the conceptual lexicon
- **Documentation**: Markdown viewer with category navigation

## Architecture

- **Server**: `website/ssr-docs/server.ts` (Bun + Hono.js)
- **Templates**: JSX components with DataStar reactivity
- **Styling**: Terminal-brutalist CSS (`/css/terminal.css`)
- **Registry**: `.amalfa/runtime/doc-registry.json` (persisted document index)

## Routes

| Route | Purpose |
|-------|---------|
| `/` | System dashboard |
| `/lexicon` | Entity browser |
| `/doc` | Documentation index |
| `/doc/*.md` | Markdown document viewer |
| `/css/terminal.css` | Shared stylesheet |
| `/api/*` | JSON endpoints |

## Running

```bash
# Start the SSR docs server
bun run website/ssr-docs/server.ts

# Available at http://localhost:3001
```

## Stack

- **Runtime**: Bun.js
- **Server**: Hono.js
- **Templates**: Hono JSX
- **Reactivity**: DataStar
- **Styling**: Terminal-brutalist CSS
- **Registry**: Persisted JSON index

## Document Registry

Documents are indexed from:
- `docs/` - Main documentation
- `briefs/` - Design briefs
- `debriefs/` - Retrospectives

The registry is persisted to `.amalfa/runtime/doc-registry.json` and is invalidated when the file watcher signals changes.
