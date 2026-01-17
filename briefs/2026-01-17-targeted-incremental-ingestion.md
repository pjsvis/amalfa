---
date: 2026-01-17
tags: [daemon, performance, ingestion, optimization, file-watcher]
status: active
---

# Brief: Targeted Incremental Re-Ingestion

## Problem Statement

The file watcher daemon currently triggers a **full directory scan** on every file change, even though it knows exactly which files changed. This causes unnecessary overhead:

1. **Inefficient:** Glob-scans entire source tree (potentially thousands of files) to find and process 1-10 changed files
2. **Wasteful:** Hash checking happens inside the ingestor, but only after scanning everything
3. **Slow:** On large repos (1000+ files), full scan takes 100-500ms before processing even starts
4. **Misleading comment:** Line 158 in `src/daemon/index.ts` claims "hash checking prevents duplicates" but the full scan still happens

## Current Flow

```
File change detected
   ↓
Add to pendingFiles set
   ↓
Debounce timer triggers
   ↓
Call ingestor.ingest() [FULL SCAN]
   ↓
Glob **/*.md across all sources
   ↓
For each discovered file:
   - Hash check (skip if unchanged)
   - Process if changed
```

**The inefficiency:** Steps 5-6 scan the entire tree when we already know the exact files in step 2.

## Evidence

### File Watcher (`src/daemon/index.ts`)
Lines 141-159:
```typescript
// Drain pending files
const batch = Array.from(pendingFiles);  // ← We have the exact file list!
pendingFiles.clear();

// ...
const ingestor = new AmalfaIngestor(config, db);

// Process only changed files
// Note: We'd need to modify AmalfaIngestor to accept file list
// For now, we'll re-run full ingestion (hash checking prevents duplicates)
await ingestor.ingest();  // ← Ignores batch, scans everything
```

### Ingestor (`src/pipeline/AmalfaIngestor.ts`)
Lines 195-224:
```typescript
private async discoverFiles(): Promise<string[]> {
    const files: string[] = [];
    const glob = new Glob("**/*.{md,ts,js}");
    const sources = this.config.sources || ["./docs"];

    // Scan each source directory
    for (const source of sources) {
        // ... glob.scanSync(sourcePath) ...  ← Full scan every time
    }
    return files;
}
```

Lines 266-274:
```typescript
// Skip if content unchanged (hash check)
const hasher = new Bun.CryptoHasher("md5");
hasher.update(rawContent.trim());
const currentHash = hasher.digest("hex");
const storedHash = this.db.getNodeHash(id);

if (storedHash === currentHash) {
    return; // No change  ← This works, but only after full scan
}
```

## Proposed Solution

### 1. Add Targeted Ingestion Mode

**File:** `src/pipeline/AmalfaIngestor.ts`

Add new method:
```typescript
/**
 * Ingest specific files (incremental mode)
 * Used by file watcher to process only changed files
 */
public async ingestFiles(filePaths: string[]): Promise<IngestResult> {
    const startTime = Date.now();
    
    // Initialize services
    const embedder = Embedder.getInstance();
    const tokenizer = new TokenizerService();
    
    // Pass 1: Process changed files (no edge weaving yet)
    for (const filePath of filePaths) {
        await this.processFile(filePath, embedder, null, tokenizer);
    }
    
    // Pass 2: Rebuild edges for affected nodes
    const lexicon = this.buildLexicon();
    const weaver = new EdgeWeaver(this.db, lexicon);
    
    for (const filePath of filePaths) {
        const id = this.extractIdFromPath(filePath);
        const content = await Bun.file(filePath).text();
        weaver.weave(id, content);
    }
    
    const durationSec = (Date.now() - startTime) / 1000;
    
    return {
        success: true,
        stats: {
            filesProcessed: filePaths.length,
            nodesCreated: filePaths.length,
            edgesCreated: 0, // Would need to track in EdgeWeaver
            durationSec,
        },
    };
}

/**
 * Extract node ID from file path
 */
private extractIdFromPath(filePath: string): string {
    const filename = filePath.split("/").pop() || "unknown";
    return filename
        .replace(/\.(md|ts|js)$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");
}
```

### 2. Update Daemon to Use Targeted Mode

**File:** `src/daemon/index.ts`

