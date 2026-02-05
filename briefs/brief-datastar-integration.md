---
date: 2026-02-04
tags: [brief, frontend, datastar, signals, reactivity]
agent: minimax
environment: local
---

# Brief: DataStar Integration for Public Website

## Context

Current `public/` website uses:

- Static HTML files (`index.html`, `lexicon.html`, `tts.html`)
- Alpine.js for declarative reactivity
- Polling for real-time updates (`fetch('/api/stats')`)
- No server-side routing

## DataStar Overview

DataStar is a signals-based reactivity library that:

- Uses signals (like Preact Signals)
- Works with SSE/HTMX for server communication
- No build step required
- CDN-only: `https://data-star.dev/dist/index.js`

## Requirements

1. Replace Alpine.js with DataStar for reactivity
2. Add SSE endpoints for real-time updates (replace polling)
3. Create fragment endpoints for HTMX-style partial updates
4. Minimal server changes (use Bun.serve)

## Implementation Proposal

### Server Changes (Bun.serve)

```typescript
// api/server.ts (Bun.serve)

// SSE endpoint for real-time stats
Bun.serve({
  port: 3000,
  routes: {
    "/api/stream": (req) => {
      return new Response(new SSEStream(statsStore), {
        headers: { "Content-Type": "text/event-stream" },
      });
    },
    // Fragment endpoint for partial updates
    "/api/fragment/stats": () => {
      return new Response(statsFragmentHTML(), {
        headers: { "Content-Type": "text/html" },
      });
    },
  },
});
```

### Client Changes (DataStar CDN)

```html
<!-- index.html -->
<script src="https://data-star.dev/dist/index.js"></script>
<script type="module">
  import { signal, effect } from "https://data-star.dev/dist/index.js";

  // Define signals
  const stats = signal({ nodes: 0, edges: 0 });
  const services = signal([]);

  // Connect SSE
  const evtSource = new EventSource("/api/stream");
  evtSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    stats.value = data.stats;
  };
</script>
```

## Migration Path

| File           | Current                   | Target               |
| -------------- | ------------------------- | -------------------- |
| `index.html`   | Alpine polling            | DataStar + SSE       |
| `lexicon.html` | Vanilla JS + static JSONL | DataStar + fragments |
| `tts.html`     | Vanilla JS                | Keep or DataStar     |

## Server Packages Required

**None for DataStar itself** - it's a client-only library loaded from CDN.

**Required for full integration:**

- `hono` - optional, for routing and SSE endpoints
- No additional DataStar server packages needed

**Recommendation:** Use vanilla DataStar CDN + Bun.serve for simplicity.

```bash
# No npm install needed for DataStar - use CDN
# Just add hono if you prefer it over Bun.serve
bun add hono
```

## Files to Create

```
public/
├── index.html           # DataStar prototype (replace Alpine)
api/
└── server.ts           # Bun.serve server with SSE endpoints
```

## Success Criteria

1. Stats update via SSE (no polling)
2. Services panel updates in real-time
3. Same UI appearance preserved
4. No build step required

## Timeline

- Phase 1: Prototype SSE + DataStar signals (1-2 hours)
- Phase 2: Migrate index.html (2-3 hours)
- Phase 3: Add fragment endpoints for lexicon (2-3 hours)
