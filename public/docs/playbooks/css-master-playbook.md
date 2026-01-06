# CSS Master Playbook

**Status:** Authoritative
**Context:** PolyVis Frontend Architecture

## 1. Core Philosophy

### The "Zero-Magic" Mandate
*   **No Magic Numbers:** Arbitrary pixel values (e.g., `37px`) are forbidden. All values must derive from the Design System tokens (Open Props).
*   **No Brittle Selectors:** Avoid deeply nested or DOM-structure-dependent selectors.
*   **Visual Verification:** "If you haven't seen it in the browser, it doesn't exist." Visual regression testing is mandatory for CSS changes.

### Definesive CSS
*   **Assume Overflow:** Content is dynamic. Labels will wrap. Titles will be long.
*   **Assume Flex:** Containers change size. Use `minmax`, `flex-wrap`, and `clamp()` to handle fluidity.

## 2. Architecture: The Stack

We use a **Hybrid Architecture** combining Utility-First speed with Component Maintainability.

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Tokens** | Open Props | The "Source of Truth" for spacing, colors, typography. |
| **Theme** | CSS Variables | Semantic abstracttion (`--text-1` vs `#000`). Handles Light/Dark mode. |
| **Utilities** | Tailwind CSS | Layout primitives and one-off adjustments. |
| **Logic** | Alpine.js | Reactive state styling via ARIA attributes and CSS Variables. |

## 3. Design System (Tokens)

All design decisions map to variables in `src/css/layers/theme.css`.

### Colors (Semantic)
*   `--surface-1` to `--surface-3`: Background hierarchy.
*   `--text-1`, `--text-2`: Content hierarchy.
*   `--primary`, `--secondary`: Brand/Structural elements.

### Spacing (Open Props)
*   Use `var(--size-1)` through `var(--size-15)`.
*   **Fluid:** Use `var(--size-fluid-*)` for responsive padding/gaps.

### Typography
*   **Families:** `--font-sans` (UI), `--font-mono` (Data/Code), `--font-serif` (Narrative).
*   **Sizes:** `--font-size-*` scale.

## 4. Layout Patterns

### The App Shell (Holy Grail)
We use CSS Grid areas for the main application structure to ensure stability.
```css
.app-shell {
    display: grid;
    grid-template-areas:
        "header header header"
        "left   main   right"
        "footer footer footer";
}
```

### The RAM Grid (Responsive)
For collections of cards:
```css
grid-template-columns: repeat(auto-fit, minmax(min(var(--size-content-1), 100%), 1fr));
```

### The Stack (Vertical Rhythm)
We prefer "Lobotomized Owl" or standard Stack primitives over ad-hoc margins.
```css
.stack-large > * + * { margin-block-start: var(--size-4); }
```

## 5. State & Reactivity (Alpine.js)

### The CSS Variable Bridge
Avoid binding complex style strings in JS. Bind **variables**.
*   **Bad:** `:style="'width: ' + percent + '%'"`
*   **Good:** `:style="{ '--progress': percent + '%' }"` + CSS `width: var(--progress);`

### ARIA-Driven Styling
Style state based on accessibility attributes, not arbitrary classes.
```css
/* Good */
button[aria-expanded="true"] { background: var(--surface-active); }
/* Bad */
button.is-open { ... }
```

## 6. Specificity & Best Practices

1.  **Generic First, Specific Last:** Physically order CSS files and rules from generic (reset, defaults) to specific (overrides).
2.  **Avoid `!important`:** It breaks the cascade. Use it only for utility classes or forcing overrides on 3rd party libraries.
3.  **Capsulate:** Use CSS Nesting for component-local styles to keep related rules together.
    ```css
    .card {
        background: var(--surface-1);
        & h2 { color: var(--text-1); }
        &:hover { @media (hover: hover) { ... } }
    }
    ```

## 7. Workflow Checklist
1.  **Plan:** Identify the Token needed. Do not invent a hex code.
2.  **Edit:** Apply changes in the appropriate Layer (`layout.css` vs `components.css`).
3.  **Verify:** Check distinct viewport sizes (Mobile/Desktop) and Themes (Light/Dark).
4.  **Lint:** Run `bun run check`.