Lines 154-159, replace:
```typescript
// OLD: Full scan
const ingestor = new AmalfaIngestor(config, db);
await ingestor.ingest();
```

With:
```typescript
// NEW: Targeted ingestion
const ingestor = new AmalfaIngestor(config, db);
await ingestor.ingestFiles(batch);  // Only process changed files
```

### 3. Handle Edge Cases

**Deleted files:**
Currently not detected by file watcher. Need to:
1. Detect `rename` events where new path doesn't exist
2. Call `db.deleteNode(id)` for deleted files

**Moved files:**
1. Detect as delete + create
2. Or: Track by content hash and update `meta.source` path

## Performance Impact

### Before (Current)
On a repo with 500 markdown files, single file change:
- Directory scan: 100ms
- Hash check 500 files: 50ms
- Process 1 changed file: 20ms
- **Total: ~170ms**

### After (Targeted)
Same scenario:
- No directory scan: 0ms
- Hash check 1 file: 0.1ms
- Process 1 changed file: 20ms
- **Total: ~20ms**

**Improvement: 8.5x faster** (170ms → 20ms)

On larger repos (2000+ files), improvement scales linearly.

## Success Criteria

✅ `AmalfaIngestor.ingestFiles(paths)` method exists
✅ Daemon calls `ingestFiles()` with `batch` array
✅ No full directory scan on file change
✅ Hash checking still prevents duplicate work
✅ Edge weaving works correctly for changed files
✅ Performance: Single file change processes in <50ms
✅ Existing `ingest()` method still works for full re-index
✅ Tests pass

## Testing Strategy

### Unit Tests
```typescript
// tests/pipeline/incremental-ingestion.test.ts
describe("Incremental Ingestion", () => {
    it("should process only specified files", async () => {
        const db = DatabaseFactory.createTestDB();
        const config = await loadConfig();
        const ingestor = new AmalfaIngestor(config, db);
        
        // Create test file
        const testFile = "/tmp/test-doc.md";
        await Bun.write(testFile, "# Test\nContent");
        
        // Ingest single file
        const result = await ingestor.ingestFiles([testFile]);
        
        expect(result.success).toBe(true);
        expect(result.stats.filesProcessed).toBe(1);
        
        // Verify node exists
        const node = db.getNode("test-doc");
        expect(node).toBeDefined();
    });
    
    it("should skip unchanged files via hash", async () => {
        // ... test hash checking works in targeted mode ...
    });
});
```

### Integration Tests
```bash
# Start daemon
bun run amalfa daemon start

# Modify single file
echo "# Updated" > docs/test.md

# Verify:
# 1. Daemon log shows "Processing changes... (1 file)"
# 2. Update completes in <50ms
# 3. Database updated correctly
# 4. No full directory scan in logs

# Stop daemon
bun run amalfa daemon stop
```

## Edge Cases to Handle

1. **File doesn't exist anymore:** Skip with warning
2. **File not in configured sources:** Skip with warning
3. **Invalid markdown:** Log error, continue processing others
4. **Database locked:** Retry with backoff (already implemented)
5. **Empty batch:** No-op (already handled)

## Migration Path

1. **Phase 1:** Add `ingestFiles()` method (non-breaking)
2. **Phase 2:** Update daemon to use new method
3. **Phase 3:** Add deleted file detection
4. **Phase 4:** Optimize edge weaving for incremental updates

**Backward compatibility:** Full `ingest()` method remains unchanged for manual re-indexing.

## Files to Modify

- `src/pipeline/AmalfaIngestor.ts` - Add `ingestFiles()` method
- `src/daemon/index.ts` - Switch from `ingest()` to `ingestFiles(batch)`
- `tests/pipeline/incremental-ingestion.test.ts` - New test file

## Files to Create

- `tests/pipeline/incremental-ingestion.test.ts` - Unit tests

## References

- Hash checking: `src/pipeline/AmalfaIngestor.ts` lines 266-274
- Current daemon logic: `src/daemon/index.ts` lines 126-259
- Edge weaving: `src/core/EdgeWeaver.ts`

## Related Issues

- File watcher currently doesn't detect deleted files
- Edge weaving is always global (could be optimized for local changes)
- Ember integration (lines 162-184) could also benefit from targeted mode
