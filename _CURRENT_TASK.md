# Current Task: AMALFA Extraction

**Status**: Phase 5 In Progress (60% complete) 🚧  
**Last Session**: 2026-01-06  
**Project**: Extract AMALFA NPM package from PolyVis  
**Timeline**: ~1.5 weeks remaining to v1.0.0

---

## Project Overview

**AMALFA** = **A Memory Layer For Agents**

Extracting PolyVis core functionality (knowledge graph + MCP server) into standalone NPM package for AI agent memory.

**Package name**: `amalfa` (reserved on NPM)  
**Repository**: https://github.com/pjsvis/amalfa  
**NPM account**: `polyvis`

---

## Completed Work

### ✅ Phase 1: Lift-and-Shift
- Created AMALFA GitHub repo
- Copied entire PolyVis codebase (945 files, 187k lines)
- Verified MCP server works in new location
- **Commit**: `44b3d8d`

### ✅ Phase 2: Remove UI/Web Components
- Removed 258 files (~56k lines, 30% reduction)
- Deleted: `public/`, `src/js/`, `src/css/`, `experiments/`, `examples/`
- Result: 687 files, ~131k lines remaining
- **Commit**: `fbe029a`

### ✅ Phase 3: Dependency Audit
- Updated package.json metadata (name, author, repo, keywords)
- Removed UI dependencies (Alpine, Tailwind, Drizzle, OpenAI clients)
- Kept MCP essentials: `@modelcontextprotocol/sdk`, `fastembed`, `pino`
- Result: 463 → 163 packages (65% reduction)
- **Commit**: `4775f17`

### ✅ Phase 4: Rebrand and Update Paths
- Database path: `public/resonance.db` → `.amalfa/resonance.db`
- Server name: `polyvis-mcp` → `amalfa-mcp`
- Branding: PolyVis → AMALFA throughout
- Resource URI: `polyvis://` → `amalfa://`
- Added `.amalfa/` to gitignore (database is cache, markdown is truth)
- MCP server tested and working
- **Commit**: `ced3c1b`

### ✅ Phase 5: CLI Implementation (PARTIAL - 60%)
**Working Commands:**
- ✅ `amalfa serve` - Start MCP server (with DB validation)
- ✅ `amalfa stats` - Database statistics (nodes, edges, size)
- ✅ `amalfa doctor` - Health check (Bun, deps, DB, directories)
- ✅ `amalfa help` / `amalfa version` - Documentation

**Stubbed Commands (TODO):**
- ⏳ `amalfa init` - Initialize database from markdown files
- ⏳ `amalfa daemon` - File watcher service (incremental updates)

**Commits**: `aceabfd` (DESIGN_DECISIONS.md), `05d1c44` (CLI implementation)

---

## Current State

### Repository Structure
```
amalfa/
├── src/
│   ├── cli.ts              # CLI entry point ✅
│   ├── mcp/index.ts        # MCP server ✅
│   ├── core/VectorEngine   # FAFCAS vector search ✅
│   ├── resonance/          # DB + schema ✅
│   └── utils/              # Lifecycle, Logger ✅
├── .amalfa/
│   └── resonance.db        # Database (2.32 MB, 494 nodes, 503 edges)
├── DESIGN_DECISIONS.md     # Architectural philosophy ✅
├── EXTRACTION_PROGRESS.md  # Detailed progress tracking ✅
└── package.json            # NPM config with bin entry ✅
```

### Testing Status
- ✅ MCP server starts and runs
- ✅ CLI commands (`serve`, `stats`, `doctor`) working
- ✅ Database connection verified
- ✅ Health checks pass
- ⏳ End-to-end workflow (init → daemon → serve) not yet tested

---

## Next Session Tasks

### Priority 1: Complete Phase 5 CLI
**Target: 2-3 hours**

1. **Implement `amalfa init` command**
   - Extract ingestion pipeline from PolyVis (`scripts/pipeline/`)
   - Core files to port:
     - `scripts/pipeline/ingestor.ts` - Main ingestion logic
     - `src/core/EdgeWeaver.ts` - Graph construction
     - `src/resonance/services/embedder.ts` - Embedding generation
   - Requirements:
     - Read markdown files from source directory
     - Generate embeddings via FastEmbed
     - Build `.amalfa/resonance.db` with hollow-nodes pattern
     - Show progress bar during ingestion
   - Configuration: Use defaults or read `amalfa.config.ts`

