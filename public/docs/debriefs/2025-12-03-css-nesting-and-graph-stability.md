---
date: 2025-12-03
tags: [css, nesting, graphology, louvain, refactor]
---

# Debrief: CSS Nesting & Graph Stability


## Lessons Learned

- **Locality of Behavior is Critical:** Nesting CSS media queries immediately highlighted how scattered the previous responsive logic was. The code is now much easier to reason about.
- **Deterministic Randomness:** For data visualization, "random" initial positions should always be seeded or hashed to ensure reproducibility. Users lose trust if the data looks different every time they refresh.
- **Don't Expose Tuning Knobs:** Complex parameters like Louvain resolution are better handled as "curated defaults" by the engineer rather than exposed as confusing sliders to the user.

## Accomplishments

- **CSS Nesting Adoption:** Successfully refactored `layout.css`, `components.css`, and `graph.css` to use native CSS nesting. This significantly improved the "Locality of Behavior" by co-locating media queries and state modifiers (hover/focus) with their parent selectors.
- **Graph Layout Stability:** Solved the issue of the graph "shape-shifting" on reload by replacing `Math.random()` with a deterministic hash of the Node ID for initial coordinate assignment.
- **Color Stability:** Solved the issue of communities swapping colors on reload by adding a deterministic tie-breaker (ID comparison) to the community sorting logic.
- **Community Count Optimization:** Tuned the Louvain resolution to `1.1` to target Miller's Law ($7 \pm 2$ communities), resulting in a stable set of ~5 distinct communities for the current dataset.
- **Documentation:** Updated `graphology-playbook.md` with the new tuning and stability strategies, and created `public/docs/css-nesting.md` to document the architectural decision.

## Problems

- **Louvain Sensitivity:** The Louvain algorithm is sensitive to resolution. The default `1.0` produced 4-6 communities, while `1.3` produced too many (~15). `1.1` was found to be the sweet spot for this specific dataset.
- **Browser Subagent Verification:** Initial attempts to verify community counts failed because the subagent didn't account for the toggle state of the "Louvain Communities" button (clicking it when it was already active turned it off). This required a retry with a cleaner state.