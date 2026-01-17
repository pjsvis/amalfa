# AMALFA

**A Memory Layer For Agents**

Local-first knowledge graph with semantic search for AI agents.

**Core Design**: Your documents are the source of truth. The database is a disposable runtime artifact.

---


[![npm](https://img.shields.io/npm/v/amalfa?logo=npm)](https://www.npmjs.com/package/amalfa)
[![downloads](https://img.shields.io/npm/dm/amalfa)](https://www.npmjs.com/package/amalfa)

---

## What is Amalfa?

Amalfa is a **Model Context Protocol (MCP) server** that provides AI agents with:

- 🔍 **Semantic search** over markdown documentation
- 📊 **Graph traversal** of relationships between documents
- 🧠 **Agent continuity** across sessions via persistent memory
- ⚡ **Auto-augmentation** of metadata (tags, links, clusters)
- 🏷️ **Latent space tagging** for emergent organization

Built with **Bun + SQLite + FastEmbed**.

**Core distinguisher**: Database is a **disposable runtime artifact**. Documents are the source of truth.

---

## The Problem

**Current state:** AI agents lose context between sessions. Knowledge resets. Same problems get re-solved.

**Amalfa solves this:** Agents write structured reflections (Write Brief → Do Work → Write Debrief → Update Playbooks). Amalfa indexes this as a queryable knowledge graph with semantic search.

👉 **Deep Dive:** [Why Structured Reflection Beats Infinite Context](docs/WHY-STRUCTURED-REFLECTION.md)

**Result:** Agents can query "What did we learn about authentication?" and get ranked, relevant past work—even across different agents and sessions.

---

## Core Architecture: Disposable Database

**The Foundation**: AMALFA treats your filesystem as the single source of truth and the database as an ephemeral cache.

### The Philosophy

**Documents = Truth, Database = Cache**

```
Markdown Files (filesystem)
    ↓
  [Ingestion Pipeline]
    ↓
SQLite Database (.amalfa/)
    ↓
  [Vector Search]
    ↓
MCP Server (AI agents)
```

**Key Insight**: The database can be deleted and regenerated at any time without data loss.

- **Source of Truth**: Your markdown documents (immutable filesystem)
- **Runtime Artifact**: SQLite database with embeddings and metadata
- **Regeneration**: `rm -rf .amalfa/ && bun run scripts/cli/ingest.ts`

### Why This Matters

**Benefits**:
- ✅ **No Migration Hell**: Upgrading? Just re-ingest. No migration scripts.
- ✅ **Deterministic Rebuilds**: Same documents → same database state
- ✅ **Version Freedom**: Switch between AMALFA versions without fear
- ✅ **Corruption Immunity**: Database corrupt? Delete and rebuild in seconds
- ✅ **Model Flexibility**: Change embedding models by re-ingesting

**Distinguisher**: Unlike traditional systems where the database *is* the truth, AMALFA inverts this. Your prose is permanent, the index is disposable.

### Troubleshooting & Maintenance

Amalfa employs a tiered maintenance strategy. For standard issues, run `amalfa doctor`. For data updates, run `amalfa init`.

👉 **Full Guide:** [User Manual - Maintenance & Troubleshooting](docs/USER-MANUAL.md#6-maintenance--troubleshooting)


### Write Brief → Do Work → Write Debrief → Update Playbooks Pattern

```
Brief (task spec)
   ↓
Work (implementation)
   ↓
Debrief (what we learned)
   ↓
Playbook (codified patterns)
   ↓
Future briefs (informed by playbooks)
```

**Debriefs** capture:
- What worked (successes)
- What failed (dead ends)
- Lessons learned (abstractions)

**Playbooks** codify:
- Principles (how we do things)
- Patterns (reusable solutions)
- Anti-patterns (what to avoid)
- Decision records (why we chose X over Y)

### Auto-Augmentation

Amalfa **automatically** adds:

- **Tags:** Extracted from content + latent space clustering
- **Links:** Wiki-style links between related documents
- **Clusters:** Documents organized by embedding similarity
- **Suggested reading:** Context for new sessions

**Agents don't maintain metadata manually.** Amalfa handles it via git-audited auto-augmentation.

---

## Sub-Agents & Discovery

Amalfa orchestrates specialized sub-agents (Vector, Reranker, Sonar) to provide intelligence.

*   **Vector Daemon**: Handles embeddings.
*   **Reranker Daemon**: Re-scores search results for precision.
*   **Sonar Agent**: Performs reasoning and deep research using local LLMs (Ollama) or Cloud APIs.

👉 **Full Guide:** [User Manual - Services & Sub-Agents](docs/USER-MANUAL.md#5-services--sub-agents)


---

## Architecture

### Technology Stack

- **Runtime:** Bun (fast, TypeScript-native)
- **Database:** SQLite with WAL mode (local-first, portable)
- **Embeddings:** FastEmbed (`bge-small-en-v1.5`, 384 dims)
- **Reranking:** Xenova Transformers (`bge-reranker-base`)
- **Protocol:** Model Context Protocol (MCP)

### Project Structure

```
amalfa/
├── src/
│   ├── mcp/           # MCP server implementation
│   ├── resonance/     # Database layer (SQLite wrapper)
│   ├── core/          # Graph processing (EdgeWeaver, VectorEngine)
│   └── utils/         # Logging, validation, lifecycle
├── scripts/
│   ├── cli/           # Command-line tools
│   └── pipeline/      # Data ingestion pipeline
├── docs/
│   ├── VISION-AGENT-LEARNING.md        # Core vision
│   ├── AGENT-METADATA-PATTERNS.md      # Auto-augmentation design
│   └── SETUP.md                        # NPM publishing guide
├── briefs/            # Task specifications
├── debriefs/          # Reflective documents
└── playbooks/         # Codified patterns
```

### Key Patterns

1.  **Hollow Nodes:** Node metadata in SQLite, content on filesystem
2.  **FAFCAS Protocol:** Embedding normalization that enables scalar product searches (10x faster than cosine similarity)
3.  **Micro-Daemon Mesh:**
    *   **File Watcher Daemon**: Monitors markdown changes, triggers re-ingestion with embeddings
    *   **Vector Daemon (3010)**: Standalone HTTP service for embedding generation
    *   **Reranker Daemon (3011)**: Relevance Scoring
    *   **Sonar Agent (3012)**: Reasoning loop
4.  **ServiceLifecycle:** Unified daemon management pattern

## Quick Start

### Installation

**Requires Bun** (v1.0+) - [Install Bun](https://bun.sh)

```bash
bun install -g amalfa
```

**IMPORTANT**: Amalfa must be installed via **Bun only**. Do not use npm or other package managers.

**Why Bun?**
- ⚡ **Fast startup** - Critical for stdio-based MCP servers that spawn on every request
- 🔄 **Built-in daemon management** - Runs background processes for file watching and vector embeddings
- 📦 **Native TypeScript** - No compilation step, direct execution from source
- 🎯 **SQLite performance** - Optimized native bindings for database operations

### Uninstalling

```bash
bun remove -g amalfa
```

**Note**: Bun and npm maintain separate package registries. If you accidentally tried `npm install -g amalfa`, it won't work. Always use Bun for Amalfa installation and removal.

**From source** (for development):
```bash
git clone https://github.com/pjsvis/amalfa.git
cd amalfa
bun install  # Must use bun, not npm
```

### Common Gotchas

#### "I can't uninstall amalfa"

**Problem**: `npm uninstall -g amalfa` does nothing.

**Cause**: Bun and npm are **separate package managers** with separate:
- Installation directories (`~/.bun/bin/` vs `/usr/local/lib/node_modules/`)
- Package databases
- Binary locations

Think of them as **crossed porpoises**—two systems swimming in opposite directions, each functional in its own ecosystem, but never coordinating.

**Solution**: Use the same package manager you installed with:
```bash
# If installed with Bun (correct)
bun remove -g amalfa

# If you somehow have a stale npm install
npm uninstall -g amalfa
```

**Check which is active**:
```bash
which amalfa
# ~/.bun/bin/amalfa = Bun install ✓
# /usr/local/bin/amalfa = npm install (wrong)
```

#### "amalfa command not found after install"

**Problem**: Shell can't find the `amalfa` binary.

**Cause**: `~/.bun/bin` not in your `$PATH`.

**Solution**: Add to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export PATH="$HOME/.bun/bin:$PATH"
```
Then reload: `source ~/.zshrc`

#### "Why can't I use npm? It's on npmjs.org"

**Answer**: Amalfa is **published** to npm (for discoverability) but **requires Bun to run**. This is because:
- Bun's native TypeScript execution (no build step)
- Optimized SQLite bindings
- Daemon lifecycle management
- Faster stdio transport for MCP

Think of it like a Rust crate that's listed but requires `cargo` to build. npm and Bun are crossed porpoises—both legitimate package managers, but trying to use one to manage the other's installations leads nowhere.

#### "trustedDependencies in package.json?"

These packages (`onnxruntime-node`, `protobufjs`) run native build scripts during `bun install`. Bun blocks untrusted scripts by default. This whitelist lets them compile native bindings for ML operations.

### Setup MCP Server

1. **Configure your sources** in `amalfa.config.json`:
   ```json
   {
     "sources": ["./docs", "./playbooks"],
     "database": ".amalfa/resonance.db"
   }
   ```

2. **Ingest your markdown**:
   ```bash
   bun run scripts/cli/ingest.ts
   ```

3. **Generate MCP config**:
   ```bash
   amalfa setup-mcp
   ```

4. **Add to Claude Desktop**: Copy the JSON output to:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

5. **Restart Claude Desktop**

**Full setup guide:** See repository docs for detailed MCP setup

**Package:** Available at https://www.npmjs.com/package/amalfa

---



## Implementation Status

### ✅ Core Functionality (v1.4.0 - Released)

- ✅ **MCP Server** - stdio transport, tools, resources
- ✅ **Vector Search** - FastEmbed embeddings (384-dim), semantic search
- ✅ **Reranking** - BGE-M3 cross-encoder for high precision
- ✅ **Database** - SQLite with hollow nodes, FAFCAS protocol
- ✅ **Ingestion Pipeline** - Markdown → nodes + embeddings
- ✅ **CLI** - init, serve, stats, doctor, servers, daemon, vector, reranker
- ✅ **Service Management** - Vector/Reranker daemons, file watcher, Sonar agent
- ✅ **Pre-flight Validation** - Check markdown before ingestion

### 🚧 Phase 1: Auto-Augmentation (In Progress)

- [ ] Entity extraction from markdown
- [ ] Auto-linking (wiki-style [[links]])
- [ ] Tag extraction and indexing
- [ ] Git-based auditing for augmentations
- [x] Automated file watcher updates

### 🚧 Phase 2: Ember Service (Automated Enrichment)
- ✅ **Analyzer** - Louvain community detection & heuristics
- ✅ **Sidecar Generator** - Safe proposal mechanism (`.ember.json`)
- ✅ **Squasher** - Robust metadata merging (preserves user content)
- ✅ **CLI** - `amalfa ember scan/squash` commands

### 📋 Phase 3: Latent Space Organization (Planned)

- [ ] Document clustering (HDBSCAN)
- [ ] Cluster label generation
- [ ] Confidence-based tagging
- [ ] Topic modeling (BERTopic)
- [ ] Self-organizing taxonomy

### 🔗 Phase 3: Graph Intelligence (Planned)

- [ ] K-nearest neighbor recommendations
- [ ] Suggested reading lists
- [ ] Temporal sequence tracking
- [ ] Backlink maintenance
- [ ] Graph traversal tools

### 🎯 Phase 4: Learning from Feedback (Future)

- [ ] Track human edits to augmentations
- [ ] Adjust confidence thresholds
- [ ] Improve extraction heuristics
- [ ] Weekly knowledge digest
- [ ] Multi-agent coordination

---

## Development

### Prerequisites

- **Bun:** v1.0+ (required - cannot use npm/yarn/pnpm)
- **Git:** For version control

**Note**: Node.js is NOT required. Bun replaces Node entirely.

### Setup

```bash
# Clone repo
git clone https://github.com/pjsvis/amalfa.git
cd amalfa

# Install dependencies
bun install

# Run tests
bun test
```

### Commands

```bash
# Core commands (after global install: bun install -g amalfa)
amalfa init              # Initialize database from markdown
amalfa serve             # Start MCP server (stdio)
amalfa stats             # Show database statistics
amalfa doctor            # Health check
amalfa setup-mcp         # Generate MCP config
amalfa --help            # Show help

# Service management
amalfa servers           # Show all service status
amalfa servers --dot     # Generate DOT diagram
amalfa stop-all          # Stop all running services

# Individual services (start|stop|status|restart)
amalfa daemon <action>   # File watcher daemon
amalfa vector <action>   # Vector embedding daemon
amalfa reranker <action> # Reranking daemon
amalfa sonar <action>    # Sonar AI agent
amalfa ember <action>    # Ember enrichment (scan|squash)

# Local development scripts (bun run <script>)
bun run servers          # Test servers command
bun run servers:dot      # Test DOT diagram
bun run stats            # Test stats
bun run doctor           # Test doctor
bun run help             # Show CLI help

# Code quality
bun test                 # Run tests
bun run check            # Biome check
bun run format           # Biome format
```

---

## Documentation

- **[VISION-AGENT-LEARNING.md](docs/VISION-AGENT-LEARNING.md)** - Why agent-generated knowledge works
- **[AGENT-METADATA-PATTERNS.md](docs/AGENT-METADATA-PATTERNS.md)** - Auto-augmentation design
- **[SETUP.md](docs/SETUP.md)** - NPM publishing setup

### Playbooks

- **[embeddings-and-fafcas-protocol-playbook.md](playbooks/embeddings-and-fafcas-protocol-playbook.md)** - Vector search patterns
- **[local-first-vector-db-playbook.md](playbooks/local-first-vector-db-playbook.md)** - Database architecture
- **[problem-solving-playbook.md](playbooks/problem-solving-playbook.md)** - Debugging strategies

---

## Contributing

Amalfa is in active development. Contributions are welcome!

**How to contribute:**
- ⭐ Star the repo if you find it useful
- 🐛 Report bugs or request features via issues
- 📝 Improve documentation
- 🚀 Submit PRs for new features or fixes
- 💬 Join discussions about the vision and roadmap

---

## License

MIT

---

## Lineage

Amalfa evolved from patterns discovered in the [PolyVis](https://github.com/pjsvis/polyvis) project, where agents spontaneously maintained documentation through brief-debrief-playbook workflows.

**Key insight:** When given minimal structure, agents naturally build institutional memory. Amalfa scales this with semantic infrastructure.

---

## Roadmap

### v1.0 (Released)

- ✅ Published to npm
- ✅ Core vision documented
- ✅ Auto-augmentation design complete
- ✅ MCP server functional
- ✅ Basic semantic search working
- ✅ Initial release

### v1.1+ (Future)

- Latent space clustering
- Multi-agent knowledge sharing
- Cross-repo knowledge graphs
- Agent-to-agent learning

---

**Built with ❤️ by developers frustrated with context loss.**

---

## Acknowledgments

AMALFA leverages the powerful [Graphology](https://graphology.github.io/) library for in-memory graph analysis. Graphology is published on Zenodo with a DOI ([10.5281/zenodo.5681257](https://doi.org/10.5281/zenodo.5681257)).
