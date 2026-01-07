# Configuration Unification Plan

**Date:** 2026-01-07  
**Status:** Proposed

## Current State

### Two Active Configs

1. **`amalfa.config.json`** (Primary)
   - User-facing AMALFA configuration
   - Clean, minimal, focused
   - Controls: sources, database, embeddings, file watching
   - Loaded by: `src/config/defaults.ts`

2. **`polyvis.settings.json`** (Legacy)
   - Resonance pipeline configuration
   - Complex, with graph tuning and persona paths
   - Controls: legacy database paths, graph algorithms, persona fixtures
   - Loaded by: `src/resonance/config.ts`

### Issue

- Confusing for new users (two configs)
- Potential for conflicting settings (both define database paths)
- Unclear which config to edit

## Decision: Keep Separate (For Now)

**Rationale:**

1. **Different audiences:**
   - `amalfa.config.json` - End users configuring AMALFA
   - `polyvis.settings.json` - Internal Resonance library settings

2. **Different lifecycles:**
   - AMALFA config is stable and user-friendly
   - Resonance config will be deprecated as features migrate

3. **Clean migration path:**
   - Mark `polyvis.settings.json` as deprecated
   - Gradually move needed settings to `amalfa.config.json`
   - Remove when fully migrated

## Recommendation: Document Ownership

Create clear boundaries:

### `amalfa.config.json` - AMALFA Core (User-Facing)

```json
{
  "sources": ["./docs", "./playbooks"],
  "database": ".amalfa/resonance.db",
  "embeddings": {
    "model": "BAAI/bge-small-en-v1.5",
    "dimensions": 384
  },
  "watch": {
    "enabled": true,
    "debounce": 1000
  },
  "excludePatterns": ["node_modules", ".git", ".amalfa"],
  
  // Future additions (not yet implemented):
  // "daemons": {
  //   "vector": {
  //     "enabled": true,
  //     "port": 3010  // Only if really needed
  //   },
  //   "watcher": {
  //     "enabled": true
  //   }
  // }
}
```

**Controls:**
- MCP server behavior
- File watcher daemon
- Vector daemon
- Database location
- Source directories
- Embedding model selection

### `polyvis.settings.json` - Resonance Library (Internal/Deprecated)

**Current usage:**
- Graph tuning parameters (Louvain algorithm)
- Persona fixture paths (lexicon, CDA)
- Legacy "experience" source structure

**Migration path:**
1. Mark file as deprecated in v1.0
2. Add warning when loaded: "polyvis.settings.json is deprecated, migrate to amalfa.config.json"
3. Remove in v2.0

**What to migrate:**
- Graph tuning → `amalfa.config.json` (if users need it)
- Persona paths → Hard-coded defaults or removed (likely unused)
- Experience sources → Already handled by `sources` in amalfa.config.json

## Port Numbers Decision

**NO** - Do not add port configuration to `amalfa.config.json`

**Reasons:**
1. Ports rarely change in single-user, local-first systems
2. Adds complexity for minimal benefit
3. Already support env var override: `VECTOR_PORT=3011 bun run start`

**Current approach (keep):**
```typescript
// Code constant with env override
const PORT = Number(process.env.VECTOR_PORT || 3010);
```

**When to add ports to config:**
- Multi-user deployments
- Cloud-native setups
- Conflict resolution needs

For AMALFA's use case: **Not needed.**

## Action Plan

### Phase 1: Document (Now)
- [x] Create this document
- [ ] Update `_current-config-status.md` with clear ownership
- [ ] Add comments to `polyvis.settings.json` marking as deprecated
- [ ] Update README with config documentation

### Phase 2: Deprecation Warnings (v0.9)
- [ ] Add warning log when `polyvis.settings.json` is loaded
- [ ] Migrate graph tuning to `amalfa.config.json` (optional section)
- [ ] Remove unused persona paths from codebase

### Phase 3: Removal (v2.0)
- [ ] Delete `polyvis.settings.json`
- [ ] Remove `src/resonance/config.ts`
- [ ] Single config: `amalfa.config.json`

## Example: Unified Config (Future v2.0)

```json
{
  "sources": ["./docs", "./playbooks"],
  "database": ".amalfa/resonance.db",
  
  "embeddings": {
    "model": "BAAI/bge-small-en-v1.5",
    "dimensions": 384
  },
  
  "watch": {
    "enabled": true,
    "debounce": 1000
  },
  
  "excludePatterns": ["node_modules", ".git", ".amalfa"],
  
  "graph": {
    "tuning": {
      "louvain": {
        "resolution": 0.3
      }
    }
  }
}
```

## Configuration Schema (Future)

Consider adding schema validation:
- `amalfa.config.schema.json` for IDE autocomplete
- Validate on load with `zod` or similar
- Clear error messages for invalid config

## Summary

**Decision:** Keep configs separate for now, document clearly, deprecate `polyvis.settings.json` gradually.

**Port numbers:** NO - use env vars, keep config simple.

**Timeline:**
- v1.0: Document + deprecation warnings
- v2.0: Single unified config
