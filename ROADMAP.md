# AMALFA Roadmap

This document outlines the planned features and improvements for future versions of AMALFA.

## Version 1.1 (Q1 2026) - Graph Analytics & Performance

### Theme: "Hollow Nodes + Graph Intelligence"

Version 1.1 focuses on leveraging the hollow node architecture to enable powerful graph analytics with minimal memory overhead.

---

### Graphology Integration

**Status**: Planned  
**Priority**: High  
**Complexity**: Medium

#### Overview
Integrate Graphology.js for in-memory graph analytics using the hollow node pattern. Graph contains only structure (nodes as IDs + paths, edges with weights), while content remains in filesystem/database.

#### Memory Footprint
- 70,000 nodes × 20 bytes (ID + path) = **~1.4MB**
- 100,000 edges × 50 bytes (source + target + weight + type) = **~5MB**
- **Total: ~7MB for 70K node graph** (vs 490MB if we stored content + embeddings)

#### New Components
- `src/core/GraphEngine.ts` - Lazy-loading graph builder
- Hollow pattern: `graph.addNode(id, { path: "docs/file.md" })`  
- Content fetched on-demand from filesystem

#### Benefits
- **Fast traversal**: Pure memory operations, no I/O
- **Graph algorithms**: Centrality, clustering, path finding
- **Hybrid search**: Vector similarity + graph structure
- **Scalable**: 100K+ nodes easily

---

### New MCP Tools

**Status**: Planned  
**Priority**: High  
**Complexity**: Low-Medium

#### 1. `find_related_documents(node_id, depth)`
- **Purpose**: Find documents connected via graph structure
- **Parameters**:
  - `node_id`: Starting document ID
  - `depth`: Traversal depth (default: 2)
  - `include_content`: Return full content or just paths (default: false)
- **Returns**: Array of related document IDs/paths
- **Use Case**: Agent explores document relationships without vector search

#### 2. `discover_clusters()`
- **Purpose**: Detect topic communities using Louvain algorithm
- **Parameters**:
  - `min_cluster_size`: Minimum documents per cluster (default: 3)
- **Returns**: Array of clusters, each with document IDs
- **Use Case**: "What are the main topics in this knowledge base?"

#### 3. `find_connection_path(from_id, to_id)`
- **Purpose**: Find shortest path between two documents
- **Parameters**:
  - `from_id`: Source document
  - `to_id`: Target document
- **Returns**: Array of document IDs forming the path
- **Use Case**: "How is the API documentation related to the database schema?"

#### 4. `get_document_importance(node_id)`
- **Purpose**: Return centrality metrics for a document
- **Parameters**:
  - `node_id`: Document to analyze
- **Returns**: Object with PageRank, betweenness, degree centrality
- **Use Case**: "Is this a hub document?"

#### 5. Enhanced `search_knowledge(query, use_graph_ranking)`
- **Enhancement**: Add optional graph-based reranking
- **Parameters**:
  - `query`: Search query (existing)
  - `limit`: Result count (existing)
  - `use_graph_ranking`: Rerank by centrality (new, default: false)
- **Use Case**: Find relevant AND important documents

---

### VectorEngine Refactor

**Status**: Required for v1.1  
**Priority**: High  
**Complexity**: Low

#### Problem
Current VectorEngine reads content from database `content` column (now NULL in schema v6).

#### Solution
Update `searchByVector()` to read content from filesystem:

```typescript
// Current (broken in v6)
const row = this.db.query("SELECT title, content FROM nodes WHERE id = ?").get(id);

// New (filesystem-backed)
const row = this.db.query("SELECT title, meta FROM nodes WHERE id = ?").get(id);
const meta = JSON.parse(row.meta);
const content = readFileSync(meta.source, 'utf8');
```

#### Benefits
- Works with hollow nodes (schema v6)
- Single source of truth (filesystem)
- Enables schema v7 (remove content column entirely)

---

### Schema v7: Remove Content Column

**Status**: Planned after VectorEngine refactor  
**Priority**: Medium  
**Complexity**: Low

#### Changes
- Drop `content` column from `nodes` table completely
- Rebuild table without deprecated column
- All code must use filesystem reads

#### Prerequisites
- VectorEngine refactor complete
- All legacy code updated
- Test suite validates filesystem reads

#### Benefits
- Cleaner schema
- Removes technical debt
- ~350MB saved for 70K corpus

---

### Automatic File Splitting

**Status**: Planned  
**Priority**: Medium  
**Complexity**: High

#### Problem
Large files (>10MB) currently blocked by pre-flight validation. Users must manually split files.