2. **Implement `amalfa daemon` command**
   - File watcher using `fs.watch()` or `chokidar`
   - Debounced updates (1000ms default)
   - Incremental re-embedding of changed files
   - Background service using `ServiceLifecycle` pattern
   - Commands: `start`, `stop`, `status`, `restart`

3. **Add configuration file support**
   - Load `amalfa.config.ts` (or `.js`, `.json`)
   - Schema:
     ```typescript
     {
       source: "./docs",
       database: ".amalfa/resonance.db",
       embeddings: { model: "BAAI/bge-small-en-v1.5", dimensions: 384 },
       watch: { enabled: true, debounce: 1000 },
       excludePatterns: ["node_modules", ".git"]
     }
     ```

### Priority 2: Documentation
**Target: 1-2 hours**

1. **Write README.md**
   - Installation: `bun add -g amalfa`
   - Quick start: `init` → `daemon` → `serve`
   - Claude Desktop configuration
   - Philosophy: Markdown is truth, database is cache
   - Link to DESIGN_DECISIONS.md

2. **Write docs/MCP_TOOLS.md**
   - Document each MCP tool with schemas
   - Example interactions

3. **Write docs/AGENTS.md**
   - Guide for AI agents using AMALFA
   - "You are an AI agent..." style

### Priority 3: Testing & Launch Prep
**Target: 1-2 hours**

1. **End-to-end testing**
   - Create test markdown files
   - Run `amalfa init`
   - Verify database created
   - Start daemon, modify files, verify updates
   - Test MCP server with Claude Desktop

2. **Publish v1.0.0 to NPM**
   - Switch NPM email to no-reply address
   - Final testing
   - `npm publish`

---

## Key Decisions Made

1. **Local-first** - Privacy, speed, zero cost
2. **SQLite** - Simple, fast, reliable (WAL mode)
3. **Markdown as truth** - Database is ephemeral cache
4. **Hollow nodes** - Metadata + embeddings only
5. **FAFCAS** - Fast vector search without vector DB
6. **MCP protocol** - Standard interface for agents
7. **Bun runtime** - Modern, fast, great DX
8. **CLI-first** - Explicit commands (init/daemon/serve)
9. **LLM-first** - MCP tools over human UI
10. **No visualization in v1.0** - Focus on agent memory

See `DESIGN_DECISIONS.md` for detailed rationale.

---

## Working in Two Repos

**PolyVis** (`/Users/petersmith/Documents/GitHub/polyvis`):
- Source repository
- Contains ingestion pipeline code to extract
- Database to copy for testing
- Playbooks, briefs, debriefs remain here

**AMALFA** (`/Users/petersmith/Documents/GitHub/amalfa`):
- Extraction target (current working directory)
- NPM package structure
- CLI implementation
- Active development

---

## Quick Reference

**Current Git Status:**
- Branch: `main`
- Last commit: `05d1c44` (Phase 5 CLI)
- Commits ahead of origin: 0 (all pushed)

**Database:**
- Path: `.amalfa/resonance.db`
- Size: 2.32 MB
- Nodes: 494
- Edges: 503
- Embeddings: 309 (384-dim)

**CLI Testing:**
```bash
bun run src/cli.ts help       # Show help
bun run src/cli.ts stats      # Database stats
bun run src/cli.ts doctor     # Health check
bun run src/cli.ts serve      # Start MCP server
```

---

## Session Handoff

**Resume with:**
> "Continue AMALFA Phase 5: implement `amalfa init` and `amalfa daemon` commands. See EXTRACTION_PROGRESS.md and this file for context."

**Files to review:**
- `EXTRACTION_PROGRESS.md` - Detailed progress
- `DESIGN_DECISIONS.md` - Architectural philosophy
- `src/cli.ts` - Current CLI implementation
- PolyVis: `scripts/pipeline/ingestor.ts` - Code to extract

**Key insight:** Core infrastructure done. Need ingestion pipeline and file watcher to complete v1.0.

**Timeline:** ~1.5 weeks to launch. On track! 🚀
