---
name: css-layout-development
description: CSS layout guidance for the AMALFA terminal-brutalist interface. Focuses on intrinsic sizing, ch-based spacing, and maximum data density.
---

# CSS Layout Development Skill

## Purpose

This skill provides guidance for writing CSS layouts in the AMALFA terminal interface. Principles:

1. **Intrinsic sizing** - Elements size to content, not container
2. **ch-based units** - Character widths for monospace typography
3. **Maximum density** - Fit-content, tight spacing, small fonts
4. **Minimal complexity** - Few properties, predictable behavior

When writing CSS, consult this document first.

---

## Core Principles

### Intrinsic Sizing Over Extrinsic

```css
/* WRONG: Stretches to fill space */
.tile {
  width: 100%;
}

/* RIGHT: Sizes to content */
.tile {
  fit-content;
}
```

### ch-Based Units

- `ch`: Character width in monospace. 1ch = width of "0"
- Use for widths, max-widths, spacing
- Predictable sizing regardless of font-size changes

```css
.tile {
  max-width: 45ch;
  gap: var(--space-sm);  /* 0.75-1ch */
}
```

### Horizontal Flow First

```css
/* Items flow left-to-right, wrap when full */
.grid {
  display: flex;
  flex-wrap: wrap;
}
```

---

## Layout Primitives

### Stack Pattern

Vertical flow with consistent spacing.

```css
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
```

### Cluster Pattern

Horizontal items that wrap naturally.

```css
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: center;
}
```

### Sidebar Pattern

Controls panel with fixed intrinsic width, content flows beside it.

```css
.sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.sidebar > .controls-panel {
  width: fit-content;
}

.sidebar > .content {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}
```

---

## Spacing Scale

```css
:root {
  --space-xs: clamp(0.5ch, 0.4ch + 0.5vw, 0.75ch);
  --space-sm: clamp(0.75ch, 0.6ch + 0.75vw, 1ch);
  --space-md: clamp(1ch, 0.8ch + 1vw, 1.5ch);
  --space-lg: clamp(1.5ch, 1.2ch + 1.5vw, 2ch);
  --space-xl: clamp(2ch, 1.6ch + 2vw, 3ch);
}
```

---

## Grid vs Flexbox Decision

### Use Flexbox When:
- One-dimensional layout (row OR column)
- Items should wrap onto new lines
- Content size should drive layout

**Examples:** Navigation, button groups, inline metadata, grids of tiles

### Use Grid When:
- Two-dimensional layout (rows AND columns)
- Named layout areas
- Fixed sidebar + flexible content structure

**Examples:** Page layouts with header/sidebar/main/footer

---

## Global Layout Structure

Always designed around this frame:

```
┌─────────────────────────────────────┐
│ HEADER (fixed 3ch)                │ ← nav, branding
├────────────────┬────────────────────┤
│                │ MAIN              │
│  CONTROLS      │ (tiles flow here) │
│  (fit-content) │                   │
│                ├────────────────────┤
│                │ FOOTER (fixed 2ch)│ ← status, timestamp
└────────────────┴────────────────────┘
```

### Implementation

```css
body {
  display: grid;
  grid-template-rows: 3ch 1fr 2ch;
  grid-template-areas:
    "header"
    "main"
    "footer";
  height: 100vh;
}

main {
  overflow: hidden;
}
```

---

## Data Density First

Maximize information per screen pixel. Everything else is secondary.

### Priority Order
1. **Data density**: fit-content, tight spacing, small fonts
2. **Readability**: clear hierarchy, contrast, scannability
3. **Aesthetics**: terminal-brutalist, consistent theme

### Rules
- Block → `width: fit-content` (not 100%)
- Tables → `width: auto` (not 100%)
- Flow → Horizontal first, wrap when full
- Spacing → Use `--space-xs` for tight layouts
- Fonts → 10-11px for data, 11-13px for labels

---

## Btop-Style Terminal Aesthetics

Maximum data density, minimum wasted space.

### Characteristics
- No stretching to fill space
- Horizontal flow first, vertical wrap second
- Inline stats over boxes
- Horizontal table borders only
- fit-content for all containers
- Tight typography (10-11px fonts)

