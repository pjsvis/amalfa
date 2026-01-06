# Debrief: Front Page Refactor

**Date**: 2025-11-27
**Objective**: Refactor the front page layout to use a robust, deterministic "Holy Grail" grid and rationalized spacing.

## Achievements
1.  **Holy Grail Grid**: Implemented a 5-zone grid (`header`, `left`, `main`, `right`, `footer`) that provides a stable app shell.
2.  **Stack Primitive**: Replaced ad-hoc margins with a `.stack` utility (`* + *` selector) for consistent vertical rhythm.
3.  **Layout Debug Mode**: Created a `.layout-debug-mode` (toggled via `Shift+D`) that visualizes container extents and grid tracks.
4.  **Centered Navigation**: Refined the navigation bar to size to content and center horizontally, aligning with the main card.
5.  **Rationalized Spacing**: Switched to Open Props variables (`var(--size-4)`, `var(--size-1)`) for all spacing, eliminating magic numbers.

## Lessons Learned
-   **Grid vs. Flex**: For the main app shell, CSS Grid is superior to Flexbox as it allows for explicit named areas (`grid-template-areas`), making the layout self-documenting.
-   **The "Stack" is Powerful**: The lobotomized owl selector (`* + *`) is a cleaner way to manage vertical spacing than adding `margin-bottom` to every element.
-   **Debug Tools are Essential**: Having a built-in debug mode (`Shift+D`) dramatically speeds up layout verification and fine-tuning.
-   **Fit-Content for Nav**: To center a nav bar inside a full-width header, `width: fit-content` + `margin-inline: auto` is a robust pattern.

## Next Steps
-   **Nav Bar Consistency**: Ensure the new centered navigation layout is applied consistently across all pages (Docs, Graph, Explorer).
-   **Component Extraction**: Consider extracting the `.home-box` card into a reusable component if used elsewhere.
