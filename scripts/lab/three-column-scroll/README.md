# Three-Column Independent Scroll (Brutalisimo Pattern)

**Experiment:** `scripts/lab/three-column-scroll/index.html`

Based on `@public/docs/playbooks/css-brutalisimo-manifesto.md` and `@public/docs/playbooks/css-brutalisimo-playbook.md`

## Visual Structure

```
┌────────────────────────────────────────┐
│ HEADER (fixed 3ch)                     │
├────────┬────────┬─────────────────────┤
│ SIDEBAR│  TOC   │ CONTENT           │  ← Each scrolls independently
│        │        │                     │
├────────┴────────┴─────────────────────┤
│ FOOTER (fixed 2ch)                     │
└────────────────────────────────────────┘
```

## Brutalisimo CSS Pattern

```css
:root {
  --bg: oklch(0.18 0 0);
  --fg: oklch(0.75 0 0);
  --accent: oklch(0.62 0.25 145);
  --dim: oklch(0.78 0.22 100);
  --border: oklch(0.88 0 0);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

/* === VIEWPORT: NO SCROLLING === */
html, body {
  height: 100vh;
  overflow: hidden;
}

body {
  display: grid;
  grid-template-rows: 3ch 1fr 2ch;
}

header {
  grid-row: 1;
  border-bottom: 1px solid var(--border);
}

footer {
  grid-row: 3;
  border-top: 1px solid var(--border);
}

/* === MAIN: 3-Column Grid === */
main {
  grid-row: 2;
  display: grid;
  grid-template-columns: 25ch 20ch 1fr;
  overflow: hidden;  /* Main CONTAINS scroll, doesn't scroll */
}

/* === SCROLLABLE COLUMNS: Only these scroll === */
.scroll-col {
  overflow-y: auto;
  overflow-x: hidden;
  border-right: 1px solid var(--border);
}

.scroll-col:last-child {
  border-right: none;
}
```

## Critical Rules (From Brutalisimo Manifesto)

| Layer | Property | Value |
|-------|----------|-------|
| Viewport | `overflow` | `hidden` |
| Body | `display` | `grid` with rows |
| Main | `overflow` | `hidden` |
| Columns | `overflow-y` | `auto` |

### The Bouncer Philosophy

> "Apply `overflow: hidden` to the Body. Apply `overflow-y: auto` only to `.sidebar` and `.content-area`."
> — CSS-Brutalisimo Playbook

### Grid Units

> "Use only `ch` (width) and `lh` (line-height/1.5rem). Never use `%` or `vh/vw` for component sizing."
> — The Brutal Engine

## HTML Structure

```html
<body>
  <header>...</header>
  
  <main>
    <aside class="scroll-col">...</aside>
    <aside class="scroll-col">...</aside>
    <section class="scroll-col">...</section>
  </main>
  
  <footer>...</footer>
</body>
```

## What Breaks It

```css
/* BAD: Column missing height */
.scroll-col {
  overflow-y: auto;
  /* height: 100% missing */
}

/* BAD: Main has overflow: auto (global scroll) */
main {
  overflow: auto;  /* Wrong! */
}

/* BAD: Using % for widths */
main {
  grid-template-columns: 33% 25% 1fr;  /* Wrong! */
}
```

## What Works

```css
main {
  grid-template-columns: 25ch 20ch 1fr;  /* ch units */
}

.scroll-col {
  height: 100%;
  overflow-y: auto;
}
```

## Test Results

Open `index.html` in browser:
- [x] Header fixed at top
- [x] Footer fixed at bottom
- [x] Three columns scroll independently
- [x] No global scrollbars

## References

- `@public/docs/playbooks/css-brutalisimo-manifesto.md`
- `@public/docs/playbooks/css-brutalisimo-playbook.md`
- `@public/docs/playbooks/css-playbook.md` - GOTCHA #1: The Overflow Trap
