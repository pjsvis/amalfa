# Brief: Subsystem Deficiency Remediation

**Date Created:** 2025-12-17  
**Status:** Pending  
**Priority:** Mixed (P0, P1, P2)  
**Estimated Effort:** 3-5 sessions

## Objective

Systematically address architectural deficiencies identified during deep subsystem analysis. Focus on data integrity, concurrency safety, and protocol compliance.

## Context

Following comprehensive deep dive analysis of 8 critical subsystems (~100+ tool calls), identified 24 distinct issues ranging from **critical data corruption risks** (P0) to **technical debt** (P2/P3). This brief focuses on actionable fixes for P0-P2 issues.

### Risk Assessment
- **P0 Issues (2)**: Can cause data corruption or silent failures
- **P1 Issues (5)**: Can cause operational issues or confusing behavior
- **P2 Issues (3)**: Protocol violations or inconsistencies

## Tasks

---

### **P0-1: Fix MCP Shared Database Connection** 🔴

**Issue:** MCP server creates ONE `ResonanceDB` instance shared across ALL tool calls. `bun:sqlite` connections are NOT thread-safe; concurrent requests could corrupt connection state.

**Location:** `src/mcp/index.ts` lines 38-43

**Changes Required:**
1. Remove global `db` and `vectorEngine` instances (lines 41-43)
2. Move instantiation inside each tool handler
3. Use `DatabaseFactory.connectToResonance()` per request
4. Ensure connections are closed after each request

**Definition of Done:**
- [ ] Global `db` variable removed from MCP server scope
- [ ] Each tool handler creates fresh connection via `DatabaseFactory`
- [ ] Connections explicitly closed in try/finally blocks
- [ ] TypeScript compilation passes: `tsc --noEmit`
- [ ] Biome linting passes: `bunx biome check src/ --diagnostic-level=error`
- [ ] Functional test: Run `bun run mcp` and execute 10 concurrent searches via MCP client
- [ ] Verification: No `SQLITE_BUSY` errors under concurrent load

---

### **P0-2: Add Transaction Boundaries to Ingestion** 🔴

**Issue:** Ingestion pipeline runs hundreds of `INSERT` statements without wrapping in transactions. This causes:
- Slow performance (each insert commits separately)
- Partial failures leave database in inconsistent state
- Unnecessary WAL growth

**Location:** `src/pipeline/Ingestor.ts` throughout `runPersona()` and `runExperience()`

**Changes Required:**
1. Wrap `runPersona()` body in transaction:
   ```typescript
   this.db.getRawDb().run("BEGIN TRANSACTION");
   try {
       // ... persona ingestion ...
       this.db.getRawDb().run("COMMIT");
   } catch (e) {
       this.db.getRawDb().run("ROLLBACK");
       throw e;
   }
   ```
2. Wrap `runExperience()` body in transaction similarly
3. Add transaction helpers to `ResonanceDB` class:
   ```typescript
   beginTransaction() { this.db.run("BEGIN TRANSACTION"); }
   commit() { this.db.run("COMMIT"); }
   rollback() { this.db.run("ROLLBACK"); }
   ```

**Definition of Done:**
- [ ] `ResonanceDB` has transaction helper methods
- [ ] `Ingestor.runPersona()` wrapped in transaction
- [ ] `Ingestor.runExperience()` wrapped in transaction
- [ ] Error handling includes rollback on failure
- [ ] TypeScript compilation passes: `tsc --noEmit`
- [ ] Biome linting passes: `bunx biome check src/ --diagnostic-level=error`
- [ ] Functional test: Run `bun run build:data` successfully
- [ ] Verification: Check ingestion performance improvement (should be 5-10x faster)
- [ ] Verification: Manually trigger error during ingestion, confirm rollback leaves DB consistent

---

### **P1-1: Fix ResonanceDB readonly Parameter Override** 🟡

**Issue:** `ResonanceDB` constructor accepts `readonly` option but **silently ignores it**, always forcing `readonly: false`. This creates confusing API where callers think they're requesting read-only connections but get read-write.

**Location:** `src/resonance/db.ts` line 42

**Changes Required:**
1. **Option A (Recommended):** Remove `readonly` parameter entirely since WAL mode requires write access:
   ```typescript
   constructor(dbPath: string, options: { create?: boolean } = {}) {
       this.db = DatabaseFactory.connect(dbPath, { readonly: false, ...options });
   }
   ```
