# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

**Note:** For agent behavior and philosophy, see `AGENTS.md`. The Edinburgh Protocol (Scottish Enlightenment-inspired reasoning) is most effective when placed in your agent's **system prompt** rather than loaded as a file-based rule. Key principles: Mentational Humility (maps vs territory), systems over villains, anti-dogma pragmatism.

## Project Overview

**Amalfa** gives AI agents persistent memory and semantic search across sessions via Model Context Protocol (MCP). Agents can query past work ("What did we learn about auth?") and get ranked, relevant results from structured markdown documentation (briefs, debriefs, playbooks).

**Core Philosophy:** Markdown files are the source of truth. The database is a **disposable runtime artifact** that can be regenerated anytime with `rm .amalfa/resonance.db* && amalfa init`.

**Key Benefits:**
- Zero migration hell (upgrade by re-ingesting)
- Git-native knowledge (version control markdown, not databases)
- Sub-second searches across 1000+ documents
- 4.6x faster than grep, 95% search precision

## Essential Commands

### Development Workflow

```bash
# Install dependencies (MUST use Bun, not npm)
bun install

# Run tests
bun test

# Code quality
bun run check      # Biome linting
bun run format     # Auto-format code

# Core commands
bun run amalfa init              # Initialize database from markdown
bun run amalfa serve             # Start MCP server (stdio mode)
bun run amalfa stats             # Show database statistics
bun run amalfa doctor            # Run health check
bun run amalfa setup-mcp         # Generate MCP config for Claude

# CLI search commands (all support --json flag)
bun run amalfa search <query>    # Semantic search [--limit N]
bun run amalfa read <node-id>    # Read document content
bun run amalfa explore <node-id> # Show related documents [--relation type]
bun run amalfa list-sources      # Show configured source directories
bun run amalfa find-gaps         # Discover unlinked documents [--limit N] [--threshold T]
bun run amalfa inject-tags <path> <tag1> [tag2...] # Add metadata tags

# Service management
bun run amalfa servers           # Show all service status
bun run amalfa stop-all          # Stop all running services (alias: kill)

# Individual services (start|stop|status|restart)
bun run amalfa watcher start     # File watcher daemon
bun run amalfa vector start      # Vector embedding daemon
bun run amalfa reranker start    # Reranking daemon
bun run amalfa sonar start       # Sonar AI agent
bun run amalfa ember scan        # Ember enrichment service

# Diagnostic and enhancement commands
bun run amalfa validate [--graph]        # Database validation and integrity checks
bun run amalfa enhance --strategy=STRAT  # Graph enhancement (adamic-adar|pagerank|communities)
bun run amalfa scripts list              # List available maintenance scripts
```

### Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/ember/analyzer.test.ts

# Run with watch mode
bun test --watch
```

### Database Operations

```bash
# Regenerate database (preserves embedding model cache)
rm .amalfa/resonance.db*
amalfa init

# Full reset (only if you need to clear 128MB model cache)
rm .amalfa/resonance.db*  # WARNING: Deletes embedding model cache
amalfa init

# Check database integrity
sqlite3 .amalfa/resonance.db "PRAGMA integrity_check;"

# View schema
sqlite3 .amalfa/resonance.db ".schema"
```

### Schema Migrations (Drizzle)

**CRITICAL:** Always use Drizzle for schema changes. Never manually edit SQL.

```bash
# 1. Edit schema
vim src/resonance/drizzle/schema.ts

# 2. Generate migration
bunx drizzle-kit generate

# 3. Review generated SQL
cat src/resonance/drizzle/migrations/XXXX_*.sql

# 4. Apply migration
bunx drizzle-kit migrate

# 5. Verify
sqlite3 .amalfa/resonance.db ".schema nodes"
```

## CLI vs MCP Mode

**Amalfa operates in two modes:**

### CLI Mode (Direct Command Line)
Execute commands directly from terminal without running MCP server.

**Use when:**
- Testing queries without MCP overhead
- Shell scripting and automation (CI/CD)
- Human power users prefer terminal
- Agents execute shell commands (not MCP protocol)
- One-shot queries (no persistent server needed)

**Available Commands:**
- `search`, `read`, `explore`, `list-sources`, `find-gaps`, `inject-tags`
- All support `--json` flag for machine-readable output
- Example: `amalfa search "oauth" --json | jq '.[0].id' | xargs amalfa read`

### MCP Mode (Model Context Protocol Server)
Run as stdio server exposing 8 tools to MCP clients (e.g., Claude Desktop).

**Use when:**
- Integrated with Claude Desktop or other MCP clients
- Multi-turn agent conversations
- Need scratchpad caching (MCP-only feature)
- Prefer agent-native tool calling

**Start server:** `amalfa serve`

## MCP Tools (What Agents Can Do)

Amalfa exposes 8 MCP tools:
1. **search_documents(query, limit)** - Semantic search across knowledge graph
2. **read_node_content(id)** - Read full markdown content
3. **explore_links(id, relation)** - Traverse document relationships
4. **find_gaps(limit, threshold)** - Discover similar but unlinked documents
5. **list_directory_structure()** - Show document organization
6. **inject_tags(path, tags)** - Add metadata to documents
7. **scratchpad_read(id)** / **scratchpad_list()** - Cache management

**Full Reference:** See `docs/MCP-TOOLS.md` for signatures, examples, and workflows.

## Architecture

### Technology Stack
- **Runtime:** Bun (TypeScript-native, fast startup, required)
- **Database:** SQLite with WAL mode (local-first)
- **Embeddings:** FastEmbed (`bge-small-en-v1.5`, 384 dims)
- **Reranking:** Xenova Transformers (`bge-reranker-base`)
- **Protocol:** Model Context Protocol (MCP)
- **Linting/Formatting:** Biome (tabs, double quotes)

### Core Concepts

**1. Hollow Nodes**
Nodes store only metadata in SQLite. Content lives on the filesystem. Use `GraphGardener.getContent(nodeId)` to hydrate content.

```typescript
// ❌ WRONG
const node = db.getNode(id);
const content = node.content; // Always undefined

