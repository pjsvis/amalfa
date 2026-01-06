# AMALFA MCP Tools

Documentation for Model Context Protocol (MCP) tools provided by AMALFA.

## Overview

AMALFA exposes 5 tools through the MCP protocol for AI agents to interact with your knowledge graph:

1. **search_documents** - Semantic vector search
2. **read_node_content** - Read full markdown content
3. **explore_links** - Graph traversal (find related nodes)
4. **list_directory_structure** - View document organization
5. **inject_tags** - Add semantic tags to files (experimental)

## Tools

### 1. search_documents

**Purpose**: Search the knowledge graph using semantic vector search.

**Parameters**:
```json
{
  "query": "string (required)",
  "limit": "number (optional, default: 20)"
}
```

**Example Request**:
```json
{
  "name": "search_documents",
  "arguments": {
    "query": "machine learning architectures",
    "limit": 10
  }
}
```

**Example Response**:
```json
[
  {
    "id": "neural-networks",
    "score": "0.847",
    "preview": "Neural networks are computing systems inspired by biological neural networks...",
    "source": "vector"
  },
  {
    "id": "deep-learning",
    "score": "0.823",
    "preview": "Deep learning is part of a broader family of machine learning methods...",
    "source": "vector"
  }
]
```

**Notes**:
- Uses 384-dimensional vector embeddings (BAAI/bge-small-en-v1.5)
- Scores range from 0.0 to 1.0 (cosine similarity)
- Results are sorted by relevance (highest score first)
- Preview is first 200 characters of content

### 2. read_node_content

**Purpose**: Retrieve the full markdown content of a specific document.

**Parameters**:
```json
{
  "id": "string (required)"
}
```

**Example Request**:
```json
{
  "name": "read_node_content",
  "arguments": {
    "id": "neural-networks"
  }
}
```

**Example Response**:
```markdown
# Neural Networks

Neural networks are computing systems inspired by biological neural networks...

## Architecture

[[Deep Learning]] architectures consist of multiple layers:

1. Input layer
2. Hidden layers
3. Output layer

<!-- tags: [DOMAIN: machine-learning] -->
```

**Notes**:
- Returns raw markdown content from source file
- Implements "Hollow Nodes" pattern (content not stored in database)
- Includes frontmatter, WikiLinks, and metadata
- Returns error if node ID not found or file missing

### 3. explore_links

**Purpose**: Find related documents through graph traversal.

**Parameters**:
```json
{
  "id": "string (required)",
  "relation": "string (optional)"
}
```

**Relation Types**:
- `CITES` - WikiLink references (`[[Document]]`)
- `TAGGED_AS` - Semantic tags (`[tag: Concept]`)
- `EXEMPLIFIES` - Legacy tag references (`tag-concept`)
- `RELATED_TO` - Generic relationships
- Custom - User-defined metadata tags

**Example Request**:
```json
{
  "name": "explore_links",
  "arguments": {
    "id": "neural-networks",
    "relation": "CITES"
  }
}
```

**Example Response**:
```json
[
  { "target": "deep-learning", "type": "CITES" },
  { "target": "backpropagation", "type": "CITES" },
  { "target": "gradient-descent", "type": "CITES" }
]
```

**Example Request (All Relations)**:
```json
{
  "name": "explore_links",
  "arguments": {
    "id": "neural-networks"
  }
}
```

**Notes**:
- Without `relation` parameter, returns all outgoing edges
- Only shows direct connections (1-hop traversal)
- For multi-hop exploration, call recursively on target nodes
- Empty array if node has no outgoing edges

### 4. list_directory_structure

**Purpose**: View the high-level organization of documents.

**Parameters**: None

**Example Request**:
```json
{
  "name": "list_directory_structure",
  "arguments": {}
}
```

**Example Response**:
```json
[
  "docs/",
  "notes/"
]
```

**Notes**:
- Currently returns hardcoded structure
- TODO: Make configurable via `amalfa.config.ts`
- Useful for understanding document organization before search

