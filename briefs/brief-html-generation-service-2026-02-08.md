---
date: 2026-02-08
tags: [mcp-server, dashboard, ui-service, feature, html-generation]
agent: claude
environment: local
---

# Brief: HTML Generation Service for Agent Dashboards

## Task: Create Data-to-HTML MCP Service

**Objective:** Build an MCP tool that transforms raw monitoring/process data into rendered HTML dashboards using our existing component system. Agents send data + layout constraints; service returns complete, styled HTML ready for display.

- [ ] Design MCP tool interface (`render_dashboard`)
- [ ] Implement layout density calculator (chars × lines → component selection)
- [ ] Integrate existing src/components system (StatCard, PipelineRow, LogStream, etc.)
- [ ] Support multiple view modes (dense grid, detail list, monitoring view)
- [ ] Return HTML string or save to file

---

## Why This Matters

### The Problem

Agents monitoring multiple processes face a design burden:
- Must choose between `StatCard` vs `PipelineRow` vs `LogStream`
- Must calculate responsive breakpoints for X chars × Y lines
- Must worry about Tailwind classes and visual hierarchy

This cognitive overhead distracts from the actual task: **monitoring and managing processes**.

### The Solution

**Externalize UI complexity to a specialized MCP service.**

```
Agent: "Here are 3 processes with their stats"
       ↓
MCP Server: Receives JSON data
            ↓
            Calculates optimal layout
            (120 chars × 40 lines @ 75% density)
            ↓
            Selects appropriate components
            (2 StatCards + 1 PipelineRow fit perfectly)
            ↓
            Returns complete HTML dashboard
       ↓
Agent: Displays it / Saves it / Serves it
```

**Result:** Agent stays focused on data. UI decisions are automated.

---

## Key Actions Checklist

### Phase 1: Design Interface

- [ ] Define MCP tool name (`render_dashboard` or `generate_ui`)
- [ ] Design input schema (process data + layout constraints)
- [ ] Design output options (HTML string, file path, or error)
- [ ] Document expected data shapes for different component types

**Input Schema Draft:**
```typescript
{
  // Process data to visualize
  processes: [
    {
      type: "stat" | "pipeline" | "log" | "block",
      name: string,
      status?: "idle" | "active" | "warning" | "error",
      value?: string | number,
      metric?: string,
      content?: string  // For SmartBlock rendering
    }
  ],
  
  // Layout constraints
  layout: {
    width: number,      // Characters (e.g., 120)
    height: number,     // Lines (e.g., 40)
    density?: number    // 0.0-1.0, default 0.75
  },
  
  // Output preference
  output: {
    format: "html" | "file",
    filename?: string   // If format is "file"
  }
}
```

### Phase 2: Layout Engine

- [ ] Implement density calculator (available space → component count)
- [ ] Create component sizing map:
  - StatCard: ~30ch × 8 lines
  - PipelineRow: ~60ch × 3 lines
  - SmartBlock: ~45ch × auto-height
  - LogStream: ~120ch × 20 lines
- [ ] Build layout optimizer (fit maximum information given constraints)
- [ ] Handle overflow gracefully (scrollable sections, truncation)

### Phase 3: Component Integration

- [ ] Import existing components from `src/components/`:
  - `StatCard` (metrics)
  - `PipelineRow` (process status)
  - `SmartBlock` (rich content)
  - `LogStream` (real-time logs - requires streaming endpoint)
  - `ToggleSwitch` / `NumericDial` (interactive controls)
  - `Collapsible` (expandable sections)
- [ ] Ensure Hono/JSX context for SSR rendering
- [ ] Handle Bun.Markdown rendering for SmartBlock content
- [ ] Apply Tailwind classes consistently

### Phase 4: View Modes

- [ ] **Dense Grid:** Maximum components, minimal whitespace
  - Use FlowContainer with tight gap
  - Prioritize StatCards and small blocks
- [ ] **Detail List:** Full information, vertical scrolling
  - Use ReadingColumn with standard width
  - Prioritize SmartBlocks and PipelineRows
- [ ] **Monitoring View:** Live-updating dashboard
  - Include LogStream for real-time data
  - Use PageWrapper for complete page shell
- [ ] **Compact Card:** Single process, dense display
  - Just one component type, focused view

### Phase 5: MCP Integration

- [ ] Add tool to existing MCP server (`src/mcp/`)
- [ ] Implement error handling (invalid data, layout overflow)
- [ ] Return structured response:
  ```typescript
  {
    success: boolean,
    html?: string,
    filePath?: string,
    error?: string,
    meta: {
      componentsUsed: string[],
      layoutApplied: string,
      density: number
    }
  }
  ```

### Phase 6: Testing & Validation

