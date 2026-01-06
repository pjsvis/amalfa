# Debrief: CSS Lint & Hygiene Sprint

**Date:** 2025-12-07
**Participants:** User, Antigravity

## Lessons Learned
*   **Biome CSS Suppression:** `/* biome-ignore */` comments are strict about placement. For multi-line properties (like gradients), the ignore comment must precede the property key, not reside inside the value block.
*   **Specificity & Order:** The `noDescendingSpecificity` lint is a useful heuristic for detecting ordering bugs, but often flags valid "Generic vs Contextual" patterns. The fix is usually to strictly physically order rules by specificity (Low -> High) or move overrides to the absolute bottom of the file.
*   **Zero Lint vs. Progressive Enhancement:** Modern CSS features (like `contrast-color()`) may not be recognized by current linters. A "Zero Lint" policy requires explicit suppression for these valid forward-looking patterns, rather than abandoning the feature.

## Accomplishments
*   **Audit & Chunking:** Divided the lint errors into structural utilities, layout overrides, and component styles.
*   **Refactoring:**
    *   **Utilities (`utilities.css`):** Removed `!important` from stack primitives; suppressed valid debug utility usage properly.
    *   **Markdown (`public/css/markdown.css`):** Removed `!important` from card resets, relying on natural cascade.
    *   **Layout (`layout.css`):** Moved `.home-layout` overrides to the end of the file to resolve `noDescendingSpecificity` warnings and removed `!important` from `#right-sidebar-override` rules.
    *   **Components (`components.css`):** Removed `!important` from `.home-subtitle`; Added Biome suppressions for `contrast-color()` fallback patterns (progressive enhancement).
*   **Configuration:** Updated `.biomeignore` to exclude build artifacts (`public/css/app.css`) to prevent false positives from generated code.

*   **Zero Lint State:** `bun x biome check src/css` now returns **zero errors** and **zero warnings**.
*   **Structural Integrity:** The CSS architecture now relies on cascade and specificity rather than brute-force overrides, making it more predictable and maintainable.

## 4. Next Steps
*   **QA & Polish:** Address the visual regressions and UI refinements identified in `_CURRENT_TASK.md` (Nav bar contrast, H1 headings in debriefs, Wiki-links).

## Problems

## 1. Context
Following the legacy cleanup, the project carried a debt of ~250 CSS lint errors, primarily flagged by Biome as `noImportantStyles`. These indicated a reliance on `!important` to force overrides (`utilities.css`, `layout.css`), creating brittle and hard-to-maintain styles. The goal was to achieve a "Zero Lint" state for CSS source files.