// ✅ CORRECT
const node = db.getNode(id);
const content = await gardener.getContent(id);
```

**2. FAFCAS Protocol**
**F**ast **A**s **F**ck, **C**ool **A**s **S**hit. A vector storage protocol:
- Vectors normalized to unit length (L2 norm = 1.0) before storage
- Stored as raw BLOBs in SQLite
- Similarity = pure dot product (not cosine, since vectors are normalized)
- Result: 10x faster than cosine similarity, zero serialization overhead

**3. Micro-Daemon Mesh**
Four background services provide intelligence:
- **File Watcher Daemon:** Monitors markdown changes, triggers re-ingestion with embeddings. Watches directories specified in config sources.
- **Vector Daemon (3010):** Standalone embedding HTTP service (optional). Provides on-demand embedding generation via HTTP API.
- **Reranker Daemon (3011):** Result relevance scoring using BGE cross-encoder. Improves search precision by 3-5 position changes.
- **Sonar Agent (3012):** LLM reasoning loop. Query intent analysis, result reranking, context extraction. Requires local Ollama or cloud provider (OpenRouter).

**Note:** The file watcher daemon includes its own embedding pipeline. The vector daemon is a separate HTTP service for on-demand embedding generation.

Managed via `amalfa servers` command. Use `amalfa servers --dot` to visualize service dependencies as a graph.

**4. Brief-Debrief-Playbook Pattern**
Agents follow a structured reflection workflow:
```
Brief (task spec)
   ↓
Work (implementation)
   ↓
Debrief (learnings)
   ↓
Playbook (patterns)
```

See `docs/VISION-AGENT-LEARNING.md` for philosophy.

### Directory Structure

```
src/
├── mcp/           # MCP server implementation (stdio transport)
├── resonance/     # Database layer (SQLite + Drizzle)
│   ├── drizzle/   # Schema definitions and migrations
│   └── services/  # Node/edge CRUD operations
├── core/          # Graph processing engines
│   ├── VectorEngine.ts      # Semantic search
│   ├── EdgeWeaver.ts        # Graph edge construction
│   ├── GraphEngine.ts       # Graph traversal
│   ├── Harvester.ts         # Markdown parsing
│   └── BentoNormalizer.ts   # Vector normalization (FAFCAS)
├── daemon/        # Background services
│   └── sonar-*.ts # Reasoning agent
├── ember/         # Auto-augmentation service (metadata enrichment)
├── pipeline/      # Ingestion pipeline
├── cli/           # CLI command implementations
└── utils/         # Logging, validation, lifecycle

scripts/
├── cli/           # CLI entry points (ingest.ts)
└── pipeline/      # Batch processing

docs/              # Vision and architecture docs
briefs/            # Task specifications (work to be done)
debriefs/          # Agent reflections (what was learned)
playbooks/         # Codified patterns (reusable knowledge)

# Brief-Debrief-Playbook Workflow
briefs/            # Start: Task specifications written before work
debriefs/          # During/After: Learnings and insights from implementation
playbooks/         # End: Distilled patterns for future reuse
```

## Critical Files

### Database Layer
- `src/resonance/DATABASE-PROCEDURES.md` - **Read before any database changes**
- `src/resonance/drizzle/schema.ts` - Single source of truth for schema
- `src/resonance/db.ts` - ResonanceDB class (high-performance wrapper)

### Core Processing
- `src/core/VectorEngine.ts` - Semantic search implementation
- `src/core/BentoNormalizer.ts` - FAFCAS vector normalization
- `src/core/Harvester.ts` - Markdown → graph node conversion
- `src/core/EdgeWeaver.ts` - Relationship detection

### Configuration
- `amalfa.config.json` - Runtime config (sources, database path)
- `amalfa.config.example.ts` - Full config reference
- `biome.json` - Code style (tabs, double quotes, organize imports)

## Development Guidelines

### Code Style
- **Formatting:** Tabs for indentation, double quotes for strings (enforced by Biome)
- **Imports:** Auto-organized via Biome (`organizeImports: "on"`)
- **Run before commit:** `bun run check && bun run format`

### Database Rules
1. **Never use Drizzle query builders in production code** - Use `db.prepare()` with raw SQL for performance
2. **Drizzle is only for schema definition and migrations**
3. **Always backup before schema changes:** `cp .amalfa/resonance.db .amalfa/resonance.db.backup`
4. **Never store content in the database** - Content stays on filesystem

### Vector Operations
- All embeddings must be normalized via `BentoNormalizer.toFafcas()` before storage
- Use dot product for similarity (not cosine) - vectors are pre-normalized
- See `playbooks/embeddings-and-fafcas-protocol-playbook.md` for details

### Testing Patterns
- Tests use in-memory SQLite (`:memory:`)
- Test files: `*.test.ts` in `tests/` or co-located with source
- Use `DatabaseFactory.createTestDB()` for test databases

### Package Management
**CRITICAL:** Amalfa requires Bun. Do not use npm, yarn, or pnpm.

```bash
# ✅ Correct
bun install
bun install -g amalfa

