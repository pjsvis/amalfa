---
date: 2025-12-28
tags: [local-first, louvain, communities, phase-3, database-repair]
---

## Debrief: Local-First Classifier Phase 3 — Community Detection

### Summary

Implemented **Louvain community detection** with veracity-weighted edges. Discovered and fixed FTS5 corruption in the database. Detected 78 communities due to graph fragmentation.

---

## Accomplishments

- **Louvain Algorithm Implemented:** Created `ingest/calc_communities.py` using networkx/python-louvain with edge weight = `confidence × veracity` (Judicial Veracity formula).

- **TypeScript Integration:** Created `scripts/run-community-detection.ts` that:
  1. Invokes Python for Louvain computation (outputs JSON)
  2. Loads partition using centralized ResonanceDB access
  3. Persists community IDs to node `meta` field

- **260 nodes** successfully updated with community assignments.

- **FTS5 Corruption Fixed:** Discovered mismatch (3277 FTS entries vs 486 nodes). Rebuilt FTS5 using `content table mode` which reads directly from nodes table — no triggers needed.

---

## Problems

- **Graph Fragmentation:** 78 communities instead of target ~7 because the graph has many disconnected components:
  - Timeline chains (debriefs linked chronologically)
  - Concept clusters (OH-*, Concept-* from lexicon)
  - Isolated semantic extractions
  
  Louvain cannot merge unconnected components regardless of resolution setting.

- **FTS Trigger Instability:** The original FTS trigger caused `SQL logic error` on any UPDATE. Root cause was rowid mismatch from previous incomplete ingestions.

---

## Lessons Learned

- **Content Table Mode for FTS5:** Using `content='nodes'` syntax makes FTS5 read directly from the source table. No triggers needed, no sync issues. Trade-off: requires manual `rebuild` after bulk changes.

- **Louvain Limitations:** Resolution parameter only affects community granularity *within* connected components. Cannot merge disconnected subgraphs.

- **Graph Health Metric:** The ratio of nodes in "main" communities vs isolated clusters could indicate knowledge graph maturity.

---

## Files Changed

| Action | File |
|--------|------|
| NEW | `ingest/calc_communities.py` |
| NEW | `scripts/run-community-detection.ts` |
| MODIFIED | `public/resonance.db` (FTS rebuilt, communities added) |

---

## Next Steps

Consider implementing "Misc Container" strategy:
1. Identify connected components
2. Run Louvain only on largest component(s)
3. Assign small/isolated components to "misc" community (-1)
4. Track misc percentage as graph health indicator
