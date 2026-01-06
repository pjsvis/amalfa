# Session Debrief: Layout Stabilization & Standardization

**Date:** 2025-11-27
**Topic:** Fixing Layout Overflow & Standardizing CSS

## 1. Objective
The primary goal was to resolve persistent layout overflow issues in the `public/graph/index.html` page, where the main window would scroll instead of internal containers, breaking the "Holy Grail" application layout. A secondary goal was to standardize layout dimensions using CSS variables.

## 2. The Problem
-   **Main Window Scrollbar:** The `1fr` grid row in the app shell was expanding beyond the viewport height because its children (sidebars, main content) were growing without constraint.
-   **Hidden Footer:** The expansion pushed the footer off-screen, requiring the user to scroll the entire window to see it.
-   **Inconsistent Dimensions:** Layout values (widths, heights) were hardcoded in multiple places or relied on utility classes (`w-48`, `w-80`), making global adjustments difficult.

## 3. The Solution

### A. Nested Scroll Container Pattern
We moved away from trying to make the grid areas themselves scrollable. Instead, we adopted a strict parent-child relationship:
1.  **Grid Area (Parent):** `overflow: hidden`, `min-height: 0`, `display: flex`, `flex-direction: column`. This forces the grid area to respect the grid row height (1fr) and never expand.
2.  **Scroll Container (Child):** A `div` inside the parent with `overflow-y: auto`, `flex-grow: 1`, and `min-height: 0`. This container handles the actual scrolling content.
3.  **Headers:** Placed *inside* the scroll container (or fixed above it within the flex parent) depending on the desired behavior. For this session, we moved headers inside the scrollable area for sidebars.

### B. CSS Variables for Layout
We standardized the layout dimensions in `src/css/main.css` to allow for single-source-of-truth control:
-   `--header-height`: Controls the app header height (can be set to `0px` to hide).
-   `--footer-height`: Controls the app footer height.
-   `--sidebar-width-left`: Controls the left sidebar width.
-   `--sidebar-width-right`: Controls the right sidebar width.

## 4. Verification
-   **Test Page (`public/layout-test.html`):** Created a dedicated testbed to isolate and verify the layout fixes before applying them to the main app. Verified that:
    -   Main window does not scroll.
    -   Footer is always visible.
    -   Internal containers scroll independently.
    -   CSS variables correctly control dimensions.
-   **Main App (`public/graph/index.html`):** Applied the verified patterns and confirmed the fix on the live application.

## 5. Artifacts Created/Updated
-   `public/layout-test.html`: A permanent test fixture for layout experiments.
-   `src/css/main.css`: Updated with strict grid rules and new variables.
-   `public/graph/index.html`: Refactored to use the nested scroll container pattern.

## 6. Next Steps
-   **Mobile Verification:** Explicitly test the layout on mobile viewports to ensure the `min-height: 0` constraints don't cause issues on smaller screens (though the current responsive logic seems sound).
-   **Refine Visuals:** Now that the structure is solid, further visual polish (glassmorphism, colors) can be applied without breaking the layout.
