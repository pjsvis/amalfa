# Amalfa Technical Debt & Improvement Backlog

This file captures issues surfaced during code reviews. Items are recorded here for triage and planning—**not immediate action**.

---

## Discovery Log

### 2026-01-09: Core Module Review

#### 1. LouvainGate Threshold Hardcoded
- **File:** `src/core/LouvainGate.ts`
- **Issue:** Super-node threshold is hardcoded at 50. Should be configurable.
- **Impact:** Users with large graphs may need higher thresholds; small projects lower.
- **Suggested Fix:** 
  - Add `graph.tuning.louvain.superNodeThreshold` to config schema
  - Read from config in LouvainGate.check()
- **Priority:** Low (works fine for most cases)

#### 2. LouvainGate Rejection Metrics Not Tracked
- **File:** `src/core/LouvainGate.ts`, `src/core/EdgeWeaver.ts`
- **Issue:** Edges rejected by LouvainGate are logged to console but not tracked in stats.
- **Impact:** No visibility into graph health or centralization issues.
- **Suggested Fix:**
  - Add `louvainGate.rejected`, `louvainGate.superNodes` to StatsTracker
  - Surface in `amalfa stats` output
- **Priority:** Medium (useful for Gardener intelligence)

---

## Backlog Format

When adding new items, use this template:

```markdown
#### [Short Title]
- **File:** `path/to/file.ts`
- **Issue:** What's wrong or missing
- **Impact:** Why it matters
- **Suggested Fix:** High-level approach
- **Priority:** Low | Medium | High | Critical
```

---

## Triage Notes

_To be filled after discovery phase is complete._

---

## Completed Items

_Moved here after fix is verified._
