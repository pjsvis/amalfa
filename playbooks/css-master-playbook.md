# CSS Master Playbook

**Status:** Authoritative
**Context:** PolyVis Frontend Architecture

## 1. Core Philosophy: Brutalist Rigor

### The "Terminal Brutalist" Mandate
*   **Zero Ambiguity:** Interfaces must be high-contrast, strictly monotonic, and geometrically precise.
*   **Raw Aesthetics:** No border-radius, no soft shadows, no blur effects. `border-radius: 0 !important`.
*   **ANSI Loyalty:** All colors must derive from the standard ANSI palette (Black, White, Red, Green, Yellow, Orange, Cyan). Use these semantically (e.g., Orange = Agent).
*   **Verification:** Runtime integrity is enforced via `runStyleAudit()`. If the CSS drifts, the system warns the user.

### Defensive CSS (Legacy but Valid)
*   **Assume Overflow:** Content is dynamic. Labels will wrap.
*   **Assume Flex:** Containers change size.

## 2. Architecture: The Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Tokens** | `theme.css` | The "Source of Truth". Defines ANSI Palette and Spacing Scale (`--spacing-*`). |
| **Theme** | CSS Variables | Semantic abstraction (`--bg-canvas`, `--text-primary`). Handles Inversion (Light/Dark). |
| **Utilities** | Tailwind CSS | Layout primitives (`flex`, `grid`). |
| **Logic** | Alpine.js | Reactive state styling. |

## 3. Design System (Tokens)

All design decisions map to variables in `src/css/layers/theme.css`. **Open Props is Deprecated.**

### Colors (ANSI Semantic)
*   `--ansi-black` / `--ansi-white`: The Core.
*   `--ansi-green`: Success/Valid (System OK).
*   `--ansi-red`: Error/Fatal (System Fail).
*   `--ansi-orange`: The Agent (AI Logic).
*   `--ansi-cyan`: System Identity (PolyVis).

### Spacing (Integer Scale)
*   Use `var(--spacing-1)` (4px) through `var(--spacing-8)` (48px).
*   **Gap Theory:** Layouts are defined by gaps, not padding.

### Typography
*   **Monospace Only:** `var(--font-mono)` is the default. Every piece of text is data.
*   **Uppercase:** Key headers and actions should be `text-transform: uppercase`.

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

## 8. CSS Cascade Layers

### Layer Ordering
Define layer order explicitly in your main CSS file:
```css
@layer base, layout, components, graph, utilities;
```

**Rules**:
- Layers declared later have higher specificity
- `utilities` layer comes last to override everything else
- Never use `!important` when layers can solve specificity issues

### Integration with Tailwind
When integrating custom CSS with Tailwind v4:

**✅ CORRECT: Import into build**
```css
/* src/css/main.css */
@import "./layers/markdown.css" layer(utilities);
```

**❌ WRONG: Separate link tag**
```html
<!-- This bypasses the layer system -->
<link rel="stylesheet" href="/css/markdown.css" />
```

**Why**: External stylesheets loaded via `<link>` tags are not part of the Tailwind build and won't respect the `@layer` declarations in your main CSS.

### Debugging Layer Issues
1. Check if styles are in the compiled `app.css` file
2. Use browser DevTools to inspect which rule is winning
3. Verify `@layer` declarations are processed by your build tool
4. Consider inline styles only for prototyping, then migrate to proper layers

## 7. Workflow Checklist
1.  **Plan:** Identify the Token needed. Do not invent a hex code.
2.  **Edit:** Apply changes in the appropriate Layer (`layout.css` vs `components.css`).
3.  **Verify:** Check distinct viewport sizes (Mobile/Desktop) and Themes (Light/Dark).
4.  **Lint:** Run `bun run check`.
