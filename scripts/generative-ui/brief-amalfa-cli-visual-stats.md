---
date: 2026-01-15
tags: [brief, cli, visualization, gemini, amalfa, diagnostics]
status: draft
priority: low
---

# Brief: Amalfa CLI Visual Stats Dashboard

## Context

Amalfa has two distinct user interfaces:
1. **CLI** (`amalfa stats`, `amalfa doctor`) - Text-based, for terminal users
2. **Web UI** (static pages + sql.js) - Interactive graph/search, for browser users

**Architectural Constraint Discovered**: Graph visualization and vector search require **full database download to client** (Graphology + sql.js). This means server-side Gemini generation **cannot** query live data for interactive dashboards—the database isn't on the server during exploration, it's in the browser.

**Gap Identified**: CLI users get raw text output from `amalfa stats`. No visual representation.

**Opportunity**: Use generative UI for **disposable diagnostic snapshots**, not persistent interactive dashboards.

## Revised Scope: Minimal Viable Feature

### Single Feature: `amalfa stats --ui`

**User Story**: As a CLI user, when I run `amalfa stats --ui`, I want to see my database statistics in a visual dashboard that auto-opens in my browser, without requiring a persistent server or manual setup.

**Workflow**:
1. Terminal: `amalfa stats --ui`
2. Server queries SQLite (server-side, before client download)
3. Formats stats as natural language prompt
4. Gemini generates dashboard layout (ScreenDef)
5. Temporary Hono server starts on random available port
6. Browser auto-opens to `http://localhost:PORT`
7. User reviews visual dashboard
8. User closes browser or waits 30s → server auto-terminates
9. No persistent state, no cleanup needed

**Example Dashboard Content**:
- **StatCards**: Total nodes (489), Total edges (1,203), Embeddings coverage (100%), DB size (45.2 MB)
- **DataGrid**: Node type distribution (documents: 450, concepts: 38, domains: 1)
- **Markdown**: "⚠️ 12 files are stale—run `amalfa init` to update"
- **ActionPanel**: Buttons showing commands to run (not executable, just copy-paste)

## What This Is NOT

This feature **explicitly excludes**:
- ❌ Interactive graph exploration (client-side Sigma.js already handles this)
- ❌ Real-time vector search dashboard (sql.js in browser is faster)
- ❌ Document viewer with AI recommendations (client-side rendering preferred)
- ❌ Persistent monitoring server (temporary only)
- ❌ Historical trend analysis (future enhancement, not MVP)
- ❌ Ingestion progress monitoring (terminal progress bars sufficient for now)

**Rationale**: Client-side solutions (static pages + sql.js + AlpineJs) are superior for interactive use cases because:
1. Database is already downloaded for graph visualization
2. No server round-trips needed for queries
3. AlpineJs handles interactivity without complexity
4. Works offline once database is cached

**Generative UI's Role**: Disposable diagnostics for CLI contexts only.

## Technical Design

### Architecture: Ephemeral Server Pattern

```
User Terminal                    Temporary Server              Browser
     |                                 |                          |
     | amalfa stats --ui              |                          |
     |-------------------------------->|                          |
     |                          Query SQLite                      |
     |                          Format prompt                     |
     |                          Call Gemini API                   |
     |                          Generate ScreenDef                |
     |                          Start Hono (random port)          |
     |                          Return URL                        |
     |<--------------------------------|                          |
     | Open browser                   |                          |
     |-------------------------------------------------->|        |
     |                                 | Serve HTML with dashboard |
     |                                 |------------------------->|
     |                                 |                   Render  |
     |                                 |                          |
     | [30s timeout or browser close]  |                          |
     |                          Shutdown server                   |
     |<--------------------------------|                          |
     | Back to terminal               |                          |
```

### Implementation Components

