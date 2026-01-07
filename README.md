# AMALFA

**A Memory Layer For Agents**

MCP server that gives AI agents semantic access to project knowledge graphs.

---

## Status

✅ **v1.0 published** - Available on npm

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

---

## The Problem

**Current state:** AI agents lose context between sessions. Knowledge resets. Same problems get re-solved.

**Amalfa solves this:** Agents write structured reflections (briefs → work → debriefs → playbooks). Amalfa indexes this as a queryable knowledge graph with semantic search.

**Result:** Agents can query "What did we learn about authentication?" and get ranked, relevant past work—even across different agents and sessions.

---

## Core Concepts

### Brief-Debrief-Playbook Pattern

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

### Latent Space Tagging

**Innovation:** Tags emerge from vector clustering, not predefined taxonomy.

```python
# Cluster documents in embedding space
clusters = cluster(all_docs, min_size=3)

# Generate labels from cluster content
for cluster in clusters:
    label = generate_label(cluster.docs)  # e.g., "auth-state-patterns"
    for doc in cluster:
        doc.add_tag(f"latent:{label}", confidence_score)
```

**Result:** Self-organizing knowledge base that adapts as it grows.

---

## Quick Start

### Installation

```bash
npm install -g amalfa
# or
bun install -g amalfa
```

**From source** (for development):
```bash
git clone https://github.com/pjsvis/amalfa.git
cd amalfa
bun install
```

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
   bun run scripts/setup_mcp.ts
   ```

4. **Add to Claude Desktop**: Copy the JSON output to:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

5. **Restart Claude Desktop**

**Full setup guide:** [docs/MCP_SETUP.md](docs/MCP_SETUP.md)

**Package status:** Reserved at https://www.npmjs.com/package/amalfa (v1.0 coming soon)

---

## Architecture

### Technology Stack

- **Runtime:** Bun (fast, TypeScript-native)
- **Database:** SQLite with WAL mode (local-first, portable)
- **Embeddings:** FastEmbed (`all-MiniLM-L6-v2`, 384 dims)
- **Search:** Vector similarity + full-text (FTS5)
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

1. **Hollow Nodes:** Node metadata in SQLite, content on filesystem
2. **FAFCAS Protocol:** Fast Approximate Fuzzy Cosine Similarity search
3. **Git-Based Auditing:** All agent augmentations are git commits
4. **ServiceLifecycle:** Unified daemon management pattern

---

## Vision

See [VISION-AGENT-LEARNING.md](docs/VISION-AGENT-LEARNING.md) for the full vision.

**TL;DR:**

Agents generate knowledge through structured reflection. Amalfa provides semantic infrastructure to make this knowledge:

- **Queryable** (vector search + graph traversal)
- **Persistent** (across sessions and agents)
- **Self-organizing** (latent space clustering)
- **Auditable** (git-based workflow)

**The goal:** Enable agents to maintain institutional memory without human bottlenecks.

---

## Implementation Status

### Phase 1: Basic Auto-Augmentation (In Progress)

- [ ] Entity extraction
- [ ] Auto-linking (wiki-style)
- [ ] Tag extraction
- [ ] Embedding generation
- [ ] Git integration

### Phase 2: Latent Space Tagging (Planned)

- [ ] Document clustering (HDBSCAN)
- [ ] Cluster label generation
- [ ] Confidence-based tagging
- [ ] Topic modeling (BERTopic)

### Phase 3: Semantic Relationships (Planned)

- [ ] K-nearest neighbor search
- [ ] Suggested reading lists
- [ ] Temporal sequences
- [ ] Backlink maintenance

### Phase 4: Learning from Corrections (Future)

- [ ] Track human edits
- [ ] Adjust confidence thresholds
- [ ] Improve extraction
- [ ] Weekly digest

---

## Development

### Prerequisites

- **Bun:** v1.0+ (required)
- **Node:** v22.x (for compatibility)
- **Git:** For version control

### Setup

```bash
# Clone repo
git clone https://github.com/pjsvis/amalfa.git
cd amalfa

# Install dependencies
bun install

# Run tests
bun test

# Start development server
bun run dev
```

### Commands

```bash
bun run dev          # Start dev server
bun run build        # Build for production
bun test             # Run tests
bun run precommit    # TypeScript + Biome checks
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

Amalfa is in early development. Contributions welcome once v1.0 is released.

**For now:**
- ⭐ Star the repo if interested
- 👀 Watch for release announcements
- 💬 Open issues for feedback

---

## License

MIT

---

## Lineage

Amalfa evolved from patterns discovered in the [PolyVis](https://github.com/pjsvis/polyvis) project, where agents spontaneously maintained documentation through brief-debrief-playbook workflows.

**Key insight:** When given minimal structure, agents naturally build institutional memory. Amalfa scales this with semantic infrastructure.

---

## Roadmap

### v1.0 (Q1 2026)

- ✅ Package name reserved on npm
- ✅ Core vision documented
- ✅ Auto-augmentation design complete
- 🚧 MVP implementation (in progress)
- [ ] MCP server functional
- [ ] Basic semantic search working
- [ ] Initial release

### v1.1+ (Future)

- Latent space clustering
- Multi-agent knowledge sharing
- Cross-repo knowledge graphs
- Agent-to-agent learning

---

**Built with ❤️ by developers frustrated with context loss.**
