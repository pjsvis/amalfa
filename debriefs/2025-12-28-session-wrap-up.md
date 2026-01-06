---
date: 2025-12-28
tags: [local-first, classifier, louvain, hollow-node, architecture, session]
---

## Debrief: 2025-12-28 Session — Classifier Pipeline & Hollow Node Migration

### Summary

Completed **Local-First Classifier Phases 2-3** and implemented **Hollow Node architecture**, reducing database size by 61% and improving scaling capacity 2.6×.

---

## Accomplishments

### Phase 2: End-to-End Pipeline
- ✅ `scripts/test-classifier.ts` — 8/8 tests passed (100%)
- ✅ Regex fallback extraction when Llama server unavailable
- ✅ `scripts/run-semantic-harvest.ts` — full pipeline integration

### Phase 3: Community Detection
- ✅ `ingest/calc_communities.py` — Louvain with veracity weighting
- ✅ **Misc Container Strategy** — small components → community -1
- ✅ Graph Connectivity Health metric: **95.8%**
- ✅ Fixed FTS5 corruption (rebuilt with content table mode)

### Hollow Node Migration
- ✅ Removed FTS5 table and triggers
- ✅ Updated MCP to vector-only search
- ✅ `read_node_content` reads from filesystem via `meta.source`
- ✅ **Size: 5.9MB → 2.3MB (61% reduction)**

---

## Scaling Impact

| Metric | Before | After |
|--------|--------|-------|
| Size per document | ~8,600 bytes | ~3,220 bytes |
| Document capacity | ~70,000 | **~185,000** |
| Scaling factor | 1.0× | **2.6×** |

---

## Architecture Evolution

```
ResonanceDB = Graph Edges + Vector Embeddings + File Pointers
            = Navigation  + Semantics        + Truth Source
```

The database is now a **lightweight index layer** over filesystem documents.

---

## Files Changed

| Action | File |
|--------|------|
| NEW | `scripts/test-classifier.ts` |
| NEW | `scripts/run-semantic-harvest.ts` |
| NEW | `scripts/run-community-detection.ts` |
| NEW | `ingest/calc_communities.py` |
| NEW | `briefs/brief-hollow-node-simplification.md` |
| MODIFIED | `ingest/harvester.py` (regex fallback) |
| MODIFIED | `src/db/schema.ts` (removed content) |
| MODIFIED | `src/resonance/schema.ts` (migration v5) |
| MODIFIED | `src/mcp/index.ts` (vector-only, filesystem read) |

---

## Debriefs Created
- `debriefs/2025-12-28-local-first-classifier-phase2.md`
- `debriefs/2025-12-28-local-first-classifier-phase3.md`
