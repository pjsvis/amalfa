# Debrief: Heading Font Size Adjustment
**Date:** 2025-11-29
**Topic:** Typography, Readability


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
The user noted that H1 and H2 headings were "far too big," disrupting the reading flow. We aimed to align with Tufte's principle of "clear structural definition" without excessive scale.


<!-- bento-id: bento-f4ec5f57 -->
<!-- type: section -->
## Change
1.  **Defined Variables:** Added `--font-size-h1` through `--font-size-h4` in `src/css/layers/theme.css`, mapping them to `2xl`, `xl`, `lg`, and `base` respectively.
2.  **Applied Variables:** Updated `public/css/markdown.css` to use these new variables for `.prose h1` and `.prose h2`.


<!-- bento-id: bento-52b8ffce -->
<!-- type: section -->
## Verification
-   **Visual Check:** Verified via screenshot that the headings in "Conceptual Lexicon" are now significantly more restrained and balanced relative to the body text.


<!-- bento-id: bento-ec53a8c4 -->
<!-- type: section -->
## Status
Complete.
