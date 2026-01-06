# PERSONA PIPELINE ISSUES - SUMMARY

## Issue 1: CDA Tags Reference Non-Existent Concepts

### The Problem
- CDA has 7 tags referencing: `Biddability`, `Reward_Hacking`
- Lexicon has 161 concepts
- **NONE of the tag targets exist in the lexicon**

### Impact
- 0 edges can be created from CDA tags
- Tags are broken references
- PERSONA graph remains empty

### Solution Options
1. **Add missing concepts to lexicon** (Biddability, Reward_Hacking)
2. **Update CDA tags to reference existing concepts**
3. **Use keyword matching instead of explicit tags**

## Issue 2: Minimal Tag Coverage

### The Problem
- Only 6 of 24 CDA entries have tags (25%)
- Only 7 total tags across entire CDA
- Previous claim of "3,000 edges" was incorrect

### Reality
- Maximum possible edges from current tags: 0 (broken references)
- If tags were fixed: 7 edges maximum
- This is NOT enough for a useful graph

### Solution
- Implement keyword-based edge generation
- Extract terms from CDA entry definitions
- Match against lexicon concepts
- Expected: ~100-150 edges

## Issue 3: No CDA Directive Nodes

### The Problem
- CDA has 24 directives
- 0 directive nodes in database
- Only lexicon concepts are ingested

### Impact
- Can't create edges TO directives
- Can't visualize directive relationships
- PERSONA graph is incomplete

### Solution
- Ingest CDA directives as nodes (type: `directive`)
- Create edges FROM directives TO concepts
- Enable full PERSONA graph structure

## Recommended Approach

### Phase 1: Fix Immediate Issues
1. Ingest CDA directives as nodes (24 nodes)
2. Implement keyword extraction from definitions
3. Match keywords to lexicon concepts
4. Create MENTIONS/RELATED_TO edges

**Expected Output:**
- 161 concept nodes
- 24 directive nodes
- ~100-150 edges (keyword-based)

### Phase 2: Enrich CDA (Future)
1. Add proper relationship tags to CDA entries
2. Use format: `[IMPLEMENTS: Concept-ID]`
3. Ensure tag targets exist in lexicon
4. Target: 5-10 tags per entry = 120-240 edges

### Phase 3: Semantic Enhancement (Future)
1. Use embeddings for similarity-based edges
2. LLM-based relationship extraction
3. User validation workflow
4. Maintain high-quality ontology

## Updated Baseline Expectations

### PERSONA Domain (Realistic)
- **Nodes:** 185 (161 concepts + 24 directives)
- **Edges:** 100-150 (keyword-based matching)
- **Edge Types:** MENTIONS, RELATED_TO, ADDRESSES

### NOT 3,000 Edges
The previous claim was based on incorrect assumptions about CDA structure.

## Next Actions

1. **Implement CDA directive ingestion**
2. **Implement keyword extraction and matching**
3. **Update baseline with realistic expectations**
4. **Verify in UI**