#### Solution
Automatic chunking strategy:

1. **Detection**: Files > 10MB trigger auto-split
2. **Strategy Priority**:
   - Markdown headers (H1/H2) - Most natural
   - Token count (~2000 tokens per chunk) - Fallback
   - Character count (~8000 chars) - Last resort
3. **Virtual Nodes**: Create chunks with naming:
   - `docs/api-reference.md#introduction`
   - `docs/api-reference.md#authentication`
   - `docs/api-reference.md#endpoints`
4. **Graph Links**: Connect chunks:
   - Container node: `api-reference.md` (type: `container`)
   - Chunk nodes: `api-reference.md#section` (type: `chunk`)
   - Edges: `chunk --part_of--> container`

#### Components
- `src/pipeline/MarkdownSplitter.ts` - Splitting logic
- Update `PreFlightAnalyzer` to suggest auto-split
- Schema v8: Add `chunk_index` column to nodes
- Update MCP tools to reassemble chunks on retrieval

#### Configuration
```json
{
  "maxFileSizeKB": 10240,
  "autoSplit": true,
  "splitStrategy": "headers" // or "tokens" or "characters"
}
```

---

### Performance Enhancements

**Status**: Ongoing  
**Priority**: Medium  
**Complexity**: Varies

#### Planned Improvements

1. **Batch Embedding Generation**
   - Current: One file at a time
   - Proposed: Batch FastEmbed calls (5-10 files)
   - Expected: 2-3x faster ingestion

2. **Parallel File Discovery**
   - Current: Sequential directory scan
   - Proposed: Parallel glob with worker threads
   - Expected: Faster for large corpora (10K+ files)

3. **Incremental Edge Reweaving**
   - Current: Full graph rebuild on changes
   - Proposed: Update only affected edges
   - Expected: Faster daemon updates

4. **Graph Cache**
   - Current: Build graph from SQLite on each MCP session
   - Proposed: Serialize to `.amalfa/graph.bin`, load in ~50ms
   - Expected: Faster MCP server startup

---

## Version 1.2+ (Future) - Advanced Features

### Multi-Language Support
- Embeddings for non-English content
- Language-specific tokenization
- Configurable embedding models per language

### Custom Embedding Models
- Support for user-provided models
- Model switching without re-ingestion
- Embedding dimension compatibility checks

### Graph Visualization Export
- Export to Graphviz DOT format
- Export to Sigma.js JSON
- Interactive web-based explorer

### Backup & Restore
- `amalfa backup` command
- Compressed archive with database + source files
- `amalfa restore` with validation

### Advanced Search
- Boolean operators (AND/OR/NOT)
- Filtered search by metadata
- Date range queries
- Fuzzy matching

### API Server Mode
- RESTful API alongside MCP
- WebSocket for real-time updates
- Multi-client support

---

## Feature Requests

We welcome feature requests! Please open an issue on GitHub with:
- **Use case**: What problem does this solve?
- **Priority**: How important is this to you?
- **Alternatives**: What workarounds exist?

---

## Development Priorities

### High Priority (v1.1)
1. Graphology integration
2. New MCP tools
3. VectorEngine refactor
4. Schema v7

### Medium Priority (v1.1 or v1.2)
1. Automatic file splitting
2. Performance optimizations
3. Graph cache

### Low Priority (v1.2+)
1. Multi-language support
2. Custom embedding models
3. Graph visualization
4. API server mode

---

## Breaking Changes

### v1.1
- Schema v7 removes `content` column (after VectorEngine refactor)
- Existing databases auto-migrate from v6 → v7
- **Action required**: Ensure all nodes have `meta.source` paths before upgrading

### v2.0 (If needed)
- Major API changes (TBD)
- New MCP protocol version
- Configuration format changes

---

## Timeline

| Version | Target Date | Status | Features |
|---------|------------|--------|----------|
| v1.0.0 | 2026-01-06 | ✅ Released | Initial release, MCP server, vector search |
| v1.0.1 | 2026-01-06 | ✅ Released | Pre-flight validation, multi-source, schema v6 |
| v1.1.0 | Q1 2026 | 🚧 In Progress | Graphology, new MCP tools, schema v7 |
| v1.2.0 | Q2 2026 | 📋 Planned | File splitting, performance, advanced features |
| v2.0.0 | TBD | 💭 Future | Major enhancements, breaking changes |

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Priority areas for contributors:**
- Graphology integration
- Test coverage improvements
- Documentation enhancements
- Performance benchmarks

---

**Last Updated**: 2026-01-06  
**Version**: 1.0.1
