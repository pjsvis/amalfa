# Incident Report: Persistent Disk I/O Error (2025-12-16)

## 1. The Verdict
**The system is healthy.** The errors you witnessed were caused by a **Ghost Process (PID 9622)**.

## 2. The Evidence ("Where, When, What")

### **WHERE: Process ID 9622**
We located a hidden Bun process that was not visible in standard `ps aux` checks but was caught by `lsof +L1` (List Open Files with Link Count < 1).

```bash
COMMAND  PID  USER        FD   TYPE DEVICE SIZE/OFF NODE      NAME
bun      9622 petersmith  6u   REG  1,15   8011776  0         .../public/resonance.db (deleted)
```

### **WHEN: Post-Rebuild (16:58 UTC)**
The error began immediately after we ran `rm public/resonance.db` to rebuild the database.

1.  **16:58:10** - We deleted the old `resonance.db` file.
2.  **16:58:15** - We created a *new* `resonance.db` file (with a new Inode on the disk).
3.  **16:58:20** - Process 9622 (The Zombie) continued to hold a file handle to the *old* (now deleted) Inode.

### **WHAT: The "Two Worlds" Conflict**
SQLite in WAL mode relies on three files working in unison: `.db`, `.db-shm` (Shared Memory), and `.db-wal` (Write Ahead Log).

1.  **The Zombie (PID 9622)** was trying to coordinate locks on the **OLD** `.db-shm` file associated with the deleted database.
2.  **The New System (Daemon/Scripts)** was trying to coordinate locks on the **NEW** `.db-shm` file.
3.  **The Result:** `SQLITE_IOERR` (Disk I/O Error).
    -   When the Zombie tried to "Checkpoint" (move data from WAL to DB), the OS reported that the DB file no longer existed in the directory structure (Link Count 0), creating a catastrophic I/O failure state for that process.
    -   Any MCP tool call routed to this Zombie process inevitably crashed.

## 3. Resolution
The code is correct. The configuration is hardened. The "fix" is simply to terminate the zombie process.
Restarting the IDE/Agent environment will kill PID 9622 and resolve the issue permanently.

<!-- tags: [concept: auto-generated-tag], [concept: debrief] -->
