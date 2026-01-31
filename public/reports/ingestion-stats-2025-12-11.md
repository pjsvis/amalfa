# Resonance Ingestion Stats & Analysis

**Date:** 2025-12-11
**Version:** 0.1.0

## 1. Performance Benchmark (RTZ Test)
Full ingestion of the current knowledge base (Clean DB start).

## 1. Performance Overview
- **Total Load:** 199 KB
- **Files Processed:** 81
- **Time Taken:** ~7.5 seconds
- **Throughput:** ~27,200 chars/sec
- **Nodes/Sec:** 10.8

## 2. Database Stats
- **Nodes:** 81
- **Vectors:** 81
- **Edges:** 44 (Success! Up from 0)
- **Semantic Tagged:** 81

### Scaling Projections
Based on current throughput (linear scaling assumption):

| Scale | Volume | Est. Time | Feasibility |
| :--- | :--- | :--- | :--- |
| **Current** | ~200 KB | ~7s | ✅ Instant |
| **10x** | 2 MB | ~70s | ✅ Fast |
| **100x** | 20 MB | ~11.6 min | ⚠️ Acceptable (CI/CD) |
| **1000x** | 200 MB | ~2 hours | ❌ Needs Optimization |

**Conclusion:** The current architecture (Bun + SQLite + FAFCAS) is highly performant for the target scale of personal/team knowledge bases (< 100MB).

---

## 2. Semantic Token Analysis
**Tool:** `compromise` (Rule-based NLP)
**Status:** Integrated, untuned.

### Current Observations
*   **False Positives:** High rate of detecting numbered lists (`1.`, `2.`) and CSS units (`1200px`) as "Money".
*   **Missed Entities:** Technical terms (e.g., "SQLite", "Embeddings") are not recognized as distinctive entities by the default model.
*   **Successes:** Good recognition of capitalized phrases ("Inclusive Design", "Standard Library") as Organizations/Topics.

### Action Plan
1.  **Tune Extractors:** Disable the `money` extractor or refine its regex to exclude list items.
2.  **Inject Vocabulary:** Load `docs/domain-vocabulary-draft.md` (or JSON equivalent) into `TokenizerService` to recognize project-specific terms.
3.  **Filter Noise:** Implement a post-processing step to filter out extracted tokens < 3 characters or purely numeric.
