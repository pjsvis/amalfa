# AMALFA Extraction Progress

## Session Summary: 2026-01-06

### ✅ Completed Phases

#### Phase 1: Lift-and-Shift
- Created AMALFA GitHub repository
- Copied entire PolyVis codebase (945 files, 187k lines)
- Verified MCP server works in new location
- **Commit:** `44b3d8d` - "Initial commit: Lift from PolyVis"

#### Phase 2: Remove UI/Web Components
- Removed 258 files (~56k lines)
- Deleted directories:
  - `public/` - Web UI assets
  - `src/js/` - Alpine.js frontend
  - `src/css/` - Tailwind CSS
  - `experiments/` - GGUF, ML experiments
  - `examples/` - Example code
  - Misc: `images/`, `conductor/`, `inferences/`, `local_cache/`
- **Result:** 687 files remaining (~131k lines, 30% reduction)
- **Commit:** `fbe029a` - "Phase 2: Remove UI/web components"

#### Phase 3: Dependency Audit
- Updated package.json metadata:
  - Name: `amalfa` (was `polyvis`)
  - Version: `1.0.0`
  - Author: `729613+pjsvis@users.noreply.github.com`
  - Repository: `github.com/pjsvis/amalfa`
  - Keywords: mcp, knowledge-graph, vector-search, etc.
- Removed UI/web dependencies:
  - Alpine.js, Tailwind CSS, basecoat-css
  - Drizzle ORM, Graphology
  - OpenAI, Mistral AI clients
  - Remark, marked, compromise (markdown processors)
- Kept MCP essentials:
  - `@modelcontextprotocol/sdk@1.25.0`
  - `fastembed@2.0.0`
  - `pino@10.1.0`
- **Result:** 463 → 163 packages (65% reduction)
- **Commit:** `4775f17` - "Phase 3: Dependency audit"

### 🔜 Next Phase

#### Phase 4: Restructure for Package (NOT STARTED)
**Goal:** Simplify src/ structure for NPM distribution

**Current structure:**
```
src/
├── mcp/index.ts           # MCP server entry point
├── core/VectorEngine.ts   # Vector search
├── resonance/db.ts        # ResonanceDB wrapper
└── utils/                 # Logger, ServiceLifecycle, etc.
```

**Proposed structure:**
```
src/
├── server.ts              # Main MCP server (from mcp/index.ts)
├── database.ts            # ResonanceDB
├── vector.ts              # VectorEngine
├── utils.ts               # Consolidated utilities
└── cli.ts                 # CLI entry point
```

**Tasks:**
- [ ] Flatten src/ directory structure
- [ ] Consolidate utility files
- [ ] Update imports (remove @src aliases, use relative)
- [ ] Update package.json with main/bin/exports
- [ ] Create build script for distribution
- [ ] Test local installation

---

## NPM Package Status

### Reserved
- **Package name:** `amalfa`
- **Version:** `0.0.0-reserved` (placeholder)
- **NPM URL:** https://www.npmjs.com/package/amalfa
- **Account:** `polyvis`
- **Email:** `pjstarifa@gmail.com` (to be switched to no-reply)

### v1.0.0 Requirements (from brief)
- [ ] Package installable via `bun add amalfa`
- [ ] CLI commands:
  - `amalfa init [--source <path>]` - Initial ingestion
  - `amalfa serve` - Start MCP server (stdio)
  - `amalfa daemon start|stop|status` - File watcher
  - `amalfa doctor` - Dependency/config check
  - `amalfa stats` - Database statistics
- [ ] Supports hollow-nodes pattern
- [ ] Vector search working (FAFCAS)
- [ ] Graph traversal working
- [ ] Content reading working
- [ ] Configuration via `amalfa.config.ts`
- [ ] Works with Claude Desktop (macOS tested)
- [ ] Comprehensive README
- [ ] Platform matrix documented

---

## Current Codebase Stats

### Files & Lines
- **Total files:** 687
- **Total lines:** ~131k
- **Package size:** ~8MB (with node_modules)

### Dependencies
- **Total packages:** 163
- **Core dependencies:** 3
  - @modelcontextprotocol/sdk
  - fastembed
  - pino
- **Dev dependencies:** 4
  - @biomejs/biome
  - @types/bun
  - only-allow
  - pino-pretty

### Key Files
- `src/mcp/index.ts` - MCP server (343 lines)
- `src/core/VectorEngine.ts` - Vector search
- `src/resonance/db.ts` - Database wrapper
- `src/utils/ServiceLifecycle.ts` - Process management
- `src/utils/Logger.ts` - Logging
- `src/utils/EnvironmentVerifier.ts` - Env checks

---

## MCP Server Features

### Tools
1. **search_documents** - Vector semantic search
2. **read_node_content** - Read markdown from hollow nodes
3. **explore_links** - Graph edge traversal
4. **list_directory_structure** - List doc folders
5. **inject_tags** - Annotate files (Gardener)

### Resources
- **polyvis://stats/summary** - Database statistics

### Current Issues
- Hardcoded database path: `public/resonance.db` (needs .amalfa/)
- Hardcoded server name: "polyvis-mcp" (needs "amalfa")
- No configuration file support yet

