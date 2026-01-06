# SQLite Configuration & Best Practices (Canon)

> [!IMPORTANT]
> This document is the **Single Source of Truth** for all SQLite operations in PolyVis.
> Deviating from these standards causes "Disk I/O Errors" and locking issues in our concurrent environment (Daemon + MCP).

## 1. The "Resonance" Standard
All database connections MUST use the following configuration to ensure stability under concurrency.

### Required Pragmas
Every connection (Writer or Reader) must execute these immediately upon opening:

```sql
-- 1. Busy Timeout (Startup Safety)
-- CRITICAL: Must be executed FIRST to survive startup contention/recovery.
PRAGMA busy_timeout = 5000;

-- 2. Write-Ahead Logging (Concurrency)
-- "Smart WAL": Only set if not already 'wal' to avoid write## 2. Configuration Standards (The "Hardened" Protocol)

To ensure concurrency (1 Writer + N Readers) without `SQLITE_BUSY` or `disk I/O error`, we enforce the following **Hardened Configuration** via `DatabaseFactory`.

### 2.1 The Golden Rules
1.  **WAL Mode is Mandatory**: `PRAGMA journal_mode = WAL`.
2.  **ReadWrite is Mandatory**: Even "Readers" must connect with `readonly: false` because WAL readers need to write to the `-shm` shared memory file.
3.  **Busy Timeout**: `PRAGMA busy_timeout = 5000;` (Wait 5s for locks).
4.  **No mmap**: `PRAGMA mmap_size = 0;` (Stability over speed).

### 2.2 Implementation (`DatabaseFactory.ts`)
Do not instantiate `new Database()` directly. Always use the factory:

```typescript
import { DatabaseFactory } from "@src/resonance/DatabaseFactory";

// For raw access (enforces WAL, timeout, etc.)
const db = DatabaseFactory.connectToResonance(); 
// Factory will enforce Pragma settings automatically.
```

## 2. Architecture Patterns

### ✅ Protocol A: The `ResonanceDB` Class
Use the `ResonanceDB` class for all standard graph operations. It encapsulates the config above.

```typescript
// Correct: Uses Factory internally via init()
const db = ResonanceDB.init();
// or if strictly necessary: new ResonanceDB(DatabaseFactory.connectToResonance())
```

### ✅ Protocol B: Dependency Injection (Services)
Services (like `VectorEngine`) should NOT open their own connections. Pass the existing `ResonanceDB` instance or its raw connection.

```typescript
// Correct
const vectorEngine = new VectorEngine(db.getRawDb());
```

### ❌ Anti-Pattern: Raw Connections
Do not instantiate `new Database()` directly in business logic unless properly configured with ALL pragmas above.
-   **Risk:** Missing `busy_timeout` causes immediate crashes when the Daemon is writing.

## 3. Maintenance
-   **Vacuum:** Run `VACUUM;` weekly.
-   **Optimize:** Run `PRAGMA optimize;` before closing.` tracking.
-   **Drizzle:** Available for reference/type generation, but runtime is Pure Bun.

### 3. File Extensions
-   **Primary:** `resonance.db`

## 4. Connection Lifecycle
-   **Singletons:** In long-running processes (Daemon), keep one connection open.
-   **Ephemeral:** CLI tools can open/close on demand.
-   **Shutdown:** Always `db.close()` to checkpoint WAL (optional but polite).
