# Database Connection Hygiene Playbook

**Purpose**: Canonical guidelines for SQLite connection management in AMALFA  
**Status**: Established 2026-01-15  
**Related**: `playbooks/sqlite-standards.md`, `src/resonance/DatabaseFactory.ts`

---

## Core Principles

### 1. Every Connection Must Close

**Rule**: Every `new ResonanceDB()` MUST have a matching `db.close()`.

```typescript
// ✅ CORRECT
const db = new ResonanceDB(dbPath);
try {
    // ... operations
} finally {
    db.close();  // Guaranteed cleanup
}

// ❌ WRONG
const db = new ResonanceDB(dbPath);
// ... operations
// Missing close() - connection leak!
```

### 2. Use Finally Blocks

**Rule**: Always use `finally` to ensure cleanup even on errors.

```typescript
// ✅ CORRECT
try {
    const db = new ResonanceDB(dbPath);
    await performOperations(db);
} catch (error) {
    log.error(error);
} finally {
    db.close();  // Runs even if error thrown
}

// ❌ WRONG
const db = new ResonanceDB(dbPath);
await performOperations(db);
db.close();  // Skipped if performOperations() throws!
```

### 3. Per-Request Connections for Servers

**Rule**: Servers should create fresh connections per request, not persistent connections.

```typescript
// ✅ CORRECT (MCP Server pattern)
server.setRequestHandler(async (request) => {
    const { db } = createConnection();
    try {
        const result = await handleRequest(db, request);
        return result;
    } finally {
        db.close();
    }
});

// ❌ WRONG
const db = new ResonanceDB(dbPath);  // Persistent connection
server.setRequestHandler(async (request) => {
    return await handleRequest(db, request);
});
// Never closes, blocks other writers!
```

### 4. Short Transaction Durations

**Rule**: Keep transactions under 50% of `busy_timeout` (< 2.5s for 5s timeout).

```typescript
// ✅ CORRECT
const BATCH_SIZE = 10;  // ~1.3s lock duration
db.beginTransaction();
for (let i = 0; i < BATCH_SIZE; i++) {
    db.insertNode(nodes[i]);
}
db.commit();  // Quick release

// ❌ WRONG
const BATCH_SIZE = 50;  // ~6.5s lock duration (exceeds timeout!)
db.beginTransaction();
for (let i = 0; i < BATCH_SIZE; i++) {
    db.insertNode(nodes[i]);
}
db.commit();  // Blocks other writers too long
```

---

## Batch Size Guidelines

### Formula

```
Max Lock Duration = BATCH_SIZE × Avg_Processing_Time
Target: < 50% of busy_timeout (< 2.5s for 5s timeout)
```

### AMALFA Benchmarks

| Batch Size | Lock Duration | Commits | Use Case |
|------------|---------------|---------|----------|
| 10 | ~1.3s | 56 (per 556 files) | **Production default** - Daemon-safe |
| 30 | ~3.9s | 19 | Balanced - Single-user init |
| 50 | ~6.5s | 11 | Fast init - NO daemons running |

### Choosing Batch Size

```typescript
// Decision tree
const BATCH_SIZE = 
    process.env.AMALFA_FAST_INIT ? 50 :  // Explicit speed request
    isDaemonRunning() ? 10 :              // Concurrent writes possible
    30;                                    // Default: balanced

function isDaemonRunning(): boolean {
    // Check if file watcher or vector daemon is active
    return fs.existsSync('.amalfa/runtime/daemon.pid');
}
```

### Trade-offs

**Batch 10** (Current production setting):
- ✅ Safe for concurrent access
- ✅ 1.3s lock duration (well within timeout)
- ✅ Allows daemon/MCP interleaving
- ❌ Slower: 5× more commits (transaction overhead)
- ❌ 87s full ingestion vs. 30-40s with batch 50

**Batch 50** (Fast mode):
- ✅ 2-3× faster throughput
- ✅ Fewer commits (less transaction overhead)
- ❌ 6.5s lock duration (exceeds 5s timeout)
- ❌ Blocks daemons, causes SQLITE_BUSY

**Recommendation**: Keep batch 10 for daemon-first architecture. Implement `--fast` flag for single-user init if needed.

---

## Common Patterns

### Pattern 1: CLI Command

```typescript
export async function cmdInit(args: string[]) {
    const dbPath = await getDbPath();
    const db = new ResonanceDB(dbPath);
    
    try {
        const ingestor = new AmalfaIngestor(config, db);
        const result = await ingestor.ingest();
        return result;
    } catch (error) {
        log.error({ error }, "Init failed");
        throw error;
    } finally {
        db.close();  // Always cleanup
    }
}
```

