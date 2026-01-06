# Current Configuration Status

**Last Updated:** 2026-01-06

## Configuration Files (Single Source of Truth)

### 1. AMALFA Core Configuration
**File:** `amalfa.config.json` (root)
**Purpose:** Main AMALFA system settings
**Loaded by:** `src/config/defaults.ts`

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
  "excludePatterns": ["node_modules", ".git", ".amalfa"]
}
```

**Status:** ✅ Active, primary config for AMALFA operations

### 2. Resonance Configuration (Legacy)
**File:** `polyvis.settings.json` (root)
**Purpose:** Resonance database and pipeline settings
**Loaded by:** `src/resonance/config.ts`

```json
{
  "paths": {
    "database": { "resonance": "public/resonance.db" },
    "docs": { ... },
    "sources": {
      "experience": [...],
      "persona": { ... }
    }
  },
  "graph": { "tuning": { ... } },
  "schema": { "version": "1.0.0" }
}
```

**Status:** 🔄 Legacy, used by resonance pipeline only

### 3. Beads Issue Tracking
**File:** `.beads/config.yaml`
**Purpose:** Beads issue tracking system configuration
**Loaded by:** Beads CLI (`bd` commands)

**Status:** ✅ Active, separate system

## Configuration Strategy

### Current Approach (2026-01-06)
- **AMALFA** and **Resonance** have separate configs
- This is **intentional** - they serve different purposes:
  - AMALFA: User-facing MCP server and CLI
  - Resonance: Internal database/pipeline layer

### Future Unification (v1.0+)
- Consider consolidating if Resonance becomes AMALFA-exclusive
- Keep separate if Resonance remains standalone library

## Configuration Hierarchy

```
Project Root
├── amalfa.config.json        ← AMALFA core (MCP, CLI, daemon)
├── polyvis.settings.json     ← Resonance (database, pipeline)
└── .beads/
    └── config.yaml           ← Beads (issue tracking)
```

## Action Items

- [ ] Decide: Merge AMALFA + Resonance configs for v1.0?
- [ ] Document: Which config controls what
- [ ] Validate: No conflicting settings between configs
- [ ] Clean: Remove unused legacy config options

## Notes

- No `_current-*` files existed prior to 2026-01-06
- Configuration is stable but not unified
- Each system has clear ownership of its config file
