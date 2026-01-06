# Debrief: Documentation Layout Upgrade

**Date:** 2025-11-26
**Topic:** Documentation Layout, Sidenotes, and "Green Phosphor" Styling


<!-- bento-id: bento-c603e90e -->
<!-- type: section -->
## Lessons Learned



<!-- bento-id: bento-676d8500 -->
<!-- type: section -->
## Accomplishments



<!-- bento-id: bento-2d9d499f -->
<!-- type: section -->
## Problems


<!-- bento-id: bento-55ef1dc3 -->
<!-- type: section -->
## 1. Context
The goal was to upgrade the documentation layout to a "Tri-Pane Structural Grid" with academic-style sidenotes, moving away from a standard single-column layout. We also aimed to implement a "Green Phosphor" aesthetic for code blocks.


<!-- bento-id: bento-419902e3 -->
<!-- type: section -->
## 2. What Went Well
*   **Grid Layout:** Moving to CSS Grid for the main layout (`public/docs/index.html`) provided a solid foundation for independent scrolling of the sidebar and content.
*   **Green Phosphor Style:** The switch to a black background with bright green text (`#33ff00`) and a subtle text shadow for code blocks was a quick and effective visual win, aligning with the "Terminal" aesthetic.
*   **Code Block Contrast Fix:** We identified and fixed a specificity issue where inline code styles were bleeding into preformatted blocks.


<!-- bento-id: bento-9cb24665 -->
<!-- type: section -->
## 3. What Went Wrong (and how we fixed it)
*   **The Sidenote Trap:**
    *   *Initial Attempt:* We tried a 3-column grid (Sidebar | Content | Margin). This failed because `overflow-y-auto` on the middle column clipped the sidenotes (the "Overflow Trap").
    *   *Second Attempt:* We merged the content and margin into one wide column and used `position: relative` on the prose container. This worked technically but led to "in flow" confusion on smaller screens (laptops).
    *   *Final Decision:* We reverted to **Inline Callouts**.
    *   *Lesson:* "Sidenotes" are often a print-design artifact that fights against the fluid nature of the web. Unless you have a very specific constraint-solver (like Tufte CSS), simple inline blocks are more robust and readable across devices.


<!-- bento-id: bento-f9d5de54 -->
<!-- type: section -->
## 4. Action Items
*   [ ] Update `playbooks/css-playbook.md` with the "Green Phosphor" code block standard.
*   [ ] Update `playbooks/css-playbook.md` with a warning about the "Sidenote/Overflow Trap".


<!-- bento-id: bento-189c77a9 -->
<!-- type: section -->
## 5. Artifacts
*   **Archived Brief:** `briefs/archive/brief-doc-layout-upgrade.md`
*   **New Test Page:** `public/docs/layout-test.md`