**1. CLI Flag Handler** (`src/cli/commands/stats.ts`)
```typescript
export async function cmdStats(args: string[]) {
  const showUI = args.includes('--ui');
  
  if (!showUI) {
    // Existing text output...
    return;
  }
  
  // New UI mode
  const stats = await gatherStats(); // Extract existing logic
  const port = await startDashboardServer(stats);
  console.log(`📊 Dashboard: http://localhost:${port}`);
  console.log('Press Ctrl+C to close server');
  await openBrowser(`http://localhost:${port}`);
}
```

**2. Stats Gatherer** (`src/cli/formatters/stats-gatherer.ts`)
```typescript
export async function gatherStats() {
  const db = new ResonanceDB(await getDbPath());
  const stats = db.getStats();
  const config = await loadConfig();
  
  // Check for stale files (existing logic from cmdStats)
  const staleFiles = await scanForStaleFiles(config.sources);
  
  // Optional: Check for orphans
  const orphans = args.includes('--orphans') 
    ? await db.getOrphanNodes() 
    : null;
  
  return {
    nodes: stats.nodes,
    edges: stats.edges,
    vectors: stats.vectors,
    dbSizeMB: stats.db_size_bytes / 1024 / 1024,
    staleFiles,
    orphans,
    nodeTypes: await db.getNodeTypeDistribution(),
    domains: await db.getDomainDistribution()
  };
}
```

**3. Natural Language Formatter** (`src/cli/formatters/stats-to-prompt.ts`)
```typescript
export function formatStatsAsPrompt(stats: StatsData): string {
  return `
Show me a database statistics dashboard:

Core Metrics:
- Total nodes: ${stats.nodes.toLocaleString()}
- Total edges: ${stats.edges.toLocaleString()}
- Embeddings: ${stats.vectors.toLocaleString()} (${((stats.vectors/stats.nodes)*100).toFixed(1)}% coverage, 384 dimensions)
- Database size: ${stats.dbSizeMB.toFixed(2)} MB

Node Distribution:
${Object.entries(stats.nodeTypes).map(([type, count]) => 
  `- ${type}: ${count}`
).join('\n')}

${stats.staleFiles > 0 ? `
⚠️ Stale Files Alert:
- ${stats.staleFiles} markdown files are newer than database
- Action required: Run 'amalfa init' or start 'amalfa daemon'
` : '✅ Database is up to date'}

${stats.orphans && stats.orphans.length > 0 ? `
⚠️ Orphan Nodes:
- ${stats.orphans.length} nodes have no edges (${((stats.orphans.length/stats.nodes)*100).toFixed(1)}%)
- Action: Run 'amalfa ember scan' to detect linking opportunities
` : ''}

Include:
- StatCards for key metrics with trend indicators if notable
- DataGrid for node type distribution
- ActionPanel with commands to run (as text, not executable)
- Markdown section highlighting any issues or confirmations
  `.trim();
}
```

**4. Dashboard Server** (`src/cli/dashboard-server.ts`)
```typescript
import { Hono } from 'hono';
import { generateScreen } from './generative-ui-adapter'; // Wraps scripts/generative-ui/ai.ts
import { renderScreen } from './generative-ui-adapter'; // Wraps components rendering

