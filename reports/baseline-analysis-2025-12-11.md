# Current Baseline Analysis
**Date:** 2025-12-11

## Actual Database State (After Fresh Ingestion)

### Total Counts
- **Nodes:** 289
- **Edges:** 112
- **Vectors:** 128

### By Domain & Type
| Domain | Type | Count |
|--------|------|-------|
| PERSONA | concept | 161 |
| EXPERIENCE | debrief | 62 |
| EXPERIENCE | document | 44 |
| EXPERIENCE | playbook | 22 |

## Source Data Analysis

### PERSONA Domain
- **Lexicon:** 161 concepts (from `conceptual-lexicon-ref-v1.79.json`)
- **CDA:** 24 directives (from `cda-ref-v63.json`)
- **CDA Relationship Tags:** 0 (no edges defined in CDA yet)

**Expected:**
- Nodes: 161 (lexicon only, CDA directives not ingested as nodes)
- Edges: 0 (CDA has no relationship tags)

**Actual:**
- Nodes: 161 ✅
- Edges: 0 ✅

### EXPERIENCE Domain
- **Source Files:** 128 markdown files (debriefs + playbooks + briefs)
- **Ingested Nodes:** 128 (62 debriefs + 22 playbooks + 44 documents)

**Expected:**
- Nodes: 128 ✅
- Edges: ~100-150 (from semantic token extraction)
- Vectors: 128 (1 per document) ✅

**Actual:**
- Nodes: 128 ✅
- Edges: 112 ✅ (within expected range)
- Vectors: 128 ✅

## Discrepancies

### Node Count Mismatch
**Database shows 289 nodes, but breakdown is:**
- 161 (persona concepts)
- 62 (debriefs)
- 44 (documents)  
- 22 (playbooks)
- **Total: 289** ✅

Wait, that adds up correctly!

### Edge Density Analysis
**EXPERIENCE edges: 112 for 128 documents**
- **Ratio:** 0.875 edges per document
- **This seems low** for semantic extraction

**Expected edge sources:**
1. WikiLinks `[[Concept]]` → CITES edges
2. Semantic tokens matching lexicon → MENTIONS edges
3. Document structure → CONTAINS edges

**Question:** Why only 112 edges?
- Are semantic tokens not matching lexicon concepts?
- Is EdgeWeaver not creating edges for all matches?
- Are there duplicate edges being filtered?

## Recommended Baseline

```json
{
  "persona": {
    "nodes": {
      "concepts": 161,
      "directives": 0,
      "total": 161
    },
    "edges": {
      "total": 0
    },
    "vectors": 161
  },
  "experience": {
    "nodes": {
      "debriefs": 62,
      "playbooks": 22,
      "documents": 44,
      "total": 128
    },
    "edges": {
      "MENTIONS": 80,
      "CONTAINS": 32,
      "total": 112
    },
    "vectors": 128,
    "semantic_tokens": 128
  }
}
```

## Questions for Investigation

1. **CDA Integration:** Should CDA directives be ingested as nodes? (Currently: No)
2. **CDA Edges:** Should we extract edges from CDA structure? (Currently: No relationship tags exist)
3. **Edge Density:** Is 112 edges for 128 documents the expected density, or should it be higher?
4. **Edge Types:** What are the actual edge types in the database? (Need to query)

## Next Steps

1. Query database for actual edge type breakdown
2. Investigate EdgeWeaver logic to understand edge creation
3. Determine if edge density is acceptable or if extraction is failing
4. Decide on CDA integration strategy (nodes + edges)
