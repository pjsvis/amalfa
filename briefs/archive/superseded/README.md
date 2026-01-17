# Archive: Superseded Briefs

These briefs were superseded by later work or are no longer relevant due to implementation changes.

## Vector Reranking
- **brief-vector-reranking.md** (archived 2026-01-17)
  - **Original goal:** Implement BGE-M3 reranker
  - **What happened:** Implemented BGE base instead (lighter, faster)
  - **Superseded by:** 
    - `briefs/archive/2026-01-17-reranking/` (investigation & implementation)
    - `debriefs/2026-01-17-reranker-implementation-debrief.md`
  - **Outcome:** Cross-encoder reranking fully operational with BGE base
  - **Why different:** BGE base sufficient for needs, avoided larger model overhead

This brief is preserved for historical context but the approach was modified during implementation.
