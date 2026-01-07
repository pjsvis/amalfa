# Legacy Configuration Deprecation Plan

**Target**: Remove `polyvis.settings.json` and consolidate to `amalfa.config.json`  
**Timeline**: v1.0 (deprecation warnings) → v2.0 (removal)  
**Status**: 🔄 In Progress

## Current State

### Files Using `polyvis.settings.json`

**Active (needs migration)**:
1. `src/resonance/config.ts` - ResonanceConfig loader (✅ deprecation warning added)
2. `src/resonance/db.ts` - ResonanceDB uses legacy paths
3. `src/resonance/DatabaseFactory.ts` - Factory pattern for DB instances
4. `src/core/VectorEngine.ts` - Vector search initialization
5. `src/utils/EnvironmentVerifier.ts` - Environment validation
6. `src/pipeline/HarvesterPipeline.ts` - Tag harvesting (soft dependency)

**Legacy scripts** (low priority):
- `scripts/verify/*` - Debug/diagnostic scripts (15+ files)
- `scripts/cli/harvest.ts` - Concept harvesting CLI
- Various test/lab utilities

### Configuration Comparison

| Feature | polyvis.settings.json | amalfa.config.json |
|---------|----------------------|-------------------|
| Database path | `public/resonance.db` | `.amalfa/multi-source-test.db` |
| Source directories | `debriefs`, `playbooks`, `briefs`, `docs` | `../polyvis/docs`, `../polyvis/playbooks` |
| Embeddings | ❌ Not defined | ✅ BAAI/bge-small-en-v1.5 (384d) |
| Watch config | ❌ Not defined | ✅ Enabled, 1000ms debounce |
| Graph tuning | ✅ Louvain params | ❌ Needs migration |
| Persona fixtures | ✅ Lexicon, CDA | ❌ Needs migration |

---

## Migration Strategy

### Phase 1: Expand amalfa.config.json (Current)

Add missing features from `polyvis.settings.json` to `amalfa.config.json`:

```json
{
  "sources": ["../polyvis/docs", "../polyvis/playbooks"],
  "database": ".amalfa/multi-source-test.db",
  "embeddings": {
    "model": "BAAI/bge-small-en-v1.5",
    "dimensions": 384
  },
  "watch": {
    "enabled": true,
    "debounce": 1000
  },
  "excludePatterns": ["node_modules", ".git", ".amalfa"],
  
  // NEW: Migrate from polyvis.settings.json
  "graph": {
    "tuning": {
      "louvain": {
        "persona": 0.3,
        "experience": 0.25
      }
    }
  },
  "fixtures": {
    "lexicon": "scripts/fixtures/conceptual-lexicon-ref-v1.79.json",
    "cda": "scripts/fixtures/cda-ref-v63.json"
  }
}
```

### Phase 2: Update Code to Use amalfa.config.json

1. **Modify `src/resonance/config.ts`**:
   - Try loading `amalfa.config.json` first
   - Fall back to `polyvis.settings.json` with deprecation warning
   - Map unified config structure to ResonanceConfig

2. **Update ResonanceDB initialization**:
   - Accept config object in constructor
   - Use `amalfa.config.json` paths

3. **Migrate graph tuning parameters**:
   - Add `graph.tuning` to AmalfaConfig interface
   - Use in Louvain clustering algorithms

4. **Handle persona fixtures**:
   - Add `fixtures` section to AmalfaConfig
   - Update HarvesterPipeline to read from new config

### Phase 3: Update Scripts

- Mark all `scripts/verify/*` as legacy (add README note)
- Update `scripts/cli/harvest.ts` to use unified config
- Create `scripts/migrate-config.ts` tool to auto-convert

### Phase 4: Remove Legacy (v2.0)

- Delete `polyvis.settings.json`
- Remove `src/resonance/config.ts` fallback logic
- Remove EnvironmentVerifier (replaced by modern config validation)
- Archive legacy scripts to `scripts/legacy/`

---

## Migration Checklist

### v1.0 (Current Release)
- [x] Add deprecation warning to `loadConfig()` (src/resonance/config.ts)
- [x] Document current config conflicts (docs/CONFIG_VALIDATION.md)
- [ ] Extend `amalfa.config.json` schema with graph tuning
- [ ] Extend `amalfa.config.json` schema with fixtures
- [ ] Update `src/config/defaults.ts` with new fields
- [ ] Create config migration helper script
- [ ] Test all MCP commands with unified config

### v1.1 (Transition Period)
- [ ] Update ResonanceDB to accept unified config
- [ ] Update VectorEngine to use unified config
- [ ] Make polyvis.settings.json fully optional
- [ ] Add config auto-migration on first run
- [ ] Update all documentation to reference amalfa.config.json only

### v2.0 (Legacy Removal)
- [ ] Remove polyvis.settings.json from repo
- [ ] Remove ResonanceConfig loader fallback
- [ ] Archive legacy verify scripts
- [ ] Remove EnvironmentVerifier
- [ ] Update CHANGELOG with breaking changes

---

## Testing Strategy

1. **Backward compatibility** (v1.0-1.1):
   - Both configs work simultaneously
   - Deprecation warnings guide users
   - No breaking changes

2. **Migration path validation**:
   - Test with only `amalfa.config.json`
   - Test with only `polyvis.settings.json` (warnings)
   - Test with both (unified config takes precedence)

3. **Removal readiness** (v2.0):
   - All tests pass without polyvis.settings.json
   - No imports of `src/resonance/config.ts` legacy loader
   - Documentation references only unified config

---

## Naming Review (Post-Migration)

Once we have a single config file, review these names:

**Consider renaming**:
- `.amalfa/` → Could stay, or rename to `.amalfa-data/`?
- `ResonanceDB` → `AmalfaDB`? (breaks API)
- `sources` → `ingest` or `watch_dirs`?
- `embeddings.model` → More descriptive field names?

**Keep as-is**:
- `database` - Clear
- `watch` - Standard terminology
- `excludePatterns` - Matches .gitignore convention

---

## Related Documentation

- [Configuration Unification Strategy](./CONFIG_UNIFICATION.md)
- [Configuration Validation](./CONFIG_VALIDATION.md)
- [MCP Setup Guide](./MCP_SETUP.md)