### Pattern 2: MCP Server Request

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { db, vectorEngine } = createConnection();
    
    try {
        const results = await vectorEngine.search(query);
        return formatResults(results);
    } finally {
        db.close();
    }
});
```

### Pattern 3: Daemon Batch Processing

```typescript
async function processBatch(batch: string[]) {
    const db = new ResonanceDB(dbPath);
    
    try {
        const ingestor = new AmalfaIngestor(config, db);
        await ingestor.ingest();
    } catch (error) {
        log.error({ error, batch }, "Batch failed");
    } finally {
        db.close();  // Release before next batch
    }
}
```

### Pattern 4: Test Setup/Teardown

```typescript
describe("DatabaseTest", () => {
    let db: ResonanceDB;
    
    beforeEach(() => {
        db = new ResonanceDB(TEST_DB);
    });
    
    afterEach(() => {
        db.close();  // Guaranteed cleanup after each test
    });
    
    test("should insert node", () => {
        db.insertNode({ id: "test", type: "doc" });
        expect(db.getNode("test")).toBeDefined();
    });
});
```

---

## Anti-Patterns (DO NOT DO)

### ❌ Global Persistent Connection

```typescript
// WRONG: Singleton database connection
export const globalDb = new ResonanceDB('.amalfa/resonance.db');

// Problem: Never closes, blocks all writers
```

### ❌ Missing Finally Block

```typescript
// WRONG: Close skipped on error
async function badPattern() {
    const db = new ResonanceDB(dbPath);
    await riskyOperation(db);
    db.close();  // Skipped if riskyOperation() throws!
}
```

### ❌ Long-Running Transactions

```typescript
// WRONG: Transaction holds lock for too long
db.beginTransaction();
for (const file of allFiles) {  // Could be 1000+ files
    await processFile(file);
}
db.commit();  // Blocks others for minutes!
```

### ❌ No Error Handling

```typescript
// WRONG: No cleanup on error
const db = new ResonanceDB(dbPath);
db.insertNode(node);  // If this throws, connection leaks
db.close();
```

---

## Debugging Lock Issues

### Symptoms

- `SQLiteError: database is locked` (SQLITE_BUSY)
- `SQLiteError: database is locked, snapshot` (SQLITE_BUSY_SNAPSHOT)
- Timeouts during ingestion
- MCP server hangs

### Diagnostic Steps

1. **Check running processes**
   ```bash
   ps aux | grep -E "bun.*amalfa|bun.*daemon"
   ```

2. **Check for stale daemons**
   ```bash
   amalfa servers
   # or
   ls -l .amalfa/runtime/*.pid
   ```

3. **Kill stale processes**
   ```bash
   pkill -f "bun.*amalfa"
   # or
   amalfa servers stop
   ```

4. **Check database locks**
   ```bash
   lsof +D .amalfa/
   ```

5. **Verify batch size**
   ```bash
   grep "BATCH_SIZE" src/pipeline/AmalfaIngestor.ts
   # Should be 10 for production
   ```

### Common Causes

| Issue | Cause | Fix |
|-------|-------|-----|
| SQLITE_BUSY during init | Daemon holding connection | `pkill -f "bun.*daemon"` |
| Slow ingestion | Batch size too small | Verify batch=10 is intentional |
| Fast init fails | Batch size too large | Reduce to batch=10 |
| Test hangs | Missing `db.close()` in afterEach | Add cleanup hook |

---

## Monitoring & Maintenance

### Health Check Commands

```bash
# View database stats
amalfa stats

# Check daemon status
amalfa servers

# Stop all services cleanly
amalfa servers stop

# Verify no lingering processes
ps aux | grep amalfa | grep -v grep
```

### Metrics to Watch

- **Lock wait time**: Should be < 100ms
- **Transaction duration**: Should be < 2.5s per batch
- **Commit frequency**: ~56 commits for 556 files (batch 10)
- **Connection leaks**: Check for increasing process count

---

## References

- **SQLite WAL Mode**: `playbooks/sqlite-standards.md`
- **DatabaseFactory**: `src/resonance/DatabaseFactory.ts`
- **Ingestion Pipeline**: `src/pipeline/AmalfaIngestor.ts`
- **Debrief**: `debriefs/2026-01-15-database-connection-hygiene.md`

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-01-15 | Initial playbook created from production incident | System |
| 2026-01-15 | Established batch size 10 as production default | System |
