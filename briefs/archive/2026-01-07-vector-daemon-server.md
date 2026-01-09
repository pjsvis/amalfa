---
date: 2026-01-07
tags: [daemon, vector, performance, embeddings, http-server]
---

# Brief: Vector Daemon HTTP Server

## Problem Statement

The embedder service (`src/resonance/services/embedder.ts`) attempts to connect to a vector daemon on port 3010 for fast embedding generation, but no server implementation exists. This causes:

1. **Slow searches** - Every search loads the FastEmbed model fresh (~2-5s overhead)
2. **Wasted work** - DaemonManager was created but can't start the vector daemon
3. **Fallback behavior** - Embedder always falls back to local mode

## Current State

**Embedder** (`src/resonance/services/embedder.ts`):
- Line 12: `private daemonUrl = http://localhost:3010`
- Lines 90-111: Tries to POST to `/embed` endpoint with 200ms timeout
- Falls back to local FastEmbed if daemon unreachable

**Missing:** HTTP server that:
- Listens on port 3010
- Keeps FastEmbed model loaded in memory
- Provides `/embed` endpoint
- Returns normalized vectors (FAFCAS protocol)

## Implementation Plan

### Create HTTP Server

**New file:** `src/resonance/services/vector-daemon.ts`

```typescript
#!/usr/bin/env bun

import { serve } from "bun";
import { EmbeddingModel, FlagEmbedding } from "fastembed";
import { toFafcas } from "@src/resonance/db";
import { getLogger } from "@src/utils/Logger";
import { ServiceLifecycle } from "@src/utils/ServiceLifecycle";

const log = getLogger("VectorDaemon");
const PORT = Number(process.env.VECTOR_PORT || 3010);

// Service lifecycle management
const lifecycle = new ServiceLifecycle({
  name: "Vector-Daemon",
  pidFile: ".vector-daemon.pid",
  logFile: ".vector-daemon.log",
  entryPoint: "src/resonance/services/vector-daemon.ts",
});

// Keep model loaded in memory
let embedder: FlagEmbedding | null = null;
const currentModel = EmbeddingModel.BGESmallENV15;

async function initEmbedder() {
  if (!embedder) {
    log.info({ model: currentModel }, "Initializing embedding model...");
    embedder = await FlagEmbedding.init({
      model: currentModel,
      cacheDir: ".resonance/cache",
      showDownloadProgress: true,
    });
    log.info("✅ Embedding model loaded and ready");
  }
}

async function runServer() {
  // Initialize model
  await initEmbedder();

  // Start HTTP server
  const server = serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url);

      // Health check
      if (url.pathname === "/health") {
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Embed endpoint
      if (url.pathname === "/embed" && req.method === "POST") {
        try {
          const body = await req.json();
          const { text } = body;

          if (!text) {
            return new Response(
              JSON.stringify({ error: "Missing text parameter" }),
              { status: 400 }
            );
          }

          // Generate embedding
          const gen = embedder!.embed([text]);
          const result = await gen.next();
          const val = result.value?.[0];

          if (!val || val.length === 0) {
            return new Response(
              JSON.stringify({ error: "Failed to generate embedding" }),
              { status: 500 }
            );
          }

          // Normalize (FAFCAS protocol)
          const raw = new Float32Array(val);
          const normalized = toFafcas(raw);
          
          return new Response(
            JSON.stringify({ 
              vector: Array.from(new Float32Array(normalized.buffer))
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (e) {
          log.error({ err: e }, "Embedding generation failed");
          return new Response(
            JSON.stringify({ error: String(e) }),
            { status: 500 }
          );
        }
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  log.info({ port: PORT }, "🚀 Vector Daemon listening");
}

// Run with lifecycle management
await lifecycle.run(process.argv[2] || "serve", runServer);
```

### Update DaemonManager

**File:** `src/utils/DaemonManager.ts`

Change line 25:
```typescript
entryPoint: "src/resonance/services/vector-daemon.ts", // ✅ Now exists
```

## Success Criteria

✅ Vector daemon starts on port 3010
✅ `/health` endpoint returns `{"status":"ok"}`
✅ `/embed` endpoint accepts POST with `{text: "hello"}`
✅ Returns normalized vector matching FAFCAS protocol
✅ Model stays loaded between requests
✅ Embedder service successfully uses daemon (no fallback)
✅ Search performance improves (first search 2-5s, subsequent <100ms)
✅ Daemon managed by DaemonManager
✅ MCP server auto-starts daemon on startup

## Testing

```bash
# Start daemon
bun run src/resonance/services/vector-daemon.ts start

# Test health check
curl http://localhost:3010/health

# Test embedding
curl -X POST http://localhost:3010/embed \
  -H "Content-Type: application/json" \
  -d '{"text":"hello world"}'

# Stop daemon
bun run src/resonance/services/vector-daemon.ts stop
```

## Files to Create

- `src/resonance/services/vector-daemon.ts` - HTTP server implementation

## Files to Modify

- `src/utils/DaemonManager.ts` - Update entry point (remove TODO comment)
- `src/mcp/index.ts` - Uncomment vector daemon startup code
