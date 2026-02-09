# AI Component System (SSR + Hono + Bun)

**Current Version:** 2.4.0-SSR  
**Location:** `/src/components`

---

## 🤖 Agent Protocol (Read First)

**DO NOT** generate generic HTML/CSS.  
**DO NOT** use React Hooks (`useState`, `useEffect`) — this is a stateless SSR system.  
**DO NOT** use CSS Grid for main layouts — use the provided `FlowContainer`.

**ALWAYS** import and use the typed components defined in this directory.  
**ALWAYS** use `ch` units for text width (`ReadingColumn`).

---

## 1. Architecture Overview

This system is a **Server-Side Rendered (SSR)** UI built on **Bun + Hono**. It focuses on performance, "Terminal/Industrial" aesthetics, and type safety.

- **Stack:** Bun, Hono, JSX (No Virtual DOM), Tailwind CSS.
- **Styling:** Utility classes (Tailwind) + Scoped ID Isolation (`[id^="doc-"]`).
- **Interactivity:** "Islands" architecture. The server renders HTML; tiny client-side scripts hydrate specific blocks (Graph, Search, LogStream).
- **Type Safety:** All components typed via `ai-system.d.ts`.

---

## 2. File Structure

```text
src/components/
├── ai-system.d.ts              # THE CONTRACT: Type definitions and JSDoc rules
├── layout.tsx                  # Page wrappers, Columns, Flow containers
├── data-display.tsx            # Stat cards, Pipeline rows, Status indicators
├── content.tsx                 # Markdown viewers, Graph containers
├── log-stream.tsx              # Real-time streaming log viewer (island)
├── toggle-switch.tsx           # Interactive toggle switch and numeric dial (islands)
├── smart-block.tsx             # Smart content blocks and collapsible containers
├── auto-mount-tool-runner.tsx  # Hono router for dynamic tool execution UI
├── dash-logger.ts              # JSONL streaming logger utility
├── check-system.ts             # System diagnostics worker
├── dash-py-hono-controller.ts  # Python-Bun bridge for streaming
└── README.md                   # This file
```

---

## 3. Core Design Principles

### A. Stateless SSR Components

All components in this directory are **stateless**. They receive props and render HTML. No client-side state management, no hooks.

```tsx
// CORRECT: Stateless, receives all data via props
export const StatCard = ({ label, value, trend }: StatCardProps) => (
  <div className="border border-gray-800 bg-neutral-900 p-4">
    <div className="text-xs text-gray-500 uppercase">{label}</div>
    <div className="text-2xl font-bold text-white">{value}</div>
  </div>
);

// WRONG: Do not use React hooks
// const [count, setCount] = useState(0); // ❌ Not allowed
```

### B. The "Flow" Layout (Anti-Grid)

We avoid CSS Grid for page-level layout because it creates "voids" when content size varies.

- **Use:** `FlowContainer` (Flexbox wrapping).
- **Behavior:** Items naturally flow left-to-right and wrap to the next line.
- **Why:** Grid cells maintain size even when content is missing, creating awkward empty spaces.

```tsx
<FlowContainer gap="normal">
  <StatCard label="CPU" value="45%" />
  <StatCard label="Memory" value="12GB" />
  <StatCard label="Disk" value="234GB" />
  {/* Items flow and wrap naturally */}
</FlowContainer>
```

### C. The "Reading" Width

Text must never stretch to the full width of a monitor. We use `ch` (character) units to enforce readability.

| Width      | Size  | Use Case                             |
| ---------- | ----- | ------------------------------------ |
| `narrow`   | 45ch  | Lists, Stats, Dashboards             |
| `standard` | 65ch  | Documentation, Markdown, Articles    |
| `wide`     | 120ch | Data Tables, Graph Visualizations    |
| `full`     | 100%  | Rarely used - only for special cases |

```tsx
<ReadingColumn width="standard">
  {/* Content constrained to 65ch max-width */}
  <DocViewer docId="readme" contentHtml={html} />
</ReadingColumn>
```

### D. Component Isolation (Markdown)

Raw Markdown content is dangerous for global CSS. We use **ID-Attribute Isolation**.

**Mechanism:** `[id^="doc-"]` selectors in `layout.tsx` apply typography styles only within isolated containers.

```tsx
// The DocViewer assigns id="doc-{docId}", creating a style sandbox
<DocViewer docId="readme" contentHtml={html} />

// Results in:
// <article id="doc-readme">
//   <h1>, <p>, <code>, etc. get isolated styles
// </article>
```

