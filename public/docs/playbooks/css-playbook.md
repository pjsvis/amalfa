# CSS Playbook

## Purpose
To document the styling standards, architectural patterns, and common "gotchas" for the PolyVis project. This ensures consistency and prevents recurring layout bugs.

## Core Principles
1.  **Vanilla First:** We use standard CSS variables and layout primitives (Flexbox/Grid) before reaching for frameworks.
2.  **Utility Classes:** We use Tailwind CSS for utility classes but maintain semantic class names (e.g., `.btn-structural`) for recurring components.
3.  **Theming:** All colors must be defined in `:root` variables in `style.css`. Hardcoded hex values are forbidden in component CSS.
4.  **Open Props:** We use [Open Props](https://open-props.style/) for standardized variables (colors, shadows, spacing, fonts). Do not invent new magic numbers.

## Global Variables (The DNA)
Located in `public/css/style.css`.

```css
:root {
  /* Colors mapped to Open Props */
  --primary: var(--gray-9);    /* The Ink */
  --secondary: var(--white);   /* The Paper */
  --accent: var(--gray-1);     /* The Void */
  
  /* Spacing & Shadows */
  --shadow-offset: var(--size-1);
}
```

## Common Pitfalls & Solutions

### 1. The "Overflow Trap" (Z-Index Clipping)
**Problem:** If you apply `overflow: auto` (or `hidden`/`scroll`) to a container (like a sidebar), any child element with `position: absolute` will be clipped by that container's bounds, even if it has a high `z-index`.

**Scenario:** Tooltips or dropdown menus inside a scrolling sidebar.

**Solution:**
1.  **Fixed Positioning:** Use `position: fixed` for the floating element. This positions it relative to the viewport, breaking it out of the overflow container.
2.  **Portal/Global Mounting:** Move the DOM element outside the scrolling container (e.g., to the `<body>` tag) and use JavaScript to position it.

### 2. Stacking Contexts
**Problem:** `z-index` only works within a Stacking Context. Elements like `opacity`, `transform`, and `filter` create new stacking contexts, often trapping your `z-index` values.

**Solution:** Keep your z-index hierarchy flat and simple. Avoid unnecessary transforms on container elements.

### 3. Visual Complexity as Technical Debt
**Problem:** Over-engineering simple components (like a list of links) with `truncate`, complex `calc()` padding, and hover borders often leads to fragility (text disappearing, layout shifts).

**Solution:**
-   **Default to Natural Flow:** Let text wrap. It's the web's natural state.
-   **Avoid "Magic" Truncation:** `truncate` requires specific parent widths (`min-w-0`, `flex-1`) to work reliably. If you don't *need* single-line text, don't force it.
-   **Smell Test:** If a component looks "scrunched" or requires precise pixel tuning to be legible, strip it back to standard text styles.

## Component Standards

### Buttons (`.btn-structural`)
- **Style:** Brutalist, high-contrast, monospace.
- **Interaction:** `transform: translate` on click for tactile feel.
- **Shadows:** Hard shadows (`box-shadow: 4px 4px 0px 0px`) for depth.

### Layouts
- **Viewport:** `100vh` / `100vw` with `overflow: hidden` on `body` for app-like feel.
-   **Flexbox:** Use `flex-col` for the main page structure (Navbar -> Main -> Footer).

### 3. Footer Layout
**Problem:** A footer placed outside a scrollable main area can push the body height beyond `100vh`, causing global scrollbars (The "Tailwind Paradox").

**Solution:** Place the footer **inside** the scrollable container (e.g., `<main>`).
```html
<div class="h-screen flex flex-col">
  <nav>...</nav>
  <main class="flex-grow overflow-y-auto">
    <!-- Content -->
    <footer>...</footer>
  </main>
</div>
```

## Specialized Playbooks
For advanced integrations and modern techniques, consult the following specialized guides:

1.  **[Modern Layout Playbook](modern-layout-playbook.md)**: For "Holy Grail" grids, "RAM" responsive cards, and container queries.
2.  **[Design Tokens Playbook](design-tokens-playbook.md)**: For Tailwind v4 configuration, Open Props mapping, and color theory.
3.  **[Defensive CSS Playbook](defensive-css-playbook.md)**: For robust styles (scrollbar stability, image hardening).
4.  **[Reactive Styling Playbook](reactive-styling-playbook.md)**: For integrating Alpine.js with CSS variables.
## 4. The Stack Primitive
**Problem**: Managing vertical spacing between elements without fragile `margin-bottom` on every item.

### Pattern: The Owl Selector (`* + *`)
Apply top margin only to elements that follow another element.

```css
.stack-large > * + * {
  margin-block-start: var(--size-4);
}

.stack-small > * + * {
  margin-block-start: var(--size-1);
}
```

## 5. Centered Navigation
**Problem**: Centering a navigation bar within a full-width header.

### Pattern: Fit-Content + Auto Margins
```css
.app-header {
  width: fit-content;
  margin-inline: auto;
}
```
