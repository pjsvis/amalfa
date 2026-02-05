## Task: Website Single Source of Truth (SSOT) Integration

**Objective:** Link the website/dashboard to `amalfa.settings.json` as the single source of truth, eliminating hardcoded paths and configuration values.

**Status:** 🚧 IN PROGRESS

## Problem Statement

Current website has hardcoded values:
- Database path: `/Users/petersmith/Dev/GitHub/amalfa/.amalfa/resonance.db`
- Sources: Not using actual configured sources
- Model: Hardcoded "bge-small-en-v1.5"
- Ports: Hardcoded 3001
- Cache location: Hardcoded `.amalfa/cache/lang-extract`

These should come from `amalfa.settings.json` which is the project SSOT.

## High-Level Requirements

- [ ] Server reads `amalfa.settings.json` on startup
- [ ] All hardcoded paths replaced with configured values
- [ ] Create `/api/config` endpoint exposing safe configuration
- [ ] Dashboard displays actual configured values (model, sources, features)
- [ ] Frontend fetches config on load and uses dynamic values
- [ ] Maintain security: never expose API keys or sensitive data

## Key Actions Checklist:

- [ ] **Server Configuration Loading**
  - [ ] Read `amalfa.settings.json` at server startup
  - [ ] Parse and validate JSON structure
  - [ ] Store in module-level config object
  - [ ] Add error handling for missing/malformed config

- [ ] **Replace Hardcoded Paths**
  - [ ] `database` → use `config.database` instead of hardcoded path
  - [ ] `sources` → use `config.sources` for document scanning
  - [ ] `embeddings.dimensions` → use configured dimension
  - [ ] `embeddings.model` → use configured model name
  - [ ] `excludePatterns` → respect configured exclusions

- [ ] **New `/api/config` Endpoint**
  - [ ] Return safe configuration object (no API keys/secrets)
  - [ ] Include: database path, sources, model info, enabled features
  - [ ] Include: sonar port, watch status, ember status
  - [ ] JSON response with proper Content-Type

- [ ] **Dashboard Dynamic Configuration**
  - [ ] Fetch `/api/config` on page load
  - [ ] Display configured sources in System Status widget
  - [ ] Display actual embedding model (not hardcoded)
  - [ ] Show enabled features (watch, ember, sonar) with indicators
  - [ ] Use configured database path for stats queries

- [ ] **Enhanced System Status Widget**
  - [ ] Add "Sources" row showing configured sources
  - [ ] Add "Model" row showing configured embedding model
  - [ ] Add "Features" section with indicators:
    - [ ] Watch: enabled/disabled
    - [ ] Ember: enabled/disabled
    - [ ] Sonar: enabled/disabled + port

- [ ] **Error Handling**
  - [ ] Graceful fallback if config file missing
  - [ ] Log warnings for configuration issues
  - [ ] Dashboard shows "Configuration Error" if can't load

## Technical Design

### Configuration Schema (Server-Side)
```typescript
interface AmalfaConfig {
  sources: string[];
  database: string;
  embeddings: {
    model: string;
    dimensions: number;
  };
  watch: { enabled: boolean; };
  ember: { enabled: boolean; };
  sonar: { enabled: boolean; port: number; };
  excludePatterns: string[];
  // ... other safe config
}
```

### Safe Config API Response
```json
{
  "sources": [".", "src", "scripts"],
  "database": ".amalfa/resonance.db",
  "embeddings": {
    "model": "BAAI/bge-small-en-v1.5",
    "dimensions": 384
  },
  "features": {
    "watch": { "enabled": true },
    "ember": { "enabled": true },
    "sonar": { "enabled": true, "port": 3012 }
  },
  "excludePatterns": ["node_modules", ".git", ".amalfa"],
  "serverPort": 3001
}
```

### Dashboard Integration
```javascript
// On page load
fetch('/api/config')
  .then(r => r.json())
  .then(config => {
    document.getElementById('model-name').textContent = config.embeddings.model;
    document.getElementById('sources-list').textContent = config.sources.join(', ');
    updateFeatureIndicators(config.features);
  });
```

## Implementation Details

### Server.ts Changes
1. Add config loading at module level:
```typescript
const CONFIG = await loadConfig();

async function loadConfig(): Promise<AmalfaConfig> {
  try {
    const configFile = Bun.file("amalfa.settings.json");
    const content = await configFile.text();
    return JSON.parse(content);
  } catch (e) {
    console.warn("Failed to load amalfa.settings.json, using defaults");
    return getDefaultConfig();
  }
}
```

2. Replace hardcoded values:
```typescript
// Before:
const dbPath = "/Users/petersmith/Dev/GitHub/amalfa/.amalfa/resonance.db";

// After:
const dbPath = CONFIG.database;
```

3. Add endpoint:
```typescript
if (path === "/api/config") {
  return new Response(JSON.stringify(getSafeConfig(CONFIG)), {
    headers: { "Content-Type": "application/json" }
  });
}
```

## Success Criteria

- [ ] Server reads configuration from `amalfa.settings.json`
- [ ] No hardcoded paths remain in server.ts
- [ ] `/api/config` returns valid JSON with safe config
- [ ] Dashboard displays configured sources, model, and features
- [ ] Changing amalfa.settings.json and restarting server updates dashboard
- [ ] Missing config file doesn't crash server (uses defaults)

## Benefits

1. **SSOT Compliance**: Website uses same configuration as rest of system
2. **Dynamic Updates**: Change config → restart server → UI reflects changes
3. **Feature Visibility**: Users can see which features are enabled
4. **Debugging Aid**: Dashboard shows actual configuration being used
5. **Consistency**: No more divergence between configured and displayed values

## Related Files

- `amalfa.settings.json` - Single source of truth
- `website/ssr-docs/server.ts` - To be updated
- `playbooks/ssot-integration-playbook.md` - Future documentation

---

**Proposed Architecture:**
```
amalfa.settings.json (SSOT)
    ↓
Server reads on startup
    ↓
Uses values for DB queries, paths, etc.
    ↓
/api/config exposes safe subset
    ↓
Dashboard fetches and displays
```

This maintains the SSOT principle while providing web visibility into configuration.
