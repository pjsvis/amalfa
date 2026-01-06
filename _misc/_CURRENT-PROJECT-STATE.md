# Polyvis Project State - Verifiable Capabilities Baseline

**Last Updated:** 2025-12-12  
**Schema Version:** 1.0.0  
**Git Branch:** alpine-refactor  
**Status:** 🟢 STABLE BASELINE ESTABLISHED

---

## Executive Summary

This document defines the **non-negotiable baseline** of Polyvis capabilities. Any future changes that degrade these capabilities constitute a **regression** and must be blocked until fixed.

**Purpose:** Prevent capability drift and confusion over "single source of truth" implementations.

---

## 1. Database Capabilities ✅

### Core Infrastructure
- **File:** `public/resonance.db`
- **Size:** 1.2 MB (328 nodes, 1515 edges)
- **Engine:** SQLite 3.x via `bun:sqlite`
- **Mode:** WAL (Write-Ahead Logging) ✅
- **Git Status:** ❌ Ignored (via `.gitignore`)

### Verified Capabilities

| Capability | Status | Test Command | Expected Result |
|------------|--------|--------------|----------------|
| **WAL Mode** | ✅ | `sqlite3 public/resonance.db 'PRAGMA journal_mode;'` | `wal` |
| **Node Count** | ✅ | `sqlite3 public/resonance.db 'SELECT COUNT(*) FROM nodes;'` | `328` |
| **Edge Count** | ✅ | `sqlite3 public/resonance.db 'SELECT COUNT(*) FROM edges;'` | `1515` |
| **FTS5 Enabled** | ✅ | `sqlite3 public/resonance.db 'SELECT COUNT(*) FROM nodes_fts;'` | `328` |
| **Vector Embeddings** | ✅ | `sqlite3 public/resonance.db 'SELECT COUNT(*) FROM nodes WHERE embedding IS NOT NULL;'` | `> 0` |
| **Integrity** | ✅ | `sqlite3 public/resonance.db 'PRAGMA integrity_check;'` | `ok` |

### API Methods

```typescript
// ResonanceDB (resonance/src/db.ts)
✅ insertNode(node: Node): void
✅ insertEdge(source, target, type): void
✅ searchText(query, limit): SearchResult[]  // FTS5
✅ findSimilar(vector, limit, domain): SimilarNode[]  // Vector
✅ getStats(): DbStats
✅ getNodeHash(id): string | null
✅ close(): void
```

**Verification:**
```bash
# Run FTS search test
bun run -e "
import {ResonanceDB} from './resonance/src/db.ts';
const db = new ResonanceDB();
const results = db.searchText('graph');
console.log('FTS Results:', results.length);
db.close();
"
```

---

## 2. Configuration Standards ✅

### Single Source of Truth
**File:** `polyvis.settings.json` (root)

```json
{
  "paths": {
    "database": {
      "resonance": "public/resonance.db"
    },
    "sources": {
      "experience": {
        "directories": ["debriefs", "playbooks", "briefs"]
      },
      "persona": {
        "lexicon": "scripts/fixtures/conceptual-lexicon-ref-v1.79.json",
        "cda": "scripts/fixtures/cda-ref-v63.json"
      }
    }
  },
  "graph": {
    "tuning": {
      "louvain": {
        "persona": 1.1,
        "experience": 1.0
      }
    }
  },
  "schema": {
    "version": "1.0.0"
  }
}
```

### Import Pattern (MANDATORY)
```typescript
// ✅ CORRECT - Always use this
import settings from "@/polyvis.settings.json";
import { join } from "path";
const dbPath = join(process.cwd(), settings.paths.database.resonance);

// ❌ WRONG - Never hardcode paths
const dbPath = "public/resonance.db";
```

**Verification:**
```bash
# Check for hardcoded paths (should find only 1 in debug script)
rg -t ts -t js 'public/resonance\.db' scripts/
# Expected: Only scripts/verify/debug_bun_edges.ts (flagged for fix)
```

---

## 3. TypeScript Compilation ⚠️

### Status: 6 Errors (Non-Blocking)

**Current State:**
```bash
tsc --noEmit
# 6 errors in scripts/utils/VectorEngine.ts (type imports + undefined checks)
```

**Errors:**
- Type import needs `type` keyword (verbatimModuleSyntax)
- Missing undefined checks on optional properties

**Action Required:** Fix in next regularization sprint (non-critical)

---

## 4. Biome Linting 🟡

### Status: Format-Only Warnings

**Current State:**
```bash
bunx biome check src/ resonance/src/ scripts/ --diagnostic-level=error
# 0 errors, only formatting suggestions
```

**Safe to proceed** - formatting can be batch-fixed with `bun run format`

---

## 5. Ingestion Pipeline ✅

