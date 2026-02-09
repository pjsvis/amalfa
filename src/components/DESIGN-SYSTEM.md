# Brutalisimo Design System

**Version:** 2.4.0-SSR  
**Stack:** Bun + Hono + JSX (Stateless SSR)  
**Styling:** Tailwind CSS v4 + Inline Geometry

---

## Core Philosophy

Brutalisimo is a "Terminal/Industrial" design system that prioritizes:

1. **Physical Integrity** — Layout constraints enforced at the component level
2. **Agent-Readiness** — Semantic HTML with ARIA state for machine navigation
3. **Streaming-First** — JSONL-based real-time data flow without React complexity
4. **Stateless SSR** — No hydration phase; state lives in DOM attributes

---

## 1. The Layout Substrate (Anti-Grid)

### The Problem with CSS Grid

CSS Grid creates "voids" when content size varies. We use **Flexbox Flow** instead.

### Character-Locked Widths

Text must never stretch to full monitor width. Use `ch` (character) units:

| Width      | Value | Use Case                          |
| ---------- | ----- | --------------------------------- |
| `narrow`   | 45ch  | Lists, stats, dashboards          |
| `standard` | 65ch  | Documentation, markdown, articles |
| `wide`     | 120ch | Data tables, graph visualizations |
| `full`     | 100%  | Use sparingly                     |

### Height Law

Every block must use:

```css
height: fit-content;
min-height: 0;
interpolate-size: allow-keywords;
```

This ensures physical density and allows smooth height transitions.

---

## 2. Component Architecture

### File Structure

```text
src/components/
├── ai-system.d.ts       # Type definitions (THE CONTRACT)
├── layout.tsx           # PageWrapper, ReadingColumn, FlowContainer
├── data-display.tsx     # PipelineRow, StatCard
├── content.tsx          # DocViewer, GraphVizContainer
├── log-stream.tsx       # JSONL-to-UI adapter
├── tc-lib-01.tsx        # SmartBlock, Collapsible
├── tc-switch-dial.tsx   # ToggleSwitch, NumericDial
└── DESIGN-SYSTEM.md     # This file
```

### Component Categories

**Layout Components** (`layout.tsx`)

- `PageWrapper` — HTML shell with Tailwind script
- `ReadingColumn` — Constrained vertical stack with width prop
- `FlowContainer` — Wrapping flex container for cards/widgets

**Data Display** (`data-display.tsx`)

- `PipelineRow` — Status monitoring row (idle/active/warning/error)
- `StatCard` — Metric card with optional trend indicator

**Content** (`content.tsx`)

- `DocViewer` — Markdown viewer with ID-isolated styling
- `GraphVizContainer` — Client-side graph hydration island

**Interactive** (`tc-switch-dial.tsx`)

- `ToggleSwitch` — Self-state toggle with ARIA
- `NumericDial` — Stepper with min/max bounds

---

## 3. The Styling Protocol

### Geometry Law

**Physical properties (width, height, interpolate-size) go in inline `<style>` blocks.**
**Atmospheric properties (colors, borders, typography) use Tailwind classes.**

This ensures:

- Components render correctly with zero external CSS
- Physical integrity is never broken by theme changes
- Geometry is scoped to the component ID

Example:

```tsx
<article
  id={id}
  data-component="block"
  class="bg-bg border border-border antialiased"
>
  <style>{`
    #${id} {
      width: ${width};
      height: fit-content;
      min-height: 0;
      interpolate-size: allow-keywords;
    }
  `}</style>
  {/* content */}
</article>
```

### Tailwind v4 Theme

Define in CSS, not JS config:

```css
@import "tailwindcss";

@theme {
  --color-bg: oklch(0.14 0.01 250);
  --color-fg: oklch(0.88 0.01 250);
  --color-border: oklch(0.32 0.01 250);
  --color-p-blue: oklch(0.85 0.06 230);
  --color-p-yellow: oklch(0.88 0.07 95);
  --color-p-green: oklch(0.85 0.08 145);
  --spacing-lh: 1.5rem;
}
```

### Attribute Targeting

Style via `data-component` and `aria-*` attributes:

```css
[data-component="block"] {
  @apply border border-border h-fit min-h-0;
}

[data-component="block"][aria-busy="true"] {
  @apply opacity-50 cursor-wait;
}
```

---

## 4. ARIA & Agent Interface

### ID Prefixing Convention

All interactive elements use `[type]_[hash]` pattern:

- `block_8f2a` — Content block
- `coll_e110` — Collapsible section
- `switch_f231` — Toggle switch
- `dial_a3b7` — Numeric dial
- `config_max_thresh` — Config-bound element

### State Reflection

Mirror visual state in ARIA attributes:

- `aria-expanded` — For collapsibles
- `aria-busy` — For loading states
- `aria-checked` — For switches
- `aria-live` — For dynamic values

### Landmark Roles

Every page must have:

- One `role="main"` — Primary content
- One `role="status"` — Live updates

---

## 5. Streaming Architecture (JSONL)

### The Protocol

Backend scripts emit JSON Lines to stdout. The UI consumes via `LogStream`:

```typescript
type StreamMessage =
  | {
      type: "log";
      level: "info" | "warn" | "error";
      message: string;
      timestamp: string;
    }
  | {
      type: "stat";
      label: string;
      value: string | number;
      trend?: "up" | "down";
    }
  | {
      type: "pipeline";
      name: string;
      status: "idle" | "active" | "error";
      metric: string;
    };
```

### TypeScript Helper (`dash-logger.ts`)

```typescript
const dash = new Dash(stream);
dash.log("Starting process...");
dash.stat("Processed", 150, "up");
dash.pipeline("Twitter Stream", "active", "1.2k/s");
```

### Python Helper (`dash.py`)

```python
dash = Dash()
dash.log("Starting Python analysis...")
dash.stat("Rows", 1500, "up")
dash.pipeline("ETL", "active", "500/s")
```

### The "DVR" Effect

Save JSONL output for replay:

```bash
bun run ingest.ts > logs/run_01.jsonl
```

Load later to replay the dashboard exactly as it happened.

---

## 6. State in the DOM

### Self-State Components

State lives in `data-*` attributes, not JavaScript objects:

```tsx
<button
  data-state="off"
  data-persist="true"
  onclick="this.dataset.state = this.dataset.state === 'on' ? 'off' : 'on'"
>
```

### Persistence Janitor

A tiny client script mirrors `data-persist` elements to localStorage:

```typescript
document.querySelectorAll("[data-persist]").forEach((el) => {
  const saved = localStorage.getItem(el.id);
  if (saved) el.dataset.state = saved;

  new MutationObserver(() => {
    localStorage.setItem(el.id, el.dataset.state);
  }).observe(el, { attributes: true, attributeFilter: ["data-state"] });
});
```

---

## 7. Compliance Rules

### The "China Shop" Clause

> If you find yourself writing complex JavaScript for a visual toggle, you have failed. Use native `<details>` and `<summary>` instead.

### Unit Lockdown

- **Horizontal:** `ch` units only
- **Vertical:** `lh` (1.5rem) or `fit-content`
- **Forbidden:** `px`, `%`, `auto` heights

### Formatting Law

Opening tags for primary components must format attributes vertically:

```tsx
<article
  id={id}
  data-component="block"
  role="region"
  aria-labelledby={`${id}_label`}
  class="..."
>
```

### Syntax Law

Use Tailwind v4 shorthand for theme variables:

- ✅ `mb-(--spacing-lh)`
- ❌ `mb-[var(--spacing-lh)]`

---

## 8. Auto-Mount Tool Pattern

### The CGI-Bin of the Future

Drop a script into `/scripts/tools/` and it automatically becomes a page.

**Implementation:**

1. Index page scans `/scripts/tools/` for `.ts` or `.py` files
2. Wildcard route `/tools/:script_name` spawns the script
3. Output streams to `LogStream` component

**Metadata Headers:**

```typescript
/**
 * @title AWS Cost Analyzer
 * @desc Scans last month's usage
 * @icon 💰
 */
```

---

## 9. Config Sync (Planned)

### The Closed-Loop Substrate

1. File watcher monitors `config.json`
2. Server broadcasts changes via SSE
3. UI updates only `data-updatable="true"` elements
4. SSOT is always the file, never the UI state

See `briefs/brief-config-watcher-sync-2026-02-08.md` for implementation details.

---

## Quick Reference

### Do

- ✅ Use `to()` monad for async operations
- ✅ Use `ch` units for text width
- ✅ Use `fit-content` for height
- ✅ Mirror state in ARIA attributes
- ✅ Use native `<details>` for collapsibles
- ✅ Emit JSONL for streaming dashboards

### Don't

- ❌ Use React hooks (`useState`, `useEffect`)
- ❌ Use CSS Grid for page layout
- ❌ Use `%` or `px` for text containers
- ❌ Write complex JS for visual toggles
- ❌ Use `console.log` in tool scripts (use `Dash` logger)
