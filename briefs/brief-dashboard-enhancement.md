## Task: Dashboard Enhancement & Live Service Integration

**Objective:** Fix Datastar errors, add live service status monitoring, and enhance the dashboard with better search, additional widgets, and improved user experience.

**Status:** 🚧 IN PROGRESS

## High-Level Requirements

- [ ] Fix Datastar console errors in search widget
- [ ] Implement live service status (query PID files for actual daemon health)
- [ ] Add briefs to Recent Activity widget (currently only debriefs)
- [ ] Enhance search UI with filters and better result display
- [ ] Add new widgets: Quick Actions, Graph Growth (ASCII chart), System Resources
- [ ] Add auto-refresh capability for live data
- [ ] Improve mobile responsive behavior
- [ ] Add keyboard shortcuts for power users

## Key Actions Checklist:

- [ ] **Bug Fixes & Stabilization**
  - [ ] Fix Datastar expression errors in search input binding
  - [ ] Fix Datastar `data-for` loop expression errors
  - [ ] Add error handling for failed API calls with user feedback
  - [ ] Validate all HTML generation escapes special characters properly

- [ ] **Live Service Status Implementation**
  - [ ] Create `/api/services` endpoint that checks PID files
  - [ ] Check `.amalfa/runtime/watcher.pid`, `vector.pid`, `reranker.pid`
  - [ ] Query process table to verify daemons are actually running
  - [ ] Return JSON with service states: `{ watcher: "active|inactive", vector: "active|idle|inactive", reranker: "..." }`
  - [ ] Update dashboard to poll `/api/services` every 30 seconds
  - [ ] Add visual indicator: green (active), yellow (idle), red (inactive)

- [ ] **Enhanced Recent Activity Widget**
  - [ ] Scan both `/debriefs` and `/briefs` directories
  - [ ] Display both types with visual distinction
  - [ ] Briefs: Blue indicator, show "[BRIEF]" prefix
  - [ ] Debriefs: Green indicator, show "[DEBRIEF]" prefix
  - [ ] Sort by date across both types
  - [ ] Limit to top 10 combined items
  - [ ] Add filter toggle: All | Briefs | Debriefs

- [ ] **Search Enhancement**
  - [ ] Add search filter options: Documents | Briefs | Debriefs | All
  - [ ] Show result count and search time
  - [ ] Add result preview/snippet (first 100 chars)
  - [ ] Add clear button to reset search
  - [ ] Add "No results" message when empty
  - [ ] Add keyboard shortcut: `/` focuses search, `Escape` clears

- [ ] **New Widgets**
  - [ ] **Quick Actions** widget (top of RHS):
    - [ ] "Run Ingest" button → triggers `amalfa init`
    - [ ] "Find Gaps" button → triggers gap analysis
    - [ ] "View Stats" link → navigates to detailed stats
  - [ ] **Graph Growth** widget (ASCII chart):
    - [ ] Show node count over time (last 7 days)
    - [ ] Use ASCII bar chart: `[████░░░░░░] 1,714 nodes`
    - [ ] Store history in `.amalfa/dashboard-history.jsonl`
  - [ ] **System Resources** widget:
    - [ ] DB file size
    - [ ] Cache directory size
    - [ ] Last ingestion timestamp

- [ ] **Polish & UX**
  - [ ] Add loading states with spinner/indicator
  - [ ] Add timestamp to "last updated" in System Status
  - [ ] Add auto-refresh toggle (every 30s/60s/off)
  - [ ] Improve mobile: better touch targets, simplified layout
  - [ ] Add toast notifications for actions

## Detailed Requirements / Visuals

### Live Service Status Design

Current (static):
```
Service Status
○ Watcher   ○ Vector   ○ Reranker
```

Target (live):
```
Service Status          [refresh ↻]
● Watcher (active)    PID: 1234
● Vector (idle)       Last: 2m ago
○ Reranker (stopped)  Click to start
```

### Enhanced Recent Activity

Current:
```
Recent Activity              [↻]
• debrief-2026-02-04-...
• debrief-2026-02-03-...
```

Target:
```
Recent Activity    [All ▼]  [↻]
[B] brief-website-server-consolidation
    2026-02-04 | System architecture
[D] debrief-2026-02-04-website-...
    2026-02-04 | Server consolidation
[D] debrief-2025-02-03-package-...
    2026-02-03 | Multi-ecosystem detection
```

### Search Enhancement

Target:
```
🔍 Semantic Search                    [Clear]
[Search query...          ]         47 results (0.3s)
Filter: [All ▼] [Documents ▼]

┌─ Results ──────────────────────────────┐
│ 1. brief-website-server-consolidation │
│    Server consolidation task with...   │
│    Score: 95% | Type: Brief          │
│                                        │
│ 2. debrief-2026-02-04-website-...     │
│    Debrief documenting the server...  │
│    Score: 87% | Type: Debrief        │
└────────────────────────────────────────┘
```

## Technical Implementation Notes

### PID File Checking
```typescript
// Check if service is running
async function checkServiceStatus(pidFile: string): Promise<{ active: boolean; pid?: number }> {
  try {
    const pid = await Bun.file(pidFile).text();
    // Check if process exists
    const proc = await $`ps -p ${pid.trim()}`.quiet();
    return { active: proc.exitCode === 0, pid: parseInt(pid) };
  } catch {
    return { active: false };
  }
}
```

### Graph Growth History
Store in `.amalfa/dashboard-history.jsonl`:
```jsonl
{"timestamp":"2026-02-04T10:00:00Z","nodes":1700,"edges":6300}
{"timestamp":"2026-02-04T11:00:00Z","nodes":1714,"edges":6329}
```

### Datastar Fixes
- Use `data-bind-__datastar` instead of direct `data-bind`
- Escape `$` in expressions: `\$searchQuery`
- Use `data-on-keydown__datastar` for events

## Success Criteria

- [ ] No console errors when using dashboard
- [ ] Service status shows real PID and state
- [ ] Recent Activity includes both briefs and debriefs
- [ ] Search has working filters and shows result count
- [ ] All new widgets load without errors
- [ ] Mobile layout is usable (tested at <100ch width)
- [ ] Auto-refresh can be toggled on/off

## Related Artifacts

- **Playbook**: `playbooks/terminal-style-playbook.md` - UI styling reference
- **Debrief**: `debriefs/2026-02-04-website-server-consolidation.md` - Previous session
- **Current Dashboard**: http://localhost:3001/
- **API Endpoint**: http://localhost:3001/api/stats

---

**Next Steps After Completion:**
1. Test all widgets manually
2. Run lighthouse/mobile audit
3. Update `terminal-style-playbook.md` if new patterns discovered
4. Archive brief and create debrief