2. **Option B:** Document the override explicitly with runtime warning:
   ```typescript
   if (options.readonly) {
       console.warn("⚠️  ResonanceDB: readonly=true ignored (WAL mode requires write access)");
   }
   ```
3. Update all call sites to remove `readonly` parameter
4. Update `ResonanceDB.init()` signature accordingly

**Definition of Done:**
- [ ] `readonly` parameter removed from `ResonanceDB` constructor OR warning added
- [ ] All call sites updated (search codebase for `new ResonanceDB(`)
- [ ] TypeScript compilation passes: `tsc --noEmit`
- [ ] Biome linting passes: `bunx biome check src/ --diagnostic-level=error`
- [ ] Functional test: Run multiple scripts that instantiate ResonanceDB
- [ ] Verification: Grep codebase confirms no remaining `readonly` usage in ResonanceDB instantiation

---

### **P1-2: Deprecate VectorEngine String Path Constructor** 🟡

**Issue:** `VectorEngine` accepts BOTH Database objects AND string paths. String path mode creates its own Database connection WITHOUT using DatabaseFactory, bypassing "Gold Standard" configuration.

**Location:** `src/core/VectorEngine.ts` lines 56-71

**Changes Required:**
1. Add deprecation warning to string constructor path:
   ```typescript
   if (typeof dbOrPath === "string") {
       console.warn("⚠️  DEPRECATED: VectorEngine string path constructor bypasses DatabaseFactory. Pass Database object instead.");
       // ... existing logic
   }
   ```
2. Update all call sites to pass Database objects:
   - Search for `new VectorEngine(` across codebase
   - Replace string paths with `DatabaseFactory.connectToResonance()`
3. Add comment indicating future removal:
   ```typescript
   /** @deprecated Use VectorEngine(db: Database) instead. Will be removed in v2.0 */
   ```

**Definition of Done:**
- [ ] Deprecation warning added to string constructor path
- [ ] All call sites updated to pass Database objects
- [ ] JSDoc deprecation annotation added
- [ ] TypeScript compilation passes: `tsc --noEmit`
- [ ] Biome linting passes: `bunx biome check src/ --diagnostic-level=error`
- [ ] Functional test: Run vector search script, confirm deprecation warning NOT shown
- [ ] Verification: Grep confirms no remaining string path usage

---

### **P1-3: Add Exit Handlers for PID File Cleanup** 🟡

**Issue:** PID files are only removed on manual `stop()` command. If a process crashes or is killed, stale PID files remain, causing false "duplicate process" detections.

**Location:** `src/utils/ServiceLifecycle.ts`

**Changes Required:**
1. Add exit handler registration in `start()` method:
   ```typescript
   async start() {
       // ... existing startup logic ...
       
       // Register cleanup on exit
       const cleanup = async () => {
           try {
               if (await Bun.file(this.config.pidFile).exists()) {
                   await unlink(this.config.pidFile);
               }
           } catch (e) {
               // Ignore cleanup errors
           }
       };
       
       process.on('SIGINT', cleanup);
       process.on('SIGTERM', cleanup);
       process.on('exit', cleanup);
   }
   ```
2. Ensure cleanup is called ONCE (use flag to prevent double cleanup)
3. Test with forced crash scenarios

