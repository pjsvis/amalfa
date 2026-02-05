---
date: 2026-02-04
status: deprecated
tags: [playbook, ui, css, terminal, design-system, amalfa]
agent: any
environment: any
---

> **DEPRECATED**: This playbook has been superseded by `css-layout-skill-playbook.md`.
> The principles here are now consolidated in that file with simpler, more focused guidance.

## Quick Reference (for migration only)

### Color Palette
```css
:root {
  --black:   #000000;
  --red:     #AA0000;
  --green:   #00AA00;
  --yellow:  #AA5500;
  --blue:    #0000AA;
  --magenta: #AA00AA;
  --cyan:    #00AAAA;
  --white:   #AAAAAA;

  --bright-white: #FFFFFF;
  --bright-green: #55FF55;
  --bright-yellow: #FFFF55;

  --bg: var(--black);
  --fg: var(--white);
  --accent: var(--green);
  --border: var(--white);
  --dim: var(--yellow);
  --link: var(--cyan);
  --error: var(--red);
}
```

### Font Sizes
```css
:root {
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
}
```

### Forbidden
- No border-radius
- No box-shadow
- No images
- No animations
- No custom fonts
- No px units for layout

### Global Layout
```css
body {
  display: grid;
  grid-template-rows: 3ch 1fr 2ch;
  grid-template-areas: "header" "main" "footer";
  height: 100vh;
}
```

**See**: `playbooks/css-layout-skill-playbook.md` for full guidance.
