# Brief: CSS Lint & Hygiene Sprint

**Status:** Proposed
**Owner:** Antigravity / User
**Goal:** Achieve a "Zero Lint" state for CSS by resolving structural issues (specificity hacks, `!important`) identified by the new Biome toolchain.

## 1. Context
Following the removal of legacy code, the project has a cleaner file structure but carries a technical debt of approximately 250 CSS lint errors. The majority of these are `lint/complexity/noImportantStyles`, indicating a reliance on `!important` to force styles. This "defensive CSS" approach fights the cascade rather than leveraging it, leading to brittle and hard-to-maintain styles.

## 2. Objectives
*   **Eliminate `!important` Hacks:** Systematically remove `!important` flags by correcting specificity issues or utilizing CSS Layers (`@layer utilities`, `@layer components`).
*   **Biome Compliance:** Ensure `bun run check` passes with 0 errors for CSS files.
*   **Standardization:** Where possible, replace hardcoded values found during the audit with Open Props variables.

## 3. Scope & Strategy
The work will focus on the files identified in the recent Biome check:
*   `src/css/layers/utilities.css` (likely the main source of overrides).
*   `src/css/markdown.css` (check for aggressive resets).
*   `public/sigma-explorer/index.html` (inline styles if any).

**Tactics:**
1.  **Audit:** Run `bun x biome check . --diagnostic-level=error` to isolate the critical CSS failures.
2.  **Refactor:**
    *   For utility classes that *must* override (e.g., `.hidden`), ensure they are in the correct `@layer` or use high-specificity selectors instead of `!important` if possible, though some utilities may justifiably need it (Biome warnings can be suppressed *if* explicitly justified, but avoidance is better).
    *   Refactor component styles to use proper nesting and specificity.
3.  **Verify:** Ensure no visual regressions in the Sigma Explorer or Docs layout.

## 4. Acceptance Criteria
*   [ ] `bun run check` returns clean for CSS files.
*   [ ] No visual regression in `sigma-explorer` layout (sidebar reset, dynamic visibility).
*   [ ] No visual regression in `docs` (markdown typography).