### Performance Baseline
```
Processed: 138 files
Total Load: 416.42 KB (426415 chars)
Time Taken: 18.59s
Throughput: 22931.74 chars/sec
Database Stats:
  - Nodes: 327
  - Vectors: 139
  - Edges: 1516
  - Semantic Tagged: 138
```

### Pipeline Components

| Component | Status | Function |
|-----------|--------|----------|
| **Lexicon Bootstrap** | ✅ | Loads concepts from `conceptual-lexicon-ref-v1.79.json` |
| **CDA Ingest** | ✅ | Loads directives from enriched CDA artifacts |
| **Experience Ingest** | ✅ | Processes markdown files from briefs/debriefs/playbooks |
| **Edge Weaving** | ✅ | Creates semantic links between nodes |
| **Tokenization** | ✅ | Extracts semantic tokens from content |
| **Embeddings** | ✅ | Generates vector embeddings via fastembed |
| **Hash Delta Detection** | ✅ | Skips unchanged content (idempotent) |

**Verification:**
```bash
bun run scripts/pipeline/ingest.ts
# Should complete without errors and show stats above
```

---

## 6. Graph Visualization ✅

### Sigma Explorer
- **URL:** `/public/sigma-explorer/index.html`
- **Database Loading:** ✅ Fetches `/resonance.db` via XHR
- **Louvain Communities:** ✅ Detects communities with configurable resolution
- **Domains:** Persona (185 nodes), Experience (128 docs)
- **Interactive:** Pan, zoom, search, node details

**Console Status:** ✅ Zero errors (verified 2025-12-12)

---

## 7. Schema Definition ✅

### Canonical Schema
**Location:** `src/db/schema.ts` (Drizzle ORM)

```typescript
export const nodes = sqliteTable("nodes", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title"),
  content: text("content"),
  domain: text("domain").default("knowledge"),
  layer: text("layer").default("experience"),
  embedding: blob("embedding", { mode: "buffer" }),
  hash: text("hash"),
  meta: text("meta"),
});

export const edges = sqliteTable("edges", {
  source: text("source").notNull(),
  target: text("target").notNull(),
  type: text("type").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.source, t.target, t.type] }),
}));
```

**Materialized in:** `resonance/src/db.ts` lines 28-50

---

## 8. Known Issues & Technical Debt

### Priority 1: Fix Before Next Release
- [ ] **Hardcoded Path:** `scripts/verify/debug_bun_edges.ts:3` uses hardcoded `"public/resonance.db"`
- [ ] **Documentation Cleanup:** Remove `ctx.db` references from non-archived docs
  - `docs/project-structure.md`
  - `docs/tooling-showcase.md`
  - `docs/project-standards.md`
  - `docs/data-architecture.md`
  - `README.md`

### Priority 2: Next Regularization Sprint
- [ ] Fix TypeScript errors in `scripts/utils/VectorEngine.ts`
- [ ] Address Biome formatting warnings
- [ ] Add `any` type annotations (lint warnings in `resonance/src/db.ts`)

### Priority 3: Enhancement Backlog
- [ ] Implement SieveNet architecture (see `briefs/polyvis-semantic-linking.md`)
- [ ] Add HNSW vector index for N > 10k nodes
- [ ] Create automated regression tests for database capabilities

---

## 9. File System Layout (Verified)

```
polyvis/
├── public/
│   ├── resonance.db          ✅ Main database (NOT in git)
│   ├── resonance.db-wal      ✅ WAL file (ephemeral, NOT in git)
│   ├── resonance.db-shm      ✅ SHM file (ephemeral, NOT in git)
│   └── sigma-explorer/       ✅ Graph visualization UI
├── src/
│   ├── css/                  ✅ Stylesheets (Tailwind + theme.css)
│   ├── js/                   ✅ Frontend JavaScript (Alpine.js)
│   └── db/                   ✅ Drizzle schema definitions
├── resonance/
│   └── src/
│       ├── db.ts             ✅ ResonanceDB class (WAL + FTS)
│       ├── config.ts         ✅ Settings schema
│       └── services/         ✅ Embedder, Tokenizer
├── scripts/
│   ├── pipeline/             ✅ Ingestion scripts
│   ├── migrations/           ✅ Database migrations (FTS added)
│   └── verify/               ✅ Validation scripts
├── docs/                     ✅ Project documentation
├── playbooks/                ✅ Operational protocols
├── briefs/                   ✅ Technical specifications
├── debriefs/                 ✅ Session reports
├── polyvis.settings.json     ✅ SINGLE SOURCE OF TRUTH
└── .gitignore                ✅ Excludes resonance.db*
```

---

## 10. MCP Server Readiness Assessment

### Current State: 🟡 FOUNDATION READY, IMPLEMENTATION PENDING