**Definition of Done:**
- [ ] Exit handlers added to `ServiceLifecycle.start()`
- [ ] Cleanup idempotency ensured (won't crash if called multiple times)
- [ ] TypeScript compilation passes: `tsc --noEmit`
- [ ] Biome linting passes: `bunx biome check src/ --diagnostic-level=error`
- [ ] Functional test: Start daemon with `bun run daemon start`, then `kill -9 <PID>`, verify `.daemon.pid` is cleaned up
- [ ] Functional test: Start MCP server, Ctrl+C to interrupt, verify `.mcp.pid` is cleaned up
- [ ] Verification: Zombie Defense scan shows clean after forced termination

---

### **P1-4: Implement Retry Queue for Failed Ingestions** 🟡

**Issue:** Active daemon drops files if ingestion fails. A transient error (network hiccup, file lock) permanently loses changes.

**Location:** `src/resonance/daemon.ts` lines 153-166

**Changes Required:**
1. Add retry tracking structure:
   ```typescript
   const retryQueue = new Map<string, { attempts: number, lastError: Error }>();
   const MAX_RETRIES = 3;
   ```
2. Modify error handler to re-queue files:
   ```typescript
   catch (e) {
       console.error("❌ Ingestion Failed:", e);
       batch.forEach(file => {
           const current = retryQueue.get(file) || { attempts: 0, lastError: e };
           if (current.attempts < MAX_RETRIES) {
               retryQueue.set(file, { attempts: current.attempts + 1, lastError: e });
               pendingFiles.add(file);  // Re-queue for next debounce
           } else {
               console.error(`⛔ ABANDONED: ${file} failed ${MAX_RETRIES} times`);
           }
       });
       await notify("PolyVis Resonance", "Ingestion Failed (Will Retry)");
   }
   ```
3. Add exponential backoff delay before re-trigger

**Definition of Done:**
- [ ] Retry queue implemented with max 3 attempts
- [ ] Failed files re-queued automatically
- [ ] Files abandoned after 3 failures are logged clearly
- [ ] TypeScript compilation passes: `tsc --noEmit`
- [ ] Biome linting passes: `bunx biome check src/ --diagnostic-level=error`
- [ ] Functional test: Start daemon, edit a file in watched directory while database is locked (manually), verify file is retried
- [ ] Verification: Check daemon logs show retry attempts

---

### **P1-5: Add Zero-Vector Protection in Dot Product** 🟡

**Issue:** `dotProduct()` doesn't check for zero-magnitude vectors. If embedding generation fails (returns all zeros), dot product will be 0 for ALL comparisons, skewing search results.

**Location:** `src/resonance/db.ts` lines 320-327, `src/core/VectorEngine.ts` lines 43-50

**Changes Required:**
1. Add magnitude check helper function:
   ```typescript
   function magnitude(vec: Float32Array): number {
       let sum = 0;
       for (let i = 0; i < vec.length; i++) {
           sum += vec[i]! * vec[i]!;
       }
       return Math.sqrt(sum);
   }
   ```
2. Update `dotProduct()` to check magnitudes:
   ```typescript
   export function dotProduct(a: Float32Array, b: Float32Array): number {
       const magA = magnitude(a);
       const magB = magnitude(b);
       
       // Skip zero vectors
       if (magA < 1e-6 || magB < 1e-6) {
           console.warn("⚠️  Zero vector detected in dot product");
           return 0;
       }
       
       let sum = 0;
       for (let i = 0; i < a.length; i++) {
           sum += a[i]! * b[i]!;
       }
       return sum;
   }
   ```
3. Apply to BOTH locations (ResonanceDB and VectorEngine)

**Definition of Done:**
- [ ] `magnitude()` helper function added
- [ ] `dotProduct()` checks for zero vectors in both files
- [ ] Warning logged when zero vectors detected
- [ ] TypeScript compilation passes: `tsc --noEmit`
- [ ] Biome linting passes: `bunx biome check src/ --diagnostic-level=error`
- [ ] Unit test: Create test with zero vector, verify it returns 0 without crashing
- [ ] Functional test: Run vector search, verify no zero-vector warnings in normal operation
- [ ] Verification: Manually inject zero vector into database, confirm it's skipped gracefully

---

### **P2-1: Fix Theme Toggle to Use Alpine.js** 🟢

**Issue:** Theme toggle button uses `onclick="window.toggleTheme()"` instead of Alpine.js directive `@click`. This violates AFP (Alpine First Protocol).

**Location:** `public/sigma-explorer/index.html` line 65

**Changes Required:**
1. Remove `onclick` attribute
2. Add `@click="toggleTheme()"` Alpine directive
3. Ensure `toggleTheme()` method exists in relevant Alpine component (or create global Alpine store)
4. Move `window.toggleTheme()` logic into Alpine component method

**Definition of Done:**
- [ ] `onclick` removed from theme toggle button
- [ ] `@click` Alpine directive added
- [ ] `toggleTheme()` method exists in Alpine component
- [ ] TypeScript compilation passes: `tsc --noEmit`
- [ ] Biome linting passes: `bunx biome check src/ --diagnostic-level=error`
- [ ] Browser test: Open sigma-explorer, click theme toggle, verify theme switches
- [ ] Verification: Grep HTML files confirms no remaining `onclick` attributes in app code

---

### **P2-2: Add Frontmatter Bounds Check** 🟢

**Issue:** `BentoNormalizer` assumes frontmatter always has closing `---`. Malformed markdown with unclosed frontmatter will cause incorrect H1 insertion position.

**Location:** `src/core/BentoNormalizer.ts` lines 11-19

**Changes Required:**
1. Add bounds check after frontmatter scan loop:
   ```typescript
   if (lines[0]?.trim() === "---") {
       let i = 1;
       while (i < lines.length && (lines[i]?.trim() ?? "") !== "---") {
           i++;
       }
       if (i >= lines.length) {
           console.warn(`⚠️  Unclosed frontmatter in ${filename}`);
           firstContentIndex = 1;  // Skip only opening ---
       } else if (i < lines.length) {
           firstContentIndex = i + 1;
       }
   }
   ```
2. Add test case for malformed frontmatter

**Definition of Done:**
- [ ] Bounds check added to frontmatter parsing
- [ ] Warning logged for unclosed frontmatter
- [ ] Graceful degradation (skips only first line)
- [ ] TypeScript compilation passes: `tsc --noEmit`
- [ ] Biome linting passes: `bunx biome check src/ --diagnostic-level=error`
- [ ] Unit test: Create markdown file with unclosed frontmatter, verify H1 inserted correctly
- [ ] Verification: Run normalizer on all existing docs, no crashes

---

### **P2-3: Add Rate Limiting to MCP Tool Handlers** 🟢

**Issue:** No limits on query complexity or frequency. Misbehaving MCP client could request `limit: 999999` or run expensive searches in a loop, exhausting server resources.

**Location:** `src/mcp/index.ts` throughout `CallToolRequestSchema` handler

**Changes Required:**
1. Add max limit constants:
   ```typescript
   const MAX_SEARCH_LIMIT = 100;
   const MAX_EXPLORE_DEPTH = 3;
   ```
2. Clamp user-provided limits:
   ```typescript
   if (name === TOOLS.SEARCH) {
       const query = String(args?.query);
       const limit = Math.min(Number(args?.limit || 20), MAX_SEARCH_LIMIT);
       // ... rest of search logic
   }
   ```
3. Add query complexity validation (e.g., reject queries > 500 chars)

**Definition of Done:**
- [ ] Max limit constants defined
- [ ] All tool handlers clamp input limits
- [ ] Query length validation added
- [ ] TypeScript compilation passes: `tsc --noEmit`
- [ ] Biome linting passes: `bunx biome check src/ --diagnostic-level=error`
- [ ] Functional test: Send MCP request with `limit: 999999`, verify capped at 100
- [ ] Verification: MCP server logs show clamped limit, no performance degradation

---

## Verification Protocol

After completing **each task**, follow this sequence:

1. **Code Review**: Self-review changes against Definition of Done checklist
2. **TypeScript Compilation**: `tsc --noEmit` (must pass with zero errors)
3. **Biome Linting**: `bunx biome check src/ --diagnostic-level=error` (must pass with zero errors)
4. **Functional Test**: Execute the specific test scenario defined in DoD
5. **Regression Check**: Run integration tests if available: `bun run test:integration`
6. **Commit**: Create atomic commit with conventional commit message
7. **Document**: Update this brief with completion timestamp

## Success Criteria

- **All P0 tasks completed**: No data corruption or concurrency risks remain
- **All P1 tasks completed**: No confusing API behaviors or operational issues
- **All P2 tasks completed**: Full protocol compliance
- **Clean build**: `tsc --noEmit && bun run check` passes
- **No regressions**: Existing functionality preserved
- **Debrief created**: `debriefs/YYYY-MM-DD-subsystem-fixes.md` documenting what was learned

## Dependencies

- None (tasks can be executed independently, though P0 should be prioritized)

## Notes

- **Task Ordering**: Execute in priority order (P0 → P1 → P2) for risk reduction
- **Testing**: Some tasks require manual testing (daemon crashes, concurrent MCP requests). Document test procedures in debrief.
- **Breaking Changes**: P1-2 (VectorEngine deprecation) is backward compatible but issues warnings. Plan full removal for v2.0.

---

**Last Updated:** 2025-12-17  
**Generated By:** Letta Code Deep Dive Analysis
