---
date: 2026-01-15
tags: [brief, monitoring, dashboard, generative-ui, gemini, visualization, amalfa]
status: draft
priority: medium
---

# Brief: Amalfa Monitoring Dashboard

## Context

Amalfa ingests markdown documents into a hybrid SQLite vector graph database. The system accumulates rich metrics (nodes, edges, embeddings, graph statistics) but currently only exposes them via CLI text output (`amalfa stats`, `amalfa doctor`). 

**Problem**: No visual interface for monitoring ingestion progress, viewing database health, or tracking growth trends over time.

**Opportunity**: Leverage the Gemini-powered generative UI prototype (from `scripts/generative-ui/`) to create dashboards from natural language descriptions of system state.

## Objectives

### Additional Objectives (pjsvis)

- the dashboard UI should be a service that runs in the background
- we have additional assets tat we can serve alongside our dashboard
- for example we have an HTML page for showing the graph database using graphology and sigma.js
- we have an HTML page allowing the user to browse and read rendered markdown documents
- we need to figure out how to serve our typescript documents, if it is appropriate to view them in the document browser
- maybe a summary page that shows the most important metrics and links to the other pages
- the additional HTML pages are available as static web pages and also as SSR pages
- we have some legacy data that shows us stats from our past runs
- we should formalise our stats persistence logic so that we can present a coherent picture of the system health over time

### Primary Goal
Enable visual monitoring of Amalfa system health and ingestion progress using AI-generated server-side UIs.

### Success Criteria
1. Users can view database statistics visually (nodes, edges, size, distributions)
2. Users can monitor real-time ingestion progress during `amalfa init`
3. System automatically detects anomalies (orphan nodes, stale files) and surfaces them visually
4. Dashboard generation requires minimal maintenance (AI handles layout decisions)

## Available Metrics

### Current State (from `amalfa stats`)
- **Nodes**: Total count, type distribution (document, concept, domain)
- **Edges**: Total count, type distribution (relates_to, contains, references)
- **Embeddings**: Count, coverage percentage, dimensionality (384)
- **Database**: File size (MB), last modified timestamp
- **Stale Files**: Count of markdown files newer than DB
- **Orphans**: Nodes with no edges (requires `--orphans` flag)

### From `amalfa doctor`
- Runtime health: Bun, dependencies, directories
- Database existence and accessibility
- Source directory validation
- MCP SDK availability

### From Database Schema (SQL queries)
- Node type distribution
- Domain distribution (knowledge, lexicon, experience)
- Layer distribution (experience, pattern, principle)
- Semantic tokens count
- Edge type distributions
- Temporal data (via `date` field on nodes)

### Ingestion Pipeline (real-time events)
- Files processed count
- Current file being processed
- Nodes created per file
- Edges created per file
- Throughput (files/sec)
- Errors and warnings
- Queue depth (if async)

## Proposed Implementation Phases

### Phase 1: Static Stats Dashboard (MVP)
**Effort**: 1-2 hours  
**Value**: Immediate visual feedback for existing data

**Features**:
- `amalfa stats --ui` opens browser dashboard
- Shows current state: nodes, edges, embeddings, size
- Displays distributions: node types, domains, orphans
- Highlights stale files with action buttons
- Auto-closes server after timeout

**Technical Approach**:
1. Add `--ui` flag to `cmdStats()` in `src/cli/commands/stats.ts`
2. Start temporary Hono server on random available port
3. Query stats from `ResonanceDB.getStats()`
4. Format stats as natural language prompt
5. Send to Gemini → generate `ScreenDef`
6. Render via Hono JSX (reuse `scripts/generative-ui/components.tsx`)
7. Open browser automatically (`open http://localhost:PORT`)
8. Server auto-closes after 30 seconds or on connection close

**Example Prompt to Gemini**:
```
Show me a database statistics dashboard:
- Total nodes: 489 (documents: 450, concepts: 38, domains: 1)
- Total edges: 1,203
- Embeddings: 489 (100% coverage, 384 dimensions)
- Database size: 45.2 MB
- Stale files: 12 files need re-ingestion
- Orphan nodes: 3 (0.6%)
Include action buttons to run 'amalfa init' or 'amalfa daemon start'
```

### Phase 2: Real-Time Ingestion Monitor
**Effort**: 3-4 hours  
**Value**: Confidence during long ingestion runs, debugging visibility

**Features**:
- Live progress during `amalfa init` or daemon file-watch
- Real-time metrics: files processed, nodes created, throughput
- Recent activity log (last 10 files)
- Error/warning display
- Completion summary

**Technical Approach**:
1. Add EventEmitter to ingestion pipeline (new file: `src/pipeline/IngestionMonitor.ts`)
2. Emit events: `file:start`, `file:complete`, `node:created`, `edge:created`, `error`, `warning`
3. Start Hono server before ingestion begins
4. SSE endpoint (`/api/ingestion-stream`) subscribes to EventEmitter
5. Browser receives updates via EventSource
6. Initial dashboard generated by Gemini, data updated via SSE merges
7. On completion, show summary and auto-close option