#### What We Have ✅
- **Database:** Stable, queryable SQLite with FTS5 and vectors
- **API Layer:** `ResonanceDB` class with clean methods
- **Search:** Text search (FTS5) + Vector search functional
- **Configuration:** Single source of truth pattern established
- **Documentation:** Architecture defined in `briefs/pending/D-brief-resonance-mcp.md`

#### What's Missing ❌
- **MCP SDK:** No `@modelcontextprotocol/*` dependencies in `package.json`
- **Server Implementation:** No `src/mcp/server.ts` or equivalent
- **Tools Definition:** MCP tools not defined (search, traverse, etc.)
- **CLI Integration:** No `resonance serve --mcp` command
- **Transport:** No stdio/SSE server setup

#### Dependencies Needed
```json
{
  "@modelcontextprotocol/sdk": "^0.5.0",
  "@modelcontextprotocol/server-stdio": "^0.1.0"
}
```

#### Estimated Effort
- **Foundation:** ✅ Already complete (database + API)
- **MCP Integration:** ~4-6 hours (server + tools + testing)
- **Testing:** ~2 hours (MCP Inspector + Claude Desktop)
- **Documentation:** ~1 hour

**Verdict:** We have all the building blocks. MCP implementation is a **clean layer** on top of existing infrastructure. No architectural changes needed.

---

## 11. Verification Commands (Checklist)

Run these to verify baseline integrity:

```bash
# 1. Database integrity
sqlite3 public/resonance.db 'PRAGMA integrity_check;'
# Expected: ok

# 2. WAL mode enabled
sqlite3 public/resonance.db 'PRAGMA journal_mode;'
# Expected: wal

# 3. FTS5 functional
sqlite3 public/resonance.db 'SELECT COUNT(*) FROM nodes_fts;'
# Expected: 328

# 4. No hardcoded paths (except known issue)
rg -t ts -t js 'public/resonance\.db' scripts/ src/ resonance/
# Expected: 1 result (scripts/verify/debug_bun_edges.ts)

# 5. No ctx.db references in scripts
rg "ctx.db" scripts/ src/
# Expected: 0 results

# 6. Settings import pattern usage
rg 'settings\.paths\.database\.resonance' scripts/ -c
# Expected: 15+ results

# 7. TypeScript compilation (warnings OK)
tsc --noEmit
# Expected: 6 errors in VectorEngine.ts

# 8. Biome linting (errors only)
bunx biome check src/ resonance/src/ scripts/ --diagnostic-level=error
# Expected: 0 errors (formatting warnings OK)

# 9. Ingestion pipeline
bun run scripts/pipeline/ingest.ts
# Expected: ~328 nodes, ~1515 edges, no errors

# 10. Git ignore working
git check-ignore public/resonance.db
# Expected: public/resonance.db (ignored)
```

---

## 12. Capability Regression Prevention

### Before Any Major Change:
1. ✅ Run all verification commands above
2. ✅ Document current baseline metrics
3. ✅ Ensure changes don't reduce capability count
4. ✅ Update this document if new capabilities added

### Red Flags (BLOCK IMMEDIATELY):
- ⛔ WAL mode disabled
- ⛔ FTS5 index missing or broken
- ⛔ Hardcoded database paths introduced
- ⛔ `ctx.db` references in active code
- ⛔ Duplicate configuration files
- ⛔ Database not gitignored

---

## 13. Next Milestones

### Immediate (This Session)
- [x] Add FTS5 to database
- [x] Update `.gitignore` for resonance.db
- [x] Create database capabilities documentation
- [x] Create this project state document
- [ ] Fix hardcoded path in `debug_bun_edges.ts`
- [ ] Clean `ctx.db` references from docs

### Short-Term (Next Sprint)
- [ ] Fix TypeScript compilation errors
- [ ] Address Biome linting warnings
- [ ] Implement automated baseline verification tests
- [ ] Create MCP server MVP

### Medium-Term (Next Month)
- [ ] SieveNet architecture implementation
- [ ] HNSW vector index for scale
- [ ] Comprehensive test coverage (>80%)
- [ ] Performance benchmarking suite

---

## 14. Contacts & Ownership

**Maintainer:** petersmith  
**Architecture:** Bun + SQLite + Alpine.js  
**Philosophy:** Zero Magic, Fast as Fuck, Single Source of Truth  

**Key Documents:**
- Architecture: `docs/data-architecture.md`
- Database: `docs/database-capabilities.md`
- Protocols: `AGENTS.md`
- Standards: `docs/project-standards.md`

---

**Baseline Established:** 2025-12-12  
**Next Review:** Upon completion of any major feature or refactor  
**Status:** 🟢 STABLE - Ready for enhancement
