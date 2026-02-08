This is a strong set of requirements. You have a mix of **static, text-heavy content** (Markdown docs) and **dynamic, visual data** (GraphViz, Stats, Pipelines).

Since you are using **Bun + Hono + SSR + JSX**, you have a unique opportunity to build a "Hybrid Hypermedia" system. The server renders the heavy lifting (Markdown, Layouts), and you sprinkle just enough client-side JavaScript for the Graph and Search.

Here are three concrete proposals to leverage your stack, focusing on your specific constraints like `ch` units and component isolation.

---

### Proposal 1: The "Character-Perfect" Layout System

**Goal:** Enforce `fit-content` and readable line lengths using character units (`ch`), matching your terminal aesthetic.

Instead of generic responsive breakpoints (sm, md, lg), define your layout containers by **Reading Complexity**.

**The Pattern:**
Create a wrapper component that strictly enforces width based on character count. This ensures your long-form text never stretches into unreadable "walls of text" on wide monitors.

```tsx
// components/Layout/ReadingColumn.tsx
interface ReadingColumnProps {
  children: JSX.Element;
  width?: 'narrow' | 'standard' | 'wide'; // TypeScript prevents arbitrary sizes
}

export const ReadingColumn = ({ children, width = 'standard' }: ReadingColumnProps) => {
  // Map abstract sizes to concrete 'ch' units
  const widthClasses = {
    narrow: 'max-w-[45ch]',   // Great for lists/stats
    standard: 'max-w-[65ch]', // Perfect for Markdown/Docs
    wide: 'max-w-[120ch]',    // Necessary for Data Tables/Pipelines
  };

  return (
    <div className={`mx-auto w-full ${widthClasses[width]} px-4`}>
      {children}
    </div>
  );
};

```

**Why this works for AI:**

* The AI doesn't have to guess pixel values or percentages.
* It just picks `width="standard"` for docs and `width="wide"` for the ingestion pipeline table.
* It forces the "Terminal" look where whitespace is respected.

---

### Proposal 2: The "Isolated" Document Viewer

**Goal:** Render long-form SSR Markdown with zero style leakage, using your `[id^="doc-"]` pattern.

**The Strategy:**
Use a "Smart Wrapper" component that auto-generates the ID and applies the isolation scope.

```tsx
// components/Document/DocViewer.tsx
interface DocViewerProps {
  contentHtml: string;
  docId: string; // e.g., "01", "02"
}

export const DocViewer = ({ contentHtml, docId }: DocViewerProps) => {
  const wrapperId = `doc-${docId}`;
  
  return (
    <article 
      id={wrapperId} 
      // The CSS wildcard [id^="doc-"] handles the typography reset here
      className="prose prose-invert prose-green min-h-[50vh]" 
    >
       {/* Safe injection of pre-rendered HTML */}
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </article>
  );
};

```

**AI Instruction:**
"When rendering a markdown file, wrap it in `<DocViewer>` and pass the content. Do not attempt to style `h1` or `p` tags manually; the ID isolation handles it."

---

### Proposal 3: The "Client-Side Islands" (Graph & Search)

**Goal:** Integrate the Sigma.js UI and Amalfa Search without breaking the SSR model.

Since Sigma.js requires the DOM (Canvas/WebGL) and Amalfa requires user input, these are your "Islands of Interactivity."

#### A. The Graph Visualization (The "Portal")

Do not try to SSR the graph. SSR a **placeholder** and let a tiny client-side script "hydrate" it.

```tsx
// components/Visuals/GraphContainer.tsx
export const GraphContainer = ({ dataUrl }: { dataUrl: string }) => {
  return (
    <div className="relative w-full h-[600px] border border-gray-700 bg-black overflow-hidden">
      {/* 1. The Container for Sigma.js to latch onto */}
      <div id="sigma-container" className="absolute inset-0" />
      
      {/* 2. The Script that boots the graph (Lazy Loaded) */}
      <script type="module" dangerouslySetInnerHTML={{ __html: `
        import { initGraph } from '/static/js/graph-loader.js';
        initGraph('sigma-container', '${dataUrl}');
      `}} />
    </div>
  );
};

```

#### B. The Search "Command Palette"

For the Amalfa Search, avoid complex React state. Use the native HTML `<dialog>` element. It is robust, accessible, and works perfectly with vanilla JS.

* **Trigger:** A global "Search" button or `/` keypress.
* **UI:** A modal utilizing your `ReadingColumn` (narrow width).
* **Result:** The search results are just a list of links (SSR rendered or fetched via simple `fetch`).

---

### Proposal 4: The Ingestion Dashboard (Live Data)

**Goal:** Monitor pipeline status (Red/Green/Yellow) and stats.

Since you likely don't want a full React SPA but need "live" updates, use **Meta-Refresh** or **HTMX-style Polling** for the dashboard pages.

**The "Status Matrix" Component:**

```tsx
// components/Dashboard/PipelineRow.tsx
interface PipelineStatus {
  name: string;
  status: 'idle' | 'processing' | 'error';
  lastRun: string;
  itemsProcessed: number;
}

export const PipelineRow = ({ name, status, lastRun, itemsProcessed }: PipelineStatus) => {
  const statusColors = {
    idle: 'bg-gray-500',
    processing: 'bg-green-500 animate-pulse', // Tailwind animation!
    error: 'bg-red-500',
  };

  return (
    <div className="flex justify-between border-b border-gray-800 py-2 font-mono">
      <span>{name}</span>
      <div className="flex items-center gap-4">
        <span>{itemsProcessed.toLocaleString()} items</span>
        <span className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
      </div>
    </div>
  );
};

```

**The "Live" Header:**
In your Hono route for the dashboard:

```javascript
// routes/monitor.tsx
app.get('/monitor', (c) => {
  return c.html(
    <html>
      <head>
        {/* Refresh page every 30 seconds for "poor man's real-time" */}
        <meta http-equiv="refresh" content="30" /> 
      </head>
      <body>
         {/* Render PipelineRows here */}
      </body>
    </html>
  );
});

```

This is surprisingly effective for internal dashboards. It requires zero client-side JS logic and is "unkillable."

---

### Summary of Recommendations

1. **Layout:** Use a `max-w-[ch]` system. It is the only way to make text look good on ultra-wide monitors without complex grids.
2. **Documents:** Lean hard into the `[id^="doc-"]` selector. It is your "namespace" for styling raw markdown.
3. **GraphViz:** Treat it as an `<iframe>`-style isolated app. Don't let its CSS or JS bleed into the main document viewer.
4. **Pipelines:** Use Typed Components (`<PipelineRow status='error' />`) to ensure the AI always picks the correct color codes (Red/Green).

**Next Step:**
Would you like me to sketch out the **Typed Interface definitions (`.d.ts`)** for these components? You can then feed that file directly to your AI agent to ensure it "knows" exactly which building blocks it has available.

