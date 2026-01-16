---
date: 2026-01-16
tags: [maintenance, cli, vector-search, database, caching]
agent: claude
environment: local
---

## Task: Tiered Maintenance Strategy

**Objective:** Replace the destructive "nuke-and-pave" maintenance workflow with a 3-tier strategy (`doctor`, `rebuild`, `reset`) that prioritizes data preservation and rapid recovery, powered by a new Vector Caching architecture.

- [ ] Implement Vector Caching in `Embedder.ts` (store outputs, not just models)
- [ ] Implement `amalfa rebuild` (Level 2: State Refresh)
- [ ] Implement `amalfa doctor --fix` (Level 1: Surgical Repair)
- [ ] Implement `amalfa reset` (Level 3: Factory Reset)

## Key Actions Checklist

- [ ] **Infrastructure**: Create `scripts/maintenance/vector-cache.ts` or extend `Embedder.ts` with SQLite/LMB KV store.
- [ ] **CLI**: Add `rebuild` command to `src/cli/commands/`.
- [ ] **CLI**: Upgrade `doctor` command to support `--fix` flag.
- [ ] **CLI**: Add `reset` command to `src/cli/commands/`.
- [ ] **Docs**: Update `docs/guides/troubleshooting.md` with new maintenance workflows.

## Detailed Requirements

### 1. Vector Caching Architecture (Critical Enabler)
To make `rebuild` fast, we must avoid re-running the ONNX model for unchanged content.
*   **Location**: `.amalfa/cache/vector_cache.sqlite`
*   **Schema**:
    ```sql
    CREATE TABLE cache (
      key TEXT PRIMARY KEY, -- sha256(text + model_id)
      vector TEXT,          -- base64 or blob
      last_used INTEGER     -- timestamp for LRU cleanup
    );
    ```
*   **Integration**: Modify `Embedder.embed()` to check cache before inference.

### 2. Tier 1: Surgical Repair (`amalfa doctor --fix`)
**Goal**: Resolve runtime issues without stopping services or touching data.
*   Check PID files against `process.kill(pid, 0)`. Remove stale files.
*   Check for `SQLITE_BUSY` locks. Run `PRAGMA wal_checkpoint(TRUNCATE)`.
*   Verify service health endpoints.

### 3. Tier 2: State Refresh (`amalfa rebuild`)
**Goal**: Re-sync the database with the filesystem *without* losing expensive artifacts.
*   Stop ingestion daemon (pause).
*   Drop/Truncate all database tables (keeps DB file or recreates it).
*   **Crucial**: Do NOT delete `.amalfa/cache`.
*   Run `amalfa init` logic (modified to leverage Vector Cache).

### 4. Tier 3: Factory Reset (`amalfa reset`)
**Goal**: Complete wipe. The "Nuclear Option".
*   `amalfa stop-all`
*   Recursive delete `.amalfa/`
*   Prompt for confirmation.
