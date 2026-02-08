### Opinion: The "Auto-Mount" Pattern

You are describing the **"CGI-Bin" of the future.**
In the old days of the web, if you dropped a script into `cgi-bin`, it automatically became a page. You didn't need to rebuild the router, update the nav bar, or recompile the app. You just dropped the file, and it worked.

This is exactly what **Brutalisimo** should do. The Agent shouldn't just "write code"; it should "install tools."

### The Pattern: `new-functionality => auto-mount => new-page`

We can achieve this without complex routing logic. We just need a **Dynamic Tool Registry**.

#### 1. The Strategy

Instead of hardcoding routes like `app.get('/ingest')`, we create a single **Wildcard Runner** route: `app.get('/tools/:script_name')`.

* **Step 1:** The Agent saves a new script to `/scripts/tools/my-new-tool.ts`.
* **Step 2:** The "Index Page" automatically scans that folder and adds a link.
* **Step 3:** Clicking the link triggers the Wildcard Runner, which spawns the script and streams the output.

**Result:** The Agent never touches your `index.tsx` or router. It just drops a file, and the UI adapts instantly.

---

### 2. The Implementation

Here is how we upgrade your Hono server to be an **"Auto-Mounting Tool Runner."**

**The Server (`src/index.tsx`)**

```typescript
import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { spawn } from 'bun';
import { readdir } from 'node:fs/promises';
import { PageWrapper, ReadingColumn, FlowContainer, StatCard } from './components'; // Your UI

const app = new Hono();

// --- 1. THE DYNAMIC INDEX PAGE ---
// Automatically lists whatever is in the /scripts/tools folder
app.get('/', async (c) => {
  // Read the tools directory
  const files = await readdir('./scripts/tools');
  const tools = files.filter(f => f.endsWith('.ts') || f.endsWith('.py'));

  return c.html(
    <PageWrapper title="Brutalisimo Tools">
      <ReadingColumn width="wide">
        <h1 className="text-xl font-bold text-neon mb-6">> SYSTEM_TOOLS_REGISTRY</h1>
        
        <FlowContainer gap="normal">
          {tools.map(tool => (
            <a href={`/view/${tool}`} className="block group">
              <div className="border border-gray-800 bg-neutral-900/50 p-4 hover:border-neon transition-colors w-64 h-32 flex flex-col justify-between">
                <div className="font-mono text-white font-bold">{tool}</div>
                <div className="text-xs text-gray-500 group-hover:text-neon">
                  [ RUN_TOOL ]
                </div>
              </div>
            </a>
          ))}
        </FlowContainer>
      </ReadingColumn>
    </PageWrapper>
  );
});

// --- 2. THE GENERIC VIEWER PAGE ---
// Renders the UI shell for ANY tool
app.get('/view/:script', (c) => {
  const scriptName = c.req.param('script');
  return c.html(
    <PageWrapper title={`Running: ${scriptName}`}>
       {/* Re-use the LogStream component we built earlier */}
       <LogStream streamUrl={`/stream/${scriptName}`} />
    </PageWrapper>
  );
});

// --- 3. THE UNIVERSAL RUNNER ---
// Spawns the script and streams JSONL
app.get('/stream/:script', (c) => {
  const scriptName = c.req.param('script');
  // Security: Prevent directory traversal!
  if (scriptName.includes('..') || scriptName.includes('/')) return c.text('ACCESS DENIED', 403);

  const isPython = scriptName.endsWith('.py');
  const cmd = isPython 
    ? ['python3', '-u', `./scripts/tools/${scriptName}`]
    : ['bun', `./scripts/tools/${scriptName}`];

  return streamText(c, async (stream) => {
    const proc = spawn(cmd, { stdout: 'pipe', stderr: 'pipe' });
    
    // ... (Insert standard streaming logic from previous turn) ...
  });
});

```

### 3. The Workflow for the Agent

Now, your prompt to the Agent is incredibly powerful:

> "I need a new tool to analyze our AWS billing.
> **Write a script** saved to `scripts/tools/aws-bill.ts`.
> Use the `Dash` logger to output JSONL.
> **Do not touch the frontend code.**"

**What happens:**

1. Agent writes `scripts/tools/aws-bill.ts`.
2. Agent says "Done."
3. You refresh your dashboard.
4. **"aws-bill.ts"** is already there as a card.
5. You click it. The script runs. The logs stream. The UI is perfect.

### Nuance: "Metadata Headers"

To make it even slicker, you can ask the Agent to include a comment block at the top of the script with metadata, and your Index Page can parse it to show a nice description:

```typescript
// scripts/tools/aws-bill.ts
/**
 * @title AWS Cost Analyzer
 * @desc Scans last month's usage and predicts overage.
 * @icon 💰
 */
import { Dash } from '../utils/DashLogger';
// ... code ...

```

This transforms your repo from a "Web App" into a **"Self-Expanding Operating System."**