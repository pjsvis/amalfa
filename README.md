# AMALFA

**A Memory Layer For Agents**

A local-first knowledge graph engine that transforms your markdown files into a searchable memory layer for AI agents. Built for privacy, speed, and zero API costs.

[![NPM Version](https://img.shields.io/npm/v/amalfa)](https://www.npmjs.com/package/amalfa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why AMALFA?

AI agents need memory. AMALFA provides:

- **🔒 Privacy-first**: Your data never leaves your machine
- **⚡️ Fast**: SQLite + vector embeddings for sub-second search
- **💰 Zero cost**: No API calls, no subscriptions
- **📝 Markdown native**: Your notes are the source of truth
- **🔄 Real-time**: File watcher keeps your knowledge graph up-to-date
- **🤖 Agent-ready**: MCP protocol integration with Claude Desktop

## Quick Start

### Installation

```bash
# Install globally
bun add -g amalfa

# Or use with bunx
bunx amalfa --help
```

### Initialize Your Knowledge Graph

```bash
# 1. Navigate to your project with markdown files
cd ~/Documents/my-notes

# 2. Initialize AMALFA (creates .amalfa/resonance.db)
amalfa init

# 3. Start the file watcher (optional)
amalfa daemon start

# 4. Connect to Claude Desktop (see Configuration below)
```

## Configuration

Create `amalfa.config.json` in your project root:

```json
{
  "sources": ["./docs", "./notes"],
  "database": ".amalfa/resonance.db",
  "embeddings": {
    "model": "BAAI/bge-small-en-v1.5",
    "dimensions": 384
  },
  "watch": {
    "enabled": true,
    "debounce": 1000
  },
  "excludePatterns": ["node_modules", ".git", ".amalfa"]
}
```

**New in v1.0.1:** Multi-source support! Use `sources` array to scan multiple directories. Single `source` string still works (auto-migrates).

Or use TypeScript:

```typescript
// amalfa.config.ts
export default {
  source: "./docs",
  database: ".amalfa/resonance.db",
  // ... rest of config
};
```

### Claude Desktop Integration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "amalfa": {
      "command": "amalfa",
      "args": ["serve"]
    }
  }
}
```

Restart Claude Desktop, and you'll see AMALFA tools available in the conversation.

## CLI Commands

### `amalfa init [--force]`

Initialize knowledge graph from markdown files with pre-flight validation.

```bash
amalfa init          # With validation
amalfa init --force  # Override warnings (use with caution)
```

**What it does:**
- **Pre-flight validation** (v1.0.1): Checks for large files, symlinks, circular references
- Scans your source directories for `.md` files
- Generates vector embeddings (384 dimensions)
- Extracts WikiLinks (`[[links]]`) and semantic tags
- Creates edges between related documents
- Stores metadata in SQLite (content in filesystem - "hollow nodes")

**Pre-Flight Protection** (v1.0.1):
- Blocks files >10MB (prevents memory issues)
- Detects symlink loops (prevents infinite recursion)
- Warns about small files (<50 bytes) and large corpora (10K+ files)
- Generates `.amalfa-pre-flight.log` with actionable recommendations
- Use `--force` to override warnings (errors still block)

**Output:**
```
📚 Starting ingestion from: ./docs
📁 Found 127 markdown files
  100% (127/127)
✅ Initialization complete!

📊 Summary:
  Files processed: 127
  Nodes created: 127
  Edges created: 243
  Embeddings: 127
  Duration: 8.42s