### 5. inject_tags

**Purpose**: Add semantic tags to a markdown file programmatically.

⚠️ **Experimental**: Modifies source files. Use with caution.

**Parameters**:
```json
{
  "file_path": "string (required)",
  "tags": "array<string> (required)"
}
```

**Example Request**:
```json
{
  "name": "inject_tags",
  "arguments": {
    "file_path": "./docs/neural-networks.md",
    "tags": ["DOMAIN: machine-learning", "COMPLEXITY: advanced"]
  }
}
```

**Example Response**:
```json
{
  "text": "Injected 2 tags into ./docs/neural-networks.md"
}
```

**What It Does**:
Appends metadata block to end of file:
```markdown
<!-- tags: DOMAIN: machine-learning, COMPLEXITY: advanced -->
```

**Notes**:
- **Modifies source files** - Changes persist on disk
- Triggers file watcher (if daemon running) for re-ingestion
- Tags follow metadata format: `<!-- tags: [KEY: value] -->`
- Use for "Gardener Agent" workflows (automated knowledge curation)

## Resources

AMALFA also provides MCP resources:

### amalfa://stats/summary

Returns knowledge graph statistics (nodes, edges, embeddings, database size).

## Integration Examples

### Claude Desktop

Configure in `claude_desktop_config.json`:

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

### Example Conversation

**User**: "What do I have about machine learning?"

**Claude** (uses search_documents):
```json
{
  "query": "machine learning",
  "limit": 5
}
```

**User**: "Show me the full content of neural-networks"

**Claude** (uses read_node_content):
```json
{
  "id": "neural-networks"
}
```

**User**: "What documents link to this?"

**Claude** (uses explore_links):
```json
{
  "id": "neural-networks",
  "relation": "CITES"
}
```

## Error Handling

All tools return errors in this format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: <error message>"
    }
  ],
  "isError": true
}
```

Common errors:
- `Node not found` - ID doesn't exist in database
- `File not found` - Source markdown file missing
- `Search Error` - Vector search failed (embeddings missing)
- `Tool <name> not found` - Invalid tool name

## Performance

- **search_documents**: ~10-50ms (depends on corpus size)
- **read_node_content**: <5ms (filesystem read)
- **explore_links**: <5ms (SQLite query)
- **list_directory_structure**: <1ms (in-memory)
- **inject_tags**: <10ms (file write)

Database remains open during MCP session for optimal performance.

## Limitations

1. **Read-only by default**: Only `inject_tags` modifies files
2. **No batch operations**: Each tool call processes single request
3. **No pagination**: Large result sets return all at once (use `limit` parameter)
4. **Synchronous only**: No streaming results

## Future Tools (Roadmap)

- `create_document` - Create new markdown files
- `update_document` - Edit existing files
- `delete_document` - Remove files and nodes
- `graph_stats` - Detailed graph analytics
- `find_path` - Multi-hop pathfinding between nodes
- `cluster_analysis` - Community detection

## Technical Details

### Transport

AMALFA uses **stdio transport** for MCP communication:
- stdin: Receives JSON-RPC requests
- stdout: Returns JSON-RPC responses
- stderr: Logging (captured in `.mcp.log`)

### Database Access

Each tool call creates a fresh database connection:
```typescript
const db = new ResonanceDB(".amalfa/resonance.db");
const vectorEngine = new VectorEngine(db.getRawDb());
// ... use tools ...
db.close(); // Cleanup after request
```

### Vector Search Algorithm

1. Generate query embedding (384-dim vector)
2. Normalize to unit length (L2 norm)
3. Compute dot product with all document embeddings
4. Sort by similarity score (descending)
5. Return top-k results

No vector database required - pure SQLite with BLOB storage.

---

**For more information**:
- [AMALFA GitHub](https://github.com/pjsvis/amalfa)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [FastEmbed Documentation](https://github.com/qdrant/fastembed)
