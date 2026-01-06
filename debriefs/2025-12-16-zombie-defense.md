# Debrief: Operation Zombie Defense (2025-12-16)

## Summary
The system was plagued by persistent `disk I/O error` and `SQLITE_BUSY` exceptions whenever multiple services (Daemon, MCP, Ingestion) accessed `resonance.db` simultaneously. The root cause was identified as a combination of "Zombie" processes holding stale file handles and an incorrect SQLite configuration for WAL mode.

## The Fix

### 1. Hardened SQLite Protocol (`sqlite-standards.md`)
We discovered that `bun:sqlite` with WAL mode requires **Read-Write access** even for "Reader" connections. If a reader is purely `readonly`, it cannot update the `-shm` (Shared Memory) file, leading to corruption or locks.
-   **Action**: `DatabaseFactory.connect` now strictly enforces `{ readonly: false }` for ALL connections.
-   **Action**: `PRAGMA busy_timeout = 5000` is applied immediately upon connection.

### 2. Zombie Defense System (`bun-playbook.md`)
We created `src/utils/ZombieDefense.ts` to actively scan for and terminate:
-   **Ghosts**: Processes holding handles to deleted files (via `lsof +L1`).
-   **Duplicates**: Multiple instances of singleton services (like `daemon.ts`).
-   **Unknowns**: Rogue `bun` processes.

This system is now integrated into:
-   `src/resonance/daemon.ts`
-   `src/mcp/index.ts`
-   `src/resonance/cli/ingest.ts` (Build pipeline)

## Verification
We verified the fix with:
-   **Triad Stress Test**: Running Writer, Reader (MCP), and Web concurrently for 60s.
-   **Excalibur Protocol**: Vector searching for "Excalibur" during heavy ingestion.
-   **Full Rebuild**: Integrated `ZombieDefense` into `bun run build:data` and successfully rebuilt the DB without errors.

## Artifacts Updated
-   `playbooks/bun-playbook.md`: Added Zombie Defense documentation.
-   `playbooks/sqlite-standards.md`: Updated with the "Hardened" configuration rules.
-   `src/utils/ZombieDefense.ts`: The core utility.
