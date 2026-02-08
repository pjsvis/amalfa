# AI Component System (SSR + Hono + Bun)

**Current Version:** 2.4.0-SSR
**Location:** `/scripts/components`

## 🤖 Agent Protocol (Read First)
**DO NOT** generate generic HTML/CSS.
**DO NOT** use React Hooks (`useState`, `useEffect`) — this is a stateless SSR system.
**DO NOT** use CSS Grid for main layouts — use the provided `FlowContainer`.

**ALWAYS** import and use the typed components defined in this directory.
**ALWAYS** use `ch` units for text width (`ReadingColumn`).

---

## 1. Architecture Overview
This system is a **Server-Side Rendered (SSR)** UI built on **Bun + Hono**. It focuses on performance, "Terminal/Industrial" aesthetics, and type safety.

* **Stack:** Bun, Hono, JSX (No Virtual DOM), Tailwind CSS.
* **Styling:** Utility classes (Tailwind) + Scoped ID Isolation (`[id^="doc-"]`).
* **Interactivity:** "Islands" architecture. The server renders HTML; tiny client-side scripts hydrate specific blocks (Graph, Search).

## 2. File Structure
```text
/scripts/components/
├── ai-system.d.ts       # THE CONTRACT: Type definitions and JSDoc rules.
├── Layout.tsx           # Page wrappers, Columns, Flow containers.
├── DataDisplay.tsx      # Stat cards, Pipeline rows, Status indicators.
├── Content.tsx          # Markdown viewers, Graph containers.
└── README.md            # This file.
```

---

## 3. Core Design Principles

### A. The "Flow" Layout (Anti-Grid)

We avoid CSS Grid for page-level layout because it creates "voids" when content size varies.

* **Use:** `FlowContainer` (Flexbox wrapping).
* **Behavior:** Items naturally flow left-to-right and wrap to the next line.
* **Code:**
```tsx
<FlowContainer gap="normal">
  <StatCard ... />
  <StatCard ... />
  <StatCard ... />
</FlowContainer>

```



### B. The "Reading" Width

Text must never stretch to the full width of a monitor. We use `ch` (character) units to enforce readability.

* **`width="narrow"` (45ch):** Lists, Stats, Dashboards.
* **`width="standard"` (65ch):** Documentation, Markdown, Articles.
* **`width="wide"` (120ch):** Data Tables, Graph Visualizations.

### C. Component Isolation (Markdown)

Raw Markdown content is dangerous for global CSS. We use **ID-Attribute Isolation**.

* **Mechanism:** `[id^="doc-"]` selectors in `Layout.tsx`.
* **Usage:**
```tsx
<DocViewer docId="01" contentHtml="..." />

```


*The `DocViewer` automatically assigns `id="doc-01"`, protecting the rest of the page from the Markdown styles.*

---

## 4. Component Reference

### Layout (`Layout.tsx`)

| Component | Prop | Options | Description |
| --- | --- | --- | --- |
| **PageWrapper** | `title` | `string` | The HTML `<html>` shell. Includes Tailwind script and global CSS resets. |
| **ReadingColumn** | `width` | `'narrow' | 'standard' | 'wide'` | The primary vertical stack. Centers content. |
| **FlowContainer** | `gap` | `'tight' | 'normal' | 'loose'` | A wrapping flex container for cards/widgets. |

### Data Display (`DataDisplay.tsx`)

| Component | Prop | Options | Description |
| --- | --- | --- | --- |
| **PipelineRow** | `status` | `'idle' | 'active' | 'warning' | 'error'` | A row in a monitoring list. Status controls color (Gray/Green/Yellow/Red). |
|  | `metric` | `string` | Right-aligned data point (e.g., "500ms"). |
| **StatCard** | `trend` | `'up' | 'down'` | A simple box with a Label, Value, and Trend arrow. |

### Content (`Content.tsx`)

| Component | Prop | Options | Description |
| --- | --- | --- | --- |
| **DocViewer** | `docId` | `string` | **REQUIRED.** Creates the styling sandbox. |
|  | `contentHtml` | `string` | Pre-rendered HTML string. |
| **GraphVizContainer** | `dataUrl` | `string` | URL to fetch graph JSON. Renders an empty div for client-side hydration. |

---

## 5. Usage Examples for Agents

### Scenario A: Dashboard Page

"Create a status dashboard showing 3 active pipelines and a system load stat."

```tsx
import { PageWrapper, ReadingColumn, FlowContainer, StatCard, PipelineRow } from "./components";

export default function Dashboard() {
  return (
    <PageWrapper title="Ops Dashboard">
      <ReadingColumn width="wide">
        
        {/* Top Stats */}
        <FlowContainer gap="normal">
          <StatCard label="CPU Load" value="45%" trend="up" />
          <StatCard label="Memory" value="12GB" />
        </FlowContainer>

        {/* Pipeline List */}
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-white">Ingestion Pipelines</h2>
            <PipelineRow name="Twitter Firehose" status="active" lastUpdated="Live" metric="1.2k/s" />
            <PipelineRow name="RSS Aggregator" status="idle" lastUpdated="5m ago" metric="0/s" />
            <PipelineRow name="Legacy Import" status="error" lastUpdated="1h ago" metric="Failed" />
        </div>

      </ReadingColumn>
    </PageWrapper>
  );
}

```

### Scenario B: Documentation Page

"Render the README.md content."

```tsx
import { PageWrapper, ReadingColumn, DocViewer } from "./components";

export default function Docs({ html }: { html: string }) {
  return (
    <PageWrapper title="Documentation">
      <ReadingColumn width="standard">
        <DocViewer docId="readme" contentHtml={html} meta={{ title: "Project Readme", date: "2024-05-20" }} />
      </ReadingColumn>
    </PageWrapper>
  );
}

```

## 6. Config & IDE Troubleshooting

### The "JSX Element Implicitly has type 'any'" Error
If you see red squigglies on standard HTML tags (e.g., `<div />`, `<p />`) in your editor, it means TypeScript is looking for React definitions instead of Hono's.

**The Fix:**
Ensure your `tsconfig.json` is configured to use the Hono JSX factory.

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx", 
    "types": ["bun"] 
  }
}