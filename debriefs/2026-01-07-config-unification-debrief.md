# Configuration Unification - Debrief

**Date**: 2026-01-07  
**Session Duration**: ~2 hours  
**Status**: ✅ Complete Success  
**Commits**: 5 (1e46af2, 9dba8a2, 229f3c7, 080b409, b386140)

## Objective

Deprecate and remove `polyvis.settings.json` in favor of unified `amalfa.config.json` configuration system.

## Strategy: Clean-Slate Migration

Instead of gradual deprecation with warnings and fallbacks, we took a **clean-slate approach**:

1. **Validate first** - Created automated validation to understand conflicts
2. **Rename to .bak** - Force all imports to break immediately
3. **Fix TypeScript errors** - Address every broken import systematically
4. **Archive legacy code** - Don't delete, move to `scripts/legacy/`
5. **Test and verify** - Ensure CLI works with new config

**Why This Works:**
- Forces complete migration in one session
- No half-migrated state or dead code paths
- TypeScript compiler finds every reference automatically
- No ambiguity about what's migrated vs not

## Key Decisions

### 1. Configuration Validation Before Migration

Created `scripts/validate-config.ts` to audit conflicts:
- Database path mismatch (intentional, documented)
- Source directory semantics (different purposes, no conflict)
- Embedding model ownership (clear: `amalfa.config.json`)

**Lesson**: Always validate assumptions before destructive changes. The script found the database path "conflict" was actually intentional (test DB vs production).

### 2. Extended Schema vs New Schema

Extended `AmalfaConfig` interface with optional fields instead of creating breaking changes:
```typescript
graph?: { tuning?: { louvain?: { ... } } }
fixtures?: { lexicon?: string; cda?: string }
```

**Lesson**: Optional fields maintain backward compatibility while enabling migration. Users without these features don't break.

### 3. Default Values Are Safe Fallbacks

Kept hardcoded defaults in deprecated methods:
```typescript
static init(dbPath: string = ".amalfa/resonance.db"): ResonanceDB
```

**Lesson**: Default parameter values are fine for deprecated code. They're not "active" paths, just fallbacks for legacy callers.

### 4. Archive vs Delete

Moved 16 scripts to `scripts/legacy/` instead of deleting:
- Preserves history and context
- Can be revived if needed
- Documents what was deprecated and why

**Lesson**: Archive, don't delete. Disk space is cheap, lost context is expensive.

### 5. Lazy-Load Config in CLI

Changed CLI from hardcoded `DB_PATH` constant to lazy-loaded `getDbPath()`:
```typescript
// Before: const DB_PATH = join(process.cwd(), ".amalfa/resonance.db");
// After:  const dbPath = await getDbPath(); // loads from config
```

**Lesson**: Global constants are tech debt. Lazy-load from config only when needed.

## What Worked Well

### TypeScript as Migration Guide
Using `bun build` (or `tsc --noEmit`) after renaming the config file gave us a **complete checklist** of every file that needed fixing. No guesswork, no missed imports.

### Systematic Approach
Breaking the work into TODOs kept it manageable:
1. ✅ EnvironmentVerifier (delete)
2. ✅ VectorEngine (remove import)
3. ✅ ResonanceDB (remove import)
4. ✅ DatabaseFactory (remove import)
5. ✅ Pipeline files (archive)
6. ✅ Legacy scripts (archive)
7. ✅ CLI (lazy-load config)

### Documentation-First
Creating `docs/CONFIG_UNIFICATION.md` and `docs/LEGACY_DEPRECATION.md` **before** executing the migration clarified the plan and prevented scope creep.

## What We'd Do Differently

### Earlier Validation Script
Should have created `validate-config.ts` at the start of the project, not during migration. Would have caught conflicts earlier.

### Fewer Config Files to Begin With
Having 3 config files (amalfa, polyvis, beads) from the start was a mistake. Should have started with one and kept it simple.

### Clearer Config Ownership
The confusion between "user-facing" (amalfa) vs "internal library" (polyvis) config could have been avoided with better separation of concerns from day 1.

## Technical Debt Paid

**Removed:**
- `polyvis.settings.json` (39 lines)
- `src/utils/EnvironmentVerifier.ts` (68 lines)
- `src/resonance/config.ts` (41 lines)
- 16 legacy scripts with hardcoded paths

**Simplified:**
- Single source of truth for configuration
- No more "which config do I edit?" confusion
- Predictable config loading: check 3 files (ts, js, json) in order

## Naming Insights (For Future Review)

Once config is unified, we can revisit these names:
- `ResonanceDB` → `AmalfaDB`? (But breaks API)
- `.amalfa/` directory → stays (good convention)
- `sources` field → `ingest` or `watch_dirs`? (Consider)
- `embeddings.model` → more descriptive? (Fine as-is)

**Lesson**: Don't rename during migration. One change at a time. Unify first, rename later.

## Metrics

**Files Modified**: 22  
**Lines Removed**: ~200 (imports, deprecated code)  
**Lines Added**: ~300 (validation, docs, extended schema)  
**Net Impact**: Cleaner codebase, single config system

**Build Status**: ✅ Clean  
**CLI Test**: ✅ `amalfa stats` works with new config  
**MCP Server**: ✅ Ready for testing in Warp Preview

## Lessons for Next Time

1. **Validate assumptions early** - Don't assume conflicts exist, prove them
2. **Archive, don't delete** - Future you will thank present you
3. **Clean-slate > gradual** - For config migration, breaking everything at once is faster than incremental fixes
4. **TypeScript is your friend** - Let the compiler tell you what's broken
5. **Document the plan** - Write the docs before the code
6. **Default values are safe** - Hardcoded defaults in deprecated methods are fine
7. **Lazy-load config** - Don't cache at import time, load when needed
8. **Test end-to-end** - `amalfa stats` caught the hardcoded CLI path

## Related Documentation

- [Configuration Unification Strategy](../docs/CONFIG_UNIFICATION.md)
- [Configuration Validation](../docs/CONFIG_VALIDATION.md)
- [Legacy Deprecation Plan](../docs/LEGACY_DEPRECATION.md)
- [Legacy Scripts README](../scripts/legacy/README.md)

## Status of High-Priority TODOs

From original session summary, we completed:
- ✅ Validate no conflicting settings between configs
- ✅ Document which config controls what
- ✅ Unify configuration system
- ⏭️ Add daemon management MCP tool (deferred)
- ⏭️ Improve search result previews for hollow nodes (deferred)
- ⏭️ Phase 1 features (entity extraction, auto-linking, etc.) (deferred)

**Next Session**: Focus on deferred items or new features, with clean config foundation.

## Closing Thoughts

The clean-slate approach was **significantly faster** than incremental migration would have been. By forcing all errors at once, we avoided the "death by a thousand cuts" problem where each file is partially migrated over weeks.

Total session time: ~2 hours to completely remove a legacy config system from a codebase with 16+ dependent scripts. That's a win.

**Key Insight**: Sometimes the fastest way to migrate is to break everything at once, then fix it systematically.
