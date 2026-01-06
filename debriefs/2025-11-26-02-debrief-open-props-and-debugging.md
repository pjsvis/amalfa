# Debrief: Open Props & Interaction Debugging

**Date:** 2025-11-26
**Focus:** Design System Refactor, Complex Interaction Debugging, UX Polish

## 1. Overview
This session focused on maturing the frontend architecture by adopting **Open Props** for consistent theming and resolving a critical "click-drag interference" bug that affected Mac users. We also refined the visual feedback for graph interactions.

## 2. Key Decisions

### A. Adopting Open Props
We replaced ad-hoc "magic numbers" (hex codes, pixel values) with semantic variables from Open Props.
-   **Why:** To ensure design consistency and make future theming (e.g., Dark Mode) trivial.
-   **Implementation:** Mapped `--primary` to `var(--gray-9)` and used Open Props colors for the Louvain community detection.

### B. The "Native Interception" Fix
We faced a persistent issue where clicking a node on a Mac Magic Mouse/Trackpad would trigger a "micro-drag," cancelling the click event.
-   **Failed Attempts:** Disabling `mouseEnabled` on `enterNode` (too late), stopping propagation on `downNode` (Sigma event, not native).
-   **The Solution:** We attached a **native `mousedown` listener** to the container with `{ capture: true }`.
-   **Logic:** If the mouse is over a node, we `stopPropagation()` immediately. This prevents the event from ever reaching the camera controller, guaranteeing that a click remains a click.

### C. Visual Feedback (Cursors & Contrast)
-   **Cursors:** Implemented `grab` (default) vs `grabbing` (drag) to clearly indicate state.
-   **Contrast:** Forced `color: white !important` on active buttons to resolve a "black on black" visibility issue caused by variable resolution quirks.

## 3. Lessons Learned

### "Variable Reduction" (The Disablement Pattern)
When debugging complex UI interactions, "tweaking" parameters is often insufficient. The most effective strategy was to **aggressively disable** unrelated features (e.g., the hover renderer, the drag controller) to isolate the signal. Once the core interaction (the click) was working, we re-enabled features one by one.

### Library Abstractions vs. Native Events
Libraries like Sigma.js abstract away the DOM. When those abstractions fight you (e.g., unwanted drag behavior), dropping down to the **native DOM level** (specifically the `capture` phase) is often the cleanest way to regain control.

## 4. Next Steps
-   Monitor the "Native Interception" fix for any side effects.
-   Continue refining the UI using the new Open Props system.
