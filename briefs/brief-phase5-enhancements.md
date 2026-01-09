## Task: Phase 5 - Feature Enhancements

**Objective:** Add new capabilities using existing dependencies, promote useful scripts to CLI/API, and improve graph configurability.

**TODO Items:** #1, #2, #5, #11, #14, #18

- [ ] LouvainGate threshold configurable (#1)
- [ ] LouvainGate rejection metrics (#2)
- [ ] Deprecate legacy tag-slug syntax (#5)
- [ ] Add pipeline history tracking (#11)
- [ ] Promote diagnostic scripts to API (#14)
- [ ] Leverage unused graphology features (#18)

## Key Actions Checklist:

### LouvainGate Improvements (#1, #2)
- [ ] Add `graph.tuning.louvain.superNodeThreshold` to config schema
- [ ] Update `LouvainGate.check()` to read threshold from config
- [ ] Add rejection tracking to StatsTracker:
  - [ ] `louvainGate.checked` count
  - [ ] `louvainGate.rejected` count
  - [ ] `louvainGate.topSuperNodes` list
- [ ] Surface in `amalfa stats` output

### EdgeWeaver Tag Deprecation (#5)
- [ ] Add deprecation warning when `tag-slug` format is detected
- [ ] Log: "⚠️ Legacy 'tag-slug' format detected. Use [tag: Concept] instead."
- [ ] Document migration in a playbook or README

### Pipeline History (#11)
- [ ] Add `history` table to schema:
  ```sql
  CREATE TABLE history (
    id INTEGER PRIMARY KEY,
    entity_type TEXT,  -- 'node' | 'edge'
    entity_id TEXT,
    action TEXT,       -- 'insert' | 'update' | 'delete'
    old_value TEXT,    -- JSON
    new_value TEXT,    -- JSON
    timestamp TEXT
  )
  ```
- [ ] Hook `insertNode()`, `insertEdge()`, `updateNode()` to log changes
- [ ] Add `amalfa history` CLI command to view recent changes

### Promote Scripts to CLI (#14)
- [ ] `verify_graph_integrity.ts` → `amalfa validate --graph`
- [ ] `analyze_health.ts` → enhance `/health` endpoint
- [ ] `analyze_orphans.ts` → `amalfa stats --orphans`
- [ ] `run-community-detection.ts` → `amalfa stats --communities`
- [ ] `inspect-db.ts` → `amalfa inspect <table>`

### Graphology Features (#18)
- [ ] Add `GraphEngine.traverse(startNode, depth)` using BFS
- [ ] Add `GraphEngine.validateIntegrity()` using graphology assertions
- [ ] Document available algorithms for future UI work

## Verification:

- [ ] `amalfa stats` shows LouvainGate metrics
- [ ] History table populated on ingestion
- [ ] `amalfa validate --graph` works
- [ ] Deprecation warning appears for old tag format
