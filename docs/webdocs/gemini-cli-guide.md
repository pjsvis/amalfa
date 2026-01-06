# Gemini CLI Integration Guide

## Overview

This guide explains how to integrate the semantic-graph-ts library with Gemini CLI 
using slash commands for direct, high-performance graph operations.

## Architecture

The integration uses a **slash command** approach where:
- Commands are registered directly with Gemini CLI
- No HTTP overhead - direct library access
- Response times: 0.1-5ms for most operations
- Multiple output formats: markdown, JSON, table

## Installation

### Prerequisites

- Bun 1.2.0 or higher
- semantic-graph-ts installed
- Gemini CLI (external)

### Setup Steps

1. **Install semantic-graph-ts dependencies:**
```bash
cd semantic-graph-ts
bun install
```

2. **Initialize the database:**
```bash
bun run pipeline:ingest
```

3. **Load commands in Gemini CLI:**
```typescript
import { registerWithGemini } from './src/cli/gemini-adapter.js';

await registerWithGemini(geminiCLI, {
  databasePath: './data/databases/dev-unified.db',
  outputFormat: 'markdown',
  commandPrefix: '/graph:'
});
```

## Available Commands

### Query Operations

**`/graph:query`**
Find nodes matching criteria.

**Parameters:**
- `type` (string, optional) - Filter by node type
- `label` (string, optional) - Filter by node label
- `limit` (number, optional) - Max results [default: 100]

**Examples:**
```
/graph:query type=directive
/graph:query type=concept limit=20
/graph:query label="AI Safety"
```

**`/graph:neighbors`**
Get neighbors of a node.

**Parameters:**
- `nodeId` (string, required) - Node ID to query
- `depth` (number, optional) - Traversal depth [default: 1]

**Examples:**
```
/graph:neighbors nodeId=directive-1
/graph:neighbors nodeId=concept-5 depth=2
```

**`/graph:stats`**
Get graph statistics.

**Examples:**
```
/graph:stats
```

### Graph CRUD Operations

**`/graph:get-node`**
Retrieve a single node by ID.

**Parameters:**
- `nodeId` (string, required) - The node ID

**Examples:**
```
/graph:get-node nodeId=directive-1
```

**`/graph:add-node`**
Create a new node.

**Parameters:**
- `id` (string, required) - Unique node identifier
- `type` (string, required) - Node type
- `title` (string, required) - Node title
- `description` (string, optional) - Node description

**Examples:**
```
/graph:add-node id=test-1 type=concept title="Test Concept"
/graph:add-node id=new-dir type=directive title="New Directive" description="A test"
```

**`/graph:delete-node`**
Delete a node and its edges.

**Parameters:**
- `nodeId` (string, required) - Node ID to delete

**Examples:**
```
/graph:delete-node nodeId=test-1
```

**`/graph:add-edge`**
Create an edge between nodes.

**Parameters:**
- `source` (string, required) - Source node ID
- `target` (string, required) - Target node ID
- `type` (string, optional) - Edge type/label [default: relates_to]
- `weight` (number, optional) - Edge weight [default: 1.0]

**Examples:**
```
/graph:add-edge source=node-1 target=node-2
/graph:add-edge source=node-1 target=node-2 type=influences weight=0.8
```

**`/graph:delete-edge`**
Delete an edge between nodes.

**Parameters:**
- `source` (string, required) - Source node ID
- `target` (string, required) - Target node ID

**Examples:**
```
/graph:delete-edge source=node-1 target=node-2
```

### Analysis Operations

**`/graph:centrality`**
Compute centrality metrics for a node.

**Parameters:**
- `nodeId` (string, required) - Node ID to analyze

**Examples:**
```
/graph:centrality nodeId=directive-1
```

**Output includes:**
- Degree centrality
- Betweenness centrality
- Closeness centrality

**`/graph:top-nodes`**
Get top central nodes.

**Parameters:**
- `limit` (number, optional) - Number of nodes to return [default: 10]

