# Amalfa Backend Services

This document outlines the architecture and management of the Amalfa service ecosystem.

## The Service Triad

Amalfa consists of three main background services that work together to provide AI-enhanced knowledge graph capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                    AMALFA Service Layer                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  MCP Server  │  │   Vector     │  │    Sonar     │       │
│  │   (stdio)    │  │   Daemon     │  │    Agent     │       │
│  │              │  │  (port 3010) │  │  (port 3012) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│        │                  │                  │               │
│        └──────────────────┼──────────────────┘               │
│                           ▼                                  │
│              ┌────────────────────────┐                      │
│              │   .amalfa/resonance.db │                      │
│              │   (SQLite + Vectors)   │                      │
│              └────────────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1. MCP Server
*   **Transport**: `stdio` (JSON-RPC 2.0)
*   **Role**: Primary interface for AI agents (Claude, Cursor, etc.)
*   **Capabilities**: 
    - `search_documents` - Hybrid vector + keyword search
    - `read_node_content` - Retrieve full document content
    - `explore_links` - Graph traversal
    - `list_directory_structure` - Corpus overview
    - `find_gaps` - Semantic gap detection

### 2. Vector Daemon
*   **Port**: `3010`
*   **Role**: Background embedding service
*   **Function**: Keeps the FastEmbed model loaded in memory for fast vector generation during ingestion.
*   **When to Use**: Heavy ingestion workloads, file watching.

### 3. Sonar Agent
*   **Port**: `3012`
*   **Role**: AI-powered search enhancement
*   **Capabilities**:
    - Query analysis and intent extraction
    - Search result re-ranking
    - Context snippet generation
    - Metadata enhancement
    - Interactive chat with knowledge base
*   **Backend**: Ollama (local) or OpenRouter (cloud)

---

## Service Management

### Global Status Dashboard
View the health of all services at a glance:
```bash
amalfa servers
```

**Example Output:**
```
SERVICE        PORT      STATUS         PID       
────────────────────────────────────────────────
MCP Server     stdio     ⚪️ STOPPED     -         
Vector Daemon  3010      🟢 RUNNING     12345     
Sonar Agent    3012      🟢 RUNNING     12346     
File Watcher   -         ⚪️ STOPPED     -         
────────────────────────────────────────────────
```

### Starting/Stopping Services
Each service supports a unified command interface:

```bash
# Vector Daemon
amalfa vector start
amalfa vector stop
amalfa vector status

# Sonar Agent
amalfa sonar start
amalfa sonar stop
amalfa sonar status
amalfa sonar chat   # Interactive mode

# File Watcher (auto-reindex on changes)
amalfa daemon start
amalfa daemon stop
amalfa daemon status
```

### MCP Server
The MCP server is typically started by your AI client (Claude Desktop, Cursor).
To generate the configuration:
```bash
amalfa setup-mcp
```
This outputs JSON suitable for your client's MCP configuration file.

---

## Configuration

All services read from `amalfa.config.json` in your project root.

```json
{
  "sources": ["docs", "src"],
  "database": ".amalfa/resonance.db",
  "sonar": {
    "enabled": true,
    "model": "qwen2.5:1.5b",
    "port": 3012,
    "cloud": {
      "enabled": false,
      "provider": "openrouter",
      "model": "qwen/qwen-2.5-72b-instruct"
    }
  }
}
```

---

## Logs

All service logs are written to `.amalfa/logs/`:
- `sonar.log` - Sonar Agent activity
- `vector.log` - Vector Daemon activity
- `watcher.log` - File Watcher activity

---

## See Also
- **Sonar Deep Dive:** `playbooks/sonar-system-overview.md`
- **Configuration Guide:** `playbooks/sonar-manual.md`
- **Architecture Philosophy:** `docs/the-bicameral-graph.md`
