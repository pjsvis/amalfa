# Experiment: The Concurrency Lab

**Objective**: Isolate `bun:sqlite` concurrency behavior from application logic. Prove that 1 Writer and 2 Readers can coexist in WAL mode using our `DatabaseFactory` configuration.

## The Triad
We will create three standalone scripts in `scripts/lab/`:

### 1. The Writer (`lab_daemon.ts`)
*   **Role**: Simulates the Active Daemon.
*   **Action**: Opens `resonance.db`. Inserts a new row into a `_stress_test` table every 100ms.
*   **Config**: ReadWrite, WAL.

### 2. The Reader (`lab_mcp.ts`)
*   **Role**: Simulates the MCP Server.
*   **Action**: Opens `resonance.db`. Performs a `SELECT COUNT(*)` and a Vector Search (if possible, or just heavy read) every 50ms.
*   **Config**: ReadWrite (as we learned WAL requires it), WAL.

### 3. The Observer (`lab_web.ts`)
*   **Role**: Simulates the Web Server.
*   **Action**: Opens `resonance.db`. Polls status every 1000ms.
*   **Config**: ReadOnly (or ReadWrite if needed).

## The Variable
We will test the configuration defined in `src/resonance/DatabaseFactory.ts`.

## Success Criteria
*   All 3 scripts run for 60 seconds.
*   Zero `disk I/O error` or `SQLITE_BUSY`.
*   Writer commits > 500 records.
*   Reader successfully reads 1000+ times.
