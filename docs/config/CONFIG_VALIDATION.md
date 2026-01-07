# Configuration Validation Results

**Date**: 2026-01-07  
**Status**: ✅ No critical conflicts detected  
**Command**: `bun run validate-config`

## Summary

The validation script checked for conflicts between `amalfa.config.json` (user-facing) and `polyvis.settings.json` (legacy/deprecated). Found **1 warning** and **2 info items** - no blocking issues.

## Findings

### ⚠️ Warning: Database Path Mismatch

**Issue**: Two different database paths are configured:
- `amalfa.config.json`: `.amalfa/multi-source-test.db`
- `polyvis.settings.json`: `public/resonance.db`

**Impact**: Medium - The MCP server and daemon use `amalfa.config.json`, so they operate on `.amalfa/multi-source-test.db`. Legacy Resonance utilities may still reference `public/resonance.db`.

**Resolution**: This is **intentional** for the current testing setup:
- `.amalfa/multi-source-test.db` is the active database used by MCP server
- `public/resonance.db` is legacy and only used by deprecated Resonance pipelines
- No conflict exists because only one database is actively written to

**Action Required**: None for now. When migrating to v2.0, remove `polyvis.settings.json` entirely.

---

### ℹ️ Info: Embedding Configuration

**Finding**: Embedding model controlled by `amalfa.config.json`:
- Model: `BAAI/bge-small-en-v1.5`
- Dimensions: 384

**Note**: `polyvis.settings.json` does not define embeddings - this is correct. All embedding configuration lives in `amalfa.config.json`.

---

### ℹ️ Info: Source Directory Configuration

**Finding**: Different source directories defined:
- `amalfa.config.json` (MCP ingestion): `../polyvis/docs`, `../polyvis/playbooks`
- `polyvis.settings.json` (legacy): `debriefs`, `playbooks`, `briefs`, `docs`

**Explanation**: These serve different purposes:
- **MCP server** ingests from external Polyvis project docs (cross-project knowledge sharing)
- **Legacy Resonance** processes local project artifacts

**Status**: Working as intended - no conflict.

---

## Validation Script Details

**Location**: `scripts/validate-config.ts`

**Checks**:
1. ✅ Database path conflicts
2. ✅ Multiple database file detection
3. ✅ Embedding model consistency
4. ✅ Source directory existence
5. ✅ Deprecation notice presence

**Usage**:
```bash
bun run validate-config
```

**Exit Codes**:
- `0`: No errors (warnings/info allowed)
- `1`: Critical errors detected

---

## Configuration Ownership

| Setting | Config File | Status |
|---------|------------|--------|
| Database path | `amalfa.config.json` | ✅ Active |
| Embedding model | `amalfa.config.json` | ✅ Active |
| MCP source dirs | `amalfa.config.json` | ✅ Active |
| Watch settings | `amalfa.config.json` | ✅ Active |
| Legacy Resonance paths | `polyvis.settings.json` | ⚠️ Deprecated |
| Graph tuning params | `polyvis.settings.json` | ⚠️ Needs migration |

---

## Next Steps

1. ✅ **Completed**: Validation script created
2. ✅ **Completed**: Documentation of findings
3. 🔄 **Pending**: Add deprecation warning when `polyvis.settings.json` is loaded
4. 🔄 **Pending**: Migrate graph tuning parameters to `amalfa.config.json`
5. 🔄 **Future (v2.0)**: Remove `polyvis.settings.json` entirely

---

## Related Documentation

- [Configuration Unification Strategy](./CONFIG_UNIFICATION.md)
- [Current Config Status](./docs/_current-config-status.md)
- [MCP Setup Guide](./MCP_SETUP.md)
