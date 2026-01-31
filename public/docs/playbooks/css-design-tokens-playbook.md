# Design Tokens Playbook

## Purpose
To document the integration of Open Props and Tailwind CSS, ensuring a "Maximum Signal-to-Noise" environment where all values are rationalized tokens, not magic numbers.

## 1. Tailwind v4 Integration (`@theme`)
**Strategy**: Use the CSS-first configuration to map Tailwind utilities to Open Props variables.

```css
@import "tailwindcss";
@import "open-props/style";
@import "open-props/normalize";

@theme {
  /* SPACING: Harmonic Scale */
  --spacing-0: var(--size-00);
  --spacing-1: var(--size-1);
  --spacing-4: var(--size-4); /* p-4 = var(--size-4) */
  
  /* COLORS: OKLCH Semantic Mapping */
  --color-brand: var(--indigo-6);
  --color-surface-1: var(--surface-1);
  
  /* TYPOGRAPHY: Fluid Scale */
  --font-size-base: var(--font-size-1);
  --font-size-xl: var(--font-size-3);
}
```

## 2. Color Theory & Contrast
**Standard**: Use **OKLCH** for all color definitions to ensure perceptual uniformity.

### Pattern: Automated Contrast
Use `contrast-color()` to automatically select accessible text colors.

```css
.btn-dynamic {
  background-color: var(--brand);
  color: contrast-color(var(--brand)); /* Browser picks black or white */
}
```

### Pattern: Algorithmic Palettes
Use `color-mix()` to derive states (hover, active) from a single base color.

```css
.btn-primary:hover {
  /* Mix 10% black for a consistent darken effect */
  background-color: color-mix(in oklch, var(--brand), black 10%);
}
```

## 3. Fluid Typography
**Problem**: Adjusting font sizes manually at every breakpoint.

### Pattern: Fluid Variables
Bind Tailwind classes to Open Props fluid variables, which use `clamp()`.

```css
@theme {
  --text-fluid-1: var(--font-size-fluid-1);
}
```
Usage: `class="text-fluid-1"` scales smoothly from mobile to desktop.

## 4. The "Theme API" Directive
**Rule**: All tweakable UI values must be defined in `src/css/layers/theme.css`.

-   **Why**: To provide a single "control panel" for the application's design.
-   **What**:
    -   Layout dimensions (e.g., `--header-height`, `--sidebar-width`).
    -   Semantic colors (e.g., `--primary`, `--accent`).
    -   Global spacing (e.g., `--app-padding`).
-   **How**:
    1.  Open `src/css/layers/theme.css`.
    2.  Add/Edit the variable in the `:root` block.
    3.  The change propagates instantly to all layers.

## 5. CSS Layers Architecture
We use modern CSS `@layer` to manage specificity and organization.

### The Stack (Order of Precedence)
Defined in `src/css/main.css`:
1.  **`theme`** (Implicit): Variables (No layer, global scope).
2.  **`base`**: Resets and element defaults (Normalize).
3.  **`layout`**: Macro layout structures (App Shell, Grid).
4.  **`components`**: BEM-style components (Buttons, Nav).
5.  **`utilities`**: High-specificity overrides and helpers.

### The "Back Door" (Isolation Strategy)
If a specific part of the app needs to break free from the design system (e.g., a legacy widget, a third-party integration, or a "sandbox" experiment), use a dedicated layer.

**Pattern:**
1.  Add the layer to the stack definition in `main.css`:
    ```css
    @layer base, layout, components, utilities, sandbox;
    ```
2.  Import the isolated CSS into that layer:
    ```css
    @import "./layers/sandbox.css" layer(sandbox);
    ```
**Result:** Styles in `sandbox` will override `utilities` and `components` regardless of specificity, giving you a safe, isolated playground without fighting the global cascade.

## 6. Theming Strategy
**Problem**: Implementing a JS-based theme switcher (Light/Dark/System).

### Gotcha: `color-scheme` vs. Media Queries
Setting `color-scheme: dark` on the `html` element does **not** trigger `@media (prefers-color-scheme: dark)` blocks in CSS. Open Props variables often rely on these media queries.

**Solution**: You must manually override variables for your dark theme selector.

```css
/* theme.css */
html[data-theme="dark"] {
  color-scheme: dark;
  /* Manually apply Open Props dark mode values */
  --surface-1: var(--gray-9);
  --text-1: var(--gray-1);
}
```

### Pattern: Semantic Variables (No "Nuclear" Fixes)
**Rule**: Never use hardcoded hex values to fix contrast issues.
- **Bad**: `background: #fff;` (Breaks in dark mode)
- **Good**: `background: var(--surface-1);` (Adapts to theme)

If a specific component needs a unique background, define a new semantic variable in `theme.css`:
```css
:root { --code-bg: var(--surface-2); }
html[data-theme="dark"] { --code-bg: var(--surface-3); }
```
Then use `var(--code-bg)` in your component.
## 7. Essential Open Props Tokens
**Reference**: Common values used in this project.

### Content Sizes (`--size-content-*`)
Used for container widths and sidebars.
-   `--size-content-1`: `20ch` (approx 160px) - Narrow
-   `--size-content-2`: `45ch` (approx 360px) - Standard Sidebar
-   `--size-content-3`: `60ch` (approx 480px) - Wide Sidebar / Reading
-   `--size-content-4`: `75ch` (approx 600px) - Wide Reading

### Spacing (`--size-*`)
Used for margins, padding, and gaps.
-   `--size-1`: `0.25rem` (4px)
-   `--size-2`: `0.5rem` (8px)
-   `--size-3`: `1rem` (16px)
-   `--size-4`: `1.25rem` (20px)
-   `--size-fluid-1`: `clamp(1rem, 2vw, 1.5rem)`

### Colors (`--gray-*`, `--blue-*`)
-   `--gray-0`: White-ish
-   --gray-9`: Black-ish
-   `--blue-4`: Standard Link Blue
