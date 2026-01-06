# Package Scripts & CLI Playbook

This document serves as the reference manual for all scripts defined in `package.json`. Since JSON files cannot contain comments, this file provides the necessary context and usage instructions for developer tooling.

## Core CLI Applications

PolyVis uses a standardized `ServiceLifecycle` for its three main applications. Each supports the following subcommands:
-   `serve` (Default): Runs in the foreground.
-   `start`: Runs in the background (Detached, PID file managed).
-   `stop`: Stops the background process.
-   `restart`: Stop + Start.
-   `status`: Checks if the service is running.

### 1. Developer Environment (`bun run dev`)
The primary entry point for development.
-   **Command**: `bun run scripts/cli/dev.ts`
-   **Usage**:
    -   `bun run dev` (or `serve`): Starts Web Server + CSS Watcher + JS Watcher in foreground.
    -   `bun run dev start`: Starts the stack in the background. Logs to `.dev.log`.
    -   `bun run dev status`: Check status.

### 2. Resonance Daemon (`bun run daemon`)
The background Vector Search service.
-   **Command**: `bun run src/resonance/daemon.ts`
-   **Usage**:
    -   `bun run daemon start`: Standard way to run the daemon (Port 3010).
    -   `bun run daemon status`: Check if running.

### 3. MCP Server (`bun run mcp`)
The Model Context Protocol server for AI Agent integration.
-   **Command**: `bun run src/mcp/index.ts`
-   **Transport**: `stdio` (Standard Input/Output)
-   **Important Note**: Because this server communicates via `stdin/stdout`, it **cannot** be effectively run in `start` (background) mode, as it will immediately encounter EOF on stdin and exit.
-   **Usage**:
    -   `bun run mcp` (or `serve`): Runs in foreground, awaiting JSON-RPC messages on stdin. Use this for testing or when connecting via an MCP Client (which spawns this process).
        > [!NOTE]
        > The MCP Server (`serve` mode) uses a relaxed Zombie Defense protocol (`checkZombies=false`) to allow it to coexist with its own wrapper scripts without triggering a self-termination.
    -   `bun run mcp start`: **NOT RECOMMENDED**. Will start and immediately exit.

## Development Standards

### Database Access
All scripts must adhere to the **Single Source of Truth** for database connections.
-   **DO NOT** use `new Database(path)`.
-   **DO NOT** manually resolve paths from `settings.json`.
-   **DO USE** `ResonanceDB.init()` for high-level graph access.
-   **DO USE** `DatabaseFactory.connectToResonance()` for raw SQL access.

```typescript
// ✅ Good
import { ResonanceDB } from "@src/resonance/db";
const db = ResonanceDB.init();

// ✅ Good (Raw)
import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
const sqlite = DatabaseFactory.connectToResonance();
```

## Build & Maintenance Scripts

### Data Pipeline
-   `bun run build:data`: Runs the Ingestion Pipeline (`src/resonance/cli/ingest.ts`). Rebuilds the Knowledge Graph from source markdown files.
-   `bun run build:css`: Compiles Tailwind/PostCSS assets.
-   `bun run build`: Runs both data and asset builds.

### Watchers
-   `bun run watch:css`: Watches for CSS changes and rebuilds.
-   `bun run watch:js`: Watches for frontend JS changes (hot reload not yet implemented, rebuilds only).

### Testing & Verification
-   `bun run test`: Runs the test suite.
-   `bun run verify`: Runs `scripts/verify/simple_search_test.ts` to validate Vector Search.

## Zombie Defense
All standard CLIs (`dev`, `daemon`, `mcp`) automatically integrate **Zombie Defense**.
-   **Behavior**: On startup, they scan for "Ghost" processes (holding locked files) or duplicate instances of themselves.
-   **Identity Awareness**: The defense protocol scans PIDs. To prevent "friendly fire" (a process killing itself), it explicitly excludes its own PID (`process.pid`) and parent PID (`process.ppid`) from the duplicate list.
-   **Auto-Cleanup**: If a stale PID file exists but the process is dead, it cleans the file. If the process is alive, it aborts (to prevent double-runs).

> [!CAUTION]
> **The Locked Trio**: Valid processes hold locks on three files: `resonance.db`, `resonance.db-shm`, and `resonance.db-wal`.
> If a "Zombie" process retains these locks, any new process attempting to start will crash with `Disk I/O Error`.
> **Rule**: You must clear zombies off the road before depressing the accelerator.
