# TASK: IRON-CLAD PERSISTENCE REFACTOR

**Target File:** `src/pipeline/Ingestor.ts`
**Safety Latch:** Before applying changes, run `git rev-parse --short HEAD` and confirm you are on the correct branch.

**Objective:**
Refactor `runExperience()` to prevent "Zombie Data Loss" by implementing Transaction Batching, Explicit Checkpoints, and the "Pinch Check."

## Directives

1.  **Remove the Global Transaction:**
    * Delete the `this.db.beginTransaction()` and `commit()` that wrap the *entire* `runExperience` method.
    * *Reason:* "All-or-Nothing" transactions lose everything if the process crashes.

2.  **Implement Batching:**
    * Inside the `filesToProcess` loop, group files into batches of **50**.
    * Start a transaction at the start of a batch.
    * Commit the transaction at the end of a batch.
    * *Logic:* `if (i % 50 === 0) this.db.beginTransaction();` ... `if (i % 50 === 49 || isLast) this.db.commit();`

3.  **Add Explicit WAL Checkpoint:**
    * At the very end of `runExperience()` (before the final success log), force a checkpoint.
    * *Code:* `this.db.getRawDb().run("PRAGMA wal_checkpoint(TRUNCATE);");`

4.  **Add The "Pinch Check" (Verification):**
    * Immediately after the checkpoint, verify the file exists on disk.
    * *Code:*
        ```typescript
        const finalSize = await Bun.file(this.dbPath).size;
        if (finalSize === 0) {
            throw new Error("CRITICAL: Pinch Check Failed. Database file is 0 bytes.");
        }
        ```

**Output:**
1.  The Current Git Hash (Start State).
2.  The full, updated `runExperience` method.