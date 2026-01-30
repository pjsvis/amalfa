# Implementation Plan: Amalfa Monitoring Dashboard

## Objective
Create a persistent background service that provides real-time observability for Amalfa operations, with immediate focus on harvest monitoring and historical stats.

## Architecture

### Service Structure
```
Dashboard Daemon (port 3013)
├── Summary Page (/)
│   ├── System Health
│   ├── Harvest Stats
│   ├── Cache Metrics
│   └── Quick Links
├── Graph Viz (/graph) - Existing Sigma.js
├── Doc Browser (/docs) - Existing markdown renderer
└── API Endpoints
    ├── /api/stats - Current system stats
    ├── /api/harvest-status - Cache hit rate, skipped files
    └── /api/runs - Historical ingestion data
```

### Phase 1: MVP (This Session)

#### 1.1 Dashboard Daemon (`src/services/dashboard-daemon.ts`)
- Hono server on port 3013
- Lifecycle management (start/stop/status)
- PID file: `.amalfa/pids/dashboard.pid`
- Logging via Pino

#### 1.2 Summary Page (`/`)
**Static HTML + SSR**
- **System Health**: DB size, node count, edge count, last updated
- **Harvest Stats**: Total cached, cache hit rate, skipped files (from manifest)
- **Recent Activity**: Last 5 ingestion runs (from `.amalfa/runs.jsonl`)
- **Quick Links**: Graph viz, doc browser, harvest command

#### 1.3 Stats Persistence
**File**: `.amalfa/runs.jsonl`
**Schema**:
```json
{
  "timestamp": "2026-01-30T10:00:00Z",
  "operation": "harvest",
  "files_processed": 531,
  "cache_hits": 495,
  "cache_misses": 36,
  "skipped": 10,
  "errors": 23,
  "duration_ms": 900000,
  "cost_usd": 0.50
}
```

**Integration**: Modify `harvest.ts` to log on completion.

#### 1.4 CLI Integration
- `amalfa dashboard start` - Start daemon
- `amalfa dashboard stop` - Stop daemon
- `amalfa dashboard status` - Check if running
- `amalfa dashboard open` - Open browser to dashboard

#### 1.5 Serve Existing Assets
- `/graph` → Serve existing Sigma.js graph viz
- `/docs` → Serve existing markdown browser
- Static files from `public/` directory

## Implementation Steps

### Step 1: Create Dashboard Daemon (30 min)
1. Create `src/services/dashboard-daemon.ts`
2. Hono server with routes
3. PID file management
4. Graceful shutdown

### Step 2: Summary Page (45 min)
1. Create `src/services/dashboard/views/summary.tsx` (Hono JSX)
2. Query stats from ResonanceDB
3. Read harvest manifest (`.amalfa/harvest-skipped.json`)
4. Read recent runs (`.amalfa/runs.jsonl`)
5. Render with Pico.css (existing)

### Step 3: Stats Persistence (15 min)
1. Create `src/utils/StatsLogger.ts`
2. Modify `harvest.ts` to log on completion
3. Create `.amalfa/runs.jsonl` if not exists

### Step 4: CLI Commands (20 min)
1. Create `src/cli/commands/dashboard.ts`
2. Register commands in `src/cli.ts`
3. Test start/stop/status

### Step 5: Asset Serving (20 min)
1. Copy existing graph viz to `public/graph.html`
2. Copy existing doc browser to `public/docs.html`
3. Add static file serving to Hono

## File Structure
```
src/
├── services/
│   ├── dashboard-daemon.ts (new)
│   └── dashboard/
│       ├── views/
│       │   └── summary.tsx (new)
│       └── api/
│           ├── stats.ts (new)
│           └── runs.ts (new)
├── cli/commands/
│   └── dashboard.ts (new)
└── utils/
    └── StatsLogger.ts (new)

public/ (new)
├── graph.html
└── docs.html

.amalfa/
├── runs.jsonl (new)
└── pids/
    └── dashboard.pid (new)
```

## Success Criteria
- [ ] Dashboard starts on port 3013
- [ ] Summary page shows current stats
- [ ] Harvest stats visible (cache hits, skipped files)
- [ ] Historical runs displayed
- [ ] Graph viz accessible at `/graph`
- [ ] Doc browser accessible at `/docs`
- [ ] CLI commands work (start/stop/status/open)
- [ ] Stats logged on harvest completion

## Next Session (Phase 2)
- Real-time SSE updates during harvest
- Progress bar for active operations
- Cost tracking visualization
- Anomaly detection (timeouts, errors)

---

**Ready to implement. Proceeding with Step 1.**
