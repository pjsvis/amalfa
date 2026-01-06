---
date: 2025-12-01
tags: [graph, data, semantic-edges]
---

# Debrief: Semantic Edge Generation


## Lessons Learned

- **Lesson 1:** **Labels vs. Usage:** Terms are rarely used with their full formal labels in natural text. "Conceptual Stuff" is referred to as "stuff". Keyword matching is essential for semantic linking.
- **Lesson 2:** **Stop Words are Critical:** Without filtering "the", "and", "system", the graph would be a complete clique (everything connected to everything).

## Next Steps

- **Visual Filtering:** The user intends to "hide" these edges by setting their color to the background. This will require a frontend update to map `relation='semantic'` to a specific color variable.

## Accomplishments

- **Implemented Semantic Edge Generation:** Modified `scripts/build_db.ts` to scan node definitions for keywords from other nodes.
- **Keyword Matching Strategy:** Implemented a dual-strategy matching:
    1.  **Exact Match:** Checks if the full label (e.g., "Conceptual Stuff") exists in the definition.
    2.  **Keyword Match:** Splits labels into words, filters stop words (e.g., "the", "system"), and checks if any significant keyword exists in the definition.
- **Generated 3200 Edges:** This significantly increased the graph density (approx 17 edges/node), creating the desired "hairball" structure for analysis.
- **Automated Deployment:** Added a step to copy the generated `ctx.db` to `public/data/ctx.db` so the frontend picks it up immediately.

## Problems

- **Problem 1:** Initial exact matching yielded very few edges (48).
    - **Resolution:** Relaxed the matching to check for individual keywords (e.g., matching "Stuff" from "Conceptual Stuff"). This exploded the edge count to 3200.