---
name: brutalisimo
description: The canonical playbook for CSS-Brutalisimo - terminal-brutalist interface design for AMALFA.
---

# Brutalisimo Playbook

## Philosophy

CSS-Brutalisimo treats the browser as a **hardware peripheral**. The UI is a character-addressable buffer, not a fluid canvas.

**Core Principles:**
- **Intrinsic sizing** over extrinsic
- **ch/lh units** over pixels
- **Inline styles only** - no cascade, no build step
- **Semantic HTML** over div-soup
- **Concrete values** - use `vh`/`ch`, not percentages

---

## Layout System

### Global Grid

```
┌─────────────────────────────────────┐
│ HEADER (3ch fixed)                 │
├────────┬────────────────────────────┤
│        │                            │
│  NAV   │         MAIN               │
│ (25ch) │      (scrolls)            │
│        │                            │
├────────┴────────────────────────────┤
│ FOOTER (2ch fixed)                 │
└─────────────────────────────────────┘
```

### Global CSS (terminal.css)

```css
html, body {
  height: 100vh;
  overflow: hidden;
}

body {
  display: grid;
  grid-template-rows: 3ch 1fr 2ch;
  grid-template-areas:
    "header"
    "main"
    "footer";
}

main {
  display: grid;
  grid-template-columns: 25ch 1fr;
  overflow: hidden;
}
```

### Scrolling Strategy

**Rule:** Only scrollable containers scroll. Everything else stays fixed.

```css
/* BAD: Body scrolls */
body { overflow: auto; }

/* GOOD: Only columns scroll */
aside, section { overflow-y: auto; }
```

---

## SmartBlock Component

Location: `website/ssr-docs/components/SmartBlock.tsx`

### Two Variants

| Variant | Use Case | max-width | Scroll |
|---------|----------|-----------|--------|
| Standard (default) | Lexicon tiles | 45ch | Internal |
| Long-form (`isLongForm: true`) | Documents | 60ch | Internal |

### Working Implementation

```tsx
export function SmartBlock({ id, content, isLongForm = false }: SmartBlockProps): string {
  return `
    <article
      id="${id}"
      style="max-width: ${isLongForm ? "60ch" : "45ch"}; ${
        isLongForm ? "height: calc(100vh - 9ch); overflow-y: auto;" : ""
      }"
      p-1ch
      border
      ${!isLongForm ? "mb-1ch" : ""}
    >
      <div class="command-hint" style="font-size: 9px; color: var(--dim); margin-bottom: 0.5ch;">
        agent-browse --target #${id}
      </div>
      <div class="markdown-body">
        ${content}
      </div>
      <style>
        #${id} {
          background: var(--bg);
          color: var(--fg);
          ${isLongForm ? "height: 100%;" : ""}
        }
        #${id} h1, #${id} h2, #${id} h3 { color: var(--accent); }
        #${id} h2 { border-bottom: 1px solid var(--border); padding-bottom: 0.5ch; font-size: 14px; }
        #${id} h3 { border-bottom: 1px solid var(--dim); padding-bottom: 0.25ch; font-size: 12px; }
        #${id} p { margin-bottom: 0.5ch; line-height: 1.5; }
        #${id} code, #${id} pre { background: var(--bright-black); padding: 2px 4px; font-size: 11px; }
      </style>
    </article>
  `;
}
```

### Key Patterns

1. **Inline styles for concrete values** - Use `height: calc(100vh - 9ch)` for scroll containers
2. **Tailwind for layout** - `flex`, `grid`, `overflow-y-auto`
3. **Scoped styles** - ID selector `#${id}` prevents cascade issues
4. **Command hint** - `agent-browse --target #${id}` for machine navigation

---

## Color Palette (OKLCH)

```css
:root {
  /* Substrate */
  --bg: oklch(0.18 0 0);
  --fg: oklch(0.75 0 0);
  --border: oklch(0.40 0 0);
  --dim: oklch(0.55 0 0);

  /* Semantic */
  --accent: oklch(0.62 0.25 145);
  --error: oklch(0.55 0.22 27);
  --link: oklch(0.62 0.22 200);

  /* Pastel accents */
  --pastel-green: oklch(0.62 0.25 145);
  --pastel-blue: oklch(0.55 0.18 260);
  --pastel-yellow: oklch(0.65 0.22 95);
}
```

