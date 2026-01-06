# Debrief: Database Stabilization & Factory Refactor
**Date:** 2025-12-16
**Topic:** Concurrency, DatabaseFactory, and "Harden & Flense"

## 1. Summary
This session focused on eliminating persistent `SQLITE_BUSY` and `disk I/O error` clusters caused by uncoordinated database access in a concurrent environment (Daemon, MCP Server, and Scripts running simultaneously).

We achieved this by implementing a strict **DatabaseFactory** pattern and enforcing it across 100% of the codebase.

## 2. Key Achievements

### The "Single Source of Truth" (DatabaseFactory)
-   **Problem:** Scripts were manually instantiating `new Database("./path/to/db")`. This bypassed essential PRAGMAs (`busy_timeout`, `WAL` mode) and caused locking conflicts.
-   **Solution:** Centralized all logic in `src/resonance/DatabaseFactory.ts`.
-   **Enforcement:** Refactored 20+ scripts to use `DatabaseFactory.connectToResonance()` or `ResonanceDB.init()`.
-   **Result:** All connections now automatically use the "Gold Standard" configuration (WAL + 5s Timeout + ReadWrite).

### Portable Drop-In Architecture
-   **Problem:** Deployment required manual configuration of absolute paths for MCP clients.
-   **Solution:** Created `scripts/setup_mcp.ts` ("The Handshake") which generates valid config based on the *current* directory.
-   **Liftoff:** `EnvironmentVerifier` now asserts path validity at startup, crashing early and helpfully if configs are wrong.

### The "Harden and Flense" Protocol
-   **Insight:** Standard Output (`stdout`) is an API. Logging "Connecting to DB..." to stdout breaks JSON-RPC pipes (MCP).
-   **Protocol:** Logs go to `stderr`. Data goes to `stdout`.
-   **Agentic Directive:** Agents must "Ask the Graph First" (`ask_graph`) before making assumptions.

## 3. Lessons Learned

### SQLite in Bun
1.  **ReadWrite is Mandatory for WAL Readers**: Even "Read Only" connections must be opened as Read/Write in WAL mode because they need to update the `-shm` shared memory file. Failing to do so causes `disk I/O error`.
2.  **Busy Timeout is First**: The `PRAGMA busy_timeout` must be the *very first* command sent. If a connection attempts to read before setting this, it may fail instantly under load.
3.  **Mmap is Dangerous**: In high-concurrency or dockerized environments, `mmap` can cause stability issues. We disabled it (`mmap_size = 0`) favoring stability over raw read speed.

## 4. Next Steps
-   **Deprecate Legacy Scripts:** `scripts/legacy/` should be systematically replaced or audited.
-   **Graph Visualization:** Re-enable the Sigma.js frontend features now that the backend is stable.
