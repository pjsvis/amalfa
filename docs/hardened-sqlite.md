To build a hardened, multi-process SQLite system within the Bun ecosystem, we must move beyond standard configurations and address the physical "territory" of the file system and the locking mechanics of the WAL (Write-Ahead Logging) mode.

The following "belt and braces" recipe implements **Deductive Minimalism (COG-12)**—subtracting potential failure points like `mmap` and directory permission ambiguities—to achieve **Workflow Durability (PHI-13)**.

-----

## 1\. File System "Territory" Requirements

SQLite in WAL mode is not a single file; it is a triad. Your OS permissions must reflect this, or you will encounter `SQLITE_READONLY` even with `readonly: false` in your code.

  * **The Directory:** The parent folder must have **Write + Execute** permissions for all participating processes (Writer and Readers) to allow for the creation and deletion of temporary files.
  * **The `-shm` File:** All readers **must** have physical **Read/Write** access to this file to manage "read-marks," which prevent the writer from overwriting WAL frames currently being read.
  * **The `-wal` File:** Readers need Read access; the Writer needs Read/Write.

-----

## 2\. The "Belt and Braces" Configuration

This configuration prioritizes stability and **Conceptual Entropy Reduction (PHI-12)** by explicitly setting pragmas that prevent common race conditions.

```typescript
import { Database } from "bun:sqlite";

/**
 * Ctx Hardened SQLite Recipe
 * Implements: OH-082 (Slow Thinking), OH-041 (Optimal Simplicity)
 */

const DB_PATH = "app_data.db";

// 1. Initialize Connection
const db = new Database(DB_PATH, { strict: true });

// 2. Health Check & Config Sequence
// CRITICAL: Set busy_timeout BEFORE any other pragmas
db.run("PRAGMA busy_timeout = 5000;"); // Wait up to 5s for locks/recovery

// 3. Stabilization Pragmas
db.run("PRAGMA journal_mode = WAL;");   // Enable concurrency
db.run("PRAGMA synchronous = NORMAL;"); // Safe for WAL, balances speed/integrity
db.run("PRAGMA mmap_size = 0;");        // Disable mmap to prevent Mac I/O errors
db.run("PRAGMA foreign_keys = ON;");    // Enforce relational integrity

/**
 * Health Check: Validation of Operational State
 */
function performHealthCheck() {
    const journalMode = db.query("PRAGMA journal_mode").get() as { journal_mode: string };
    const mmapSize = db.query("PRAGMA mmap_size").get() as { mmap_size: number };
    
    if (journalMode.journal_mode !== 'wal') throw new Error("HealthCheck Failed: WAL not active");
    if (mmapSize.mmap_size !== 0) throw new Error("HealthCheck Failed: mmap not disabled");
    
    // Simple Write/Read Test (The 'Proof' Artifact - OH-096)
    db.run("CREATE TABLE IF NOT EXISTS _health (id INTEGER PRIMARY KEY, ts TEXT)");
    db.run("INSERT INTO _health (ts) VALUES (datetime('now'))");
    
    return { status: "Healthy", substrate: "bun:sqlite", mode: journalMode.journal_mode };
}
```

-----

## 3\. Multi-Tenant Hardening Strategy

To transform this into a multi-tenant system, we apply **Architectural Specialisation (PHI-14)**.

| Layer | Implementation | Purpose |
| :--- | :--- | :--- |
| **Identity** | `tenant_id` column on every table. | Logical isolation of data. |
| **Enforcement** | Use **Row Level Security (RLS)** patterns via Views. | Prevent "Leaky Abstractions" where one tenant sees another's data. |
| **I/O Isolation** | `mmap_size = 0` | Prevents a crash in one process (Reader) from impacting the Writer via memory-map corruption. |
| **Concurrency** | `SQLITE_BUSY_RECOVERY` handling. | Ensures readers wait for the Writer to finish WAL recovery before erroring out. |

-----

## 4\. Operational Checklists (OPM-9)

Before deploying, verify these "Lerts" (heightened alertness items):

1.  **Integrity Check:** Run `PRAGMA integrity_check;` during maintenance windows to ensure no pages are corrupted.
2.  **Writer-First Start:** Ensure the Writer process starts and initializes the WAL/SHM files *before* the Readers attempt to connect, minimizing `SQLITE_BUSY_RECOVERY` loops.
3.  **Vacuum Strategy:** In WAL mode, use `PRAGMA auto_vacuum = INCREMENTAL;` to manage file size without locking the entire DB for long durations.

Would you like me to generate a **Speculative Map** for how to automate these health checks into a Bun-based monitoring dashboard?