# CSS Nesting: A Strategic Analysis

**Status:** Adopted | **Context:** PolyVis UI Architecture
**Date:** 2025-12-03

---

## The Case for Locality of Behavior (LoB)

In modern web development, **Locality of Behavior (LoB)** is a critical factor in maintaining long-term codebase health. Historically, CSS has been a significant offender against this principle, often forcing developers to scatter related logic across large files.

The adoption of native CSS nesting in PolyVis is not merely a syntactic preference; it is a strategic move to reduce errors and cognitive load.

### 1. Eliminating "Context Drift"
Separating a component's base styles from its responsive logic (often by hundreds of lines) creates a dangerous **mental gap**.
*   **The Error:** A developer updates the desktop width of a sidebar but forgets to check the mobile media query located at the bottom of the file.
*   **The Fix:** With nesting, the mobile logic is co-located *inside* the block being edited. The relationship is explicit and undeniable. It forces the developer to consider the component's entire lifecycle (desktop, mobile, hover, active) simultaneously.

### 2. Reducing "Jump-Scrolling" Fatigue
Cognitive load is heavily influenced by the demands placed on **working memory**.
*   **The Friction:** Every time a developer scrolls away from a selector to find its modifier, they must hold the original context in their head. By the time they locate the relevant `@media` block, the specific variable name or constraint may be forgotten.
*   **The Solution:** Colocation removes this friction. The code reads as a complete, self-contained specification of the object, rather than a scattered collection of rules.

### 3. Enforcing "Factored Design"
This approach aligns with **OH-040: Principle of Factored Design**, which advocates for factoring logic into cohesive units.
*   **Standard CSS:** Encourages "Factoring by Type" (e.g., all base styles in one section, all mobile styles in another).
*   **Nested CSS:** Encourages **"Factoring by Component"** (e.g., everything related to the Sidebar is contained within the Sidebar block).
*   **The Benefit:** This aligns the code structure with the developer's mental model of the application. We think in terms of "Components," not "Screen Sizes."

## Conclusion
The refactoring of the PolyVis CSS codebase to utilize nesting transforms "implicit knowledge" (remembering to check for overrides elsewhere) into "explicit structure." This shift significantly reduces the surface area for bugs and improves the overall maintainability of the UI system.
