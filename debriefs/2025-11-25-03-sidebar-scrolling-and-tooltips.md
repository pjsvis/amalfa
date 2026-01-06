---
date: 2025-11-25
tags: [ui, css, alpinejs, refactor, regression]
---

# Debrief: Sidebar Scrolling and Tooltip Fixes

## Accomplishments

- **Sidebar Scrolling:** Successfully enabled `overflow-y: auto` on both sidebars, allowing for content expansion on smaller screens (tablets).
- **Global Tooltips:** Implemented a robust, JavaScript-based tooltip system using Alpine.js. This solved the clipping issue caused by the scrollable sidebars.
- **Color Refinement:** Updated the global color palette to a softer "Off-Black" (`#070709`) and "Pure White" (`#fff`), improving visual comfort.
- **Brief Management:** Created a new brief for "Wikipedia Links", archived completed briefs, and updated the `debriefs-playbook.md` with a post-debrief checklist.

## Problems

- **Regression (Hidden Reversion):** The initial attempt to refactor tooltips (which was reverted) inadvertently broke the "Node Details" functionality. This was a classic case of "fixing one thing, breaking another."
- **Z-Index Clipping:** Simply adding `overflow-y: auto` to the sidebar caused the original CSS-only tooltips to be clipped. This necessitated the move to a global, fixed-position tooltip system.

## Lessons Learned

- **CSS Context Stacking:** When you make a container scrollable (`overflow: auto`), it creates a new stacking context. Absolute positioning inside it is relative to *that* context, not the viewport. To break out, you *must* use `fixed` positioning or move the element up the DOM tree.
- **Revert First, Fix Later:** When a regression is found, the safest move is often to revert to a known good state before attempting a forward fix. This isolates the variable.
- **Playbook Discipline:** Updating the playbooks *during* the work (as we did with the archiving step) keeps the process living and accurate.

## Next Steps

- **Wikipedia Links:** Implement the "External Link" feature as per the new brief.
- **PR:** Merge the `alpine-refactor` branch.
