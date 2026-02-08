Here is the **Master Interface Definition** for your system.

This file is designed to be **injected directly into your AI agent's context window**. It serves two purposes:

1. **Strict Typing:** It prevents the AI from hallucinating invalid props.
2. **Semantic Instruction:** The JSDoc comments guide the AI on *when* and *how* to use each component (e.g., "Use `narrow` for lists").

Save this as `ai-system.d.ts` or `components.d.ts`.

### The AI System Protocol (`ai-system.d.ts`)

[ai-system.d.ts](ai-system.d.ts)
---

### How to Implement This "Contract"

You don't need to rewrite your whole app immediately. Instead, use this strictly for the **Agent's Output**.

1. **Feed the File:** Copy the code block above into a file named `ai-system.d.ts`.
2. **Prompt the Agent:**
> "I need a dashboard page that shows the status of 3 ingestion pipelines and a graph visualization of our knowledge base. Use the components defined in `ai-system.d.ts`. Do not invent new CSS classes; use the `ReadingColumn` and `PipelineRow` components."


3. **The Result:**
The Agent will generate code like this:
```tsx
import { PageWrapper, ReadingColumn, PipelineRow, GraphVizContainer } from './components';

export default function Dashboard() {
  return (
    <PageWrapper title="System Status">
      {/* Top Section: Pipelines */}
      <ReadingColumn width="narrow">
        <h2 className="text-xl font-bold mb-4">Ingestion Pipelines</h2>
        <PipelineRow name="Twitter Stream" status="active" lastUpdated="Live" metric="1,204 tweets" />
        <PipelineRow name="RSS Feeds" status="idle" lastUpdated="10m ago" metric="45 feeds" />
        <PipelineRow name="PDF Parser" status="error" lastUpdated="1h ago" metric="FAILED" />
      </ReadingColumn>

      {/* Bottom Section: Graph */}
      <ReadingColumn width="wide">
         <h2 className="text-xl font-bold mb-4 mt-8">Knowledge Graph</h2>
         <GraphVizContainer dataUrl="/api/graph/main" height="500px" />
      </ReadingColumn>
    </PageWrapper>
  );
}

```

### Why This Works better than standard prompting

Notice the Agent didn't try to write `<div style="display: flex...">` or `<div class="col-span-3">`. It used the **semantic components** you defined.

* It knew `width="narrow"` was correct for the list.
* It knew `width="wide"` was correct for the graph.
* It didn't try to `npm install react-graph-vis`; it used your `GraphVizContainer` island.

This is the bridge between your **Hono/Bun backend** and the **AI's generation capabilities**.