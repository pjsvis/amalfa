# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Amalfa** is a Model Context Protocol (MCP) server that provides semantic search and knowledge graph capabilities for AI agents. It transforms markdown documents into a queryable knowledge graph with vector embeddings, enabling persistent agent memory across sessions.

**Core Philosophy:** The database is a **disposable runtime artifact**. Markdown files are the source of truth. You can always regenerate the database with `rm -rf .amalfa/ && bun run scripts/cli/ingest.ts`.

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

# Core commands (use these for local development)
bun run amalfa init              # Initialize database from markdown
bun run amalfa serve             # Start MCP server (stdio mode)
bun run amalfa stats             # Show database statistics
bun run amalfa doctor            # Run health check
bun run amalfa setup-mcp         # Generate MCP config for Claude

# Service management
bun run amalfa servers           # Show all service status
bun run amalfa stop-all          # Stop all running services

# Individual services (start|stop|status|restart)
bun run amalfa daemon start      # File watcher daemon
bun run amalfa vector start      # Vector embedding daemon
bun run amalfa reranker start    # Reranking daemon
bun run amalfa sonar start       # Sonar AI agent
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
# Regenerate database from scratch
rm -rf .amalfa/
bun run scripts/cli/ingest.ts

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
- **File Watcher Daemon:** Monitors markdown changes, triggers re-ingestion with embeddings
- **Vector Daemon (3010):** Standalone embedding HTTP service (optional)
- **Reranker Daemon (3011):** Result relevance scoring
- **Sonar Agent (3012):** LLM reasoning loop

**Note:** The file watcher daemon includes its own embedding pipeline. The vector daemon is a separate HTTP service for on-demand embedding generation.

Managed via `amalfa servers` command.

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
briefs/            # Task specifications
debriefs/          # Agent reflections
playbooks/         # Codified patterns
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
3. Add status check to `src/cli/servers.ts`

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

# Or regenerate from scratch
rm -rf .amalfa/
bun run scripts/cli/ingest.ts
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

### Documentation
- `docs/VISION-AGENT-LEARNING.md` - Core philosophy
- `docs/AGENT-METADATA-PATTERNS.md` - Auto-augmentation design
- `src/resonance/DATABASE-PROCEDURES.md` - Database operations (critical)

### Playbooks
- `playbooks/embeddings-and-fafcas-protocol-playbook.md` - Vector architecture
- `playbooks/local-first-vector-db-playbook.md` - SQLite patterns
- `playbooks/problem-solving-playbook.md` - Debugging strategies

### External
- MCP Specification: https://modelcontextprotocol.io
- Drizzle ORM: https://orm.drizzle.team
- Bun Runtime: https://bun.sh
- FastEmbed: https://github.com/Anush008/fastembed-rs

## Package Information
- **Package:** amalfa
- **Version:** 1.4.3
- **npm:** https://www.npmjs.com/package/amalfa
- **Repository:** https://github.com/pjsvis/amalfa
- **License:** MIT
