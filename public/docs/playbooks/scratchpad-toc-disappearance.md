# Scratchpad: TOC Disappearance Investigation

## Problem
The Table of Contents (TOC) for `hi-fi-css.md` (and potentially others) has become invisible or empty after changing the font size from `text-sm` to `text-base`.

## Context
- **Previous Change**: Increased vertical padding (`py-1` -> `py-1.5`) and font size (`text-sm` -> `text-base`).
- **User Report**: "now there is nothing visible in the outline".
- **Previous Issue**: `Alpine Warning: x-for ":key" is undefined` (Fixed by ensuring unique IDs).

## Hypotheses
1.  **CSS Overflow/Visibility**: The larger text might be pushing content out of a constrained container, or `truncate` is hiding everything if the width is too small.
2.  **Alpine.js Crash**: The previous fix for IDs might have introduced a syntax error or logic error that crashes the Alpine component, preventing rendering.
3.  **Data Binding**: The `toc` array might be empty despite the ID fix.

## Experiment Plan (Variable Reduction)
1.  **Revert Font Size**: Temporarily revert `text-base` to `text-sm` to see if visibility returns. (Isolates CSS vs Logic).
2.  **Console Logging**: Add aggressive logging in `doc-viewer.js` to confirm `toc` array population and Alpine lifecycle hooks.
3.  **Inspect DOM**: Use browser tool (if stable) or `view_file` to check if the `<a>` tags exist in the DOM but are hidden.

## Action Log
- [ ] Create Scratchpad.
- [ ] Propose Plan.
