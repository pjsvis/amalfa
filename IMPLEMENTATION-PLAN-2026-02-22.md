# AMALFA Implementation Plan
## Synthesized from Briefs Review

**Date:** 2026-02-22  
**Based on:** Review of 46+ briefs across root/, pending/, holding/, future/, and archive/

---

## Executive Summary

AMALFA (A Memory Layer For Agents) is a **knowledge graph system** that provides persistent memory and semantic search for AI agents. It uses TypeScript/Bun with SQLite, FastEmbed embeddings, and MCP (Model Context Protocol) for agent integration.

**Current State:**
- ✅ Core functionality released (v1.4.0): MCP server, vector search, SQLite database, CLI
- ✅ Ember enrichment service operational (Phase 2)
- 🚧 Multiple active refactor workstreams in progress
- 🚧 Dashboard enhancements IN PROGRESS
- ⏳ Website Phase 1 prototype ready to begin
- ⏳ Remeda adoption queued for execution

---

## Phase 1: Immediate Priority (Ready to Execute)

### 1.1 Remeda Adoption - Utility Foundation ⏳ PRIORITY
**Status:** Ready  
**Effort:** 2-3 hours  
**Dependencies:** None

**Briefs:**
- `brief-add-to-wrapper.md` - Foundation
- `brief-refactor-dashboard-daemon.md` - First consumer
- `brief-refactor-lexicon-harvester.md` - Major consumer
- `brief-remeda-adoption-2026-02-05.md` - Master brief

**Goal:** Harden ingestion pipelines with Remeda toolkit patterns

**Key Deliverables:**
1. Add `to()` wrapper to `src/utils/JsonlUtils.ts` for explicit async error handling
2. Add `toJsonl()` helper for safe JSON parsing
3. Add `R.pipe()` patterns for linear transformations
4. Empty array early returns with `R.isEmpty()`

**Success Criteria:**
- [ ] `to()` and `toJsonl()` functions added
- [ ] TypeScript compiles without errors
- [ ] `brief-refactor-dashboard-daemon` can use the new utilities

---

### 1.2 Dashboard Daemon Refactor ⏳ PRIORITY
**Status:** Ready (depends on 1.1)  
**Effort:** 3-4 hours  
**Dependencies:** 1.1

**Brief:** `brief-refactor-dashboard-daemon.md`

**Target:** `src/services/dashboard-daemon.ts`

**Changes:**
```typescript
// BEFORE: Manual readFileSync + split
private async getRecentRuns() {
  const lines = readFileSync(runsFile, "utf-8")
    .split("\n")
    .filter((l) => l.trim());
  return lines.slice(-10).reverse().map((line) => JSON.parse(line));
}

// AFTER: JsonlUtils with Remeda
private async getRecentRuns(): Promise<RunsEntry[]> {
  const entries = await JsonlUtils.readAll<RunsEntry>(runsFile);
  if (R.isEmpty(entries)) return [];
  return R.slice(entries, -10).reverse();
}
```

**Success Criteria:**
- [ ] `getRecentRuns()` uses `JsonlUtils.readAll()`
- [ ] Uses `R` utilities for slicing/reversing
- [ ] Dashboard still displays recent runs correctly

---

### 1.3 LexiconHarvester Refactor ⏳ PRIORITY
**Status:** Ready (depends on 1.1)  
**Effort:** 4-6 hours  
**Dependencies:** 1.1

**Brief:** `brief-refactor-lexicon-harvester.md`

**Target:** `src/core/LexiconHarvester.ts`

**Changes Required:**
1. Replace nested `.map()` with `R.pipe()` + `R.flatMap()` (lines 118-127)
2. Replace mutable `.sort()` with immutable `R.sort()` (lines 160-162)
3. Replace silent `catch (_e)` with `to()` wrapper (lines 47, 102)
4. Add `R.isEmpty()` for early returns
5. Consider extracting `normalize()` to utility

