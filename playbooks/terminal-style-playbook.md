---
date: 2026-02-04
tags: [playbook, ui, css, terminal, design-system, amalfa]
agent: any
environment: any
---

# Terminal Style Playbook

## Purpose
A codified design system for Amalfa's terminal.shop-inspired interface. This playbook ensures visual consistency across all web interfaces (dashboard, docs, and future UI) by enforcing strict constraints that simplify design decisions and create a distinctive aesthetic.

## When to Use This Playbook
- Creating new pages or components for the Amalfa web interface
- Adding widgets to the dashboard
- Styling API documentation or error pages
- Building any user-facing web UI in the Amalfa ecosystem

## Context & Prerequisites
- **Technology**: CSS with CSS Custom Properties (variables)
- **Constraint**: Monospace typography only
- **Constraint**: 8-16 ANSI colors maximum
- **Units**: `ch` (character) units for all spacing and sizing
- **Reference**: terminal.shop aesthetic - "Every character must earn its place"

## The Protocol

### Step 1: Include the Core CSS Variables

Every terminal-styled page MUST include these CSS custom properties in the `:root` selector:

```css
:root {
  /* ANSI Color Palette - 8 base colors */
  --black:   #000000;
  --red:     #AA0000;
  --green:   #00AA00;
  --yellow:  #AA5500;
  --blue:    #0000AA;
  --magenta: #AA00AA;
  --cyan:    #00AAAA;
  --white:   #AAAAAA;
  
  /* Bright variants - 8 additional colors */
  --bright-white: #FFFFFF;
  --bright-green: #55FF55;
  --bright-yellow: #FFFF55;
  
  /* Semantic mappings - USE THESE, NOT RAW COLORS */
  --bg: var(--black);
  --fg: var(--white);
  --accent: var(--green);
  --border: var(--white);
  --dim: var(--yellow);
  --link: var(--cyan);
  --error: var(--red);
  
  /* Typography */
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
}
```

**Constraint**: Never reference raw ANSI colors directly in component styles. Always use the semantic mappings (`--bg`, `--fg`, `--accent`, etc.). This enables theming and maintains consistency.

### Step 2: Set Up the Layout Grid

Use CSS Grid with explicit character-based dimensions:

```css
body {
  background: var(--bg);
  color: var(--fg);
  display: grid;
  /* Header: 3ch | Main: 1fr | Footer: 2ch */
  grid-template-rows: 3ch 1fr 2ch;
  grid-template-areas:
    "header"
    "main"
    "footer";
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

header {
  grid-area: header;
  height: 3ch;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 2ch;
  contain: strict;
}

footer {
  grid-area: footer;
  height: 2ch;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2ch;
  font-size: 12px;
  color: var(--dim);
  contain: strict;
}

main {
  grid-area: main;
  display: grid;
  /* LHS sidebar: 45ch | RHS content: remaining */
  grid-template-columns: 45ch 1fr;
  grid-template-areas: "lhs rhs";
  gap: 1px;
  background: var(--border); /* Gap color */
  overflow: hidden;
}
```

**Constraint**: Header must be exactly `3ch` height. Footer must be exactly `2ch` height. These are non-negotiable for the terminal aesthetic.

### Step 3: Create Panel Layout

Standard two-panel layout for dashboard/docs:

```css
.lhs {
  grid-area: lhs;
  background: var(--bg);
  padding: 1ch;
  overflow-y: auto;
  overflow-x: hidden;
}

.rhs {
  grid-area: rhs;
  background: var(--bg);
  padding: 1ch;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: flex-start;
  gap: 1ch;
}
```

### Step 4: Style Widgets/Blocks

**LHS Widgets** (sidebar panels):
```css
.lhs-widget {
  background: var(--bg);
  padding: 1ch;
  border-bottom: 1px solid var(--border);
}

.lhs-widget:last-child {
  border-bottom: none;
}
```

**RHS Blocks** (content cards):
```css
.rhs-block {
  background: var(--bg);
  padding: 1ch 2ch;
  width: fit-content;
  min-width: min(50ch, 100%);
  max-width: 70ch;
  max-height: 30ch; /* Never exceed 30ch */
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid var(--border);
  contain: layout;
}

/* Variant for known-long content */
.rhs-block.long {
  max-height: 25ch;
}

/* Variant for short content */
.rhs-block.short {
  max-height: 35ch;
}
```

**Constraint**: No block should ever approach the viewport edge. The `30ch` max-height keeps content well within safe boundaries. Use scroll within blocks for overflow.

### Step 5: Apply Typography Hierarchy

```css
/* Page/section titles - Accent color */
h1, .widget-title {
  color: var(--accent);
  font-size: 1rem;
  margin: 1ch 0;
  font-weight: bold;
}

/* Section headers - Bright yellow */
h2 {
  color: var(--bright-yellow);
  font-size: 1rem;
  margin: 1ch 0;
}

/* Subsection headers - Cyan */
h3 {
  color: var(--cyan);
  font-size: 1rem;
  margin: 0.5ch 0;
}

/* Body text - Default foreground */
p {
  margin: 0.5ch 0;
}

/* Dim/secondary text - Yellow */
.dim {
  color: var(--dim);
}

/* Links - Cyan */
a {
  color: var(--link);
  text-decoration: none;
}

/* Code/technical - Bright green */
code, pre {
  color: var(--bright-green);
}
```