---

## Reference Documents

### Created
- `/Users/petersmith/Documents/GitHub/polyvis/briefs/pending/brief-amalfa-extraction.md` - Master brief
- `/Users/petersmith/Documents/GitHub/polyvis/briefs/pending/npm-account-setup-guide.md` - NPM setup
- `/Users/petersmith/Documents/GitHub/polyvis/scripts/lift-to-amalfa-auto.sh` - Migration script

### Key Sections in Brief
- Development Strategy (Lift-and-Shift rationale)
- Package Structure (proposed)
- Configuration Schema (amalfa.config.ts)
- Launch Strategy (HN, Reddit, newsletters)
- NPM Publication Process
- Platform Risk Assessment (FastEmbed)

---

## Git History

```
44b3d8d - Initial commit: Lift from PolyVis
fbe029a - Phase 2: Remove UI/web components and experiments
4775f17 - Phase 3: Dependency audit and package.json cleanup
```

---

## Session Achievements

1. ✅ NPM account created (`polyvis`)
2. ✅ Package name reserved (`amalfa`)
3. ✅ Git configured with no-reply email
4. ✅ AMALFA repo created and pushed
5. ✅ Lift-and-shift completed
6. ✅ UI/web code removed
7. ✅ Dependencies reduced by 65%
8. ✅ MCP server verified working throughout

---

## Next Session Tasks

### Immediate (Phase 4)
1. Flatten src/ directory structure
2. Update imports to relative paths
3. Configure package.json for distribution
4. Add build script (if needed for CLI)
5. Test local installation flow

### Soon After (Phase 5)
1. Implement CLI commands (init, serve, daemon, doctor, stats)
2. Extract ingestion pipeline from PolyVis scripts
3. Support `.amalfa/` directory convention
4. Add `amalfa.config.ts` configuration loading
5. Create comprehensive README
6. Write integration tests

### Launch Prep (Phase 6)
1. Create demo video (3-5 min)
2. Write Dev.to tutorial
3. Prepare "Show HN" post
4. Test with Claude Desktop
5. Publish v1.0.0 to NPM
6. Announce!

---

## CLI Architecture Design

### Ingestion Strategy (Two-Phase)

**Phase 1: Initial Build (One-time)**
```bash
amalfa init --source ./docs
```
- Creates `.amalfa/` directory
- Ingests all markdown files from source
- Generates embeddings via FastEmbed
- Builds `resonance.db` with hollow-nodes pattern
- Blocks until complete (with progress bar)

**Phase 2: Maintenance (Ongoing)**
```bash
amalfa daemon start
```
- Watches source directory for file changes
- Incremental updates to database
- Re-embeds only modified files
- Runs in background (detached process)

**MCP Server Usage**
```bash
amalfa serve
```
- Assumes database already exists (from `init`)
- Fails fast if `.amalfa/resonance.db` not found
- Error message: "Database not found. Run 'amalfa init' first."

### CLI Commands (v1.0)

| Command | Purpose | Blocks |
|---------|---------|--------|
| `amalfa init [--source <path>]` | Initial ingestion & DB build | Yes |
| `amalfa serve` | Start MCP server (stdio) | Yes |
| `amalfa daemon start\|stop\|status` | File watcher service | No |
| `amalfa doctor` | Check dependencies/config | No |
| `amalfa stats` | Database statistics | No |

### Configuration File (`amalfa.config.ts`)

```typescript
export default {
  source: "./docs",              // Where to ingest from
  database: ".amalfa/resonance.db",
  embeddings: {
    model: "BAAI/bge-small-en-v1.5",
    dimensions: 384
  },
  watch: {
    enabled: true,
    debounce: 1000  // ms
  }
}
```

### User Workflow

1. Install: `bun add -g amalfa`
2. Configure: Create `amalfa.config.ts` in project root
3. Initialize: `amalfa init`
4. Start watcher: `amalfa daemon start`
5. Use with Claude: Add to `claude_desktop_config.json`

### Benefits

✅ **Clear separation** - Build vs. serve vs. maintain
✅ **Fast startup** - MCP server doesn't rebuild on every launch
✅ **Incremental updates** - Daemon only re-embeds changed files
✅ **Explicit control** - User decides when to rebuild
✅ **Better DX** - `amalfa doctor` catches missing initialization

---

## Key Decisions Made

1. **Lift-and-shift over clean extraction** - Lower risk, faster validation
2. **Minimal dependencies** - Only 3 core packages for v1.0
3. **Stdio only** - No HTTP/SSE for v1.0 (MCP standard)
4. **Hollow nodes only** - Single schema pattern (PolyVis style)
5. **BGE-Small-EN-v1.5** - Modern embedding model (not all-MiniLM)
6. **macOS/Linux/WSL2 primary** - Native Windows "experimental"
7. **GitHub no-reply email** - Privacy for package author
8. **Bun-first** - Node.js compatibility in v1.1
9. **Init/daemon/serve split** - Separates ingestion from serving

---

**Status:** Ready for Phase 4 restructuring
**Timeline:** ~3 weeks to v1.0.0 (per original brief)
**Blocker:** None - all dependencies resolved
