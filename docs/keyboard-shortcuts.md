# Keyboard Shortcuts

**Global shortcuts available across all PolyVis pages.**

---

## Layout Debug Mode

**Shortcut:** `Shift + D`

**Purpose:** Visualize container boundaries and grid structure for layout debugging.

**What it does:**
- Adds red dashed outlines to ALL elements
- Adds subtle red background tint
- Highlights grid columns in blue (sidebars)

**Visual effect:**
```css
* {
  outline: 1px dashed rgba(255, 0, 0, 0.3);  /* Red boxes */
  background: rgba(255, 0, 0, 0.02);          /* Red tint */
}
```

**Use cases:**
- Debugging layout issues
- Finding overflow/scroll problems
- Verifying grid structure
- Teaching CSS layout

**Toggle:** Press `Shift + D` again to turn off

---

## Implementation

**Alpine.js binding:**
```html
<body x-data="{ debug: false }"
      :class="{ 'layout-debug-mode': debug }"
      @keydown.window.shift.d="debug = !debug">
```

**CSS class:**
```css
/* src/css/layers/utilities.css */
.layout-debug-mode * {
  outline: var(--border-size-1) dashed rgba(255, 0, 0, 0.3) !important;
  background: rgba(255, 0, 0, 0.02) !important;
}
```

**Available on:**
- ✅ Home page (`/`)
- ✅ Sigma Explorer (`/sigma-explorer/`)
- ✅ Docs viewer (`/docs/`)

---

## Future Shortcuts

**Planned:**
- `Shift + S` - Show stats overlay
- `Shift + G` - Toggle grid guides
- `Shift + ?` - Show keyboard help

**Add your own:**
```html
@keydown.window.shift.x="yourFunction()"
```

---

**Source:**
- HTML: `public/index.html`, `public/sigma-explorer/index.html`
- CSS: `src/css/layers/utilities.css`
- Docs: This file

**Last Updated:** 2025-12-12
