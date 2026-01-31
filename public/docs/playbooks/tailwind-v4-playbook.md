# Tailwind CSS v4 Playbook

**Status**: Active
**Version**: v4.0 (Alpha/Beta)
**Philosophy**: CSS-First, Native Layers, Zero Magic.

## 1. Core Philosophy: CSS-First
Tailwind v4 moves configuration from JavaScript (`tailwind.config.js`) to CSS. We embrace this fully.
-   **DO NOT** create a `tailwind.config.js` unless strictly necessary for legacy plugin compatibility.
-   **DO** configure the theme directly in your CSS entry point (e.g., `main.css`).

## 2. Setup & Imports
The entry point should be clean and use the new import syntax.

```css
/* src/css/main.css */
@import "tailwindcss";

/* Theme Configuration */
@theme {
  --color-primary: #3b82f6;
  --font-sans: "Inter", sans-serif;
  --spacing-container: 1280px;
}
```

## 3. Layer Architecture
We use native CSS Cascade Layers to manage specificity and isolation. This is critical for "Zero Magic" and preventing style bleed.

### The Layer Stack
1.  **`theme`**: Design tokens (Open Props, Tailwind Theme).
2.  **`base`**: Resets and element defaults.
3.  **`components`**: Reusable UI components (Buttons, Cards).
4.  **`utilities`**: Tailwind utilities (automatically handled).
5.  **`app`**: Application-specific layouts (e.g., `sigma-explorer`).

```css
@layer theme, base, components, utilities, app;

@import "layers/theme.css" layer(theme);
@import "layers/base.css" layer(base);
/* ... */
```

**CRITICAL NOTE ON IMPORTS:**
Avoid double-wrapping layers. If `layers/graph.css` already contains `@layer graph { ... }`, do **not** import it with `@import "..." layer(graph)`. This can cause Tailwind v4 to drop the styles or miscalculate specificity. Import it directly:
```css
@import "layers/graph.css"; /* Correct if file has internal @layer */
```

## 4. Component Isolation Strategy
For complex, self-contained visualizations like `sigma-explorer`, we use a dedicated layer to prevent global styles from interfering with the canvas or specific UI elements.

**Pattern:**
```css
/* src/css/layers/explorer.css */
@layer app {
  #sigma-container {
    /* Isolated styles here */
    position: relative;
    width: 100%;
    height: 100%;
  }
}
```

## 5. Dos and Don'ts

### DO
-   **Use Native Variables**: Use `--my-var` instead of `theme('colors.my-var')`.
-   **Use Container Queries**: They are built-in. `@container (min-width: 700px) { ... }`.
-   **Use `oklch`**: For dynamic colors and better gradients.

### DON'T
-   **Don't use `@apply` for everything**: Only use it for highly reusable component primitives.
-   **Don't mix v3 and v4 syntax**: Avoid `module.exports` config.
-   **Don't fight the cascade**: Use layers to control it.

## 6. Troubleshooting
-   **"Styles not applying"**: Check your `@layer` order.
-   **"Unknown at-rule"**: Ensure your IDE knows about Tailwind v4 syntax (or ignore the warning).
