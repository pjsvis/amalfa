---
date: 2026-01-07
tags: [daemon, mcp, integration, performance, architecture]
---

# Brief: Integrate Daemon with MCP Server

## Problem Statement

The MCP server currently initializes the FastEmbed embedding model fresh for every search request, causing 2-5 second overhead per search. This makes the user experience slow and inefficient.

Two daemons exist but are not integrated:
1. **AMALFA Daemon** (`src/daemon/index.ts`) - File watcher for auto-ingestion
2. **Vector Daemon** (`src/resonance/services/embedder.ts`) - Keeps embedding model loaded in memory

The MCP server should automatically manage these daemons for optimal performance.

## Current State

**MCP Server** (`src/mcp/index.ts`):
- Runs standalone
- Creates `VectorEngine` per-request (line 36)
- VectorEngine initializes FastEmbed model each time (~2-5s overhead)
- No daemon integration

**AMALFA Daemon** (`src/daemon/index.ts`):
- Watches source directories for markdown changes
- Triggers incremental ingestion on file changes
- Uses `ServiceLifecycle` for process management
- Runs independently (not started by MCP)

**Vector Daemon** (`src/resonance/services/embedder.ts`):
- HTTP service on port 3010
- Keeps FastEmbed model loaded in memory
- Provides fast embedding endpoint
- Mentioned in architecture docs but not connected to MCP

## Desired State

**MCP Server startup sequence:**
1. Load configuration from `amalfa.config.json`
2. Check if vector daemon is running
3. If not running: auto-start vector daemon
4. Check if file watch is enabled in config
5. If enabled: auto-start AMALFA daemon
6. Start MCP server
7. Use daemon for fast embedding lookups

**MCP Server shutdown sequence:**
1. Stop MCP server
2. Optionally stop daemons (configurable: leave running vs. clean shutdown)

## Implementation Plan

### Task 1: Fix database path configuration
**File:** `src/mcp/index.ts`

Currently hardcoded:
```typescript
const dbPath = join(import.meta.dir, "../../.amalfa/resonance.db");
```

Should read from config:
```typescript
const config = await loadConfig();
const dbPath = join(process.cwd(), config.database);
```

### Task 2: Create daemon detection utilities
**New file:** `src/utils/DaemonManager.ts`

```typescript
interface DaemonStatus {
  running: boolean;
  pid?: number;
  port?: number;
}

class DaemonManager {
  async checkVectorDaemon(): Promise<DaemonStatus>
  async startVectorDaemon(): Promise<void>
  async stopVectorDaemon(): Promise<void>
  
  async checkFileWatcher(): Promise<DaemonStatus>
  async startFileWatcher(): Promise<void>
  async stopFileWatcher(): Promise<void>
}
```

### Task 3: Integrate daemon startup with MCP server
**File:** `src/mcp/index.ts`

Modify `runServer()` function:
```typescript
async function runServer() {
  // 0. Load configuration
  const config = await loadConfig();
  
  // 1. Start vector daemon if needed
  const daemonManager = new DaemonManager();
  const vectorStatus = await daemonManager.checkVectorDaemon();
  if (!vectorStatus.running) {
    log.info("Starting vector daemon...");
    await daemonManager.startVectorDaemon();
  }
  
  // 2. Start file watcher if enabled
  if (config.watch.enabled) {
    const watcherStatus = await daemonManager.checkFileWatcher();
    if (!watcherStatus.running) {
      log.info("Starting file watcher daemon...");
      await daemonManager.startFileWatcher();
    }
  }
  
  // 3. Continue with MCP server setup...
}
```

### Task 4: Add daemon management MCP tools (optional, future)
Expose tools for agents to manage daemons:
- `manage_vector_service` - start/stop/status vector daemon
- `manage_file_watcher` - start/stop/status file watcher

This enables self-healing infrastructure where agents can restart failed daemons.

## Technical Considerations

### PID File Management
- Vector daemon: `.vector-daemon.pid`
- File watcher: `.amalfa-daemon.pid`
- MCP server: `.mcp.pid`

All should use `ServiceLifecycle` pattern.

### Port Conflicts
Vector daemon defaults to port 3010. Need to:
- Check if port is available
- Handle port conflicts gracefully
- Allow port configuration in `amalfa.config.json`

### Daemon Lifecycle
Options for shutdown behavior:
1. **Shared daemons** - Leave running after MCP stops (multiple clients can use them)
2. **Owned daemons** - Stop daemons when MCP stops (clean shutdown)

Recommendation: Default to shared (leave running), add config option for owned.

### Error Handling
If daemon fails to start:
- Log warning but continue (degrade gracefully)
- MCP search will be slower but functional
- Agent can see error in logs and potentially restart daemon

## Success Criteria

✅ MCP server reads database path from config
✅ MCP server auto-starts vector daemon if not running
✅ MCP server auto-starts file watcher if enabled in config
✅ Search requests are fast (<100ms after first request)
✅ File changes trigger auto-ingestion
✅ Daemon status logged on MCP startup
✅ Tests pass with daemon integration

## Out of Scope

- MCP tools for daemon management (future enhancement)
- Daemon health monitoring/restart logic (future enhancement)
- Multi-daemon load balancing (future enhancement)

## Files to Modify

- `src/mcp/index.ts` - Add daemon startup logic
- `src/utils/DaemonManager.ts` - New file for daemon management
- `src/config/defaults.ts` - Add daemon config options (optional)

## Files to Reference

- `src/daemon/index.ts` - AMALFA daemon implementation
- `src/resonance/services/embedder.ts` - Vector daemon implementation
- `src/utils/ServiceLifecycle.ts` - Daemon management pattern
- `docs/architecture/daemon-operations.md` - Architecture documentation
