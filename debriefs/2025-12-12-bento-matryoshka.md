---
date: 2025-12-12
tags: [bento-box, hierarchy, matryoshka, marked]
---

> ⚠️ **DEPRECATED (2026-01-05):** This work was superseded. The Bento Boxing system was never integrated into the main vector search pipeline and has been removed. Whole-document embeddings achieve 85% search accuracy without chunking. See `docs/BENTO_BOXING_DEPRECATION.md` for details.

---

# Debrief: Matryoshka Bento Boxing

## Accomplishments

- **Hierarchical Boxing:** Implemented H3 detection with parent-linking logic (`<!-- parent-id: ... -->`).
- **Semantic Density Heuristic:** Implemented a `measureSection` function that counts words in the section body. Only H3s with > 40 words are promoted to independent boxes. Smaller headers remain part of the H2 container.
- **Context Preservation:** Successfully linked atomic lessons (H3) to their broader category (H2) using invisible metadata.

## Results
- **Files Processed:** 48
- **Boxes Generated:** 302 (vs 294 flat H2s).
- **Gain:** 8 High-Value Atomic Units extracted from dense "Lessons Learned" sections.

## Logic Validated
- **Skipped:** "Attempt 1" (15 words) -> Remained part of parent.
- **Boxed:** "Lesson 1: Source Code is Truth" (58 words) -> Became a node linked to "Lessons Learned".

## Next Steps
- **Ingestion:** The graph ingestion script must now handle `parent-id` to create `HAS_CHILD` or `PART_OF` edges.