**CSS selectors in PageWrapper:**

```css
[id^="doc-"] h1 {
  @apply text-2xl font-bold text-white mb-4;
}
[id^="doc-"] h2 {
  @apply text-xl font-semibold text-gray-100 mb-3;
}
[id^="doc-"] p {
  @apply mb-4 leading-relaxed;
}
[id^="doc-"] code {
  @apply bg-gray-900 px-1 py-0.5 rounded text-green-400;
}
```

### E. "Islands" Architecture

Some components need client-side interactivity. We use the Islands pattern: SSR the shell, hydrate with minimal client JS.

**Island Components:**

- `LogStream` - Real-time log streaming via EventSource
- `GraphVizContainer` - Client-side graph rendering (Sigma.js)
- `ToggleSwitch` / `NumericDial` - Interactive controls

**Pattern:**

```tsx
// Server renders container + inline script
<div id={islandId}>
  <script
    dangerouslySetInnerHTML={{
      __html: `// Client-side hydration logic`,
    }}
  />
</div>
```

---

## 4. Component Reference

### Layout (`layout.tsx`)

Core page structure components. Every page starts with `PageWrapper`.

| Component         | Props                                                  | Description                                                                                 |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **PageWrapper**   | `title?: string`, `children`                           | HTML shell with Tailwind CDN, global CSS resets, and markdown isolation styles.             |
| **ReadingColumn** | `width?: ReadingWidth`, `padded?: boolean`, `children` | Constrains content width using character units. Centers content horizontally.               |
| **FlowContainer** | `gap?: 'tight' \| 'normal' \| 'loose'`, `children`     | Flexbox row that wraps. Use for cards, stats, or any collection that should flow naturally. |

**Example:**

```tsx
<PageWrapper title="Dashboard">
  <ReadingColumn width="wide">
    <FlowContainer gap="normal">
      <StatCard label="Nodes" value={stats.nodes} />
      <StatCard label="Edges" value={stats.edges} />
    </FlowContainer>
  </ReadingColumn>
</PageWrapper>
```

### Data Display (`data-display.tsx`)

Components for metrics, monitoring, and operational dashboards.

| Component       | Props                                                                                      | Description                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **StatCard**    | `label: string`, `value: string \| number`, `trend?: 'up' \| 'down'`                       | Simple metric display with optional trend indicator.                                                                      |
| **PipelineRow** | `name: string`, `status: SystemStatus`, `lastUpdated: string`, `metric?: string \| number` | Status row for pipelines or processes. Status affects color (idle=gray, active=green pulsing, warning=yellow, error=red). |

**Types:**

```typescript
type SystemStatus = "idle" | "active" | "warning" | "error";
type ReadingWidth = "narrow" | "standard" | "wide" | "full";
```

**Example:**

```tsx
<PipelineRow
  name="Twitter Firehose"
  status="active"
  lastUpdated="Live"
  metric="1.2k/s"
/>
<PipelineRow
  name="RSS Aggregator"
  status="idle"
  lastUpdated="5m ago"
  metric="0/s"
/>
<PipelineRow
  name="Legacy Import"
  status="error"
  lastUpdated="1h ago"
  metric="Failed"
/>
```

### Content (`content.tsx`)

Components for displaying rich content.

| Component             | Props                                                                                             | Description                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **DocViewer**         | `docId: string`, `contentHtml: string`, `meta?: { title: string, date: string, tags?: string[] }` | Renders pre-rendered HTML with style isolation. Required `docId` creates the CSS sandbox.         |
| **GraphVizContainer** | `dataUrl: string`, `height?: string`                                                              | Empty container that client-side script hydrates with Sigma.js graph. Height defaults to "600px". |

**Example:**

```tsx
// Render markdown content
<DocViewer
  docId="architecture"
  contentHtml={markdownHtml}
  meta={{ title: "Architecture", date: "2024-05-20" }}
/>

// Graph visualization
<GraphVizContainer
  dataUrl="/api/graph/entities.json"
  height="500px"
