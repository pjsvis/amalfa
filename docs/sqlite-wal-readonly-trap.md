# The SQLite WAL Readonly Trap

**TL;DR:** If you use WAL mode (and you should), **never open connections with `readonly: true`**. Even readers need write access to the `-shm` shared memory file. Violating this causes `disk I/O error` and database corruption.

---

## The Problem

You enable WAL mode for concurrency. You open a "readonly" connection to query data. Your app crashes with:

```
Error: disk I/O error
SQLITE_IOERR
```

**What happened?** WAL mode requires ALL connections (readers and writers) to update the `-shm` (shared memory) file. A "readonly" connection can't do this, so SQLite fails.

---

## Why This Happens

### Legacy: Pre-WAL SQLite (pre-2010)
Before WAL (Write-Ahead Logging), SQLite had two access modes:
- **ReadWrite:** Can modify the database
- **Readonly:** Safe for concurrent readers, no locks needed

This made sense when the journal was file-based. Readers didn't touch anything.

### WAL Mode (2010+)
WAL introduced a shared memory file (`dbname-shm`) to coordinate between processes.
- Register itself as an active reader
- Track which WAL frames it has read
- Coordinate checkpointing

**The trap:** Many developers (and AI agents) assume "readonly" still works because it did pre-2010. The mental model is 16 years out of date.

**Why LLMs get this wrong:** Training data is dominated by pre-2010 SQLite tutorials, StackOverflow answers from 2008-2012, and books written when DELETE mode was default. LLMs confidently suggest `readonly: true` because that's what the corpus says, not because it works in WAL.

---

## The Hard-Earned Fix

### ❌ Wrong (Causes Corruption)
```javascript
// Bun/Node.js
const Database = require('bun:sqlite');
const db = new Database('app.db', { readonly: true });  // ☠️ BROKEN IN WAL

// Python
import sqlite3
conn = sqlite3.connect('app.db', uri=True, readonly=True)  # ☠️ BROKEN IN WAL

// Golang
db, _ := sql.Open("sqlite3", "file:app.db?mode=ro")  // ☠️ BROKEN IN WAL
```

### ✅ Correct (Always Works)
```javascript
// Bun/Node.js - Use default ReadWrite
const Database = require('bun:sqlite');
const db = new Database('app.db');  // ✅ Works in WAL

// Python - Omit readonly
import sqlite3
conn = sqlite3.connect('app.db')  # ✅ Works in WAL

// Golang - Use default mode
db, _ := sql.Open("sqlite3", "app.db")  // ✅ Works in WAL
```

**Key insight:** In WAL mode, "readonly" is a behavioral constraint you enforce in your code, not a database-level flag.

---

## Best Practices: The Polyvis Standard

We learned this the hard way through a process we call **"Harden and Flense"** - fortify the critical paths (Harden) and strip away assumptions that no longer hold (Flense).

Here's our battle-tested approach:

### 1. Enforce WAL + Timeout at Connection Time

Every connection gets these pragmas immediately:

```sql
PRAGMA busy_timeout = 5000;    -- Wait 5s for locks (MUST BE FIRST)
PRAGMA journal_mode = WAL;      -- Enable concurrent reads
PRAGMA synchronous = NORMAL;    -- Balance safety/speed
PRAGMA foreign_keys = ON;       -- Data integrity
PRAGMA temp_store = memory;     -- Performance
```

### 2. Use a Factory Pattern

Never instantiate connections directly. Use a factory that enforces standards:

```typescript
// DatabaseFactory.ts
export const DatabaseFactory = {
  connect(path: string, options = {}) {
    const db = new Database(path);  // Never use { readonly: true }
    
    db.run("PRAGMA busy_timeout = 5000;");  // FIRST!
    
    const current = db.query("PRAGMA journal_mode;").get();
    if (current.journal_mode !== "wal") {
      db.run("PRAGMA journal_mode = WAL;");
    }
    
    db.run("PRAGMA synchronous = NORMAL;");
    db.run("PRAGMA foreign_keys = ON;");
    db.run("PRAGMA temp_store = memory;");
    
    return db;
  }
};
```

### 3. Behavioral Readonly (Not Database-Level)

If you need readonly semantics, enforce it in your application:

```typescript
class ReadonlyDatabase {
  constructor(path: string) {
    this.db = DatabaseFactory.connect(path);  // Full access
  }
  
  query(sql: string, ...params) {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return this.db.query(sql).all(...params);
    }
    throw new Error('Readonly database: SELECT only');
  }
}
```

### 4. Centralize Configuration (Harden)

Don't scatter pragma calls across your codebase. Create one source of truth:

```
playbooks/sqlite-standards.md  ← Document the why
DatabaseFactory.ts              ← Enforce the how
```

When you forget (and you will), the factory catches you.

**The Harden principle:** Make the correct path automatic. Incorrect paths should require deliberate effort to achieve.

### 5. Strip Legacy Assumptions (Flense)

Audit your codebase for outdated patterns:
- `readonly: true` in database connections
- `journal_mode = DELETE` assumptions
- Missing `busy_timeout` settings
- Direct `new Database()` calls without pragma setup

**The Flense principle:** Remove what no longer serves. Pre-2010 patterns are technical debt.

---

## Signs You've Hit This Bug

- ✅ Works perfectly in dev (low concurrency)
- ☠️ Crashes in production (high concurrency)
- ☠️ Error message: `disk I/O error`, `SQLITE_IOERR`, or `SQLITE_READONLY`
- ☠️ Happens when multiple processes access the database
- ☠️ `-shm` or `-wal` files exist but connection fails

---

## When This Doesn't Apply

You're safe to skip this if:
- You use `journal_mode = DELETE` (old default)
- You have exactly one process, one connection, no concurrency
- Your database is truly readonly (burned to CD-ROM)

**But if you're here, you probably need WAL.**

---

## The Deeper Why: WAL Architecture

WAL changed SQLite from a single-writer model to a concurrent model:

```
Pre-2010 (DELETE mode):
┌─────────┐
│ main DB │ ← Writers lock entire file
└─────────┘   Readers wait

2010+ (WAL mode):
┌─────────┐     ┌─────────┐     ┌─────────┐
│ main DB │ ←── │   WAL   │ ──→ │   SHM   │
└─────────┘     └─────────┘     └─────────┘
                                  ↑ ALL connections must access
```

The `-shm` file is a POSIX shared memory segment. It's not optional. It's not a cache. It's the coordination mechanism that makes WAL work.

Opening a connection without write access to `-shm` is like trying to join a meeting without being able to raise your hand. The system doesn't know you exist.

---

## Recommended Reading

- [SQLite WAL Mode Docs](https://www.sqlite.org/wal.html) - Official explanation
- [Appropriate Uses For SQLite](https://www.sqlite.org/whentouse.html) - When to use WAL
- [File Locking And Concurrency](https://www.sqlite.org/lockingv3.html) - Deep dive

---

## License & Attribution

This document is born from production failures at Polyvis. Copy it. Share it. Save someone else the debugging pain.

**Polyvis Standard:** See our full implementation in:
- `src/resonance/DatabaseFactory.ts` - Factory pattern
- `playbooks/sqlite-standards.md` - Team playbook
- `debriefs/2025-12-16-database-stabilization.md` - The war stories

---

## Version History

- **v1.0** (2026-01-05) - Initial release after repeated production incidents
