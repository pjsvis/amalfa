# 2025 12 08 Sigma Explorer Refactor

---

<!-- bento-id: bento-b3f71920 -->
<!-- type: section -->
date: 2025-12-08
tags: [sigma-explorer, refactoring, visualization, louvain]
---


<!-- bento-id: bento-f7fdfa36 -->
<!-- type: section -->
## Debrief: Sigma Explorer Refactoring & Experience Graph Integration



<!-- bento-id: bento-c603e90e -->
<!-- type: section -->
## Lessons Learned

- **Rule of 300:** adhering to the "under 300 lines" rule is critical for AI-assisted coding. Monolithic files increase the probability of context-window errors and partial replacements.
- **Graphology Nuances:** The `graphology-communities-louvain` library strictly requires a directed or undirected graph instance; it fails on the default mixed type.
- **Component Lifecycle:** When separating logic (e.g., `interactions.js`), explicit state updates (like `this.rightOpen = true`) must be carefully verified to ensuring reactivity across Alpine.js components.


<!-- bento-id: bento-676d8500 -->
<!-- type: section -->
## Accomplishments

- **Modular Architecture Implemented:** Successfully refactored the monolithic `sigma-explorer.js` (which had grown to ~900 lines) into a clean, maintainable module structure within `src/js/components/sigma-explorer/`:
    - `index.js`: State management and initialization.
    - `data.js`: Database interaction.
    - `graph.js`: Graph construction and layout.
    - `viz.js`: Visualization logic (Louvain, PageRank).
    - `interactions.js`: Event handling (UI/UX).
- **Strict Domain Filtering:** Implemented a robust `activeDomain` logic that reconstructs the graph to strictly filter nodes (Persona vs. Experience vs. Unified), preventing "ghost" nodes and ensuring correct physics simulations.
- **Structural Integrity:** Enforced the exclusion of structural nodes (`000-GENESIS`, Domain Roots) from the visual graph while maintaining them in the database.
- **Visual Refinements:**
    - Tuned Louvain filtering to default to "directed" graph mode to fix algorithm errors.
    - Adjusted label visibility thresholds to balance information density ("busy" enough to be informative) with clarity.
    - Restored sidebar interactivity (click-to-open).


<!-- bento-id: bento-2d9d499f -->
<!-- type: section -->
## Problems

- **Complexity Spiral:** The `sigma-explorer.js` file became unmanageable, leading to syntax errors and botched replacements during the session. This necessitated an emergency modular refactoring.
- **Refactoring Regressions:** The split initially caused regressions:
    - The Right Sidebar ceased to open on node click.
    - Graph initialization failed due to incorrect DB pathing (`/ctx.db` vs `/data/ctx.db`).
    - Louvain community detection failed due to default "mixed" graph type in Graphology.
- **Linting Noise:** Large-scale file replacement generated significant linting noise, unrelated to logic, which obscured actual errors.