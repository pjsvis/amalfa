# AMALFA Service Architecture
**Date:** 2026-01-07  
**Status:** Current Implementation

---

## Overview

AMALFA consists of **three independent services** that work together to provide a headless knowledge management system.

```
┌─────────────────────────────────────────────────────────────┐
│                     AMALFA Services                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐     ┌──────────────────┐              │
│  │  MCP Server     │────▶│  SQLite Database │              │
│  │  (stdio)        │     │  .amalfa/        │              │
│  └─────────────────┘     │  resonance.db    │              │
│          ▲               └──────────────────┘              │
│          │                        ▲                          │
│          │                        │                          │
│  ┌──────┴────────┐               │                          │
│  │ File Watcher  │───────────────┘                          │
│  │ Daemon        │                                           │
│  │ (background)  │                                           │
│  └───────────────┘                                           │
│          │                                                    │
│          │ (optional)                                        │
│          ▼                                                    │
│  ┌──────────────────┐                                       │
│  │ Vector Daemon    │                                       │
│  │ (HTTP :3010)     │                                       │
│  └──────────────────┘                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Service 1: MCP Server

**File:** `src/mcp/index.ts`  
**Command:** `amalfa serve`  
**Protocol:** stdio (Model Context Protocol)  
**PID File:** `.amalfa/runtime/mcp.pid`

### Purpose
Exposes AMALFA knowledge graph to AI assistants (Claude, etc.) via MCP protocol.

### Responsibilities
- Read database for semantic/FTS queries
- Provide search tools to MCP clients
- Serve as read-only interface to knowledge graph

### Characteristics
- **Stateless** - No persistent state beyond DB connection
- **Read-only** - Does not modify database
- **Synchronous** - Blocking stdio communication
- **On-demand** - Started by MCP client, not background daemon

### Dependencies
- SQLite database (read-only)
- No dependency on other services

---

## Service 2: File Watcher Daemon

**File:** `src/daemon/index.ts`  
**Command:** `amalfa daemon start`  
**Protocol:** File system watching (Node.js `fs.watch()`)  
**PID File:** `.amalfa/runtime/daemon.pid`

### Purpose
Monitors markdown files and keeps knowledge graph synchronized with file system changes.

### Responsibilities
- Watch `config.sources` directories for `.md` file changes
- Debounce file change events (default: 1000ms)
- Trigger full re-ingestion on any change
- Reload config on each ingestion cycle
- Retry failed ingestions (3 attempts with backoff)
- Send system notifications on updates

### Characteristics
- **Long-lived** - Background daemon
- **Event-driven** - Triggered by file system changes
- **Write-heavy** - Updates database
- **Opportunistic config reload** - Reloads config on file changes

### Dependencies
- SQLite database (read/write)
- Embedder service (may use Vector Daemon or local fallback)
- File system watchers (one per source directory)

### Current Limitation
- Watchers set at startup - adding new `config.sources` requires restart
- Full re-ingestion on any change (hash checking prevents duplicate work)

---

## Service 3: Vector Daemon

**File:** `src/resonance/services/vector-daemon.ts`  
**Command:** `amalfa vector start`  
**Protocol:** HTTP server on port 3010  
**PID File:** `.amalfa/runtime/vector-daemon.pid`

### Purpose
Fast embedding generation service with model kept in memory.

### Responsibilities
- Load FastEmbed model once at startup
- Serve `/embed` endpoint for text → vector conversion
- Normalize vectors using FAFCAS protocol
- Serve `/health` endpoint for status checks

### Characteristics
- **Optional** - Not required for AMALFA to function
- **Performance optimization** - Keeps model loaded for <100ms embeddings
- **Stateful** - Model stays in memory
- **Standalone** - Can be used by other processes

### Dependencies
- FastEmbed library (BAAI/bge-small-en-v1.5)
- Model cache directory (`.resonance/cache`)

---

## Embedder Service (Library, Not Daemon)

**File:** `src/resonance/services/embedder.ts`  
**Usage:** `import { Embedder } from "@src/resonance/services/embedder"`

### Purpose
Abstraction layer for embedding generation with graceful degradation.

### Strategy
```typescript
async embed(text: string, forceLocal = false): Promise<Float32Array> {
  // 1. Try Vector Daemon (HTTP, 200ms timeout)
  if (useRemote && !forceLocal) {
    try {
      return await fetch('http://localhost:3010/embed', ...);
    } catch {
      // Fall through to local
    }
  }
  
  // 2. Fallback: Local FastEmbed
  if (!nativeEmbedder) await init();
  return await nativeEmbedder.embed([text]);
}
```

### Characteristics
- **Hybrid approach** - Remote-first with local fallback
- **Fast timeout** - 200ms for Vector Daemon
- **Lazy initialization** - Only loads local model if needed
- **Transparent** - Callers don't know which backend is used

---

## Data Flow

### Ingestion Flow (File Change)
```
1. File changes in docs/
2. File Watcher detects change (fs.watch)
3. Debounce timer starts (1000ms)
4. Timer expires → triggerIngestion()
5. Config reloaded from amalfa.config.json
6. AmalfaIngestor.ingest() called
   a. Embedder.embed() for each file
      i.  Try Vector Daemon (200ms timeout)
      ii. Fallback to local if unavailable
   b. EdgeWeaver creates relationships
   c. Database updated
