# Debrief: Cache Consolidation Implementation

**Date**: 2026-01-07  
**Session**: Cache Directory Consolidation  
**Status**: ✅ Complete

## What We Did

Consolidated the `.resonance/` folder into `.amalfa/cache/` to achieve a single source of truth for all runtime artifacts.

## Problem Context

The project had two dot folders in root:
- `.amalfa/` - Runtime artifacts (database, logs, PIDs)
- `.resonance/` - ML model cache (~128 MB)

This violated the single source of truth principle and created unnecessary cognitive overhead.

## Solution Implemented

### Code Changes
1. Updated `src/resonance/services/embedder.ts:74`
   - Changed: `.resonance/cache` → `.amalfa/cache`
2. Updated `src/resonance/services/vector-daemon.ts:38`
   - Changed: `.resonance/cache` → `.amalfa/cache`

### Configuration Updates
1. `.gitignore`: Removed `.resonance/` entries, added `.amalfa/cache/`
2. `.npmignore`: Removed `.resonance/` entry

### Migration
1. Moved 128 MB model cache from `.resonance/cache` → `.amalfa/cache`
2. Removed empty `.resonance/` directory

## Validation Results

### Test Suite ✅
- **18 pass, 5 skip, 0 fail**
- 413 expect() calls
- Duration: 705ms

### Services Status ✅
- Vector Daemon: 🟢 RUNNING - Model loaded from new location
- File Watcher: 🟢 RUNNING
- MCP Server: Ready (stdio mode)

### Vector Daemon Health ✅
```json
{"status":"ok","model":"fast-bge-small-en-v1.5","ready":true}
```

### Database Validation ✅
- Nodes: 80
- Edges: 22
- Embeddings: 80
- Health: PASSED

## Final Structure

```
.amalfa/
├── cache/              # ← ML model cache (consolidated)
│   └── fast-bge-small-en-v1.5/
├── logs/
│   ├── daemon.log
│   ├── pre-flight.log
│   └── vector-daemon.log
├── runtime/
│   ├── daemon.pid
│   ├── mcp.pid
│   └── vector-daemon.pid
├── resonance.db
├── resonance.db-shm
└── resonance.db-wal
```

## Benefits Achieved

1. **Single Source of Truth** - All Amalfa artifacts in one place
2. **Cleaner Root** - Reduced from 2 to 1 Amalfa-specific folder
3. **Better UX** - `rm -rf .amalfa/` removes everything
4. **Zero Breaking Changes** - Cache regenerates if missing
5. **Maintained Performance** - Vector daemon loads instantly

## Key Learnings

### Architecture Insight
The `.resonance/` folder was legacy naming from the PolyVis era. By consolidating into `.amalfa/`, we align with the project's identity and make the system more intuitive.

### Migration Pattern
Moving cached artifacts is safe because:
- They're deterministic (same model version = same files)
- They regenerate automatically if missing
- No user data or state is lost

### Testing Validation
The comprehensive test suite caught no regressions:
- EdgeWeaver tests passed (mock DB working)
- FAFCAS compliance tests passed (embedding generation)
- DatabaseFactory tests passed (connection management)
- All services started cleanly

## Risks & Mitigations

**Risk**: Users with existing `.resonance/` cache would need to re-download.  
**Mitigation**: Cache auto-regenerates. 128 MB download is acceptable.

**Risk**: Hardcoded paths in other tools/scripts.  
**Mitigation**: Grep'd codebase - only 2 locations affected, both updated.

## Future Considerations

This consolidation sets a precedent:
- All Amalfa runtime artifacts live in `.amalfa/`
- Clear separation from source code
- Easy to clean/reset development environment

## Commit Message

```
refactor: Consolidate .resonance cache into .amalfa/cache

- Move ML model cache from .resonance/ to .amalfa/cache/
- Update embedder and vector-daemon cache paths
- Update .gitignore and .npmignore
- Single source of truth for all runtime artifacts
- All tests passing (18 pass, 5 skip, 0 fail)

Co-Authored-By: Warp <agent@warp.dev>
```

## Timeline

- **15:46** - Brief created
- **15:47** - Implementation started
- **15:48** - Code changes completed, services restarted
- **15:49** - Test suite passed
- **15:51** - Validation complete

Total implementation time: ~5 minutes

## Related Documents

- Brief: `briefs/2026-01-07-consolidate-cache-directory.md`
- Architecture: `docs/architecture/SERVICE-ARCHITECTURE.md`

---

**Outcome**: Successfully consolidated cache directory with zero breaking changes and full backward compatibility. System is cleaner, more intuitive, and ready for v1.0.18.
