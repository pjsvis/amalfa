# AMALFA Design Decisions

This document explains the key architectural decisions behind AMALFA's design.

## Core Philosophy

**AMALFA is a memory layer for AI agents, not a graph explorer for humans.**

The entire architecture flows from this principle: optimize for LLM access patterns, not human browsing. This shapes everything from data storage to API design.

---

## 1. Local-First Architecture

**Decision:** Everything runs locally. No cloud services, no remote APIs, no telemetry.

**Why:**
- **Privacy:** User's knowledge graph stays on their machine
- **Speed:** No network latency, sub-10ms vector search
- **Cost:** Zero operational costs, no API keys required
- **Reliability:** Works offline, no service dependencies
- **Control:** Users own their data completely

**Trade-offs:**
- Users must install and manage the tool locally
- No collaboration features (by design)
- Platform compatibility requires testing (macOS, Linux, WSL2)

**Inspiration:** SQLite, Obsidian, Logseq - tools that prioritize local data ownership.

---

## 2. SQLite as Foundation

**Decision:** Use SQLite (via Bun's built-in bindings) for all persistence.

**Why:**
- **Simplicity:** Single file database, no server process
- **Performance:** WAL mode enables concurrent reads during writes
- **Portability:** Works everywhere, battle-tested for 20+ years
- **Embeddability:** Ships with the package, zero configuration
- **Reliability:** ACID transactions, crash-safe by default

**Modern SQLite Features Used:**
- **WAL mode:** Write-Ahead Logging for concurrency
- **BLOB storage:** Store embeddings as raw bytes (FAFCAS protocol)
- **Pragmas:** Tuned for performance (mmap_size, busy_timeout)
- **JSON support:** Store flexible metadata in TEXT columns

**Trade-offs:**
- Not designed for multi-GB datasets (but fine for 10k-100k documents)
- Single-writer limitation (mitigated by WAL + daemon architecture)

---

## 3. Markdown as Source of Truth

**Decision:** Database is ephemeral cache. Markdown files are the authoritative source.

**Why:**
- **Version control:** Markdown files go in Git, databases don't
- **Portability:** Plain text outlives any database format
- **Team collaboration:** Everyone rebuilds DB from same markdown source
- **Backup simplicity:** Git history *is* the backup
- **Tooling compatibility:** Works with existing markdown editors

**Implementation:**
- Database lives in `.amalfa/` directory (gitignored)
- `amalfa init` rebuilds database from markdown files
- Daemon watches markdown files and updates DB incrementally
- Annotations (tags, metadata) stored in markdown frontmatter

**Inspiration:** Static site generators (Jekyll, Hugo), where markdown is source and HTML is build artifact.

---

## 4. Hollow Nodes Pattern

**Decision:** Store document metadata + embeddings in database, content on filesystem.

**Traditional approach (PolyVis v1-4):**
```sql
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  content TEXT,      -- Full document stored in DB
  embedding BLOB
);
```

**Hollow nodes (AMALFA):**
```sql
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  meta TEXT,         -- JSON with { source: "/path/to/file.md" }
  embedding BLOB     -- Vector only, no content
);
```

**Why:**
- **Smaller database:** 10x reduction in DB size (embeddings-only)
- **Faster queries:** Less I/O for vector search (only load BLOBs)
- **Source of truth:** Content lives in markdown, DB is just an index
- **Rebuild speed:** Don't need to parse content during migration

**Trade-off:**
- Read tool must access filesystem (one extra I/O per document read)
- Not suitable for frequently changing content (but that's rare for docs)

---

## 5. FAFCAS Vector Search

**Decision:** L2-normalized embeddings stored as raw bytes, searched via dot product.

**FAFCAS = Fast Approximate Floating-point Cosine As Similarity**

**Why this approach:**
1. **Normalize at write time:** Embeddings stored as unit vectors (L2 norm = 1)
2. **Dot product = cosine similarity:** For unit vectors, these are equivalent
3. **No vector DB needed:** SQLite BLOBs + pure JavaScript dot product
4. **Sub-10ms search:** Scan all embeddings in-process (no IPC overhead)
5. **85% accuracy:** Good enough for most agent use cases

**Implementation:**
```typescript
// Normalize embedding to unit length
const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v*v, 0));
const normalized = vector.map(v => v / magnitude);

// Store as raw bytes
const blob = new Uint8Array(normalized.buffer);
db.run("INSERT INTO nodes (embedding) VALUES (?)", blob);

// Search via dot product
for (const candidate of candidates) {
  const candidateVector = new Float32Array(candidate.embedding.buffer);
  const score = dotProduct(queryVector, candidateVector);
}
```

**Trade-offs:**
- Not suitable for massive datasets (1M+ documents)
- Linear scan, not logarithmic (but fast enough for 10k-100k docs)
- No approximate nearest neighbors (ANN) indexing

**Why not use a vector database (Chroma, Weaviate, etc.)?**
- Adds complexity (separate service, port management)
- AMALFA is local-first (no Docker, no servers)
- For agent knowledge graphs (10k docs), SQLite is faster

---

## 6. Model Context Protocol (MCP)

**Decision:** Use MCP as the primary interface for AI agents.

**Why:**
- **Standard protocol:** Works with Claude Desktop, Cline, Zed, etc.
- **Stdio transport:** No HTTP server, no port conflicts
- **Tool abstraction:** LLMs get structured tools, not raw database access
- **Composability:** Multiple MCP servers can work together

**AMALFA exposes 5 MCP tools:**
1. `search_documents()` - Vector semantic search
2. `read_node_content()` - Read markdown from hollow nodes
3. `explore_links()` - Graph edge traversal
4. `list_directory_structure()` - Browse doc folders
5. `inject_tags()` - Annotate files (Gardener pattern)

**Why not expose raw database?**
- Tools provide semantic abstraction (search, not SQL)
- Prevents LLMs from corrupting data with bad SQL
- Enforces hollow-nodes pattern (read content from filesystem)

---

## 7. Bun as Runtime

**Decision:** Build for Bun first, Node.js compatibility in v1.1.

**Why Bun:**
- **Performance:** 3-4x faster than Node.js for many tasks
- **Built-in TypeScript:** No transpilation step needed
- **Built-in SQLite:** No native module compilation
- **Fast bundler:** `bun build` for distribution
- **Better DX:** Fast test runner, better error messages

**Trade-offs:**
- Smaller ecosystem than Node.js (but growing rapidly)
- Some libraries don't work (mostly native modules)
- Platform support still maturing (Windows experimental)

**Node.js compatibility (v1.1):**
- Will require bundling SQLite as native module (better-sqlite3)
- May need polyfills for Bun-specific APIs
- Worth it for broader adoption

---

## 8. Zero Configuration (Conventions over Config)

**Decision:** Sensible defaults, minimal required configuration.

**Defaults:**
- Database: `.amalfa/resonance.db`
- Source: `./docs` (if exists)
- Embedding model: `BAAI/bge-small-en-v1.5` (384 dimensions)
- Watch debounce: 1000ms

**Configuration only needed for:**
- Multiple source directories
- Custom embedding model
- Exclude patterns

**Example minimal config:**
```typescript
// amalfa.config.ts (optional!)
export default {
  source: "./my-docs",  // That's it!
}
```

**Why:**
- Most projects have docs in one place
- Embedding model choice rarely matters (all modern models work)
- Reduces cognitive load for new users

---

## 9. CLI-First Design

**Decision:** Separate commands for init, serve, daemon (not "do everything" mode).

**Why:**
- **Explicit control:** User decides when to rebuild vs. serve
- **Fast startup:** MCP server doesn't rebuild DB on launch
- **Clear mental model:** Init (once) → Daemon (background) → Serve (use)
- **Debuggability:** Each command has single responsibility

**Alternative (rejected):** "Smart" server that auto-rebuilds DB
- Slower startup (embeddings take minutes)
- Hides what's happening from user
- Fails mysteriously if ingestion errors occur

---

## 10. Dual Usage: CLI + Library

**Decision:** Support both MCP server usage and direct TypeScript imports.

**MCP server usage (primary):**
```bash
bun add -g amalfa
amalfa init
amalfa serve
```

**Library usage (secondary):**
```typescript
import { ResonanceDB, VectorEngine } from 'amalfa';

const db = new ResonanceDB('.amalfa/resonance.db');
const engine = new VectorEngine(db.getRawDb());
const results = await engine.search('query', 10);
```

**Why both:**
- Most users want MCP server (works with Claude, Cline, etc.)
- Power users may want direct API access (custom integrations)
- Coding agents can import as library (build features on top)

**Package.json configuration:**
```json
{
  "bin": { "amalfa": "./dist/cli.js" },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

---

## 11. No Graph Visualization in v1.0

**Decision:** Defer visualization to v2.0 or separate tool.

**Why:**
- **Focus:** v1.0 is about LLM memory, not human browsing
- **Complexity:** Graph viz requires web server, UI framework, port management
- **Alternative exists:** Users can export data for Gephi/Cytoscape, or use PolyVis
- **Demand-driven:** Let user feedback guide v2.0 priorities

**If we added viz to v1.0:**
- Adds ~50MB of dependencies (Sigma.js, D3, React/Vue)
- Requires HTTP server (port conflicts, CORS issues)
- Increases support burden (browser compatibility, etc.)

**v2.0 may include:**
- `amalfa export --format graphml` (for external tools)
- `amalfa explore` (optional web UI)

---

## 12. No Authentication/Multi-User

**Decision:** Single-user, local-only. No auth, no sharing, no collaboration.

**Why:**
- **Simplicity:** Zero security surface (no network access)
- **Use case:** Personal knowledge graph for individual developers
- **Git for sharing:** Markdown files + Git = collaboration layer

**Not a bug, it's a feature:**
- No OAuth flows to implement
- No user management database
- No session handling
- No password resets

**For teams:**
- Each developer runs own AMALFA instance
- Share markdown files via Git
- Everyone rebuilds database locally

---

## 13. Platform Targeting

**Decision:** macOS and Linux first, WSL2 supported, Windows native experimental.

**Why:**
- **Developer audience:** 80%+ on macOS or Linux
- **Bun maturity:** Best supported on Unix-like systems
- **FastEmbed limitations:** Native binaries for macOS/Linux
- **WSL2:** Windows developers can use Linux subsystem

**Windows native challenges:**
- FastEmbed requires different binaries
- File path handling (backslashes vs forward slashes)
- Bun still experimental on Windows

**v1.1 goal:** Native Windows support with thorough testing.

---

## 14. Semantic Versioning and Stability

**Decision:** v1.0 = stable API, v1.x = backward compatible.

**v1.0 guarantees:**
- MCP tools don't change names or schemas
- Database schema migrations handled automatically
- Configuration file format stable
- Breaking changes only in v2.0+

**Why this matters:**
- Users can update without fear
- Claude Desktop configs don't break
- Automation scripts remain valid

---

## Summary: The AMALFA Way

1. **Local-first:** Privacy, speed, zero cost
2. **SQLite:** Simple, fast, reliable
3. **Markdown is truth:** Database is cache
4. **Hollow nodes:** Metadata in DB, content on disk
5. **FAFCAS:** Fast vector search without vector DB
6. **MCP protocol:** Standard interface for agents
7. **Bun runtime:** Modern, fast, great DX
8. **Conventions:** Sensible defaults, minimal config
9. **CLI-first:** Explicit commands, clear workflow
10. **Dual usage:** MCP server + library imports
11. **No viz (yet):** Focus on LLM use case
12. **Single-user:** Local only, Git for sharing
13. **Unix-first:** macOS/Linux primary targets
14. **Stable v1.0:** Semantic versioning, migrations

**Inspirations:**
- SQLite (local-first database)
- Obsidian (markdown + local storage)
- Homebrew (simple CLI, sensible defaults)
- MCP (standard protocol for AI tools)

**Not trying to be:**
- Neo4j (graph database for enterprises)
- Elasticsearch (distributed search cluster)
- Notion (collaborative knowledge base)
- PolyVis (graph visualization tool)

AMALFA is a **memory layer for AI agents**, optimized for local development workflows. Everything else is secondary.