**Events Schema**:
```typescript
type IngestionEvent = 
  | { type: 'file:start', path: string, size: number }
  | { type: 'file:complete', path: string, duration: number, nodes: number, edges: number }
  | { type: 'node:created', type: string, domain: string }
  | { type: 'edge:created', type: string }
  | { type: 'error', message: string, file?: string }
  | { type: 'warning', message: string, file?: string }
  | { type: 'complete', summary: { files: number, nodes: number, edges: number, duration: number } }
```

### Phase 3: Historical Trends (Future)
**Effort**: 2-3 hours  
**Value**: Performance regression detection, growth visibility

**Features**:
- Track ingestion runs over time
- Show growth trends (nodes/week, edges/week)
- Compare run durations (is ingestion getting slower?)
- Identify large files that slow down ingestion

**Technical Approach**:
1. Log each ingestion run to `.amalfa/runs.jsonl`
2. Schema: `{ timestamp, files_processed, nodes_added, edges_added, duration_ms, errors }`
3. Dashboard queries runs.jsonl, generates time-series data
4. Gemini generates DataGrid with trend indicators
5. Optional: Detect anomalies (sudden spike in orphans, slow ingestion)

**Example Visualization**:
- StatCard: "Average ingestion: 145 files/min (↑12% vs last week)"
- DataGrid: Last 10 runs with duration, nodes added, errors
- Markdown: "⚠️ Ingestion 3x slower than baseline—investigate large files"

### Phase 4: Graph Health Dashboard (Advanced)
**Effort**: 4-5 hours  
**Value**: Early detection of knowledge graph degradation

**Features**:
- Clustering metrics (community detection, modularity)
- Embedding quality (coverage, distribution)
- Link density (avg edges per node)
- Orphan detection with suggested fixes
- Cross-domain connection analysis

**Technical Approach**:
1. Run graph analysis queries (Louvain clustering, centrality measures)
2. Query existing Ember service analytics (from `src/daemon/ember/analyzer.ts`)
3. Format as natural language prompt with specific concerns
4. Gemini generates diagnostic dashboard with recommendations
5. Action buttons to run `amalfa ember scan` or `amalfa init`

## Architecture Decisions

### Dashboard Server Options

**Option A: Temporary Server (Recommended for MVP)**
- Pros: Simple, no port conflicts, auto-cleanup
- Cons: Can't keep dashboard open long-term
- Use case: Quick stats checks, one-off ingestion runs

**Option B: Persistent Daemon**
- Pros: Always available, can refresh data
- Cons: Port management, lifecycle complexity
- Use case: Long-running development, continuous monitoring

**Option C: Embedded in MCP Server**
- Pros: Single server, unified interface
- Cons: MCP stdio transport incompatible with HTTP
- Use case: Future if MCP adds HTTP transport

**Decision**: Start with Option A (temporary), migrate to Option B if usage patterns demand it.

### Gemini Usage Strategy

**Option 1: Generate Once Per View**
- Prompt: "Show dashboard for: 489 nodes, 1203 edges, ..."
- Gemini generates full ScreenDef
- Render and display (no SSE updates)
- **Pros**: Simple, no state management
- **Cons**: Wasteful for frequently-refreshed views

**Option 2: Generate Layout Once, Stream Data**
- Gemini generates layout structure on first request
- SSE streams only data updates (node counts, file progress)
- **Pros**: Efficient for real-time monitoring
- **Cons**: Complex, requires stable component IDs

**Option 3: Hardcoded Layout, Gemini for Anomalies**
- Use predefined component structure for common views
- Call Gemini only for anomaly detection/recommendations
- **Pros**: Predictable, fast, low API cost
- **Cons**: Loses "generative" nature, requires UI maintenance

**Decision**: Start with Option 1 (simple), move to Option 2 for Phase 2 (real-time), consider Option 3 if Gemini costs become prohibitive.

### Historical Data Logging

**Question**: Should we start logging ingestion runs now (before Phase 3)?

**Arguments For**:
- Data accumulates passively
- Enables future trend analysis without backfilling
- Minimal cost (append to JSONL file)

**Arguments Against**:
- Extra I/O on every ingestion
- Disk space usage (minimal: ~100 bytes per run)
- Feature might never be built

**Decision**: **Yes, start logging now.** The cost is negligible (~1ms per run) and the historical data is valuable for debugging even without visualization.

**Implementation**:
```typescript
// In ingestion pipeline completion handler
await appendFile('.amalfa/runs.jsonl', JSON.stringify({
  timestamp: new Date().toISOString(),
  files_processed: stats.files,
  nodes_added: stats.nodes,
  edges_added: stats.edges,
  duration_ms: stats.duration,
  errors: stats.errors.length
}) + '\n');
```

## Integration Points

