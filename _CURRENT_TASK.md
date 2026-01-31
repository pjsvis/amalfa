# Current Task

**Status**: v1.1.0-alpha (Phase 7 - Dynamic Discovery) 🚧
**Last Session**: 2026-01-30 (Harvester Caching - Complete)
**Next Focus**: Monitoring Dashboard (Observability & Auditability)

---

## Session 2026-01-29-30: Harvester Caching Layer (Weaponized)

### Task: Implement Persistent LangExtract Cache
**Objective**: Decouple extraction costs from graph construction to enable rapid iteration.

**Status**: ✅ COMPLETE

### Completed Items
- ✅ **Infrastructure**: Implemented CAS content-addressable storage (`HarvesterCache.ts`)
- ✅ **Integration**: Wired up `LangExtractClient` to use cache
- ✅ **CLI**: Added `amalfa harvest` command
- ✅ **Guardrails**: 25KB file size limit, skip large files
- ✅ **Circuit Breaker**: Fail-fast on rate limit errors, skip timeouts
- ✅ **Rate Limiting**: 100ms delay between API calls (10 RPS)
- ✅ **Health Checks**: Curl OpenRouter API status on circuit breaker
- ✅ **Notifications**: macOS desktop notification on completion
- ✅ **Manifest**: Save skipped files to `.amalfa/harvest-skipped.json`
- ✅ **Documentation**: Created `docs/openrouter-rate-limits.md`
- ✅ **Logging**: Enhanced Pino logging for provider/model/timing

### Final Results
- **Total Files**: 531
- **Successfully Cached**: 497 (93.6%)
- **Skipped (Timeouts)**: 10 (1.9%)
- **Skipped (Errors)**: 23 (4.3%)
- **Total Cost**: ~$60 USD
- **Total Time**: ~2 days (with debugging)

### Lessons Learned
1. **Remote APIs are adversarial** - timeouts, rate limits, crashes are expected
2. **Observability is critical** - 2-day blind process is unacceptable
3. **Weaponized approach works** - skip edge cases, fail-fast on systemic errors
4. **Cost transparency needed** - user had no real-time visibility into spend

### Artifacts Created
1. ✅ `src/core/HarvesterCache.ts`
2. ✅ `src/cli/commands/harvest.ts`
3. ✅ `docs/openrouter-rate-limits.md`
4. ✅ `.amalfa/harvest-skipped.json`
5. ✅ Debrief: `debriefs/2026-01-30-langextract-harvest-final.md`
6. ✅ Debrief: `debriefs/2026-01-29-harvester-caching-layer.md`

---

**Session Status**: ✅ COMPLETE
**Next Session Focus**: Monitoring Dashboard (Observability & Auditability)

---

## Session 2026-01-31: Lexicon Harvester Implementation

### Task: Build the "Smelter" (Lexicon Harvester)
**Objective**: Transform raw sidecar data into a refined "Golden Lexicon" using a Node-First, Count-Second strategy.

**Status**: ✅ COMPLETE

### Plan & Results
1.  **Core Logic**: Implemented `LexiconHarvester` class (Done)
2.  **CLI Command**: Added `amalfa harvest-lexicon` command (Done)
3.  **Triage UI**: (Future) Next step: Visualizing the 4219 candidates.
4.  **Edge Survey**: (Pending Phase 2) Requires Golden Lexicon first.

### Accomplishments
- Implemented `JsonlUtils` with Bun-native streaming.
- Benchmarked JSON vs JSONL (0.84x small scale, scalable architecture).
- Scanned 499 sidecars -> 4219 candidate terms.
- Handled missing UUIDs in cache layer gracefully.

### Side Tasks
- ✅ Package Manager Cleanup (Global npm/Bun hygiene)
- ✅ JSONL Strategy Brief (Adopt streamable formats)
- ✅ Benchmark JSONL vs JSON (Validated 0.84x small batch / Scalability Win)

---

**Next Session Focus**: Monitoring Dashboard (Triage UI for Lexicon)