### Usage

```css
h1, h2, h3 { color: var(--accent); }
a { color: var(--link); }
.dim { color: var(--dim); }
border { border-color: var(--border); }
```

---

## Unit Reference

| Unit | Use For | Example |
|------|---------|---------|
| `ch` | Widths, max-widths | `max-width: 45ch` |
| `lh` | Line-heights, vertical spacing | `line-height: 1.5` |
| `px` | Borders only | `border: 1px solid` |
| `%` | Forbidden | - |
| `vh/vw` | Only for fixed document heights | `height: calc(100vh - 9ch)` |

---

## Inline Styles Only

No UnoCSS. No cascade. All styles inline.

### Pattern

```tsx
<div style="display: grid; grid-template-columns: 25ch 1fr; height: 100%;">
  <aside style="overflow-y: auto; padding: 1ch; border-right: 1px solid var(--border);">...</aside>
  <section style="padding: 1ch;">...</section>
</div>
```

### Why Inline

1. **No cascade surprises** - styles apply directly to element
2. **Co-located** - CSS and HTML together, easy to read
3. **No build step** - no CSS generation, no extra dependencies
4. **Works for agents** - predictable, no hidden rules

### When to Use

- Layout: `display`, `grid-template-columns`, `flex-direction`
- Sizing: `max-width`, `height`, `padding`, `margin`
- Scrolling: `overflow-y: auto`
- Borders: `border: 1px solid var(--border)`

---

## Minimal Tailwind Integration

Tailwind is the common language of AI agents. Use it for semantic compactness. Keep inline styles as fallback.

### Why Tailwind

1. **Token efficiency** - `class="flex flex-col h-full"` (~12 tokens) vs inline styles (~35 tokens)
2. **Semantic phrases** - `h-full overflow-y-auto` is a single unit AI recognizes
3. **Common language** - AI has seen Tailwind millions of times, knows the patterns

### Minimal Setup

```bash
bun add -D tailwindcss @tailwindcss/cli
```

### Build Command

```bash
npx @tailwindcss/cli -i ./public/css/input.css -o ./public/css/tailwind.css --minify
```

Or add to package.json scripts:

```json
{
  "scripts": {
    "css:build": "npx @tailwindcss/cli -i ./public/css/input.css -o ./public/css/tailwind.css --minify",
    "css:watch": "npx @tailwindcss/cli -i ./public/css/input.css -o ./public/css/tailwind.css --watch"
  }
}
```

Then run:

```bash
bun run css:build   # Build once
bun run css:watch   # Watch for changes
```

### input.css (v4 CSS-first config)

```css
@import "tailwindcss";

@theme {
  /* Map Tailwind to our existing CSS variables */
  --color-bg: var(--bg);
  --color-fg: var(--fg);
  --color-accent: var(--accent);
  --color-border: var(--border);
  --color-dim: var(--dim);
  --color-link: var(--link);
  --color-error: var(--error);
}
```

### Build Command

```bash
npx @tailwindcss/cli -i ./public/css/input.css -o ./public/css/tailwind.css --minify
```

### Usage Pattern

```tsx
<div class="grid grid-cols-[25ch_1fr] h-full">
  <aside class="overflow-y-auto p-1ch border-r border-border h-full">...</aside>
  <section class="p-1ch">...</section>
</div>
```

### Arbitrary Values for ch Units

Tailwind doesn't have `ch` utilities. Use brackets:

```tsx
<!-- Instead of inline styles for ch values -->
<div class="p-[1ch] m-[0.5ch] text-[11px] max-w-[45ch]">

<!-- Grid with ch columns -->
<div class="grid grid-cols-[25ch_20ch_1fr]">
```

### Terminal-Specific Features (Need Style Block)

Some terminal features require CSS that Tailwind can't do inline:

