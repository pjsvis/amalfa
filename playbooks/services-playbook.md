---
date: 2026-01-16
tags: [architecture, services, daemons, cli]
agent: claude
environment: local
---

# Services & Daemons Playbook

**Objective**: Ensure all Amalfa background services ("Daemons") follow a consistent lifecycle, logging, and integration pattern.

## 1. Architecture: The Micro-Daemon Pattern

Amalfa services are standalone `bun` processes managed by the `ServiceLifecycle` utility. They communicate via HTTP (internal) or standard streams.

**Key Principles**:
1.  **Isolation**: Each daemon runs in its own process.
2.  **Lifecycle**: Managed via PID files in `.amalfa/runtime/`.
3.  **Logging**: Dedicated logs in `.amalfa/logs/`.
4.  **Standard Interface**: All daemons must support `start`, `stop`, `status`, `serve`.

## 2. Port Registry

| Service | Port | Env Var | Description |
|---------|------|---------|-------------|
| Vector Daemon | 3010 | `VECTOR_PORT` | Embeddings generation (FastEmbed) |
| Reranker Daemon | 3011 | `RERANKER_PORT` | Cross-encoder reranking (BGE-M3) |
| Sonar Agent | 3012 | `SONAR_PORT` | LLM interactions and reasoning |
| File Watcher | N/A | - | Filesystem monitoring (runs as background worker) |
| MCP Server | Stdio | - | Model Context Protocol interface |

## 3. Implementation Checklist (Definition of Done)

When creating a new service (e.g., `src/resonance/services/new-service.ts`):

### A. The Daemon Script (`src/resonance/services/`)
- [ ] Import `ServiceLifecycle`.
- [ ] Initialize lifecycle with unique name and paths:
    ```typescript
    const lifecycle = new ServiceLifecycle({
        name: "New-Service",
        pidFile: join(AMALFA_DIRS.runtime, "new-service.pid"),
        logFile: join(AMALFA_DIRS.logs, "new-service.log"),
        entryPoint: "src/resonance/services/new-service.ts",
    });
    ```
- [ ] Implement `runServer()` with HTTP endpoints (including `/health`).
- [ ] Execute `await lifecycle.run(process.argv[2], runServer)`.

### B. CLI Integration (`src/cli/commands/services.ts`)
- [ ] Export `cmdNewService(args)` function.
- [ ] Use `spawn` to invoke the daemon script:
    ```typescript
    const proc = spawn("bun", ["run", daemonPath, action], ...);
    ```

### C. Main Entry Point (`src/cli.ts`)
- [ ] Register command in `main()` switch case (`case "new-service": ...`).
- [ ] Add to `showHelp()` output.

### D. Server Management (`src/cli/commands/server.ts`)
- [ ] Add to `SERVICES` list for `amalfa servers` status display.
- [ ] Add to `BACKGROUND_SERVICES` if it should start with `amalfa servers start`.
- [ ] Add to `cmdStopAll` list to ensuring `amalfa stop-all` kills it.

## 4. Best Practices

- **Lazy Loading**: Do not load heavy ML models at import time. Load them inside `runServer()` or on first request.
- **Graceful Shutdown**: `ServiceLifecycle` handles SIGTERM/SIGINT, but ensure your server closes connections explicitly if needed.
- **Health Checks**: Always implement `GET /health` returning JSON status.
