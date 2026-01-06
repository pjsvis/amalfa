# Debrief: Global Markdown Styles
**Date:** 2025-11-29
**Topic:** CSS Architecture, Simplification


<!-- bento-id: bento-c603e90e -->
<!-- type: section -->
## Lessons Learned



<!-- bento-id: bento-676d8500 -->
<!-- type: section -->
## Accomplishments



<!-- bento-id: bento-2d9d499f -->
<!-- type: section -->
## Problems


<!-- bento-id: bento-ad4e2064 -->
<!-- type: section -->
## Context
The user requested to style heading tags (`h1`, `h2`, etc.) directly instead of using a scoped `.prose` class, as the documentation viewer is the primary context for this content.


<!-- bento-id: bento-f4ec5f57 -->
<!-- type: section -->
## Change
Refactored `public/css/markdown.css`:
1.  Removed `.prose` prefix from all selectors.
2.  Added styles for `h3` and `h4` using the new theme variables.
3.  Ensured `code`, `pre`, `blockquote`, `table`, and lists are also styled globally.


<!-- bento-id: bento-52b8ffce -->
<!-- type: section -->
## Verification
-   **Visual Check:** Verified via screenshot that the "Hi Fi CSS" document renders correctly with the new global styles.
-   **Regression Check:** Confirmed that the sidebar navigation remains unaffected by these global changes.


<!-- bento-id: bento-ec53a8c4 -->
<!-- type: section -->
## Status
Complete.
