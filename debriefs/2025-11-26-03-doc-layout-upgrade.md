# Debrief: Documentation Layout Upgrade

**Date:** 2025-11-26
**Topic:** Documentation Layout, Sidenotes, and "Green Phosphor" Styling

## 1. Context
The goal was to upgrade the documentation layout to a "Tri-Pane Structural Grid" with academic-style sidenotes, moving away from a standard single-column layout. We also aimed to implement a "Green Phosphor" aesthetic for code blocks.

## 2. What Went Well
*   **Grid Layout:** Moving to CSS Grid for the main layout (`public/docs/index.html`) provided a solid foundation for independent scrolling of the sidebar and content.
*   **Green Phosphor Style:** The switch to a black background with bright green text (`#33ff00`) and a subtle text shadow for code blocks was a quick and effective visual win, aligning with the "Terminal" aesthetic.
*   **Code Block Contrast Fix:** We identified and fixed a specificity issue where inline code styles were bleeding into preformatted blocks.

## 3. What Went Wrong (and how we fixed it)
*   **The Sidenote Trap:**
    *   *Initial Attempt:* We tried a 3-column grid (Sidebar | Content | Margin). This failed because `overflow-y-auto` on the middle column clipped the sidenotes (the "Overflow Trap").
    *   *Second Attempt:* We merged the content and margin into one wide column and used `position: relative` on the prose container. This worked technically but led to "in flow" confusion on smaller screens (laptops).
    *   *Final Decision:* We reverted to **Inline Callouts**.
    *   *Lesson:* "Sidenotes" are often a print-design artifact that fights against the fluid nature of the web. Unless you have a very specific constraint-solver (like Tufte CSS), simple inline blocks are more robust and readable across devices.

## 4. Action Items
*   [ ] Update `playbooks/css-playbook.md` with the "Green Phosphor" code block standard.
*   [ ] Update `playbooks/css-playbook.md` with a warning about the "Sidenote/Overflow Trap".

## 5. Artifacts
*   **Archived Brief:** `briefs/archive/brief-doc-layout-upgrade.md`
*   **New Test Page:** `public/docs/layout-test.md`
