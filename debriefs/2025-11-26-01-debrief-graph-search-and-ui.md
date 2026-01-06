# Debrief: Graph Search & UI Refinements

**Date:** 2025-11-26
**Topic:** Implementing Graph Search and Refining Sigma UI

## Objectives
1.  Implement a search feature for the graph.
2.  Improve click reliability ("sticky clicks").
3.  Refine visual presentation (node sizes, label clutter).

## Key Decisions

### 1. Smart Autocomplete
Instead of a blank search box, we implemented "Smart Autocomplete".
-   **On Focus:** Immediately suggests the top 5 "Core Concepts" (largest nodes).
-   **Why:** Solves the "blank page syndrome" where users don't know what to search for.

### 2. Hover-Click Fallback (The "Sticky Click" Fix)
We encountered an issue where clicking a node would sometimes fail (hit detection miss) or immediately deselect it.
-   **Solution:** We track the `hoveredNode` state (updated by `enterNode`).
-   **Logic:** In the `clickStage` handler (background click), we check if `hoveredNode` is set. If so, we select it instead of deselecting everything.
-   **Result:** If the user sees the label/pointer, the click *will* work, regardless of precise pixel accuracy.

### 3. Label Clutter Control
The graph was too noisy with text.
-   **Solution:** Used `labelRenderedSizeThreshold: 8`.
-   **Result:** Standard nodes (6px) hide labels by default. Core nodes (20px) show them. Zooming in reveals the smaller labels naturally.

### 4. Pre-Render Visualization
We initially had a "jarring" flash where the graph loaded in gray, then switched to colors.
-   **Solution:** Moved the `toggleColorViz` and `toggleSizeViz` logic to run *before* the `new Sigma()` renderer instantiation.
-   **Result:** The graph renders instantly in its final state.

## Lessons Learned
-   **Sigma Hit Detection:** Can be finicky. The "Hover-Click Fallback" pattern is a robust workaround.
-   **Visual Hierarchy:** Hiding labels for small nodes is essential for clean graphs.
-   **User Guidance:** Empty states (like search) should provide immediate value/suggestions.

### 5. Layout Overflow (The Tailwind Paradox)
The documentation page had a footer that pushed the page height beyond 100vh, causing a double scrollbar.
-   **Solution:** Moved the footer *inside* the scrollable `<main>` container.
-   **Result:** The page body is strictly 100vh, and the footer scrolls naturally with the content.