7. WAL checkpoint forced
8. System notification sent
```

### Query Flow (MCP Search)
```
1. User asks Claude a question
2. Claude calls MCP tool (search_documents)
3. MCP Server receives request
4. ResonanceDB.searchText() or findSimilar()
5. Results returned to Claude
6. Claude synthesizes answer
```

---

## Service Independence

### Can Run Standalone
- ✅ **MCP Server** - Functions without any daemons
- ✅ **File Watcher** - Functions without Vector Daemon (uses local embeddings)
- ✅ **Vector Daemon** - Can serve other clients beyond AMALFA

### Service Interactions
```
File Watcher ──optional──▶ Vector Daemon
     │
     └─────required─────▶ Database ◀───required─── MCP Server
```

**Key insight:** Only the database is required by all services. Vector Daemon is purely optional.

---

## Configuration

### Single Source of Truth
**File:** `amalfa.config.json`

```json
{
  "sources": ["./docs", "./playbooks", "./debriefs"],
  "database": ".amalfa/resonance.db",
  "embeddings": {
    "model": "BAAI/bge-small-en-v1.5",
    "dimensions": 384
  },
  "watch": {
    "enabled": true,
    "debounce": 1000
  },
  "excludePatterns": ["node_modules", ".git", ".amalfa"]
}
```

### Config Reload Behavior
| Service | Config Reload | Timing |
|---------|---------------|--------|
| MCP Server | ✅ Every request | At startup + per request |
| File Watcher | ✅ Per ingestion | At startup + on file changes |
| Vector Daemon | ❌ Once at startup | At startup only |

**Note:** File Watcher reloads `database`, `embeddings`, `excludePatterns` on every ingestion, but `sources` array requires restart.

---

## Service Lifecycle

### Starting All Services
```bash
# Start each service independently
amalfa serve              # MCP Server (foreground)
amalfa daemon start       # File Watcher (background)
amalfa vector start       # Vector Daemon (background)

# Check status
amalfa servers
```

### Stopping Services
```bash
amalfa daemon stop
amalfa vector stop
# MCP Server stops when client disconnects
```

### Health Monitoring
```bash
# Check all services
amalfa servers

# Check individual service
ps aux | grep "daemon\|vector\|mcp"

# Check logs
tail -f .amalfa/logs/daemon.log
tail -f .amalfa/logs/vector-daemon.log
```

---

## Runtime Files

### Directory Structure
```
.amalfa/
├── resonance.db              # SQLite database
├── stats-history.json        # Database snapshots
├── logs/
│   ├── daemon.log           # File Watcher logs
│   ├── vector-daemon.log    # Vector Daemon logs
│   └── pre-flight.log       # Ingestion validation
└── runtime/
    ├── daemon.pid           # File Watcher PID
    ├── vector-daemon.pid    # Vector Daemon PID
    └── mcp.pid              # MCP Server PID
```

---

## Design Principles

### 1. Service Independence
Each service can function independently. Failure of one service doesn't cascade.

### 2. Graceful Degradation
- MCP Server works without File Watcher (static database)
- File Watcher works without Vector Daemon (local embeddings)
- Vector Daemon is purely optional performance enhancement

### 3. Single Responsibility
- **MCP Server:** Read-only query interface
- **File Watcher:** Maintain DB ↔ filesystem sync
- **Vector Daemon:** Fast embedding generation

### 4. Fail-Fast with Retries
- File Watcher retries failed ingestions (3x with backoff)
- Embedder falls back to local on Vector Daemon timeout
- Services log errors and continue running

---

## Performance Characteristics

### Cold Start (No Vector Daemon)
- First ingestion: ~15s for 75 files (loads FastEmbed model)
- Subsequent: ~9s for 75 files (model cached)

### Hot Start (Vector Daemon Running)
- Ingestion: ~5-7s for 75 files
- Embedding per document: <100ms
- 3x faster than cold start

### Query Performance
- FTS search: <10ms
- Vector similarity: <50ms for 75 nodes (linear scan)
- MCP round-trip: 50-200ms total

---

## Trade-offs

### Current Architecture

**Pros:**
- ✅ Simple - Each service does one thing
- ✅ Robust - Service failures don't cascade
- ✅ Flexible - Can run any combination of services
- ✅ Optional optimization - Vector Daemon provides speed without complexity

**Cons:**
- ❌ Three separate processes to manage
- ❌ File Watcher name is misleading (it's an ingestion coordinator)
- ❌ Potential for process state inconsistency
- ❌ More moving parts = more to understand

---

## Future Considerations

### Potential Improvements
1. **Hot config reload** - Watch config file and update watchers
2. **Incremental ingestion** - Only reprocess changed files
3. **Service health checks** - Automated monitoring
4. **Unified daemon** - Combine File Watcher + Vector Daemon?
5. **MCP write operations** - Allow graph updates via MCP

### Questions to Answer
1. Should File Watcher and Vector Daemon be one process?
2. Should we remove local embedding fallback?
3. Can MCP Server do more? Should it?
4. Is three-service architecture too complex?

---

## References

- File Watcher implementation: `src/daemon/index.ts`
- Vector Daemon implementation: `src/resonance/services/vector-daemon.ts`
- MCP Server implementation: `src/mcp/index.ts`
- Embedder service: `src/resonance/services/embedder.ts`
- Service lifecycle: `src/utils/ServiceLifecycle.ts`
- Config loading: `src/config/defaults.ts`