**Constraint**: Only 4 heading colors allowed: `--accent` (green), `--bright-yellow`, `--cyan`, and default `--fg` (white). No exceptions.

### Step 6: Style Data Tables

```css
table {
  border-collapse: collapse;
  width: 100%;
  font-size: 13px;
}

th, td {
  border: 1px solid var(--border);
  padding: 0.5ch 1ch;
  text-align: left;
}

th {
  color: var(--accent);
  background: var(--black);
}
```

### Step 7: Add Window Controls (Optional)

For interactive widgets:

```css
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1ch;
}

.widget-controls {
  display: flex;
  gap: 1ch;
}

.control-btn {
  color: var(--dim);
  font-family: monospace;
  cursor: pointer;
  user-select: none;
}

.control-btn:hover {
  color: var(--fg);
}
```

**Standard control labels**:
- `[-]` - Minimize/collapse
- `[+]` - Expand (when minimized)
- `[MAX]` - Maximize/focus mode
- `[RST]` - Reset/restore
- `[↻]` - Refresh/reload
- `[×]` - Close

### Step 8: Implement Responsive Behavior

```css
/* Stack panels on narrow screens */
@media (max-width: 100ch) {
  main {
    grid-template-columns: 1fr;
    grid-template-areas: "lhs" "rhs";
  }
  
  .lhs {
    max-height: 40vh;
    border-bottom: 1px solid var(--border);
  }
}

/* Emergency collision detection for short viewports */
@media (max-height: 50ch) {
  .rhs-block {
    max-height: 20ch; /* Aggressive reduction */
  }
}
```

## Standards & Patterns

### Color Usage Rules
| Element | Color Variable | Example |
|---------|---------------|---------|
| Primary brand/accent | `--accent` | Logo, active states, success |
| Warnings/cautions | `--dim` | Metadata, timestamps, hints |
| Interactive/links | `--link` | Anchors, buttons, nav |
| Errors/critical | `--error` | Failed states, alerts |
| Secondary headers | `--bright-yellow` | H2, section titles |
| Tertiary headers | `--cyan` | H3, subsection titles |
| Code/technical | `--bright-green` | Code blocks, preformatted |
| Body text | `--fg` (white) | Paragraphs, labels |

### Layout Rules
1. **Every dimension uses `ch` units** - no px, rem, or em for layout
2. **Borders are always `1px solid`** - no rounded corners, no shadows
3. **Padding is always in whole `ch` units** - `1ch`, `2ch`, never `1.5ch`
4. **Margins are minimal** - `0.5ch` or `1ch` maximum
5. **Overflow must be handled** - `overflow-y: auto` on scrollable regions
6. **No images** - ASCII art or text-only representations
7. **No animations** - Static displays only (except cursor blink if absolutely necessary)

### Forbidden Elements
- ❌ Border-radius (no rounded corners)
- ❌ Box-shadow (no depth effects)
- ❌ Background images
- ❌ CSS gradients (except subtle alpha overlays)
- ❌ Animation/transition (except simple color transitions on hover)
- ❌ Web fonts (system monospace only)
- ❌ Emoji in UI elements (use ASCII alternatives)

## Validation (How to Verify)

- [ ] All colors reference CSS variables, not hex codes directly
- [ ] All dimensions use `ch` units
- [ ] Header height is exactly `3ch`
- [ ] Footer height is exactly `2ch`
- [ ] Typography uses only monospace
- [ ] No border-radius properties
- [ ] No box-shadow properties
- [ ] No background images
- [ ] Responsive breakpoint at `100ch` width
- [ ] All interactive elements have hover states
- [ ] Code/pre elements use `--bright-green`

## Example: Complete Widget Template

```html
<div class="rhs-block">
  <div class="widget-header">
    <div class="widget-title">Widget Title</div>
    <div class="widget-controls">
      <span class="control-btn" onclick="toggle(this)">[-]</span>
    </div>
  </div>
  
  <p class="dim">Descriptive subtitle in dim color</p>
  
  <table>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>Nodes</td>
      <td class="status">1,714</td>
    </tr>
  </table>
  
  <p>Normal text in default foreground color.</p>
</div>
```

## Maintenance

- **Updates**: This playbook is versioned by date in the frontmatter
- **Violations**: If you find yourself adding `px` units or `border-radius`, stop and refactor
- **Extensions**: New semantic colors should be added to `:root` with clear naming (e.g., `--warning`, `--success`)
- **Deprecation**: If the terminal aesthetic is abandoned, mark this playbook with `> **DEPRECATED**` banner

## References

- **Live Implementation**: `website/ssr-docs/server.ts` (renderDashboard function)
- **Dashboard**: http://localhost:3001/ - working example
- **Documentation**: http://localhost:3001/ssr-docs - secondary example
- **Inspiration**: https://terminal.shop aesthetic philosophy

---

**Remember**: The terminal aesthetic works because it imposes strict constraints. Every character must earn its place. Simplicity is not a lack of design—it's the discipline of removing everything that doesn't serve a purpose.
