# AMALFA Hardening Improvements
**Date:** 2026-01-07  
**Context:** Code-level audit identified two critical gaps in the resilience layer

## Executive Summary
Following a detailed code audit against the "Actor Playbook" heuristics, two production-grade hardening improvements were identified and implemented:

1. **OH-104: The Pinch Check** - Missing from WAL checkpoint path
2. **inject_tags Tool** - Stacking bug in the MCP gardening tool

Both issues are now resolved and tested.

---

## Issue 1: Missing OH-104 (Pinch Check)

### The Problem
The `AmalfaIngestor` correctly implemented **OH-105 (Transactional Atomicity Cap)** with batched transactions, but **missed OH-104** after the WAL checkpoint.

**Risk:** If the OS lied about fsync, or if `bun:sqlite` failed silently during checkpoint, the system would report "Success" while the `.db` file was corrupted or empty.

### The Fix
Added physical file verification immediately after `PRAGMA wal_checkpoint(TRUNCATE)`:

```typescript path=/Users/petersmith/Documents/GitHub/amalfa/src/pipeline/AmalfaIngestor.ts start=116
// Force WAL checkpoint for persistence
this.log.info("💾 Forcing WAL checkpoint...");
this.db.getRawDb().run("PRAGMA wal_checkpoint(TRUNCATE);");

// OH-104: The Pinch Check (verify physical commit)
const dbPath = this.db.getRawDb().filename;
const dbFile = Bun.file(dbPath);
if (!await dbFile.exists()) {
    throw new Error("OH-104 VIOLATION: Database file missing after checkpoint");
}
const finalSize = dbFile.size;
if (finalSize === 0) {
    throw new Error("OH-104 VIOLATION: Database file is empty after checkpoint");
}
this.log.info(`✅ Pinch Check: db=${(finalSize / 1024).toFixed(1)}KB`);
```

### Verification
```bash
$ bun run --bun src/cli.ts init --force
# Output includes:
✅ Pinch Check: db=204.0KB
```

---

## Issue 2: inject_tags Stacking Bug

### The Problem
The `inject_tags` MCP tool blindly appended tag blocks to the end of files. If called multiple times, it would create:

```markdown
<!-- tags: concept, draft -->
<!-- tags: example -->
<!-- tags: another -->
```

This pollutes the document and breaks idempotency.

### The Fix
Implemented merge/replace logic:

1. **Check for existing tag block** using regex: `/<!-- tags: ([^>]+) -->\s*$/`
2. **If found:** Parse existing tags, merge with new tags (deduplicate), and replace the block
3. **If not found:** Append new block as before

```typescript path=/Users/petersmith/Documents/GitHub/amalfa/src/mcp/index.ts start=308
if (name === TOOLS.GARDEN) {
    const filePath = String(args?.file_path);
    const tags = args?.tags as string[];
    let content = await Bun.file(filePath).text();

    // Check for existing tag block and merge/replace
    const tagPattern = /<!-- tags: ([^>]+) -->\s*$/;
    const match = content.match(tagPattern);

    let operation = "injected";
    if (match) {
        // Merge with existing tags
        const existingTags = match[1]
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        const mergedTags = [...new Set([...existingTags, ...tags])]; // deduplicate
        const tagBlock = `<!-- tags: ${mergedTags.join(", ")} -->`;
        content = content.replace(tagPattern, `${tagBlock}\n`);
        operation = "merged";
    } else {
        // Append new tag block
        const tagBlock = `<!-- tags: ${tags.join(", ")} -->`;
        content = content.endsWith("\n")
            ? `${content}\n${tagBlock}\n`
            : `${content}\n\n${tagBlock}\n`;
    }

    await Bun.write(filePath, content);
    return {
        content: [
            {
                type: "text",
                text: `Successfully ${operation} ${tags.length} tags into ${filePath}`,
            },
        ],
    };
}
```

### Verification
```bash
$ bun run scripts/verify/test-hardening.ts
# Output:
✅ Merged result: concept, draft, example
✅ No duplicate blocks (only 1 tag block found)
```

---

## Architectural Notes

### Why These Matter
Both issues demonstrate the "Senior Engineer Paranoia" principle:

- **OH-104:** Don't trust the OS to tell you the truth about disk writes
- **inject_tags:** Don't assume tools are called once; build for idempotency

### The "Hollow Node" Pattern (Observed)
The audit confirmed a brilliant architectural choice: the database stores only **metadata + embeddings**, while content lives in the filesystem. This:

- Keeps the SQLite database small and fast
- Allows full rebuild from source files at any time
- Treats the filesystem as the "Blob Store"

This is why `read_node_content` queries `SELECT meta FROM nodes`, extracts `meta.source`, and reads the file directly.

---

## Testing

A test script was created to verify both fixes:

```bash
scripts/verify/test-hardening.ts
```

**Result:** ✅ All tests pass

---

## Deployment Status

- [x] OH-104 implemented in `src/pipeline/AmalfaIngestor.ts`
- [x] inject_tags merge logic in `src/mcp/index.ts`
- [x] Test script created and passing
- [x] Verified with live `init` run

**Status:** ACTIVE & DEPLOYED

---

## References

- **Actor Playbook:** `/Users/petersmith/Documents/GitHub/amalfa/playbooks/actor-playbook.md`
- **OH-104:** The Pinch Check (file size verification after checkpoint)
- **OH-105:** Transactional Atomicity Cap (batch commits)

---

**Conclusion:** AMALFA now implements both critical resilience heuristics from the Actor Playbook. The system is hardened against silent checkpoint failures and tag pollution.