### Font Sizes
```css
:root {
  font-size: 14px;       /* base */
  --font-xs: 10px;        /* data, stats */
  --font-sm: 11px;        /* labels, terms */
  --font-md: 13px;        /* body text */
}
```

---

## Lexicon Layout Debugging: Lessons Learned

### The Problem

Tiles stacked vertically instead of flowing horizontally. Added `align-items: flex-start`, `flex-grow`, `flex-shrink`, `flex-basis` - none worked.

### Root Causes

1. **Duplicate CSS rules** - Edited one `.entity-tile` while another overrode it
2. **Over-engineering** - Flexbox has `flex-wrap: wrap`. That's horizontal flow.
3. **Missing constraint** - No max-width meant tiles had no reason to wrap

### The Simple Solution

```css
.lexicon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.entity-tile {
  max-width: 45ch;
  max-height: 25em;
  overflow-y: auto;
  fit-content;
}
```

### Key Lessons

1. **fit-content + max-width = automatic sizing**
   - Shrinks to content when small
   - Caps at 45ch when content is large
   - No flex grow/shrink needed

2. **Trust flex-wrap**
   - `display: flex; flex-wrap: wrap` = horizontal flow
   - One property, one behavior

3. **Duplicate rules cause flailing**
   - Search for all occurrences before editing
   - Remove duplicates, don't patch around them

4. **Max constraints handle edge cases**
   - `max-height: 25em` + `overflow-y: auto` = auto scroll
   - No JavaScript needed

5. **Keep CSS minimal**
   - 2 properties for container layout
   - 4 properties for tile constraints
   - Total: 6 lines, not 20

### When Debugging CSS

1. Search for ALL occurrences of the selector
2. Start with simplest solution (flex-wrap handles flow)
3. Use fit-content for intrinsic sizing, max-* for constraints
4. One property change at a time
5. Delete duplicates before patching

---

## Layout Vocabulary

Define terms precisely for consistent communication:

### Space Units
- **ch**: Character width (monospace). 1ch = width of "0"
- **em**: Font-relative unit. 1em = current font size
- **cqw**: Container query width (1% of container)

### Layout Patterns
- **Stack**: Vertical flow, items stack top-to-bottom
- **Flow-Horizontal**: Items flow left-to-right, wrap at boundary
- **Fit-Content**: Element sizes to content, not container
- **Compact-List**: Vertical stats list, tight spacing

### Density Terms
- **Tight**: Minimal padding, small fonts (10-11px)
- **Relaxed**: More padding, larger fonts (13-14px)
- **Data-Dense**: Maximum information per unit screen

### Sizing
- **Intrinsic**: Sizes to content (fit-content, auto)
- **Extrinsic**: Fixed or container-driven (100%, fixed px)
- **Responsive**: Adapts to available space

---

## Anti-Patterns to Avoid

### Don't: Fixed Widths
```css
/* BAD: Fixed pixel width */
.tile { width: 200px; }

/* GOOD: Character-based width */
.tile { max-width: 45ch; }
```

### Don't: Percentage Widths
```css
/* BAD: Stretches to fill space */
.tile { width: 100%; }

/* GOOD: Sizes to content */
.tile { fit-content; }
```

### Don't: Fighting Flexbox
```css
/* BAD: Over-specified */
.container {
  display: flex;
  flex-direction: row;         /* redundant */
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
}

/* GOOD: Minimal */
.container {
  display: flex;
  flex-wrap: wrap;
}
```

### Don't: Vertical Stack First
```css
/* BAD: Assumes vertical */
.stack { flex-direction: column; }

/* GOOD: Horizontal flow, wrap when full */
.stack { flex-wrap: wrap; }
```

### Don't: Over-Engineered Constraints
```css
/* BAD: Too many properties */
.tile {
  flex: 1 1 auto;
  flex-basis: 45ch;
  max-width: 45ch;
  min-width: 0;
}

/* GOOD: Simple constraints */
.tile {
  max-width: 45ch;
  fit-content;
}
```

---

## Summary

When writing CSS for AMALFA:

1. Use `fit-content` for intrinsic sizing
2. Use `ch` units for predictable widths
3. Use `flex-wrap: wrap` for horizontal flow
4. Use `max-width` and `max-height` for constraints
5. Keep CSS minimal - 6 lines beats 60
6. Delete duplicates, don't patch around them
