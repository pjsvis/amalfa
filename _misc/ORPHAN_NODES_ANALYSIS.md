# UI Graph Analysis - Orphan Nodes Issue

## Current State

### Total Counts
- **Nodes:** 313
- **Edges:** 498
- **Orphan Nodes:** 106 (34%)

### By Domain

#### PERSONA (Well Connected) ✅
- **Nodes:** 185 (161 concepts + 24 directives)
- **Edges:** 386
- **Orphans:** 26 concepts (16%)
- **Connectivity:** Good - directives connect to concepts

#### EXPERIENCE (Sparse) ⚠️
- **Nodes:** 128 documents
- **Edges:** 112
- **Orphans:** 80 documents (62%)
- **Connectivity:** Poor - most documents disconnected

## Root Cause

### EXPERIENCE Edge Creation is Failing

**EdgeWeaver is only creating edges for 48 of 128 documents (38%)**

**Why?**
1. Semantic tokens are being extracted (all 128 docs have tokens)
2. But tokens aren't matching lexicon concepts
3. EdgeWeaver only creates edges when tokens match concepts
4. Low match rate = low edge density

### Example Scenario
```
Document: "2025-12-11-config-unification.md"
Tokens extracted: ["configuration", "unification", "settings", "database"]
Lexicon concepts: ["Circular-Logic", "Zero-Magic", "Context-Preservation", ...]
Matches: 0 (no overlap)
Edges created: 0
Result: Orphan node
```

## Solutions

### Option 1: Enrich Lexicon with Domain Terms
Add concepts that match common document keywords:
- "Configuration"
- "Database"  
- "Settings"
- "Pipeline"
- "Ingestion"

**Pros:** Increases match rate
**Cons:** Lexicon becomes large and diluted

### Option 2: Lower EdgeWeaver Matching Threshold
Currently requires exact matches. Could use fuzzy matching or stemming.

**Pros:** More edges created
**Cons:** Lower precision, more false positives

### Option 3: Create Document-to-Document Edges
Instead of only document→concept, also create document→document edges based on:
- Shared keywords
- Temporal proximity (same date)
- Same type (debrief→debrief)

**Pros:** Connects orphan documents
**Cons:** Different edge semantics

### Option 4: Use WikiLinks for Explicit Citations
Parse `[[Document Name]]` links in markdown to create CITES edges.

**Pros:** High precision, explicit relationships
**Cons:** Requires documents to have WikiLinks

## Recommended Approach

**Hybrid Strategy:**
1. **Add WikiLink parsing** (high precision, explicit)
2. **Add document-to-document edges** (temporal/type-based)
3. **Keep semantic matching** (concept connections)

This would create multiple edge types:
- **CITES:** Explicit citations via WikiLinks
- **MENTIONS:** Semantic token matches to concepts
- **RELATED_TO:** Documents of same type/date
- **CONTAINS:** Document structure edges

## Expected Impact

**Current:**
- 48 connected documents
- 80 orphans

**After fixes:**
- ~100-120 connected documents
- ~8-28 orphans (only truly isolated docs)

## Next Steps

1. Implement WikiLink parser
2. Add document-to-document relationship logic
3. Re-run ingestion
4. Verify UI shows fewer orphans