# ❌ Wrong
npm install        # Will not work
npm install -g amalfa  # Installs but won't run
```

Why Bun?
- Native TypeScript execution (no build step)
- Optimized SQLite bindings
- Fast stdio transport for MCP
- Built-in daemon management

## Common Tasks

### Add New MCP Tool
1. Edit `src/mcp/index.ts`
2. Add tool definition to `server.setRequestHandler(ListToolsRequestSchema, ...)`
3. Add tool implementation to `server.setRequestHandler(CallToolRequestSchema, ...)`
4. Test with Claude Desktop

### Add New CLI Command
1. Create handler in `src/cli/<command>.ts`
2. Register in `src/cli.ts` command parser
3. Test: `bun run amalfa <command>`

### Modify Database Schema
1. Read `src/resonance/DATABASE-PROCEDURES.md` (mandatory)
2. Edit `src/resonance/drizzle/schema.ts`
3. `bunx drizzle-kit generate`
4. Review generated SQL
5. `bunx drizzle-kit migrate`
6. Test with `bun test`

### Add New Service/Daemon
1. Implement `ServiceLifecycle` interface (`src/utils/ServiceLifecycle.ts`)
2. Register in service mesh
3. Add status check to `src/cli/commands/server.ts`

## Troubleshooting

### "Command not found: amalfa"
```bash
# Check PATH
which amalfa

# Add Bun bin to PATH (in ~/.zshrc or ~/.bashrc)
export PATH="$HOME/.bun/bin:$PATH"
source ~/.zshrc
```

### "Database is locked"
```bash
# Kill daemons
amalfa servers stop

# Check for processes
lsof .amalfa/resonance.db

# Restart
amalfa servers start
```

### "Table does not exist"
```bash
# Apply migrations
bunx drizzle-kit migrate

# Or regenerate from scratch (preserves 128MB model cache)
amalfa init
```

### Can't uninstall amalfa
```bash
# Use the same package manager you installed with
bun remove -g amalfa    # If installed with Bun (correct)
npm uninstall -g amalfa # If somehow installed with npm

# Verify
which amalfa
# Should show ~/.bun/bin/amalfa or nothing
```

## Key Patterns & Anti-Patterns

### ✅ DO
- Use Bun for all package operations
- Use Drizzle for schema changes
- Use raw SQL with `db.prepare()` for queries
- Normalize vectors before storage
- Read from filesystem for content (hollow nodes)
- Use `amalfa doctor` for diagnostics
- Use `amalfa init` to regenerate database

### ❌ DON'T
- Use npm/yarn/pnpm instead of Bun
- Edit migration SQL files manually
- Use Drizzle query builders in production
- Store content in database
- Skip vector normalization
- Make schema changes without backups
- Assume content exists in node.content

## References

### Core Documentation
- `docs/MCP-TOOLS.md` - Complete MCP tool reference (NEW)
- `docs/ARCHITECTURE.md` - Technical deep dive (NEW)
- `docs/VISION-AGENT-LEARNING.md` - Core philosophy
- `docs/USER-MANUAL.md` - Setup and maintenance
- `src/resonance/DATABASE-PROCEDURES.md` - Database operations (critical)

### Playbooks
- `playbooks/embeddings-and-fafcas-protocol-playbook.md` - Vector architecture
- `playbooks/local-first-vector-db-playbook.md` - SQLite patterns
- `playbooks/problem-solving-playbook.md` - Debugging strategies
- `playbooks/debriefs-playbook.md` - Debrief writing guide

### External
- MCP Specification: https://modelcontextprotocol.io
- Drizzle ORM: https://orm.drizzle.team
- Bun Runtime: https://bun.sh
- FastEmbed: https://github.com/Anush008/fastembed-rs

## Package Information
- **Package:** amalfa
- **npm:** https://www.npmjs.com/package/amalfa
- **Repository:** https://github.com/pjsvis/amalfa
- **License:** MIT

## Agent Output Style
When working with agents in this repository (especially those using the Edinburgh Protocol), prefer concise terminal output with full details in documents:

```
✅ Task Complete

[2-3 line summary of what was done]

📄 Full details: path/to/document.md
```

This reduces cognitive load and keeps terminal scannable while preserving full context in readable documents. See `AGENTS.md` for complete interaction guidelines.
