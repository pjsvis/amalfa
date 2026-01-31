# Debrief: Heading Font Size Adjustment
**Date:** 2025-11-29
**Topic:** Typography, Readability

## Lessons Learned


## Accomplishments


## Problems

## Context
The user noted that H1 and H2 headings were "far too big," disrupting the reading flow. We aimed to align with Tufte's principle of "clear structural definition" without excessive scale.

## Change
1.  **Defined Variables:** Added `--font-size-h1` through `--font-size-h4` in `src/css/layers/theme.css`, mapping them to `2xl`, `xl`, `lg`, and `base` respectively.
2.  **Applied Variables:** Updated `public/css/markdown.css` to use these new variables for `.prose h1` and `.prose h2`.

## Verification
-   **Visual Check:** Verified via screenshot that the headings in "Conceptual Lexicon" are now significantly more restrained and balanced relative to the body text.

## Status
Complete.