/>
```

### Streaming & Interactive Islands

Components that require client-side JavaScript.

| Component        | Location            | Props                                                                          | Description                                                                 |
| ---------------- | ------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **LogStream**    | `log-stream.tsx`    | `streamUrl: string`                                                            | Real-time streaming log viewer. Connects to JSONL endpoint via EventSource. |
| **ToggleSwitch** | `toggle-switch.tsx` | `id: string`, `label: string`, `persist?: boolean`                             | Interactive toggle switch with state.                                       |
| **NumericDial**  | `toggle-switch.tsx` | `id: string`, `label: string`, `min?: number`, `max?: number`, `step?: number` | Stepper control for numeric values.                                         |
| **SmartBlock**   | `smart-block.tsx`   | `content: string`, `hash: string`, `size?: 'std' \| 'long'`, `title?: string`  | Content block with Bun.Markdown rendering.                                  |
| **Collapsible**  | `smart-block.tsx`   | `title: string`, `children`, `hash: string`, `open?: boolean`                  | Expandable/collapsible content section.                                     |

### Utilities & Workers

| File                           | Exports          | Purpose                                                                                  |
| ------------------------------ | ---------------- | ---------------------------------------------------------------------------------------- |
| **ai-system.d.ts**             | Type definitions | Central type contract for all components. Import types from here.                        |
| **dash-logger.ts**             | `Dash` class     | Utility for streaming structured JSONL logs to clients. Used with `LogStream` component. |
| **check-system.ts**            | `app` (Hono)     | Worker that emits diagnostic data as JSONL stream.                                       |
| **dash-py-hono-controller.ts** | `app` (Hono)     | Bridge to spawn Python processes and stream their output.                                |
| **auto-mount-tool-runner.tsx** | `app` (Hono)     | Dynamic UI generator for tools in `/scripts/tools`.                                      |

---

## 5. Usage Patterns

### Pattern A: Dashboard with Real-time Updates

Combine `StatCard`, `PipelineRow`, and `LogStream` for monitoring interfaces.

```tsx
import {
  PageWrapper,
  ReadingColumn,
  FlowContainer,
  StatCard,
  PipelineRow,
} from "./layout";
import { LogStream } from "./log-stream";