export async function startDashboardServer(stats: StatsData): Promise<number> {
  const app = new Hono();
  const port = await getAvailablePort();
  
  // Generate dashboard once (not on every request)
  const prompt = formatStatsAsPrompt(stats);
  const screenDef = await generateScreen(prompt);
  const html = renderScreen(screenDef);
  
  app.get('/', (c) => {
    return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Amalfa Database Statistics</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  ${html}
</body>
</html>
    `);
  });
  
  const server = Bun.serve({
    port,
    fetch: app.fetch
  });
  
  // Auto-shutdown after 30 seconds
  setTimeout(() => {
    server.stop();
    console.log('\n📊 Dashboard server closed');
  }, 30000);
  
  return port;
}

async function getAvailablePort(): Promise<number> {
  // Try ports 3001-3100, return first available
  for (let port = 3001; port < 3100; port++) {
    try {
      const server = Bun.serve({ port, fetch: () => new Response() });
      server.stop();
      return port;
    } catch {
      continue;
    }
  }
  throw new Error('No available ports in range 3001-3100');
}
```

**5. Generative UI Adapter** (`src/cli/generative-ui-adapter.ts`)
```typescript
// Thin wrapper around scripts/generative-ui/ components
// Avoids code duplication while keeping experimental code isolated

import { generateScreen as geminiGenerate } from '@scripts/generative-ui/ai';
import { renderToString } from 'hono/jsx';
import { ScreenLayout } from '@scripts/generative-ui/components';
import type { ScreenDef } from '@scripts/generative-ui/layout-engine';

export async function generateScreen(prompt: string): Promise<ScreenDef> {
  return await geminiGenerate(prompt);
}

export function renderScreen(screenDef: ScreenDef): string {
  return renderToString(
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ScreenLayout screen={screenDef} />
    </div>
  );
}
```

### Reused Components

From `scripts/generative-ui/`:
- ✅ `ai.ts` - Gemini integration (generateScreen function)
- ✅ `components.tsx` - StatCard, DataGrid, ActionPanel, MarkdownViewer
- ✅ `layout-engine.ts` - ScreenDef types and schemas
- ✅ `component-schema.ts` - Zod validation schemas

**No duplication**: Adapter pattern keeps experimental code isolated while CLI code imports proven components.

## Implementation Checklist

### Phase 1: Core Feature (2-3 hours)
- [ ] Extract stats gathering logic from `cmdStats()` into `stats-gatherer.ts`
- [ ] Create `stats-to-prompt.ts` formatter
- [ ] Implement `dashboard-server.ts` with ephemeral server pattern
- [ ] Add `--ui` flag handling to `cmdStats()`
- [ ] Create adapter to import generative-ui components
- [ ] Test: `amalfa stats --ui` opens browser with dashboard
- [ ] Test: Server auto-closes after 30 seconds
- [ ] Test: Port conflict handling (random port selection works)

### Phase 2: Polish (1 hour)
- [ ] Add loading indicator while Gemini generates
- [ ] Handle Gemini API failures gracefully (fallback to text output)
- [ ] Add "Copy Command" buttons for action panel items
- [ ] Ensure cross-platform browser opening (macOS, Linux, Windows)
- [ ] Add `--no-browser` flag for SSH/headless contexts

### Phase 3: Documentation (30 min)
- [ ] Update README with `amalfa stats --ui` example
- [ ] Add screenshot to docs
- [ ] Document `GEMINI_API_KEY` requirement
- [ ] Add troubleshooting section (API key, port conflicts)

## Configuration

### Environment Variables
```bash
# Required for --ui flag
GEMINI_API_KEY=your_api_key_here
```

### Fallback Behavior
If `GEMINI_API_KEY` is not set:
- Warn user: "⚠️ Gemini API key not found. Run without --ui flag or set GEMINI_API_KEY"
- Fall back to text output (existing behavior)
- Do NOT fail hard (degrade gracefully)

## Success Metrics

### User Experience
- Dashboard opens in <3 seconds (including Gemini latency)
- Visual layout is clear and actionable
- User prefers dashboard over text output (subjective feedback)

### Technical
- Zero-config for users with API key
- No persistent processes after browser closes
- No port conflicts (random port selection works)
- Gemini API cost: <$0.01 per invocation

## Future Enhancements (Explicitly Deferred)

These are **out of scope** for MVP:

1. **Historical Trends**: Track stats over time in `runs.jsonl`
2. **Ingestion Monitoring**: Real-time SSE dashboard during `amalfa init`
3. **Interactive Filtering**: Click "orphan nodes" to see list (client-side better for this)
4. **Export Reports**: PDF/HTML export of dashboard
5. **Scheduled Snapshots**: Cron job to generate weekly reports
6. **Multi-Project View**: Compare stats across multiple Amalfa instances

**Rationale**: These require persistent servers or interactive clients, which conflicts with the "ephemeral diagnostic" pattern. Better solved with dedicated web UI (static pages + sql.js).

## Risks and Mitigations

### Risk: Gemini API Unavailable (503, timeout)
- **Impact**: Dashboard generation fails
- **Mitigation**: Fall back to text output with message "Dashboard unavailable, showing text"
- **Detection**: Catch API errors in `generateScreen()`

### Risk: Port Conflicts
- **Impact**: Server fails to start
- **Mitigation**: Try 100 ports (3001-3100), error only if all occupied
- **Detection**: Test port before binding

### Risk: Browser Fails to Open
- **Impact**: User doesn't see dashboard
- **Mitigation**: Print URL prominently, user can manually open
- **Detection**: `open` command may fail on some Linux distros

### Risk: User Expects Interactive Dashboard
- **Impact**: User disappointed by static snapshot
- **Mitigation**: Clear messaging "Snapshot as of [timestamp]", mention web UI for interactivity
- **Detection**: User feedback

## Dependencies

### New Dependencies
- `hono` - Add to main package.json (currently only in generative-ui experiment)
  - Reason: Needed for dashboard server
  - Size: ~100KB, negligible

### Existing Dependencies (No Changes)
- `@google/generative-ai` (^0.24.1) - Already installed
- `zod` - Already installed
- `bun` - Runtime (already required)

### External Services
- Gemini API (`gemini-2.5-flash`)
- Requires `GEMINI_API_KEY` environment variable

## Related Work

- **Generative UI Prototype**: `scripts/generative-ui/` - Proves Gemini → Hono JSX pipeline
- **Existing Stats Command**: `src/cli/commands/stats.ts` - Text-based output
- **Web UI Prototypes**: Static pages + sql.js (client-side database access)
- **Monitoring Brief**: `briefs/brief-amalfa-monitoring-dashboard.md` - Broader vision (deferred)

## Philosophical Note: Generative UI's True Role

**Initial Hypothesis**: "Use AI to generate all UIs from natural language"

**Revised Understanding**: "Use AI for disposable diagnostic views in CLI contexts"

**Analogy**:
- **Static pages** = Your home (permanent, optimized, familiar)
- **Generative dashboards** = Hotel room (temporary, good enough, context-specific)

You don't regenerate your home's layout every time you walk in. But when traveling (CLI diagnostic task), a generated "good enough" space is perfect.

**Key Insight**: The architectural constraint (client-side database for graph/search) clarified that generative UI fills a **different gap** than initially assumed. Not a replacement for interactive UIs, but a complement for CLI users who need quick visual context.

## Decision Record

**Question**: Should we build persistent monitoring dashboards with server-side Gemini?

**Decision**: No. Use generative UI only for **ephemeral CLI diagnostics**.

**Rationale**:
1. Graph visualization requires client-side database (Graphology + Sigma.js)
2. Vector search via sql.js is faster client-side than server round-trips
3. Interactive filtering better handled by AlpineJs (no latency)
4. Gemini generation adds latency unacceptable for interactive use
5. Existing static page prototypes already work well

**Implication**: `amalfa stats --ui` is the **only** generative UI feature needed for Amalfa. Other visual needs solved by client-side solutions.

**Trade-off**: Limits scope significantly but focuses effort on high-value use case with clear boundaries.

---

**Status**: Ready for review. Awaiting user decision on whether to implement or defer.
