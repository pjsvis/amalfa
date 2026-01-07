# Brief: Consolidate .resonance into .amalfa

**Date**: 2026-01-07  
**Type**: Refactoring  
**Impact**: Low (internal structure only)

## Problem

The project currently has two dot folders in the root:
- `.amalfa/` - Runtime artifacts (database, logs, PIDs)
- `.resonance/` - ML model cache (~128 MB)

This creates cognitive overhead and violates the "single source of truth" principle.

## Analysis

### Current Structure
```
.amalfa/          # Runtime artifacts
├── logs/
├── runtime/
└── resonance.db

.resonance/       # ML model cache
└── cache/
    └── fast-bge-small-en-v1.5/
```

### Root Cause
The `.resonance/` folder is a legacy naming holdover, likely from the PolyVis era. It serves only as a cache directory for FastEmbed model downloads.

### References
- `src/resonance/services/embedder.ts:74` - Cache path
- `src/resonance/services/vector-daemon.ts:38` - Cache path

## Proposed Solution

Consolidate all runtime artifacts into `.amalfa/cache/`:

```
.amalfa/
├── cache/        # ← ML model cache (moved from .resonance/)
├── logs/
├── runtime/
└── resonance.db
```

## Implementation Plan

### Phase 1: Update Source Code
1. Update embedder.ts cache path
2. Update vector-daemon.ts cache path
3. Add backward compatibility check (optional)

### Phase 2: Update Configuration
1. Update .gitignore (remove .resonance/ entries)
2. Update .npmignore (remove .resonance/ entry)

### Phase 3: Migration
1. Move existing cache directory
2. Test all embedding functionality
3. Verify vector daemon still works

### Phase 4: Validation
1. Run test suite
2. Test MCP server with vector search
3. Verify services start correctly

## Benefits

1. **Single Source of Truth**: All Amalfa artifacts in one place
2. **Cleaner Root**: One dot folder instead of two
3. **Better UX**: `rm -rf .amalfa/` removes everything
4. **Consistent Naming**: Eliminates confusing "resonance" terminology

## Risks

- **Low**: Only two hardcoded paths need updating
- **Backward Compatibility**: Users with existing `.resonance/` cache will need to re-download (or we auto-migrate)
- **Breaking Change**: None - cache is regenerated automatically

## Testing Checklist

- [ ] Vector daemon starts and loads model from new location
- [ ] Embedder falls back to local embedding correctly
- [ ] MCP server search works
- [ ] Test suite passes
- [ ] Services status shows all running

## Rollback Plan

If issues occur, revert the two path changes. Cache will be re-downloaded to old location.

---

**Decision**: Proceed with consolidation in v1.0.18