**Success Criteria:**
- [ ] All `.map()` chains converted to `R.pipe()`
- [ ] All `.sort()` replaced with `R.sort()`
- [ ] All `catch (_e)` replaced with `to()` wrapper
- [ ] Harvest produces identical output
- [ ] All tests pass

---

## Phase 2: Dashboard Enhancement (In Progress)

### 2.1 Dashboard Live Services & UX 🚧 IN PROGRESS
**Status:** In Progress  
**Effort:** 8-12 hours  
**Dependencies:** 1.1, 1.2

**Brief:** `brief-dashboard-enhancement.md`

**Current Workstream:** Bug fixes and stabilization

**Key Components:**
1. **Live Service Status** - Query PID files for actual daemon health
   - Check `.amalfa/runtime/watcher.pid`, `vector.pid`, `reranker.pid`
   - Create `/api/services` endpoint
   - Visual indicators: green (active), yellow (idle), red (inactive)

2. **Enhanced Recent Activity** - Include briefs, not just debriefs
   - Scan both `/debriefs` and `/briefs` directories
   - Visual distinction: [B]riefs vs [D]ebriefs
   - Filter toggle: All | Briefs | Debriefs

3. **Search Enhancement**
   - Add filters: Documents | Briefs | Debriefs | All
   - Show result count and search time
   - Result preview snippets
   - Keyboard shortcuts: `/` focuses search, `Escape` clears

4. **New Widgets**
   - Quick Actions (Run Ingest, Find Gaps, View Stats)
   - Graph Growth ASCII chart
   - System Resources (DB size, cache size, last ingestion)

5. **DataStar Fixes**
   - Use `data-bind-__datastar` instead of direct `data-bind`
   - Escape `$` in expressions: `\$searchQuery`

**Success Criteria:**
- [ ] No console errors when using dashboard
- [ ] Service status shows real PID and state
- [ ] Recent Activity includes both briefs and debriefs
- [ ] Search has working filters and shows result count

---

### 2.2 Unified Terminal Dashboard (CIC)
**Status:** Draft  
**Effort:** 12-16 hours  
**Dependencies:** 2.1

**Brief:** `2026-02-04-unified-terminal-dashboard.md`

**Goal:** Replace existing dashboard with DataStar-powered "Combat Information Center"

**Key Components (RHS Blocks):**
1. **[TELEMETRY]** - Live harvest counters (files, errors, tokens, USD)
2. **[GRAPH]** - Node/Edge counts, Pipeline C coverage ratio
3. **[SERVICES]** - Current PID state and control prompts
4. **[SYSTEM]** - Logs, system stats (CPU/MEM), version info

**Tech Stack:**
- Framework: DataStar (SSE-driven updates from Bun/Hono)
- Layout: Character-based grid (`ch` units) with collision detection
- Data Source: Existing `DashboardDaemon` APIs + new SSE endpoints

**Success Metrics:**
- Real-time spend visibility during `amalfa harvest`
- Zero client-side JS logic for UI updates (pure DataStar)
- Unified "Expanse-Terminal" aesthetic

---

## Phase 3: Website Prototype (Next Major Initiative)

### 3.1 Website Phase 1 - Foundation ⏳ READY
**Status:** Draft (ready to begin)  
**Effort:** 16-20 hours  
**Dependencies:** None

**Brief:** `brief-website-prototype-phase-1.md`

**Objective:** Prototype unified website using **Bun + Hono + JSX SSR + DataStar**

**Existing Assets:**
- SSR Docs: `website/ssr-docs/server.ts` (Markdown rendering, Bun.serve)
- Terminal CSS: `website/ssr-docs/public/terminal-style.css` (ANSI palette)
- Dashboard: `website/dashboard.html` (Static HTML, Datastar loaded)
- Graph Viz: `website/sigma-explorer/` (Static graph visualization)