```

### `amalfa daemon <action>`

Manage the file watcher daemon.

```bash
amalfa daemon start   # Start watching for changes
amalfa daemon stop    # Stop the daemon
amalfa daemon status  # Check if running
amalfa daemon restart # Restart daemon
```

**Features:**
- Watches source directory recursively
- Debounced updates (1s default)
- Hash-based change detection (only processes modified files)
- Retry logic with exponential backoff
- Native macOS notifications

### `amalfa serve`

Start MCP server for Claude Desktop (stdio transport).

```bash
amalfa serve
```

**Available Tools:**
- `search_knowledge`: Semantic search across all documents
- `get_node`: Retrieve specific document by ID
- `get_neighbors`: Find related documents (graph traversal)

See [docs/MCP_TOOLS.md](docs/MCP_TOOLS.md) for detailed tool schemas.

### `amalfa stats`

View knowledge graph statistics.

```bash
amalfa stats
```

### `amalfa doctor`

Health check and diagnostics.

```bash
amalfa doctor
```

## Architecture

### Philosophy: Markdown is Truth

AMALFA implements the **"Hollow Nodes"** pattern:

- **Markdown files** = Source of truth (version controlled, human-readable)
- **SQLite database** = Ephemeral cache (can be regenerated anytime)

**v1.0.1 Enhancement:** Schema v6 fully implements hollow nodes - content is never stored in the database, only metadata and embeddings. This reduces database size dramatically (~350MB saved for 70K documents) and maintains the filesystem as the single source of truth.

This means:
- ✅ You can delete `.amalfa/` and rebuild with `amalfa init`
- ✅ Your markdown files remain the canonical source
- ✅ Database changes are never written back to files
- ✅ No lock-in, no vendor formats
- ✅ Smaller databases, faster writes (v1.0.1)

### Technology Stack

- **Runtime**: Bun (fast, modern JavaScript runtime)
- **Database**: SQLite with WAL mode
- **Embeddings**: FastEmbed (local, no API calls)
- **Vectors**: 384-dimensional (BAAI/bge-small-en-v1.5)
- **Search**: Pure dot product (cosine similarity)
- **Protocol**: Model Context Protocol (MCP)

### File Structure

```
your-project/
├── docs/                    # Your markdown files
│   ├── README.md
│   ├── architecture.md
│   └── ...
├── .amalfa/                 # AMALFA data (gitignored)
│   └── resonance.db         # SQLite database (schema v6 - hollow nodes)
├── amalfa.config.json       # Configuration (optional)
├── .amalfa-daemon.pid       # Daemon process ID (if running)
├── .amalfa-daemon.log       # Daemon logs
└── .amalfa-pre-flight.log   # Validation report (generated by init)
```

## Features

### Vector Search (FAFCAS Protocol)

Fast, accurate search without a vector database:

- L2-normalized embeddings (unit vectors)
- Pure dot product = cosine similarity
- 85%+ accuracy at <10ms per query
- No chunking needed (markdown files are already chunk-sized)

### Edge Weaving

Automatic relationship detection:

- **WikiLinks**: `[[Document Name]]` creates `CITES` edges
- **Tags**: `[tag: Concept]` creates `TAGGED_AS` edges
- **Metadata**: `<!-- tags: [RELATION: Target] -->` for explicit edges
- **Louvain Gate**: Prevents graph pollution (community detection)

### Incremental Updates

The daemon watches for changes and only re-processes modified files:

- MD5 hash tracking
- Batch transactions (50 files)
- Debounced (1s default)
- Automatic retry on failure (3 attempts, exponential backoff)

## Use Cases

### Personal Knowledge Base

```bash
# Your notes directory
cd ~/Documents/notes
amalfa init
amalfa daemon start

# Now ask Claude: "What did I write about X?"
# Claude uses AMALFA to search your notes
```

### Project Documentation

```bash
# Your project's docs
cd ~/Code/my-project
amalfa init

# Ask Claude: "Explain the architecture"
# Claude searches ./docs and provides context
```

### Research & Zettelkasten

```bash
# Zettelkasten notes
cd ~/Zettelkasten
amalfa init

# Ask Claude: "Find connections between concept A and B"
# Claude traverses the knowledge graph
```

## Troubleshooting

### Daemon won't start

Check logs:
```bash
tail -f .amalfa-daemon.log
```

Common issues:
- Source directory doesn't exist
- Database permissions
- Port conflicts (if running multiple instances)

### Database corruption

Rebuild from markdown:
```bash
rm -rf .amalfa/
amalfa init
```

Your markdown files are the source of truth, so this is always safe.

### Slow initialization

Large repositories (1000+ files) may take 2-5 minutes on first run. Subsequent updates are fast (hash checking prevents re-processing).

## Development

```bash
# Clone repository
git clone https://github.com/pjsvis/amalfa.git
cd amalfa

# Install dependencies
bun install

# Run CLI locally
bun run src/cli.ts help

# Run tests
bun test

# Type checking
bun run tsc --noEmit
```

## Roadmap

- [ ] v1.1: Web UI for graph visualization
- [ ] v1.2: Multi-language embedding models
- [ ] v1.3: PDF/DOCX support
- [ ] v2.0: Distributed sync (private P2P)

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Built with:
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [FastEmbed](https://github.com/qdrant/fastembed) - Local embeddings
- [Model Context Protocol](https://modelcontextprotocol.io) - AI agent integration

---

**AMALFA** = **A Memory Layer For Agents**

Give your AI agents a memory. Keep your privacy. Own your data.

**[GitHub](https://github.com/pjsvis/amalfa)** • **[NPM](https://www.npmjs.com/package/amalfa)** • **[Issues](https://github.com/pjsvis/amalfa/issues)**
