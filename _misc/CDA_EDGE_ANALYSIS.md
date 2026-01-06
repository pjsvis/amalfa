# CDA/PERSONA EDGE GENERATION ANALYSIS

## Current CDA Structure

### Sections: 8
1. Foundational Concepts & Principles
2. CIP: Core Identity & Persona
3. PHI: Processing Philosophy
4. QHD: Query Handling & Dispatch
5. IEP: Interactive Elaboration Protocol
6. COG: Cognitive Strategies
7. ADV: Advanced Interaction Directives
8. OPM: Operational & Meta-Protocols

### Total Entries: 24
### Entries with Tags: 6 (25%)

## Tag Analysis

### Current Tags (All are `Substrate_Issue` type)
```json
[
  {"id": "PHI-5", "tags": ["[Substrate_Issue: Biddability]"]},
  {"id": "PHI-13", "tags": ["[Substrate_Issue: Biddability]"]},
  {"id": "IEP-4", "tags": ["[Substrate_Issue: Biddability]"]},
  {"id": "COG-12", "tags": ["[Substrate_Issue: Reward_Hacking]"]},
  {"id": "ADV-8", "tags": ["[Substrate_Issue: Biddability]", "[Substrate_Issue: Reward_Hacking]"]},
  {"id": "OPM-9", "tags": ["[Substrate_Issue: Biddability]"]}
]
```

**Tag Format:** `[Substrate_Issue: IssueType]`
**Total Tags:** 7 (5 Biddability + 2 Reward_Hacking)

## The Problem

### Expected vs Actual
- **Previous claim:** ~3,000 edges from CDA
- **Actual tags in CDA:** 7 tags
- **Maximum possible edges:** 7 (if all tags resolve to concepts)

### Reality Check
**There never were 3,000 CDA edges.**

Either:
1. The CDA file was much richer in a previous version
2. The 3,000 edges came from a different source
3. The edges were generated differently (not from tags)

## Lexicon Analysis

### Lexicon Concepts: 161
Let me check if these tag targets exist in lexicon...

### Tag Targets
- `Biddability` (appears 5 times)
- `Reward_Hacking` (appears 2 times)

**Question:** Are these in the lexicon as concepts?

## Possible Edge Generation Strategies

### Strategy 1: Tag-Based (Current CDA)
**Input:** 7 tags in CDA
**Output:** 7 edges maximum
**Edge Types:** ADDRESSES, MITIGATES (for Substrate_Issue tags)
**Example:** `PHI-5 --ADDRESSES--> term-biddability`

### Strategy 2: Keyword Matching
**Input:** CDA entry definitions (text content)
**Output:** N edges per entry (depends on lexicon matches)
**Method:** Extract keywords from definitions, match to lexicon concepts
**Example:** "maintain operational context" → matches "Context-Preservation" concept

### Strategy 3: Semantic Similarity
**Input:** CDA entry embeddings + Lexicon concept embeddings
**Output:** Top-K similar concepts per entry
**Method:** Cosine similarity, threshold-based edge creation
**Example:** PHI-5 embedding similar to "Circular-Logic" embedding → create RELATED_TO edge

### Strategy 4: Explicit Relationship Modeling
**Input:** Human-curated relationship matrix
**Output:** Structured edges between directives and concepts
**Method:** Define which directives IMPLEMENT, REQUIRE, ENABLE which concepts
**Example:** Maintain a JSON file with explicit relationships

## Recommendation

### Short-Term: Hybrid Approach
1. **Use existing tags** (7 edges for Substrate_Issue relationships)
2. **Add keyword matching** (extract terms from definitions, match to lexicon)
3. **Estimate:** 24 entries × 5 keyword matches = ~120 edges

### Medium-Term: Enrich CDA
1. Add more relationship tags to CDA entries
2. Use format: `[IMPLEMENTS: Concept-ID]`, `[GUIDED_BY: Concept-ID]`
3. Target: 5-10 tags per entry = 120-240 edges

### Long-Term: Semantic + Explicit
1. Semantic similarity for discovery
2. Human validation for precision
3. Store validated relationships in CDA
4. Maintain high-quality ontology

## Next Steps

1. **Verify lexicon contains tag targets**
   - Check if "Biddability" and "Reward_Hacking" exist as concepts
   
2. **Implement keyword extraction**
   - Parse CDA entry definitions
   - Extract significant terms
   - Match against lexicon concept titles/aliases
   
3. **Create edges from matches**
   - Type: MENTIONS or RELATED_TO
   - Track match confidence
   
4. **Update baseline**
   - Expected PERSONA edges: ~100-150 (not 3,000)
   - Set realistic expectations

## Conclusion

**The 3,000 edge claim was incorrect.**

Current CDA structure supports:
- 7 edges from explicit tags
- ~100-150 edges from keyword matching
- More if we enrich CDA with relationship tags

This is still valuable for creating a connected PERSONA graph, just not as dense as previously claimed.