```css
/* In a <style> block */

/* Blinking cursor */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
.cursor-blink {
  animation: blink 1s step-end infinite;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bg);
}
::-webkit-scrollbar-thumb {
  background: var(--border);
}

/* Focus states */
:focus {
  outline: 1px solid var(--accent);
}
```

### When to Use Which

| Feature | Use |
|---------|-----|
| Layout (grid, flex) | Tailwind classes |
| Sizing (w-full, h-full) | Tailwind classes |
| Colors, borders | Tailwind classes |
| Spacing (p-1ch, m-1ch) | Tailwind classes |
| Animations | `<style>` block |
| Scrollbar styling | `<style>` block |
| Complex specificity | Inline styles |

### Safety Rail

If Tailwind class doesn't exist, fall back to inline styles:

```tsx
<!-- Tailwind for standard patterns -->
<div class="flex flex-col h-full">

<!-- Inline for specific values Tailwind doesn't have -->
<div style="max-width: 45ch; height: calc(100vh - 9ch);">
```

---

## Lessons Learned

### The Scrolling Bug

**Problem:** Long-form document scrolled in the panel, not inside the block.

**Failed Approaches:**
- `height: 100%` in flex context (doesn't establish concrete height)
- Relying on UnoCSS `overflow-y-auto` class (cascade interference)
- Section-level scrolling (wrong container)

**Solution:**
```html
<!-- Fixed height, not percentage -->
<article style="height: calc(100vh - 9ch); overflow-y: auto;">
```

**Rule:** When scrolling breaks, use inline styles with concrete `vh`/`ch` values.

### The Cascade Problem

**Problem:** UnoCSS classes were overridden by unknown CSS elsewhere.

**Solution:**
```tsx
// Inline styles override everything
<article style="overflow-y: auto;">

// Or scoped styles
<style>#${id} { overflow-y: auto; }</style>
```

---

## The Vertical Scroll Trap: Technical Post-Mortem

Vertical scrolling defeats AI agents because it requires a **strict chain of custody** for height.

### The Diagnosis: The Infinite Canvas Problem

For `overflow-y: auto` to work, the element must have a constrained height. That height depends on its parent, which depends on its parent, all the way up to `<body>`.

- If **one** element misses `height: 100%`, `flex: 1`, or `min-height: 0`, the chain breaks
- The element thinks it has "infinite space" and expands to fit content instead of scrolling

**Why AI fails:** AI looks at code in chunks. It sees the `<div>` to scroll but lacks "peripheral vision" to check if the parent has a defined height.

### Why Changing Colors Breaks Layout

When asked to "change the background to blue," AI often regenerates the entire tag:

```html
<!-- Previous (working) -->
<div style="display: flex; flex-direction: column; overflow: auto; height: 100%;">

<!-- New (broken) -->
<div style="background: blue; padding: 20px; overflow: auto;">
```

AI "forgets" structural properties because it prioritizes the new instruction and treats CSS properties as independent tags.

### The Solution: Hard Shell Strategy

Do not let AI manage scroll containers. Treat scrolling containers like an iframe—the AI paints inside the room but never touches the frame.

#### The Jail and Prisoner Model

```
┌─────────────────────────────────────┐
│  JAIL (Never modify)               │ ← AI never touches
│  - height: calc(100vh - X)         │
│  - overflow-y: auto                 │
│  - display: flex                    │
├─────────────────────────────────────┤
│  PRISONER (AI can modify)          │ ← AI controls this
│  - colors, fonts, padding           │
│  - content, markup                 │
│  - NO height/overflow               │
└─────────────────────────────────────┘
```

#### The Scroll Zone Snippet

Define this pattern and never let AI modify it:

```css
.scroll-zone {
  /* The layout engine */
  display: flex;
  flex-direction: column;

  /* The scroll magic */
  flex: 1 1 auto;   /* Grow to fill space, shrink if needed */
  min-height: 0;    /* CRITICAL: Allows flex child to shrink below content */
  overflow-y: auto;
}
```

**Why `min-height: 0` matters:** By default, a flex item cannot shrink smaller than its content. Without `min-height: 0`, the container refuses to scroll.

### In Our Implementation

We solved this by using **inline styles with concrete `vh` values**:

```html
<!-- Hard shell: fixed by us, never changes -->
<section style="height: 100%; display: flex; flex-direction: column;">
  <header style="flex-shrink: 0; padding: 1ch; border-bottom: 1px solid var(--border);">
    <!-- Header stays fixed -->
  </header>

  <!-- Scroll zone: content scrolls, AI cannot break the frame -->
  <article style="height: calc(100vh - 9ch); overflow-y: auto;">
    <!-- Content goes here -->
  </article>
</section>
```

**Key insight:** `height: calc(100vh - 9ch)` is concrete. The AI cannot "forget" it because it's a simple arithmetic value, not a percentage chain.

---

## Routes Reference

| Route | Pattern | Scroll |
|-------|---------|--------|
| `/brutalisimo` | Grid of SmartBlocks (standard) | Each block scrolls internally |
| `/brutalisimo-doc` | Single SmartBlock (long-form) | Block scrolls, sidebars don't |

---

## Quick Reference

**When adding a new page:**

1. Use semantic HTML (`article`, `aside`, `section`)
2. Apply `height: 100vh` or `calc(100vh - Xch)` for scroll containers
3. Use `overflow-y: auto` on the element that should scroll
4. Put command hints: `agent-browse --target #${id}`
5. Use `max-width: 45ch` for content, `60ch` for long-form

**When styling breaks:**

1. Check if parent has `overflow: hidden`
2. Use inline styles for specificity: `style="overflow-y: auto"`
3. Use `vh`/`ch` instead of `%`
4. Check for `contain: layout` breaking overflow

---

## Files

- `website/ssr-docs/components/SmartBlock.tsx` - Component implementation
- `website/ssr-docs/templates/brutalisimo.tsx` - Lexicon page
- `website/ssr-docs/templates/brutalisimo-doc.tsx` - Document browser
- `public/css/terminal.css` - Global styles and CSS variables
- `public/css/input.css` - Tailwind imports

---

## The ID Hack: Discoverable UI for Agents

Every element has a fixed address. The browser is a hardware peripheral with memory-mapped I/O.

### ID Naming Convention

| Prefix | Use Case | Example |
|--------|----------|---------|
| `doc-*` | Long-form documents | `doc-00`, `doc-01` |
| `b-*` | SmartBlock tiles | `b-00`, `b-01` |
| `widget-*` | Dashboard widgets | `widget-stats` |
| `section-*` | Content sections | `section-content` |
| `aside-*` | Sidebar panels | `aside-left`, `aside-right` |
| `header-*` | Header components | `header-main` |
| `nav-*` | Navigation | `nav-main` |

### Static Layout IDs

Layout containers get fixed IDs:

```html
<header id="header">...</header>
<nav id="nav">...</nav>
<main id="main">
  <section id="content">...</section>
</main>
<footer id="footer">...</footer>
```

### Dynamic IDs for Content

Server generates indexed IDs during SSR:

```tsx
const docList = docs.map((d, i) =>
  `<li id="doc-${i}">${d.title}</li>`
);

const tocItems = headings.map((h, i) =>
  `<li id="section-${i}">${h}</li>`
);
```

### CSS Targeting: Surgical Styling

Use ID selectors for isolation and specificity:

```css
/* All documents */
[id^="doc-"] .markdown-body { ... }

/* Specific document */
[id="doc-00"] { ... }

/* All SmartBlocks */
[id^="b-"] { ... }

/* Layout containers */
[id="header"] { ... }
[id="content"] { ... }
```

### agent-browser Discovery

IDs enable direct navigation:

```bash
agent-browser find id "header" click
agent-browser find id "aside-left" scroll down
agent-browser find id "doc-00" click
agent-browser find id "section-03" scrollintoview
```

### Benefits

1. **Addressability** - Every element has a fixed address
2. **Discoverability** - `agent-browser find id "..."` finds any element
3. **Isolation** - CSS targeting prevents collisions
4. **Debuggability** - Inspect an element by its ID
5. **AI Understanding** - Consistent pattern AI can learn and use
