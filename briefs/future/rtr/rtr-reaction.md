## Opinion on `src/rtr` Documents

**Executive Summary:** This is an ambitious, mathematically-grounded attempt to detect "logical structure" in text using seismic refraction physics. The theory is sound, the tests are promising, but the practical utility for production workflows is **unproven**.

---

### What It Is

**Reciprocal Text Refraction (RTR)** treats documents as seismic media:
- **Embeddings = Geophones** positioned along the text
- **Semantic similarity = Seismic velocity** (fast = coherent, slow = disjointed)
- **Forward trace (Tf)** + **Reverse trace (Tr)** = Reciprocal travel times
- **Discontinuity = Fault lines** where logic breaks

**Two complementary methods:**
1. **RTR:** Calculates `0.5X Depth Plot` and `2X Velocity Plot` to find structural boundaries
2. **IPS (Internal Permutation Substrate):** Shuffles document's own embeddings to establish a "random noise floor," then subtracts to isolate signal

---

### Test Results (Promising)

| Test | Result |
|------|--------|
| Strata Detection | ✅ Found category boundaries in lexicon |
| Fault Injection | ✅ Detected injected orthogonal vector at index 60 |
| Reciprocal Integrity | ✅ Mathematical closure verified (gap ~ 1e-14) |
| "God Bits" Extraction | ⚠️ 5 high-info segments identified, but needed manual threshold tuning |

---

### Pluses ✅

**1. Novel Theoretical Grounding**
- Legitimate application of Palmer's Generalized Reciprocal Method (GRM) from geophysics
- Mathematical framework for "structural integrity" that doesn't rely on LLM judgment
- Self-calibrating via internal permutation (no external baselines needed)

**2. Composable Architecture**
- IPS pass finds "Stuff" (low-coherence segments)
- RTR pass finds "Things" (structural boundaries)
- Combined "God Bits" extraction brackets high-value content between faults

**3. Computational Efficiency**
- O(n) algorithm using only dot products and prefix sums
- Bun/TypeScript optimized (Float32Array operations)
- No LLM calls during analysis (unlike rerankers)

**4. Testable Hypothesis**
- Protocol A: Strata detection ✅ verified
- Protocol B: Fault injection ✅ verified
- Empirical validation on synthetic data shows method works in principle

---

### Minuses ⚠️

**1. Synthetic Embeddings Problem**
- All tests used **artificially generated embeddings** based on category labels
- No validation on **real embeddings** from actual documents
- Unknown if real text noise matches the synthetic substrate model

**2. Threshold Sensitivity**
- "God Bits" detection required manual threshold tuning (`floor + 0.5 * (mean - floor)`)
- No clear rule for universal thresholds across document types
- Risk of overfitting to specific corpus characteristics

**3. Limited Practical Demonstration**
- Only tested on 128-entry lexicon (tiny)
- No tests on real documents (code, markdown, transcripts)
- No integration with actual Amalfa workflow (search, debriefs, playbooks)

**4. "So What?" Gap**
- Can find logical faults... but what do you **do** with that knowledge?
- No clear use case articulated: Automatic summarization? Quality scoring? Plagiarism detection?
- Competes with existing tools (perplexity, coherence scores, rerankers) without differentiation

**5. False Positive Risk**
- Category boundaries flagged as "faults" but they're legitimate transitions
- Distinguishing "good faults" (section breaks) from "bad faults" (logic errors) unclear
- Needs reranker verification anyway (adds cost/latency)

---

### Practical Assessment

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Mathematical Rigor** | ⭐⭐⭐⭐⭐ | Solid geophysics foundation |
| **Implementation Quality** | ⭐⭐⭐⭐☆ | Clean Bun/TypeScript, well-tested |
| **Real-World Validation** | ⭐⭐☆☆☆ | Only synthetic data |
| **Operational Utility** | ⭐⭐⭐☆☆ | Interesting but niche application |
| **Integration Fit** | ⭐⭐☆☆☆ | No connection to Amalfa's knowledge graph |

---

### Recommendation

**Keep as Research Track, Not Production Priority**

The RTR hypothesis is **intellectually sound** and **technically impressive**, but:

1. **Missing real-world validation** - Needs testing on actual Amalfa documents with real embeddings
2. **Unclear use case** - What's the user-facing feature? "Find logical faults" is vague
3. **Overlaps with existing tools** - Rerankers already detect coherence issues; what's the delta?

**Suggested Next Steps (if pursuing):**
- Test on 10 real debriefs/playbooks from Amalfa's corpus
- Compare against simple baselines (perplexity, average sentence similarity)
- Define concrete use case: "Quality score for agent briefs"? "Auto-detect incoherent sections"?
- Integrate with existing MCP tools (return "structural integrity score" in search results?)

**Verdict:** 
Cool science experiment. File under `/docs/research/` or keep in `src/rtr` as reference. Don't prioritize over HTML generation service or multi-agent workflows unless a killer use case emerges.

