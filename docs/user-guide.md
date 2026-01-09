# Amalfa User Guide

Welcome to **Amalfa**, a local-first Knowledge Graph engine and MCP Server for AI agents.

## 1. Quick Start

### Prerequisites
- [Bun](https://bun.sh) runtime (required)
- [Ollama](https://ollama.ai) (optional, for AI features)

### Installation

**Global Install (Recommended):**
```bash
bun install -g amalfa
```

**Local Project:**
```bash
bun add amalfa
```

### Health Check
Verify your installation:
```bash
amalfa doctor
```

### Initial Data Ingestion
Before using the MCP server, ingest your markdown documents:
```bash
amalfa init
```
This scans configured source directories, generates embeddings, and builds the knowledge graph.

### Starting the MCP Server
To expose your knowledge graph to AI agents:
```bash
amalfa serve
```
The server runs on `stdio` transport (JSON-RPC 2.0).

---

## 2. Core Features

### Knowledge Graph
Your data is stored in `.amalfa/resonance.db`. This includes:
- **Nodes:** Parsed from your Markdown files
- **Edges:** Woven based on semantic similarity, tags, and temporal sequencing
- **Vectors:** Local embeddings (FastEmbed BGE-small-en) for semantic search

### Hybrid Search
The system combines:
1. **Vector Search:** Semantic understanding ("how to fix timeout errors")
2. **Graph Traversal:** Follow relationships between documents
3. **AI Enhancement:** (Optional) Sonar Agent for query analysis and re-ranking

### MCP Tools Available
When connected via MCP, AI agents have access to:
| Tool | Description |
| :--- | :--- |
| `search_documents` | Hybrid semantic + keyword search |
| `read_node_content` | Get full content of a document |
| `explore_links` | Traverse graph edges from a node |
| `list_directory_structure` | Overview of the corpus |
| `find_gaps` | Identify semantically similar but unlinked docs |

---

## 3. Configuration

Create `amalfa.config.json` in your project root:

```json
{
  "sources": ["docs", "src", "playbooks"],
  "database": ".amalfa/resonance.db",
  "embeddings": {
    "model": "BAAI/bge-small-en-v1.5",
    "dimensions": 384
  },
  "watch": {
    "enabled": true,
    "debounce": 1000
  },
  "excludePatterns": ["node_modules", ".git", ".amalfa"],
  "sonar": {
    "enabled": true,
    "model": "qwen2.5:1.5b"
  }
}
```

---

## 4. MCP Client Setup

### Generate Configuration
```bash
amalfa setup-mcp
```
This outputs JSON for your MCP client config file.

### Claude Desktop Example
Add to `~/.config/claude/mcp_config.json`:
```json
{
  "mcpServers": {
    "amalfa": {
      "command": "bun",
      "args": ["run", "--cwd", "/path/to/your/project", "amalfa", "serve"]
    }
  }
}
```

---

## 5. AI Enhancement (Sonar Agent)

Enable AI-powered search enhancement:

### Start Sonar
```bash
amalfa sonar start
```

### Features
- **Query Analysis:** Extracts intent and entities
- **Re-ranking:** Improves search result ordering
- **Context Snippets:** AI-generated relevant excerpts
- **Chat:** Interactive Q&A with your knowledge base

### Interactive Chat
```bash
amalfa sonar chat
```

---

## 6. Background Services

### Vector Daemon
Keeps embeddings model in memory for fast ingestion:
```bash
amalfa vector start
```

### File Watcher
Auto-reindex on file changes:
```bash
amalfa daemon start
```

### Service Dashboard
View all service status:
```bash
amalfa servers
```

---

## 7. Common Commands

| Command | Description |
| :--- | :--- |
| `amalfa init` | Ingest markdown and build vectors |
| `amalfa serve` | Start MCP server |
| `amalfa stats` | Show database statistics |
| `amalfa validate` | Pre-publish health check |
| `amalfa doctor` | Check installation |
| `amalfa servers` | View all service status |
| `amalfa setup-mcp` | Generate MCP config JSON |

---

## 8. Troubleshooting

**"Search returns empty results"**
- Run `amalfa init` to build the database
- Check `amalfa stats` to verify node count

**"Database not found"**
- Ensure you're in the correct project directory
- Run `amalfa doctor` for diagnostics

**"Sonar not available"**
- Ensure Ollama is running: `ollama serve`
- Pull a model: `ollama pull qwen2.5:1.5b`

---

## 9. Resources

- **Services Architecture:** `docs/services.md`
- **Sonar Deep Dive:** `playbooks/sonar-system-overview.md`
- **Architecture Philosophy:** `docs/the-bicameral-graph.md`
