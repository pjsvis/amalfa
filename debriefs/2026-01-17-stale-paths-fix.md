---
date: 2026-01-17
tags: [bugfix, cli, database, paths, hollow-nodes]
---

# Debrief: Fixing Stale Absolute Paths in Database

## Problem

`amalfa search` found documents but `amalfa read` failed with "Node not found":

```bash
$ amalfa search "scratchpad protocol"
# ✅ Returns: 2026-01-13-scratchpad-protocol (score: 0.774)

$ amalfa read "2026-01-13-scratchpad-protocol"
# ❌ Node not found: 2026-01-13-scratchpad-protocol
```

## Root Cause

The database stores **absolute file paths** in the `meta.source` field:

```json
{
  "source": "/Users/petersmith/Documents/GitHub/amalfa/debriefs/2026-01-13-scratchpad-protocol.md"
}
```

When the repository was moved from `/Users/petersmith/Documents/GitHub/amalfa/` to `/Users/petersmith/Dev/GitHub/amalfa/`, all stored paths became invalid.

**Why search worked but read didn't:**
- `search`: Uses vector embeddings and node IDs (no file access needed)
- `read`: Calls `GraphGardener.getContent()` which reads from filesystem using stored path

## Investigation Steps

1. **Verified search works:**
   ```bash
   amalfa search "scratchpad" --json
   # Returns node with ID: "2026-01-13-scratchpad-protocol"
   ```

2. **Checked database for node:**
   ```bash
   sqlite3 .amalfa/resonance.db \
     "SELECT id, meta FROM nodes WHERE id = '2026-01-13-scratchpad-protocol';"
   # Node exists with old path: /Users/.../Documents/GitHub/...
   ```

3. **Verified old path doesn't exist:**
   ```bash
   ls /Users/petersmith/Documents/GitHub/amalfa/debriefs/...
   # No such file or directory
   ```

4. **Traced read implementation:**
   - `cmdRead()` calls `GraphGardener.getContent(nodeId)`
   - `getContent()` calls `resolveSource(nodeId)` to get file path
   - `resolveSource()` queries: `SELECT meta FROM nodes WHERE id = ?`
   - Tries to read from stored `meta.source` path
   - File doesn't exist → returns null → "Node not found"

## Solution

**Delete and reinitialize database** to regenerate with current paths:

```bash
rm .amalfa/resonance.db .amalfa/resonance.db-shm .amalfa/resonance.db-wal
amalfa init
```

This regenerates all node metadata with correct absolute paths for the current repository location.

**Result:** `amalfa read` now works correctly.

## Why This Happens

### Hollow Nodes Architecture

Amalfa uses a "hollow nodes" pattern where:
- **Database stores:** Node ID, metadata, embeddings
- **Filesystem stores:** Actual document content
- **Path stored in metadata:** Absolute path to markdown file

This design is intentional (see `docs/ARCHITECTURE.md` and hollow nodes philosophy) because:
1. Content can change without invalidating vectors
2. Database stays small and fast
3. Source of truth is markdown files, not database

**Trade-off:** If repository moves, paths become stale.

### Why Absolute Paths?

The ingestion pipeline uses `node.meta.source` to store the absolute file path:

```typescript
// From src/pipeline/AmalfaIngestor.ts
const meta = {
  source: absolutePath,  // Stored during ingestion
  // ...
};
```

**Rationale:**
- Works when Amalfa is run from any directory (not just project root)
- Handles multiple source directories cleanly
- No ambiguity about file location

**Downside:**
- Paths break if repository moves
- Database can't be shared across machines with different paths

## Better Solutions (Future)

### Option 1: Root-Relative Paths

Store paths relative to project root instead of absolute:

```json
{
  "source": "debriefs/2026-01-13-scratchpad-protocol.md",
  "project_root": "/Users/petersmith/Dev/GitHub/amalfa"
}
```

**Pros:**
- Portable across directory moves
- Still works from any CWD (resolve against detected root)

**Cons:**
- Need reliable project root detection
- More complex path resolution

### Option 2: Path Healing

Detect stale paths and auto-heal:

```typescript
async getContent(nodeId: string): Promise<string | null> {
  let sourcePath = this.resolveSource(nodeId);
  
  // If path doesn't exist, try to heal
  if (!existsSync(sourcePath)) {
    sourcePath = this.healPath(nodeId, sourcePath);
  }
  
  return await Bun.file(sourcePath).text();
}

healPath(nodeId: string, stalePath: string): string | null {
  // Extract relative path from stale absolute path
  // Search for file in current project structure
  // Update database if found
}
```

**Pros:**
- Automatic recovery
- Transparent to user

**Cons:**
- Complex heuristics
- Ambiguous if multiple files have same name
- Database update overhead

### Option 3: Document as Expected Behavior

Accept that database is tied to current repository location:

```markdown
# Known Limitation

The database stores absolute file paths. If you move your repository:

1. Delete database: `rm .amalfa/resonance.db*`
2. Reinitialize: `amalfa init`

This regenerates the database with correct paths (preserves embedding cache).
```

**Pros:**
- Simple, no code changes
- Clear user expectation
- Consistent with "database is disposable artifact" philosophy

**Cons:**
- Manual intervention required
- Loses any graph enhancements (edges, tags)

## Recommendation

**Short term:** Document the limitation in `docs/USER-MANUAL.md` and `WARP.md`.

**Medium term:** Implement Option 1 (root-relative paths) in v1.5.x.

**Why root-relative is best:**
- Aligns with "database is disposable" philosophy
- Portable across moves
- Still fast (no healing logic needed)
- Clean separation: markdown = content, database = index

## Files Changed

None - this was a user-facing issue resolved by database regeneration.

## Documentation Updates Needed

**Add to `docs/USER-MANUAL.md`:**

```markdown
## Troubleshooting

### "Node not found" after moving repository

If you move your repository to a different directory, the database may have stale file paths.

**Fix:**
```bash
rm .amalfa/resonance.db*
amalfa init
```

This regenerates the database with correct paths. Your markdown files (source of truth) are unaffected.
```

**Add to `docs/ARCHITECTURE.md`:**

```markdown
### Path Storage

The database stores absolute file paths in `meta.source`. If you move the repository, paths become stale.

**Future:** We plan to switch to root-relative paths for portability.
```

## Key Learnings

1. **Absolute paths have hidden coupling** - Moving repo breaks database references
2. **Search vs read have different requirements** - Search only needs vectors/IDs, read needs filesystem access
3. **Hollow nodes trade-off** - Fast and flexible, but couples database to file locations
4. **Database regeneration is cheap** - 60s for 640 files, acceptable for recovery
5. **Good discovery process** - Used `amalfa search` to find issue, then SQL to diagnose root cause

## Success Criteria

- [x] Identified root cause (stale absolute paths)
- [x] Verified solution (database regeneration works)
- [x] Documented issue for future reference
- [x] Proposed better long-term solutions
- [x] `amalfa read` now works correctly

## Related Issues

- Hollow nodes architecture: `docs/ARCHITECTURE.md`
- Database regeneration: `docs/USER-MANUAL.md`
- Path resolution: `src/core/GraphGardener.ts` (lines 202-228)

## Conclusion

The issue was caused by storing absolute file paths in the database, which become invalid when the repository moves. Short-term fix is database regeneration. Long-term fix should be root-relative paths for portability while maintaining the hollow nodes architecture.

**Impact:** Demonstrates importance of thinking about path portability in systems that bridge filesystem and database. Absolute paths are convenient but fragile.