**Examples:**
```
/graph:top-nodes
/graph:top-nodes limit=20
```

**`/graph:communities`**
Detect communities in the graph using Louvain algorithm.

**Examples:**
```
/graph:communities
```

**Output includes:**
- Modularity score
- Community count
- Top communities with member nodes

**`/graph:clusters`**
Get semantic clusters.

**Parameters:**
- `minSize` (number, optional) - Minimum cluster size [default: 3]

**Examples:**
```
/graph:clusters
/graph:clusters minSize=5
```

**`/graph:neighborhood`**
Get node neighborhood at specified depth.

**Parameters:**
- `nodeId` (string, required) - Center node ID
- `depth` (number, optional) - Traversal depth [default: 2]

**Examples:**
```
/graph:neighborhood nodeId=directive-1
/graph:neighborhood nodeId=concept-5 depth=3
```

### Vector Operations

**`/graph:vector-search`**
Semantic search using vector embeddings (placeholder).

**Parameters:**
- `query` (string, required) - Search query
- `topK` (number, optional) - Number of results [default: 10]

**Examples:**
```
/graph:vector-search query="AI ethics" topK=5
/graph:vector-search query="knowledge representation"
```

**Note:** Full vector search integration requires Vectra setup. 
See `src/server/routes/vectra/test-vectra-query.ts`.

## Output Formats

Commands support multiple output formats:

### Markdown (default)
```
**nodeCount**: 150
**edgeCount**: 342
**uniqueTypes**: 5
```

### JSON
```json
{
  "nodeCount": 150,
  "edgeCount": 342,
  "uniqueTypes": 5
}
```

### Table
```
id          | type      | title
------------|-----------|------------------
directive-1 | directive | Core Protocol
concept-2   | concept   | Knowledge Graph
```

### Compact
```
{"nodeCount":150,"edgeCount":342,"uniqueTypes":5}
```

## Configuration

Edit `gemini-cli.config.json`:

```json
{
  "commandPrefix": "/graph:",
  "databasePath": "./data/databases/dev-unified.db",
  "defaultOutputFormat": "markdown",
  "timeout": 5000
}
```

## Performance

Expected response times:
- Graph queries: 0.1-1ms
- Node/edge CRUD: 1-5ms
- Analysis operations: 5-50ms (depending on graph size)
- Vector search: 10-100ms (when implemented)

## Testing

Run the test harness:
```bash
bun run scripts/cli/test-gemini-commands.ts
```

## Troubleshooting

### Database Not Found
Ensure the database path in config is correct:
```bash
ls data/databases/dev-unified.db
```

### Command Not Recognized
Check that all command modules are imported:
```typescript
import "./commands/query-commands.js";
import "./commands/graph-commands.js";
import "./commands/analysis-commands.js";
import "./commands/vector-commands.js";
```

### Slow Response Times
- Check database file size
- Ensure SQLite WAL mode is enabled
- Verify graph is loaded into memory on startup

## Advanced Usage

### Custom Command Registration

```typescript
import { registerCommand } from './src/cli/index.js';

registerCommand({
  name: '/graph:custom',
  description: 'Custom operation',
  parameters: {
    param1: { type: 'string', required: true, description: 'Param 1' }
  },
  handler: async (args, context) => {
    // Your logic here
    return { success: true, data: result };
  },
  examples: ['/graph:custom param1=value']
});
```

### Programmatic Access

```typescript
import { initializeCLI, executeCommand } from './src/cli/index.js';

await initializeCLI('./data/databases/dev-unified.db');

const result = await executeCommand('/graph:stats', {}, 'json');
console.log(result);
```

## API Reference

See inline documentation in:
- `src/cli/types.ts` - Type definitions
- `src/cli/index.ts` - Core API
- `src/cli/gemini-adapter.ts` - Gemini integration
- `src/cli/formatters.ts` - Output formatting

## Future Enhancements

- Full vector search integration
- Batch operations
- Export/import commands
- Graph visualization commands
- Custom query DSL
