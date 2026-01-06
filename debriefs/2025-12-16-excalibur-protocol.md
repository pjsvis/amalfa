# Debrief: The Excalibur Protocol (2025-12-16)

## Summary
We embarked on a mission to stabilize high-concurrency operations between the Active Daemon (Writer) and the MCP Server (Reader) using `bun:sqlite` in WAL mode. We encountered persistent `disk I/O error` and `SQLITE_BUSY` failures. Through the "Triad Stress Test" (Concurrency Lab), we isolated the root causes and established a "Gold Standard" configuration.

## The Problem
Running multiple Bun processes against a single SQLite database in WAL mode caused:
1.  **Disk I/O Errors:** Likely due to aggressive memory mapping (`mmap`) or stale file locks on the `-wal` / `-shm` files.
2.  **SQLITE_CANTOPEN:** Caused by opening connections as `readonly: true` in WAL mode (Readers *must* write to the shared memory file).
3.  **SQLITE_BUSY_RECOVERY:** Caused by checking `PRAGMA journal_mode` before setting `busy_timeout` during startup recovery.

## The Solution: "Hardened SQLite Protocol"
We codified the following rules in `playbooks/sqlite-standards.md` and `DatabaseFactory.ts`:

### 1. The "Busy First" Rule
**Rule:** Always set `PRAGMA busy_timeout = 5000;` as the *very first* operation on a new connection.
**Why:** If the database is in "Recovery" mode (e.g., after a crash), even a simple read query (like checking the journal mode) will fail immediately if no timeout is set.

### 2. The "Smart WAL" Rule
**Rule:** Only execute `PRAGMA journal_mode = WAL;` if the mode is not already `wal`.
**Why:** Blindly setting it on every connection forces a write-lock check, which causes unnecessary contention and `SQLITE_BUSY` errors for readers.

### 3. The "No ReadOnly" Rule
**Rule:** Never use `{ readonly: true }` in WAL mode.
**Why:** The WAL protocol requires all readers to acquire write locks on the `-shm` (Shared Memory) file. Enforcing read-only at the file descriptor level breaks this mechanism.

### 4. The "Zero Mmap" Rule
**Rule:** Set `PRAGMA mmap_size = 0;` in multi-process Bun environments.
**Why:** While `mmap` is faster, it introduces complex file-locking interactions with the OS (especially macOS) that can lead to "Disk I/O Errors" when multiple processes fight for the same pages.

## Verification
We built a permanent test suite in `scripts/lab/` ("The Concurrency Lab"):
-   **Writer:** `lab_daemon.ts` (Inserts data heavily).
-   **Reader:** `lab_mcp.ts` (Read/Vector Search heavily).
-   **Observer:** `lab_web.ts` (Checkpoints and monitors).
**Result:** 600+ concurrent operations with 0 errors.

## Next Steps (Post-Reboot)
The application code is fixed. The persistent service errors (`disk I/O error`) observed at the end of the session are likely due to "zombie" processes or stale file handles from previous crashes.
1.  **Reboot Machine.**
2.  **Start Services:** `bun run daemon start` & `bun run mcp start`.
3.  **Verify:** Run the "Excalibur" search via MCP.
