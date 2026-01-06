# Ingestion Pipeline Status Report
**Date:** 2025-12-11

## Current State

### PERSONA Pipeline
**Status:** ⚠️ Partially Functional

**What Works:**
- ✅ Lexicon loading (161 concepts)
- ✅ Node creation for concepts
- ✅ Vector generation for concepts

**What's Missing:**
- ❌ CDA directive ingestion (0 of 24 directives ingested)
- ❌ Edge generation between CL/CDA entries (0 edges)
- ❌ Keyword-based semantic edge creation (previously worked)

**Previous Implementation:**
- Used keywords/tags from CDA entries to create edges
- Example: Entry tagged with `[IMPLEMENTS: Circular-Logic]` → creates IMPLEMENTS edge
- Generated ~3,000 edges in previous version
- **This logic is no longer active**

### EXPERIENCE Pipeline
**Status:** ✅ Functional (but low edge density)

**What Works:**
- ✅ Document ingestion (128 files)
- ✅ Node creation (62 debriefs + 22 playbooks + 44 documents)
- ✅ Vector generation (128 vectors)
- ✅ Semantic token extraction (128 documents tagged)
- ✅ Edge creation via EdgeWeaver (112 edges)

**What's Suboptimal:**
- ⚠️ Low edge density (0.875 edges/doc vs expected 3-5)
- ⚠️ Only 2 edge types (MENTIONS: 111, EXEMPLIFIES: 1)
- ⚠️ Suggests semantic tokens aren't matching lexicon well

## Issues to Address

### Issue 1: CDA Directive Ingestion Missing
**Problem:** CDA directives are loaded but not ingested as nodes

**Evidence:**
- CDA file has 24 directives
- Database has 0 directive nodes
- Only lexicon concepts (161) are ingested

**Impact:**
- PERSONA graph has no directive nodes
- No structure beyond flat concept list
- Can't create edges between directives and concepts

**Root Cause:**
- Ingestion pipeline only processes lexicon
- CDA loading code exists but doesn't create nodes

### Issue 2: Keyword-Based Edge Creation Disabled
**Problem:** Previous edge generation logic is not active

**Evidence:**
- 0 PERSONA edges in database
- Previous version had ~3,000 edges
- CDA has relationship tags but they're not being processed

**Impact:**
- PERSONA graph is a disconnected set of concept nodes
- No ontological structure
- Graph is useless for navigation/exploration

**Root Cause:**
- Edge creation logic was removed or disabled
- Need to re-implement tag parsing and edge generation

### Issue 3: Low EXPERIENCE Edge Density
**Problem:** Only 112 edges for 128 documents (0.875 edges/doc)

**Evidence:**
- Expected: 3-5 edges/doc (384-640 total)
- Actual: 112 edges
- Only 29% of expected minimum

**Possible Causes:**
1. Semantic tokens not being extracted
2. Tokens not matching lexicon concepts
3. EdgeWeaver not creating edges for matches
4. Edges being deduplicated too aggressively

**Impact:**
- EXPERIENCE graph is sparse
- Limited connections between documents and concepts
- Reduced utility for knowledge navigation

## Previous PERSONA Edge Generation Approach

### Tag-Based Edge Creation
**Format:** `[EDGE_TYPE: Target-Concept]`

**Example CDA Entry:**
```json
{
  "id": "dir-001",
  "title": "Maintain Operational Context",
  "tags": [
    "[IMPLEMENTS: Circular-Logic]",
    "[GUIDED_BY: Zero-Magic]",
    "[RELATED_TO: Context-Preservation]"
  ]
}
```

**Generated Edges:**
- `dir-001 --IMPLEMENTS--> term-circular-logic`
- `dir-001 --GUIDED_BY--> term-zero-magic`
- `dir-001 --RELATED_TO--> term-context-preservation`

### Edge Types Used
- **IMPLEMENTS:** Directive implements a concept
- **GUIDED_BY:** Directive guided by a principle
- **RELATED_TO:** General semantic relationship
- **REQUIRES:** Directive requires another directive
- **ENABLES:** Directive enables a capability

### Why It Worked
- Explicit, human-curated relationships
- Low false-positive rate
- Created rich ontological structure
- ~3,000 edges from 24 directives × ~125 tags each

## Recommended Approach

### Short-Term: Restore Tag-Based Edge Generation
1. Parse CDA directive tags
2. Extract relationship patterns `[TYPE: Target]`
3. Resolve target to lexicon concept ID
4. Create edge with specified type
5. Track stats (edges created per directive)

### Medium-Term: Enhance EXPERIENCE Edge Density
1. Investigate semantic token extraction
2. Verify tokens are matching lexicon
3. Add edge type diversity (CITES, CONTAINS, REFERENCES)
4. Implement WikiLink parsing for explicit citations

### Long-Term: Hybrid Approach
1. Explicit tags (high precision)
2. Semantic matching (high recall)
3. LLM-based relationship extraction (high quality)
4. User feedback loop for validation

## Next Steps

1. **Audit CDA Structure:**
   - Count actual relationship tags in CDA file
   - Identify tag patterns and edge types
   - Verify target concepts exist in lexicon

2. **Re-implement Tag Parser:**
   - Create `parseCdaTags()` function
   - Extract `[TYPE: Target]` patterns
   - Resolve targets to concept IDs
   - Generate edges

3. **Integrate into Ingestion:**
   - Add CDA directive node creation
   - Add tag-based edge generation
   - Track stats (directives ingested, edges created)

4. **Verify Results:**
   - Run ingestion
   - Check for ~3,000 PERSONA edges
   - Verify graph structure in UI

5. **Document Baseline:**
   - Update `ingestion-baseline.json` with expected PERSONA edges
   - Set tolerance for edge count variance
   - Create regression tests

## Questions for Discussion

1. **CDA Directives as Nodes?**
   - Should directives be separate nodes, or just metadata?
   - If nodes: What type? (`directive`, `rule`, `protocol`?)

2. **Edge Type Vocabulary:**
   - Should we standardize edge types?
   - Create edge type registry/enum?

3. **Tag Format:**
   - Keep `[TYPE: Target]` format?
   - Support multiple targets: `[TYPE: A, B, C]`?

4. **Validation:**
   - Warn if target concept doesn't exist?
   - Auto-create missing concepts?
   - Fail ingestion on broken references?

## Success Criteria

**PERSONA Pipeline:**
- ✅ 161 concept nodes
- ✅ 24 directive nodes (if implemented)
- ✅ ~3,000 edges from CDA tags
- ✅ Multiple edge types (IMPLEMENTS, GUIDED_BY, etc.)

**EXPERIENCE Pipeline:**
- ✅ 128 document nodes
- ✅ 384-640 edges (3-5 per doc)
- ✅ Diverse edge types (MENTIONS, CITES, CONTAINS)

**Observability:**
- ✅ Stats tracking at each stage
- ✅ Baseline verification
- ✅ Detailed reports with edge type breakdown