- [ ] Test with various data shapes (stats, pipelines, mixed)
- [ ] Test layout constraints (small 40×20, large 200×100)
- [ ] Verify HTML renders correctly in browser
- [ ] Test file output mode
- [ ] Document usage examples for agents

---

## Detailed Requirements

### Density Calculation Logic

```
Available Space:
- Width: 120 characters (max-w-[120ch])
- Height: 40 lines (implicit from viewport or explicit)
- Density: 75% (0.75)

Effective Space:
- Width: 120ch × 0.75 = 90ch usable
- Height: 40 lines × 0.75 = 30 lines usable

Component Sizing (approximate):
- StatCard: 30ch × 8 lines
- PipelineRow: 60ch × 3 lines  
- SmartBlock (std): 40ch × auto (assume 10 lines avg)
- SmartBlock (long): 60ch × auto (assume 15 lines avg)

Layout Decision:
If monitoring 3 processes with metrics:
→ Use FlowContainer
→ 3 × StatCard (30ch × 8 lines each)
→ Fits in 90ch × 30 lines ✓

If monitoring 10 processes:
→ Use ReadingColumn (vertical stack)
→ 10 × PipelineRow (60ch × 3 lines each)
→ Fits in 90ch width, scrolls vertically
```

### Component Selection Heuristics

| Data Type | Component | When to Use |
|-----------|-----------|-------------|
| Single metric (label + value) | StatCard | Dashboard overview, top-level stats |
| Process with status | PipelineRow | Monitoring lists, queue status |
| Rich text / markdown | SmartBlock | Documentation, detailed output |
| Real-time stream | LogStream | Logs, events, live updates |
| Toggle control | ToggleSwitch | Settings, boolean states |
| Numeric input | NumericDial | Configuration, thresholds |
| Expandable section | Collapsible | Hierarchical data, optional details |

### Error Handling

- **Layout Overflow:** If data exceeds constraints, either:
  - Add scrollable container
  - Truncate with "...and N more"
  - Return error suggesting larger layout or fewer items
  
- **Invalid Data:** If process data doesn't match expected schema:
  - Return clear error message
  - Suggest valid data format
  
- **Missing Data:** If required fields absent:
  - Use sensible defaults (e.g., status: "unknown")
  - Or return error for critical fields

---

## Usage Examples

### Example 1: Simple Dashboard

```typescript
// Agent monitors 3 services
const result = await mcpClient.callTool("render_dashboard", {
  processes: [
    { type: "stat", name: "CPU", value: "45%", trend: "up" },
    { type: "stat", name: "Memory", value: "12GB" },
    { type: "pipeline", name: "Ingestion", status: "active", metric: "1.2k/s" }
  ],
  layout: { width: 120, height: 40, density: 0.75 },
  output: { format: "html" }
});

// Returns: Complete HTML page with 2 StatCards + 1 PipelineRow
```

### Example 2: Monitoring View with Logs

```typescript
// Agent monitoring with real-time logs
const result = await mcpClient.callTool("render_dashboard", {
  processes: [
    { type: "log", name: "System Logs", streamUrl: "/stream/logs" },
    { type: "pipeline", name: "Vector Daemon", status: "active", metric: "15,420 vectors" },
    { type: "pipeline", name: "Reranker", status: "error", metric: "Timeout" }
  ],
  layout: { width: 160, height: 60, density: 0.8 },
  output: { format: "file", filename: "monitor.html" }
});

// Returns: File path to saved HTML with LogStream + PipelineRows
```

### Example 3: Detail View

```typescript
// Agent displaying detailed documentation
const result = await mcpClient.callTool("render_dashboard", {
  processes: [
    { 
      type: "block", 
      name: "Architecture Overview",
      content: "# System Architecture\n\nThe system uses...",
      size: "long"
    }
  ],
  layout: { width: 65, height: 80, density: 0.9 },
  output: { format: "html" }
});

// Returns: SmartBlock with markdown rendered, 65ch width (standard reading)
```

---

## Best Practices

- **Keep it simple:** Agents send data, get HTML. No design decisions required.
- **Layout constraints are hints:** Service optimizes within constraints but can adapt.
- **Prefer vertical scrolling:** If data exceeds height, scroll beats truncation.
- **Consistent styling:** All output uses same Tailwind theme (Terminal/Industrial).
- **Fast rendering:** Layout calculation should be <50ms, total render <100ms.
- **Cache-friendly:** Same input → same output (deterministic layout).

---

## Verification

- [ ] Test with `amalfa init` to ensure brief is indexed
- [ ] Verify HTML output renders correctly in browser
- [ ] Test edge cases (empty data, extreme layouts, invalid input)
- [ ] Document for agents: include in README.md once implemented

---

## Related Files

- `src/components/` - Component library to integrate
- `src/components/README.md` - Component documentation
- `src/mcp/` - MCP server implementation location
- `website/ssr-docs/` - Example of SSR dashboard patterns
