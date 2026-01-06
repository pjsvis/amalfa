# Debrief: CSS Isolation for Sigma Explorer
**Date:** 2025-11-29
**Topic:** Tailwind v4, CSS Layers, Component Isolation

## Context
The goal was to isolate the `sigma-explorer` graph component from the main application theme. Specifically, we needed the graph background to remain a fixed light gray (`#e5e7eb`) regardless of whether the app was in light or dark mode, while the surrounding UI (sidebars) respected the theme.

## The Challenge
We attempted to use CSS Cascade Layers (`@layer graph`) to encapsulate the styles. However, we encountered a persistent issue where the styles defined in `graph.css` (specifically the background color) were not being applied to the elements, resulting in transparency.

## The Breakthrough: Isolation Testing
We were stuck debugging the complex `app.css` bundle. The user proposed a strategy: **"Create a test HTML file using all of our dependencies... build the page up... add styles one at a time."**

1.  **Isolation Test Page**: We created `public/isolation-test.html` and a minimal `src/css/test-isolation.css`.
2.  **Minimal Bundle**: We bundled *only* `graph.css` into `test-isolation.css`.
3.  **Result**: The styles worked perfectly in isolation.
4.  **Conclusion**: The code in `graph.css` was correct. The issue was the *integration* into `main.css`.

## The Fix
The issue was identified as a specificity/bundling quirk with Tailwind v4 when nesting imports inside layers.
-   **Broken**: `@import "./layers/graph.css" layer(graph);` inside `main.css`.
-   **Fixed**: `@import "./layers/graph.css";` (Direct import).

## Lessons Learned
1.  **The Isolation Test Pattern**: When a component fails in the main app, don't just stare at the inspector. Create a minimal reproduction (a "clean room") to verify the component's internal logic. If it works there, the bug is in the integration.
2.  **Tailwind v4 Imports**: Be careful with double-wrapping layers. Importing a file that already has `@layer` directives inside another `@layer` block can lead to styles being dropped or de-prioritized unexpectedly.

## Artifacts Updated
-   `src/css/layers/graph.css` (Refactored for isolation)
-   `src/css/main.css` (Fixed import)
-   `playbooks/tailwind-v4-playbook.md` (Updated with import strategy)
-   `playbooks/problem-solving-playbook.md` (Added Isolation Test pattern)
