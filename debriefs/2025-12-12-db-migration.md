# Database Migration Complete: ctx.db → resonance.db

**Date:** 2025-12-12  
**Status:** Complete  
**Agent:** Claude Sonnet 4.5

---

## Summary

Successfully migrated the PolyVis project from a "Split Brain" architecture (dual databases: `ctx.db` and `resonance.db`) to a **Single Source of Truth** architecture with `public/resonance.db` as the canonical database.

---

## What Was Accomplished

### 1. Configuration Unification
- **Deleted:** `resonance.settings.json`
- **Enforced:** `polyvis.settings.json` as the ONLY configuration file
- **Removed:** `legacy` database path from settings
- **Verified:** All scripts now import and use `settings.paths.database.resonance`

### 2. Database Cleanup
- **Deleted:** `public/data/ctx.db`
- **Deleted:** `scripts/ctx.db` (already didn't exist)
- **Deleted:** `public/sigma-explorer/index.html.bak` (contained outdated `ctx.db` reference)
- **Current:** `public/resonance.db` is the only database (1.0 MB, 327 nodes, 1516 edges)

### 3. Script Updates
Updated the following scripts to use `settings.paths.database.resonance`:
- `scripts/pipeline/migrate_db.ts`
- `scripts/pipeline/extract_terms.ts`
- `scripts/verify/verify_graph_integrity.ts`
- `scripts/verify/debug_bun_edges.ts`
- `scripts/verify/find_refs.ts`
- `scripts/verify/debug_node.ts`
- `scripts/pipeline/ingest_experience_graph.ts` (removed `COMPAT_DB_PATH` copy logic)

### 4. Frontend Verification
- **Confirmed:** `src/js/components/explorer.js` loads `/resonance.db`
- **Confirmed:** `src/js/components/sigma-explorer/index.js` loads `/resonance.db`
- **Rebuilt:** `public/js/app.js` bundle (197.28 KB) with `bun run build:js`
- **Verified:** No `ctx.db` references in bundled output

### 5. Documentation Created
- **`docs/project-standards.md`**: Defines SSOT rules for future developers/agents
- **`briefs/brief-codebase-regularization.md`**: Next phase tasks for cleanup and optimization

### 6. Deleted Redundant Code
- **Removed:** `scripts/pipeline/load_db.ts` (redundant with `ingest.ts`)

---

## Validation

### Database Integrity
```bash
$ ls -lh public/resonance.db
-rw-r--r--@ 1 petersmith  staff   1.0M Dec 12 09:42 public/resonance.db

$ sqlite3 public/resonance.db "SELECT COUNT(*) FROM nodes; SELECT COUNT(*) FROM edges;"
327
1516
```

### Code Search
```bash
$ rg "ctx.db" scripts/ src/
# (No results - SUCCESS)
```

### Ingestion Performance
```
🏁 Ingestion Complete.
   Processed: 138 files.
   Total Load: 416.42 KB (426415 chars)
   Time Taken: 18.59s
   Throughput: 22931.74 chars/sec
   ----------------------------------------
   Database Stats:
   - Nodes: 327
   - Vectors: 139
   - Edges: 1516
   - Semantic Tagged: 138
```

---

## Technical Decisions

### Why `public/resonance.db` and not `scripts/resonance.db`?
**Rationale:** The frontend needs to fetch the database via HTTP (`GET /resonance.db`). Placing it in `public/` allows the dev server to serve it directly without additional routing.

### Why delete `ctx.db` instead of keeping it as a "compatibility layer"?
**Rationale:** Any duplication violates Single Source of Truth. If `ctx.db` exists, scripts will reference it, creating confusion. The frontend was already updated to use `resonance.db`, so no compatibility layer is needed.

### Why keep `ingest_experience_graph.ts` separate from `ingest.ts`?
**Deferred Decision:** Both scripts perform similar tasks. We should evaluate merging them in the next cleanup sprint. For now, both work and reference the correct database.

---

## Remaining Lint Issues (Non-Blocking)

The following lint warnings exist but do not affect functionality:
- `scripts/cli/harvest.ts`: Unused imports, `any` types
- `scripts/pipeline/ingest_experience_graph.ts`: Unused variables (`semanticMatcher`, `useSemanticLinking`)
- `scripts/pipeline/ingest.ts`: Multiple `any` types

**Recommendation:** Address these in Phase 1 of the Regularization Brief.

---

## Next Steps

See `briefs/brief-codebase-regularization.md` for the full implementation plan.

**Immediate Priority:**
1. Fix remaining lint issues
2. Standardize stats collection
3. Add round-trip validation tests

---

## Lessons Learned

### For AI Agents
1. **SSOT is Non-Negotiable:** Any duplication (files, configs, paths) will eventually cause drift and errors.
2. **Fail Fast:** Deleting the deprecated artifact (`ctx.db`) immediately forced all scripts to update, exposing hidden dependencies.
3. **Grep is Your Friend:** `rg "ctx.db"` was the most effective way to audit the codebase.
4. **Frontend Bundling Matters:** Always rebuild and verify the bundle after source changes.

### For Human Developers
1. **Magic Strings are Foot-Guns:** Hardcoded paths like `"public/data/ctx.db"` scattered across 10+ files made migration painful. Always import from a settings file.
2. **Documentation Decay:** Old briefs and docs still referenced `ctx.db` long after it was deprecated, creating confusion.
3. **Test the Round-Trip:** We don't yet have automated tests that verify `ingest → export → re-ingest` produces identical data. This is critical.

---

## Files Modified

### Edited (Updated to use resonance.db)
- `polyvis.settings.json`
- `scripts/pipeline/migrate_db.ts`
- `scripts/pipeline/extract_terms.ts`
- `scripts/pipeline/ingest_experience_graph.ts`
- `scripts/verify/verify_graph_integrity.ts`
- `scripts/verify/debug_bun_edges.ts`
- `scripts/verify/find_refs.ts`
- `scripts/verify/debug_node.ts`

### Deleted
- `resonance.settings.json`
- `public/data/ctx.db`
- `public/sigma-explorer/index.html.bak`
- `scripts/pipeline/load_db.ts`

### Created
- `docs/project-standards.md`
- `briefs/brief-codebase-regularization.md`
- `debriefs/debrief-db-migration-2025-12-12.md` (this file)

---

## Sign-Off

The database migration is **COMPLETE** and **VERIFIED**. The project now has a single, unambiguous source of truth for both configuration and data.

**Status:** ✅ Ready for next phase (Codebase Regularization)