### Existing Code Reuse
- **Generative UI Components**: `scripts/generative-ui/components.tsx` (StatCard, DataGrid, ActionPanel, MarkdownViewer)
- **Gemini Integration**: `scripts/generative-ui/ai.ts` (generateScreen function)
- **Hono Server**: `scripts/generative-ui/server.tsx` (server setup, SSE handling)
- **Stats Queries**: `src/resonance/db.ts` (getStats method)
- **CLI Framework**: `src/cli/commands/stats.ts` (add --ui flag)

### New Code Required
- **IngestionMonitor** (`src/pipeline/IngestionMonitor.ts`): EventEmitter for real-time events
- **Dashboard Server** (`src/cli/dashboard-server.ts`): Hono server lifecycle management
- **Stats Formatter** (`src/cli/formatters/stats-to-prompt.ts`): Convert DB stats to natural language
- **Historical Logger** (`src/pipeline/runs-logger.ts`): Append to runs.jsonl

## Open Questions

1. **Port Selection**: Use random available port or fixed port (e.g., 3001)?
   - Random: No conflicts, harder to bookmark
   - Fixed: Easy to remember, might conflict with other services

2. **Browser Auto-Open**: Should `--ui` automatically open browser?
   - Yes: Convenient, better UX
   - No: User control, works over SSH

3. **Data Refresh**: Should static dashboard have "Refresh" button?
   - Yes: Useful for monitoring during long operations
   - No: Just re-run `amalfa stats --ui`

4. **Error Handling**: What if Gemini fails (503, invalid JSON)?
   - Fallback to hardcoded layout?
   - Show error message in Markdown component?
   - Retry with exponential backoff?

5. **Action Buttons**: Should dashboard buttons actually execute commands?
   - Yes: Full automation (security risk if exposed)
   - No: Just show command to copy-paste (safer)

## Success Metrics

### User Experience
- Time to understand system state: <10 seconds (vs 30+ seconds reading CLI output)
- User satisfaction: "This is useful" vs "Just noise"
- Adoption rate: % of users who enable `--ui` flag

### Technical
- Dashboard generation time: <3 seconds (Gemini latency + render)
- Server startup time: <500ms (Hono is fast)
- Memory overhead: <50 MB (temporary server)
- Gemini API cost: <$0.01 per dashboard generation

### Quality
- Dashboard accuracy: Matches CLI output 100%
- Gemini hallucination rate: <1% (strict schema validation)
- Layout quality: Subjective but should feel "professional"

## Risks and Mitigations

### Risk: Gemini API Unavailable
- **Impact**: Dashboard generation fails
- **Mitigation**: Fallback to hardcoded layout with static data
- **Detection**: Catch 503/500 errors, show fallback UI

### Risk: Complex Stats Prompt Confuses Gemini
- **Impact**: Invalid ScreenDef, Zod validation fails
- **Mitigation**: Simplify prompt, add examples in system prompt
- **Detection**: Log failed generations, iterate on prompt

### Risk: Users Expect Interactive Dashboard
- **Impact**: Static view disappoints users who want drill-down
- **Mitigation**: Set expectations (label as "snapshot"), add Phase 2 for interactivity
- **Detection**: User feedback, feature requests

### Risk: Port Conflicts
- **Impact**: Server fails to start on fixed port
- **Mitigation**: Use random available port, display URL in CLI
- **Detection**: Catch EADDRINUSE, retry with new port

## Dependencies

### Technical
- `@google/generative-ai` (^0.24.1) - Already installed
- `hono` - Need to add to main package.json (currently only in generative-ui experiment)
- `zod` - Already installed (for schema validation)

### External Services
- Gemini API (`gemini-2.5-flash`) - Requires API key in `.env`

### Internal Modules
- `ResonanceDB` - Existing (provides stats)
- Ingestion pipeline - Needs modification for event emission (Phase 2)

## Future Enhancements

1. **Multi-Project Dashboard**: Compare stats across multiple Amalfa instances
2. **Alert System**: Email/Slack when ingestion fails or graph health degrades
3. **Custom Queries**: Natural language queries like "show me documents added this week"
4. **Export Reports**: Generate PDF/HTML reports for sharing
5. **Collaborative Features**: Share dashboard URLs with team members
6. **Plugin System**: Let users define custom metrics and visualizations

## Related Work

- **Generative UI Prototype**: `scripts/generative-ui/` - Proves Gemini → Hono JSX pipeline works
- **Ember Service**: `src/daemon/ember/` - Already analyzes graph health, could feed dashboard
- **CLI Stats Command**: `src/cli/commands/stats.ts` - Current text-based output
- **Brief/Debrief Pattern**: Amalfa's own documentation workflow could generate dashboards

## References

- Generative UI Debrief: `scripts/generative-ui/debrief-2026-01-15-gemini-generative-ui-poc.md`
- Amalfa Architecture: `README.md`
- Database Schema: `src/resonance/drizzle/schema.ts`
- Change Management Protocol: `playbooks/change-management-protocol.md`

---

**Next Steps**: Review with user, prioritize phases, create implementation plan for Phase 1 MVP.