export default function DashboardPage() {
  return (
    <PageWrapper title="System Monitor">
      <ReadingColumn width="wide">
        {/* Stats Overview */}
        <FlowContainer gap="normal">
          <StatCard label="CPU" value="45%" trend="up" />
          <StatCard label="Memory" value="12GB" />
          <StatCard label="Uptime" value="14d 3h" />
        </FlowContainer>

        {/* Pipeline Status */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Active Pipelines</h2>
          <PipelineRow
            name="Ingestion"
            status="active"
            metric="1.2k/s"
            lastUpdated="Live"
          />
          <PipelineRow
            name="Processing"
            status="idle"
            metric="0/s"
            lastUpdated="5m ago"
          />
        </div>

        {/* Live Logs */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">System Logs</h2>
          <LogStream streamUrl="/stream/system-check" />
        </div>
      </ReadingColumn>
    </PageWrapper>
  );
}
```

### Pattern B: Documentation Viewer

Use `DocViewer` with markdown pre-rendered to HTML.

```tsx
import { PageWrapper, ReadingColumn, DocViewer } from "./layout";

export default function DocPage({ html, meta }: { html: string; meta: any }) {
  return (
    <PageWrapper title={meta.title}>
      <ReadingColumn width="standard">
        <DocViewer
          docId={meta.id}
          contentHtml={html}
          meta={{ title: meta.title, date: meta.date }}
        />
      </ReadingColumn>
    </PageWrapper>
  );
}
```

### Pattern C: Tool Runner Interface

The `auto-mount-tool-runner.tsx` provides a generic UI for any script in `/scripts/tools`.

```tsx
// This file creates a complete tool browser and runner
import app from "./auto-mount-tool-runner";

// GET / - Lists all tools
// GET /view/:script - Shows UI for running specific tool
// GET /stream/:script - Streams JSONL output from tool execution
```

### Pattern D: Streaming Python Output

Use `dash-py-hono-controller.ts` to bridge Python scripts into the UI.

```tsx
import pyBridge from "./dash-py-hono-controller";

// GET /stream/python-job spawns Python and streams output
// The Python script must output JSONL to stdout:
// {"type": "log", "level": "info", "message": "Processing..."}
```

---

## 6. Type System

All components are typed via `ai-system.d.ts`. Import types directly from there:

```tsx
import type {
  StatCardProps,
  PipelineRowProps,
  SystemStatus,
} from "./ai-system";

function processStatus(status: SystemStatus): string {
  // Type-safe status handling
  const labels = {
    idle: "Idle",
    active: "Running",
    warning: "Warning",
    error: "Error",
  };
  return labels[status];
}
```

**Key Type Exports:**

- `ReadingWidth` - 'narrow' | 'standard' | 'wide' | 'full'
- `SystemStatus` - 'idle' | 'active' | 'warning' | 'error'
- `PageWrapperProps` - Props for PageWrapper
- `ReadingColumnProps` - Props for ReadingColumn
- `FlowContainerProps` - Props for FlowContainer
- `DocViewerProps` - Props for DocViewer
- `GraphVizContainerProps` - Props for GraphVizContainer
- `StatCardProps` - Props for StatCard
- `PipelineRowProps` - Props for PipelineRow

---

## 7. Configuration & IDE Setup

### The "JSX Element Implicitly has type 'any'" Error

If you see red squigglies on standard HTML tags (e.g., `<div />`, `<p />`) in your editor, TypeScript is looking for React definitions instead of Hono's.

**The Fix:**

Ensure `tsconfig.json` uses Hono's JSX factory:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "types": ["bun"]
  }
}
```

**Restart TypeScript service** after changing this configuration.

### Editor Recommendations

- **VS Code:** Install "Tailwind CSS IntelliSense" for class autocomplete
- **TypeScript:** Enable strict mode for full type checking

---

## 8. Design Philosophy

### Why These Patterns?

1. **No React Hooks** - This is SSR, not SPA. State lives on the server or in the URL.
2. **No CSS Grid for Layout** - Grid creates rigid structures that break with dynamic content.
3. **Character Units** - `ch` scales with font size, maintaining readability across devices.
4. **Islands, Not SPA** - Hydrate only what needs interactivity. Everything else is static HTML.
5. **Type-First** - The `ai-system.d.ts` contract prevents drift between design intent and implementation.

### Terminal/Industrial Aesthetic

- **Colors:** Neutral grays, accent colors for status (green=good, red=error, yellow=warning)
- **Typography:** Monospace for data, sans-serif for UI chrome
- **Borders:** Sharp, thin borders (`border-gray-800`) for structure
- **Spacing:** Systematic spacing using `ch` and `lh` units

---

## 9. Common Mistakes to Avoid

### ❌ Using React Hooks

```tsx
// WRONG - This is SSR, hooks don't exist here
const [count, setCount] = useState(0);
```

### ❌ CSS Grid for Page Layout

```tsx
// WRONG - Creates layout voids
<div className="grid grid-cols-3">...</div>

// RIGHT - Flows naturally
<FlowContainer gap="normal">...</FlowContainer>
```

### ❌ Full-Width Text

```tsx
// WRONG - Unreadable on wide screens
<div className="w-full">{longText}</div>

// RIGHT - Constrained reading width
<ReadingColumn width="standard">{longText}</ReadingColumn>
```

### ❌ Unisolated Markdown

```tsx
// WRONG - Markdown styles leak globally
<div dangerouslySetInnerHTML={{ __html: markdownHtml }} />

// RIGHT - Isolated sandbox
<DocViewer docId="page-1" contentHtml={markdownHtml} />
```

---

## 10. File Naming Conventions

- **Components:** `kebab-case.tsx` (e.g., `toggle-switch.tsx`, `smart-block.tsx`)
- **Types:** `ai-system.d.ts` (central type definitions)
- **Utilities:** `kebab-case.ts` (e.g., `dash-logger.ts`)
- **Workers:** Descriptive name with `-controller` or `-runner` suffix

---

## 11. Related Files

- [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) — Philosophy, styling protocol, and compliance rules
- `website/ssr-docs/components/SmartBlock.tsx` - Separate string-based SmartBlock for Brutalisimo templates (different implementation, same concept)
- `website/ssr-docs/templates/` - Page templates using these components
- `tsconfig.json` - Must have `jsxImportSource: "hono/jsx"`

---

## 12. Archive

Superseded design documents are stored in `./archive/`:

- `aria.md` — ARIA integration discussion (consolidated into DESIGN-SYSTEM.md)
- `auto-mount-tool-runner.md` — Tool runner design (consolidated into DESIGN-SYSTEM.md)
- `brutalisimo-blueprint.html` — Original HTML prototype
- `cloud-events-*.md` — CloudEvents protocol discussion
- `dash-logger.md` — Logger design discussion
- `dash.py` — Python Dash helper (active counterpart to `dash-logger.ts`)

---

**For examples, see:** `website/ssr-docs/templates/`
