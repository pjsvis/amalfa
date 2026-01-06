# Scratchpad: TOC Generation Debugging

## Problem
The Table of Contents (TOC) for `public/docs/hi-fi-css.md` only shows the document title. Other headings are missing.

## Target File
`public/docs/hi-fi-css.md`

## Hypotheses
1.  **Header Levels**: The file might use `h1` or `h4+` which are not captured by `querySelectorAll('h2, h3')`.
2.  **Parsing Timing**: `generateToC` might run before the DOM is fully updated (though `$nextTick` should prevent this).
3.  **Marked Config**: The custom renderer might be malformed.

## Investigation Log
-   [x] Inspect `hi-fi-css.md` content.
    -   **Finding**: File uses `h1`, `h2`, `h3`, and **many `h4`** headers.
-   [x] Inspect `doc-viewer.js`.
    -   **Finding**: `generateToC` only queries `h2, h3`.
-   [x] Inspect rendered DOM in Browser.
    -   **Confirmed**: `h4` elements exist but are ignored.
-   [x] Fix: Add `h4` to `querySelectorAll`.
    -   **Action**: Updated `doc-viewer.js` to query `h2, h3, h4`.
-   [ ] **Re-Investigation**: User reports TOC still empty.
    -   **Hypothesis 1**: `marked` renderer issue with bold tags `**` in headers?
    -   **Hypothesis 2**: `generateToC` timing (DOM not ready)?
    -   **Action**: Inspect `#main-content` HTML and Alpine `$data.toc`.
    -   **Result**: Programmatic test confirmed `h4`s are present (6 count) and `toc` array is populated (39 items).
    -   **Conclusion**: The fix works. User might be seeing cached state.