**Proposed Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Bun Runtime                              │
├─────────────────────────────────────────────────────────────┤
│  Hono Server (port 3001)                                    │
│  ├── GET /              -> index.tsx (Home + Search)        │
│  ├── GET /docs          -> docs.tsx (Navigation + Content)   │
│  ├── GET /graph         -> graph.tsx (Sigma + Live Data)     │
│  ├── GET /api/*         -> REST endpoints                    │
│  └── SSR Pages          -> .tsx files with JSX               │
├─────────────────────────────────────────────────────────────┤
│  SQLite Database (readonly for safety)                       │
│  ├── Nodes (1,719)                                          │
│  ├── Edges (6,329)                                          │
│  └── Vector Embeddings (384-dim)                            │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Phases:**

**Phase 1: Foundation (4-5 hours)**
- Add Hono JSX configuration
- Create `website/pages/` directory with `.tsx` pages
- Move `terminal-style.css` to shared location
- Verify Bun + Hono + JSX SSR works
- **Deliverable:** Home page with search bar, stats panel

**Phase 2: Docs Integration (5-6 hours)**
- Port `markdown.ts` logic to JSX components
- Create `docs.tsx` with sidebar navigation
- Implement markdown rendering via Bun.markdown.html()
- Add client-side nav (DataStar or vanilla)
- **Deliverable:** Working docs browser, replace `/ssr-docs`

**Phase 3: Graph Exploration (4-5 hours)**
- Create typed DB query layer for nodes/edges
- Build `graph.tsx` with Sigma.js integration
- Add entity search and detail views
- Connect to live SQLite
- **Deliverable:** Live graph browser, replace `/sigma-explorer`

**Phase 4: Search Enhancement (3-4 hours)**
- Add vector search endpoint (FastEmbed integration)
- Create search results component with scoring
- Implement autocomplete with DataStar
- **Deliverable:** Semantic search replacing text-only

**Success Criteria:**
- [ ] Homepage loads in < 100ms
- [ ] Docs navigation works without page reload
- [ ] Graph visualization shows live node count
- [ ] Vector search returns meaningful results
- [ ] Zero client-side React bundle
- [ ] Single server process (Bun + Hono)

---

## Phase 4: Knowledge Graph & Pipeline

### 4.1 Code Knowledge Graph ⏳ PROPOSAL
**Status:** Proposal  
**Effort:** 5-7 days  
**Dependencies:** None

**Brief:** `brief-knowledge-graph-proposal.md`

**Goal:** Extract semantic units from codebase to build navigable knowledge graph

**High-Value Tokens:**
- Functions, methods, classes, types, interfaces
- Relationships: calls, inherits-from, imports, dependencies
- Semantic context: docstrings, type signatures, parameters
- Configuration: models, roles, providers, CLI options

**Graph Schema:**
- **Nodes:** File, Module, Class, Function, Type, Constant, Provider, Role, Hook, Config
- **Edges:** imports, defined-in, calls, returns-from, extends, implements, uses

**Implementation Strategy:**

**Phase 1: Baseline Graph (1 day)**
- Use `lsp_symbols` with `scope="workspace"` to get all symbols
- Run `tsc --noEmit` to validate type signatures
- Store in JSON format

**Phase 2: Call Graph (2-3 days)**
- Literal imports: AST-grep `import { $A } from "b"`
- Wildcard imports: AST-grep `import * as $A from "b"`
- Function calls: AST-grep for `funcName(...)`
- Edge confidence labeling (High/Medium/Low)

**Phase 3: Domain Entities (1 day)**
- Providers: Glob for `*Provider.ts` files
- Roles: Read `.hiac/roles.yaml`, parse YAML
- Hooks: Parse `--hook <cmd>` usage patterns
- Configuration: Scan `src/utils/config.ts`

**Phase 4: Patterns & Metrics (1 day)**
- Duplicate detection via function body hashing
- Hardcoded values via regex search
- Security issues via denylist patterns
- Test coverage tracking

**Benefits:**
- AI assistants get instant grounding for function implementations
- Humans navigate to related code with single query
- Cross-file debugging via call chain tracing
- Living documentation reflecting current code

---

### 4.2 Cross-Domain Pipeline Restoration ✅ PARTIAL
**Status:** Critical, partially complete  
**Effort:** 4-6 hours  
**Dependencies:** None

**Brief:** `2026-02-01-cross-domain-pipeline-ssot-violations.md`

**Issues Already Fixed:**
- ✅ SSOT violations in `src/pipeline/cross-domain/01-generate-edges.ts`
- ✅ SSOT violations in `src/pipeline/cross-domain/02-ingest.ts`

**Remaining Work:**
1. Create "Handling Non-Compliant Vectors" section in FAFCAS playbook
2. Create Streaming Patterns playbook (Memory Management Decision Tree)
3. FAFCAS-compliant rewrite of cross-domain pipeline
4. Investigate why vectors aren't FAFCAS-normalized

**Questions to Answer:**
- Should we normalize all vectors in database? Migration strategy?
- Use existing `VectorEngine.findSimilar()` instead of custom code?

**Prevention Measures:**
1. Mandatory RTFM: Search existing documentation before implementing
2. SSOT Linting: Add pre-commit hooks preventing hard-coded paths
3. Architecture First: Check existing infrastructure before building new

---

## Phase 5: Major Architecture (Pending/Deferred)

### 5.1 Dynamic Context Discovery ⏳ PENDING
**Status:** Proposed, in pending/  
**Effort:** 2-3 weeks  
**Dependencies:** Architectural decision

**Brief:** `pending/brief-phase7-dynamic-discovery.md`

**Goal:** Implement "Dynamic Context Discovery" pattern to eliminate context overflows

**Four Protocols:**

**Phase 1: Scratchpad Protocol (Heavy Output)**
- Intercept tool outputs in MCP server
- If payload > 2000 chars, write to temp file, return path
- Location: `.amalfa/cache/scratchpad/`

**Phase 2: Historian Protocol (Session Persistence)**
- Stop storing findings in memory
- Append every "thought" to session-specific Markdown file
- Location: `.amalfa/sessions/`

**Phase 3: Modular Toolbox (Dynamic Discovery)**
- Move tool schemas from TypeScript to JSON files
- Implement `list_capabilities` meta-tool
- Abstract model providers into discoverable "substrates"
- Support: Ollama Cloud, GLM, MiniMax, ZenMux

**Phase 4: Mirror Protocol (Introspection)**
- Grant agent read access to system logs
- Enable self-healing and autonomous debugging

**Success Metrics:**
- Zero "Context Length Exceeded" errors
- 100% of agent thoughts recoverable after daemon crash
- Reduction in average input tokens per request

**Note:** This is a significant architectural change requiring careful design review before execution.

---

### 5.2 Domain Skeletonisation ⏳ DEFERRED
**Status:** Directory with 3 sub-briefs, not immediate priority

**Briefs:** `brief-domain-skeletisation/brief-domain-skeletonisation-0{1,2,3}.md`

Work deferred - not in current sprint scope.

---

### 5.3 Mastra Integration ⏳ DEFERRED
**Status:** Directory with 2 sub-briefs, future exploration

**Briefs:** `brief-mastra/brief-mastra-*`

Exploratory work for Mastra MCP memory server integration.

---

## Phase 6: Future Enhancements (Someday/Maybe)

### 6.1 Monitoring Dashboard
**Brief:** `future/brief-amalfa-monitoring-dashboard.md`

### 6.2 Factored Bento Layout
**Brief:** `future/brief-factored-bento-layout.md`

### 6.3 Consistent ID Generation
**Brief:** `future/2026-01-28-consistent-id-generation.md`

### 6.4 Lang Extract Providers
**Brief:** `future/brief-lang-extract-providers.md`

### 6.5 Tiered Maintenance
**Brief:** `future/brief-tiered-maintenance-2026-01-16.md`

---

## Implementation Recommendations

### Recommended Execution Order

```
Week 1: Remeda Foundation
├── Day 1-2: 1.1 Add to() wrapper to JsonlUtils
├── Day 3:   1.2 Refactor dashboard-daemon.ts
└── Day 4-5: 1.3 Refactor LexiconHarvester.ts

Week 2: Dashboard Completion
├── Day 1-2: 2.1 Continue dashboard enhancements
├── Day 3-4: 2.1 DataStar fixes and testing
└── Day 5:   Review and stabilize

Week 3: Website Phase 1
├── Day 1-2: 3.1 Foundation (Hono + JSX setup)
├── Day 3-4: 3.1 Docs integration
└── Day 5:   3.1 Graph exploration start

Week 4: Website + Knowledge Graph
├── Day 1-2: Complete 3.1 Website Phase 1
├── Day 3-4: 4.1 Knowledge Graph baseline
└── Day 5:   4.2 Cross-domain pipeline fixes
```

### Risk Mitigation

1. **Remeda Adoption Risk:** Low - well-documented patterns, incremental changes
2. **Dashboard Risk:** Medium - DataStar integration complexity
3. **Website Risk:** Medium - New stack (Hono JSX) learning curve
4. **Knowledge Graph Risk:** High - Complex AST analysis, potential performance issues

### Success Metrics

**Technical:**
- TypeScript compilation: Zero errors
- Test suite: All green
- Dashboard: No console errors
- Website: <100ms page load, zero client-side React

**Functional:**
- Remeda: All pipelines use `to()` wrapper and `R.pipe()`
- Dashboard: Live service status accurate
- Website: All routes functional, search returns results
- Knowledge Graph: Can query call chains, find related code

---

## Appendix: Brief Taxonomy

### Active (Root Directory)
| Brief | Status | Priority | Effort |
|-------|--------|----------|--------|
| brief-add-to-wrapper | Ready | HIGH | 2-3h |
| brief-refactor-dashboard-daemon | Ready | HIGH | 3-4h |
| brief-refactor-lexicon-harvester | Ready | HIGH | 4-6h |
| brief-remeda-adoption | Ready | HIGH | Meta |
| brief-dashboard-enhancement | In Progress | HIGH | 8-12h |
| brief-website-prototype-phase-1 | Draft | MEDIUM | 16-20h |
| brief-knowledge-graph-proposal | Proposal | MEDIUM | 5-7d |
| 2026-02-04-unified-terminal-dashboard | Draft | MEDIUM | 12-16h |
| 2026-02-01-cross-domain-pipeline | Partial | HIGH | 4-6h |

### Pending (Approved, Waiting)
| Brief | Status | Priority | Effort |
|-------|--------|----------|--------|
| brief-phase7-dynamic-discovery | Proposed | HIGH | 2-3w |
| dependency-graph-reaction | Unknown | TBD | TBD |

### Holding (Paused)
| Brief | Status | Blocker |
|-------|--------|---------|
| brief-edinburgh-protocol | Paused | Research |
| brief-meta-swarm | Paused | Design |
| brief-node-dependency-removal | Paused | Dependencies |

### Future (Someday/Maybe)
| Brief | Status | Category |
|-------|--------|----------|
| brief-amalfa-monitoring-dashboard | Future | Observability |
| brief-factored-bento-layout | Future | UI/UX |
| brief-lang-extract-providers | Future | AI |
| brief-tiered-maintenance | Future | DevEx |

### Archive (Completed)
60+ completed briefs including:
- Ember service implementation
- Reranking system
- Dashboard integration
- Search improvements
- Documentation alignment

---

*Generated from systematic review of briefs/ directory*
*Following Edinburgh Protocol principles: Systems over villains, empirical evidence, practical improvement*
