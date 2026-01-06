# Walkthrough: Verifying OKLCH Theming

**Status:** Deployed via `theme.css` refactor.

## Concept: Auto-Contrast
We are now using **OKLCH** color space.
- Colors are defined by Lightness (`L`), Chroma (`C`), and Hue (`H`).
- Text color is calculated automatically:
  `clamp(0%, calc((var(--bg-l) - 60%) * -1000), 100%)`
  
  *Translation:*
  "If background Lightness is > 60%, text is BLACK (0%)."
  "If background Lightness is < 60%, text is WHITE (100%)."

## Verification Steps

### 1. Visual Sanity Check
- Open the App.
- Toggle between **Light** and **Dark** modes (Button in Top Right).
- **Expectation:**
    - **Light Mode:** White/Light Gray backgrounds, Dark text.
    - **Dark Mode:** Dark Gray backgrounds, White text.
    - **Sidebar borders** should be visible in both modes (`var(--border-base)`).

### 2. "The Stress Test" (DevTools)
To prove the auto-contrast works:
1. Open DevTools -> Elements.
2. Select the `<body>` tag.
3. In Styles, find `:root` or `html[data-theme]`.
4. Manually change `--surface-1-l` (Lightness):
    - Set to `90%`: Text should be **Black**.
    - Set to `70%`: Text should be **Black**.
    - Set to `50%`: Text should FLIP to **White**.
    - Set to `20%`: Text should be **White**.

### 3. Graph Logic Check
- Since we touched `layout.css` and `components.css`:
    - Ensure the graph still renders (Graph uses isolated CSS but shares some tokens).
    - Ensure sidebars still open/close cleanly.
