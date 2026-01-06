# Brief: Codebase Regularization & Performance Optimization

**Date:** 2025-12-12  
**Status:** Ready for Implementation  
**Priority:** High  
**Objective:** Eliminate remaining ambiguities, deprecated code, and optimize ingestion pipeline for fast iteration.

---

## Context

We have successfully migrated from a "Split Brain" architecture (`ctx.db` + `resonance.db`) to a **Single Source of Truth** (`public/resonance.db`). The ingestion pipeline is functional and fast (327 nodes, 1516 edges in ~18s).

However, the codebase contains:
1. **Unused/deprecated scripts** that may confuse future developers or agents.
2. **Inconsistent statistics logging** across pipeline stages.
3. **Missing baseline metrics** for validating round-trip integrity.

---

## Objectives

### 1. Remove Deprecated Code
**Goal:** Ensure no legacy references remain that could create confusion.

**Tasks:**
- [x] Delete `ctx.db` files from filesystem
- [x] Remove `COMPAT_DB_PATH` logic from `ingest_experience_graph.ts`
- [x] Update all `scripts/verify/*` to use `settings.paths.database.resonance`
- [ ] **Audit unused scripts:**
  - `scripts/pipeline/sync_resonance.ts` - Evaluate if still needed vs `ingest.ts`
  - `scripts/build_data.ts` - Check if redundant
  - `scripts/build_experience.ts` - Check if redundant
- [ ] **Clean `scripts/cli/harvest.ts`:**
  - Remove unused imports (Glob) - ID: `254e496b-90b3-427c-ab21-f07324b2d597`
  - Fix unused variables (`e`) - IDs: `ff4e3f73-2d1a-4836-931d-582c69880072`, `69337561-55b0-40ca-a13e-2ed6b47af7bb`
  - Replace `any` types - IDs: `fab7e455-bade-4581-8374-1a88b94dd0d8`, `c7942788-ab9f-4913-8220-69435e2e767c`
- [ ] **Clean `scripts/pipeline/ingest_experience_graph.ts`:**
  - Remove unused variables (`semanticMatcher`, `useSemanticLinking`, `e`) - IDs: `6fa59f16-b9e2-4f4e-a62d-0d9cfead7a84`, `3b55dcfb-0424-4222-89af-fd9103b450b1`, `18f9f127-d7cb-4df4-84f0-d15eecdb489e`

### 2. Standardize Stats Collection
**Goal:** Log consistent, actionable metrics throughout the pipeline for debugging and optimization.

**Current State:**
- `ingest.ts` logs: nodes, vectors, edges, semantic_tokens
- `ingest_experience_graph.ts` logs: nodesAdded, edgesAdded, semanticEdges
- No baseline snapshot before changes

**Proposed Format:**
```typescript
interface PipelineStats {
  stage: string;           // e.g., "lexicon_bootstrap", "experience_ingest"
  timestamp: string;
  nodes_total: number;
  edges_total: number;
  nodes_added: number;     // Delta
  edges_added: number;     // Delta
  duration_ms: number;
  throughput_chars_sec?: number;
}
```

**Tasks:**
- [ ] Create `scripts/utils/stats.ts` with `StatsCollector` class
- [ ] Refactor `ingest.ts` to use `StatsCollector`
- [ ] Refactor `ingest_experience_graph.ts` to use `StatsCollector`
- [ ] Add **baseline snapshot** at start of ingestion
- [ ] Add **round-trip validation** at end (verify counts match expected)

### 3. Performance Monitoring
**Goal:** Ensure ingestion remains fast (<20s for full rebuild) to enable rapid testing.

**Tasks:**
- [ ] Add `--benchmark` flag to `ingest.ts` that runs 3x and reports average
- [ ] Log per-file timing for slow outliers (>1s per file)
- [ ] Profile `EdgeWeaver.weave()` - currently the slowest operation
- [ ] Consider batch embedding (10 docs at once) to reduce Ollama round-trips

### 4. Documentation Updates
**Goal:** Ensure all docs reflect the new SSOT architecture.

**Tasks:**
- [ ] Update `README.md` to reference `docs/project-standards.md`
- [ ] Archive deprecated briefs in `briefs/archive/` that reference `ctx.db`
- [ ] Update `docs/data-architecture.md` to remove `ctx.db` mentions
- [ ] Create `docs/ingestion-pipeline.md` with visual flowchart

---

## Success Criteria

1. **Zero References:** `rg "ctx.db" scripts/ src/` returns no results ✅ (DONE)
2. **Clean Lints:** `bun run check` passes with 0 errors
3. **Fast Ingestion:** Full rebuild completes in <20s ✅ (DONE: 18.59s)
4. **Round-Trip Integrity:** Ingestion → Export → Re-ingest produces identical node/edge counts
5. **Clear Stats:** Every pipeline run outputs structured JSON stats

---

## Implementation Plan

### Phase 1: Lint Cleanup (30 min)
- Fix all unused imports/variables
- Replace `any` types with proper interfaces
- Run `bun run format` to normalize code style

### Phase 2: Stats Standardization (1 hour)
- Build `StatsCollector` utility
- Integrate into both ingestion scripts
- Add baseline + round-trip check

### Phase 3: Performance Profiling (30 min)
- Add `--benchmark` flag
- Profile `EdgeWeaver`
- Document hotspots

### Phase 4: Documentation (30 min)
- Archive old briefs
- Update architecture docs
- Create ingestion flowchart

**Total Estimated Time:** 2.5-3 hours

---

## Risk Assessment

- **Low Risk:** Lint fixes and stats collection are additive
- **Medium Risk:** Deleting scripts like `sync_resonance.ts` requires verification they're unused
- **Mitigation:** Run full test suite after each phase, keep git commits granular

---

## Dependencies

- `polyvis.settings.json` must exist and be valid
- `public/resonance.db` must be writable
- Ollama service must be running for embeddings

---

## Deferred (Future Sprint)

- Migrate `VectorEngine.ts` to use `fastembed` instead of Ollama (for offline capability)
- Implement incremental ingestion (only process changed files)
- Add `resonance doctor` command to validate project health
