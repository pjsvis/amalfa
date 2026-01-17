---
date: 2026-01-17
tags: [architecture, technical, fafcas, hollow-nodes, vectors, database]
---

# Amalfa Architecture

This document provides technical deep dive into Amalfa's architecture, data structures, and implementation patterns.

## Overview

Amalfa is a local-first knowledge graph with semantic search capabilities, built on:
- **Runtime:** Bun (TypeScript-native, fast startup)
- **Database:** SQLite with WAL mode
- **Embeddings:** FastEmbed (`bge-small-en-v1.5`, 384 dimensions)
- **Reranking:** Xenova Transformers (`bge-reranker-base`)
- **Protocol:** Model Context Protocol (MCP) for agent integration

## Core Design Patterns

### 1. Hollow Nodes

**Concept:** Nodes store only metadata in SQLite. Content lives on the filesystem.

**Rationale:**
- SQLite is optimized for small, structured data
- Large text blobs slow down queries and backups
- Git works better with individual files than database blobs
- Enables version control of content without database migrations

**Implementation:**

```typescript
// ❌ WRONG - Content doesn't exist in database
const node = db.getNode(id);
const content = node.content; // Always undefined

// ✅ CORRECT - Hydrate from filesystem
const node = db.getNode(id);
const content = await gardener.getContent(id); // Reads from meta.source path
```

**Database Schema:**
```sql
CREATE TABLE nodes (
    id TEXT PRIMARY KEY,
    title TEXT,
    node_type TEXT,
    meta TEXT,  -- JSON with { source: "/path/to/file.md", ... }
    created_at INTEGER,
    updated_at INTEGER
);
```

**Content Resolution Flow:**
```
1. Query node metadata from SQLite → get `meta.source` path
2. Read file from filesystem → Bun.file(sourcePath).text()
3. Return hydrated node with content
```

**Benefits:**
- Fast metadata queries (titles, tags, relationships)
- Git-friendly content storage
- No database bloat from large markdown files
- Deterministic rebuilds (same files → same index)

### 2. FAFCAS Protocol

**Fast As Fuck, Cool As Shit** - A vector storage and similarity protocol.

**Core Innovation:** Pre-normalize all vectors to unit length (L2 norm = 1.0) before storage.

**Mathematics:**

Traditional cosine similarity:
```
cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)
```

FAFCAS optimization:
```
If ||A|| = 1.0 and ||B|| = 1.0:
cosine_similarity(A, B) = A · B  (pure dot product)
```

**Implementation:**

```typescript
// BentoNormalizer.ts
export class BentoNormalizer {
  static toFafcas(vector: number[]): Float32Array {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val ** 2, 0));
    return new Float32Array(vector.map(v => v / magnitude));
  }
}
```

**Storage:**
```sql
CREATE TABLE vectors (
    node_id TEXT PRIMARY KEY,
    embedding BLOB,  -- Raw Float32Array bytes
    model TEXT DEFAULT 'bge-small-en-v1.5',
    dimension INTEGER DEFAULT 384
);
```

**Search Query:**
```sql
-- Pure dot product similarity (no division needed)
SELECT 
    node_id,
    vector_dot_product(embedding, ?) AS score
FROM vectors
ORDER BY score DESC
LIMIT ?;
```

**Performance Benefits:**
- **10x faster** than cosine similarity (no division operations)
- **Zero serialization overhead** (raw BLOB storage)
- **Cache-friendly** (contiguous Float32Array)
- **SIMD-optimizable** (modern CPUs can vectorize dot products)

**Verification:**
```typescript
// All stored vectors have L2 norm = 1.0
const stored = new Float32Array(blob);
const norm = Math.sqrt(stored.reduce((sum, v) => sum + v ** 2, 0));
assert(Math.abs(norm - 1.0) < 0.0001);
```

### 3. Micro-Daemon Mesh

**Philosophy:** Small, focused services instead of monolithic background processes.

#### File Watcher Daemon
- **Purpose:** Monitor markdown files for changes, trigger re-ingestion
- **Port:** None (file-system based)
- **PID File:** `.amalfa/runtime/daemon.pid`
- **Implementation:** `src/daemon/index.ts`
- **Embedding:** Includes its own embedding pipeline for changed files

**Flow:**
```
1. chokidar watches configured source directories
2. On change detected → parse markdown (Harvester)
3. Generate embedding via FastEmbed
4. Update nodes, edges, vectors in SQLite
5. Log sync status
```

#### Vector Daemon (Port 3010)
- **Purpose:** HTTP API for on-demand embedding generation
- **Use Case:** External tools, batch processing, testing
- **PID File:** `.amalfa/runtime/vector-daemon.pid`
- **Implementation:** `src/resonance/services/vector-daemon.ts`

**API:**
```
POST /embed
Body: { text: "content to embed" }
Response: { embedding: [0.1, 0.2, ...], dimension: 384 }
```

**Note:** The file watcher has its own embedding capability - this daemon is separate.

#### Reranker Daemon (Port 3011)
- **Purpose:** Precision re-scoring of search results
- **Model:** `bge-reranker-base` (cross-encoder)
- **PID File:** `.amalfa/runtime/reranker-daemon.pid`
- **Implementation:** `src/resonance/services/reranker-daemon.ts`

**Flow:**
```
1. Vector search returns top N candidates
2. Reranker scores each (query, document) pair
3. Results re-sorted by reranker score
4. Return top K to user
```

**Performance:**
- Vector search: ~10ms for 1000 docs
- Reranker: ~50ms for top 20 results
- Combined: ~60ms end-to-end

#### Sonar Agent (Port 3012)
- **Purpose:** LLM-powered reasoning and context extraction
- **PID File:** `.amalfa/runtime/sonar.pid`
- **Implementation:** `src/daemon/sonar-*.ts`
- **Status:** Experimental

**Capabilities:**
- Query analysis (intent detection, entity extraction)
- Result re-ranking with semantic understanding
- Context extraction (relevant snippets from documents)
- Gap detection (similar but unlinked documents)

#### Service Management

All daemons implement `ServiceLifecycle` interface:

```typescript
interface ServiceLifecycle {
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<{ running: boolean; pid?: number }>;
  restart(): Promise<void>;
}
```

**Commands:**
```bash
amalfa servers              # Show all service status
amalfa daemon start|stop    # File watcher
amalfa vector start|stop    # Vector daemon
amalfa reranker start|stop  # Reranker daemon
amalfa sonar start|stop     # Sonar agent
amalfa stop-all             # Stop all services
```

## Data Flow

### Ingestion Pipeline

```
Markdown Files (filesystem)
    ↓
Harvester (parser)
    ↓
[Nodes + Edges] → SQLite
    ↓
FastEmbed (bge-small-en-v1.5)
    ↓
BentoNormalizer.toFafcas()
    ↓
[Vectors] → SQLite (BLOB)
```

**Code Path:**
```
scripts/cli/ingest.ts
  → src/pipeline/IngestionPipeline.ts
    → src/core/Harvester.ts (markdown → nodes)
    → src/core/EdgeWeaver.ts (relationships)
    → src/core/VectorEngine.ts (embeddings)
      → src/core/BentoNormalizer.ts (FAFCAS)
    → src/resonance/db.ts (persist)
```

### Search Query Flow

```
MCP Client (Claude, etc.)
    ↓
search_documents(query)
    ↓
src/mcp/index.ts
    ↓
VectorEngine.search(query)
    ↓
1. Embed query → FAFCAS vector
2. Dot product similarity search
3. Return top N candidates
    ↓
[Optional] Sonar re-ranking
    ↓
[Optional] Context extraction
    ↓
Return ranked results to client
```

## Database Schema

**Full schema:** `src/resonance/drizzle/schema.ts`

### Core Tables

```sql
-- Node metadata (hollow)
CREATE TABLE nodes (
    id TEXT PRIMARY KEY,
    title TEXT,
    node_type TEXT,
    meta TEXT,
    created_at INTEGER,
    updated_at INTEGER
);

-- Edges (relationships)
CREATE TABLE edges (
    source TEXT,
    target TEXT,
    type TEXT,
    weight REAL DEFAULT 1.0,
    PRIMARY KEY (source, target, type)
);

-- Vector embeddings (FAFCAS)
CREATE TABLE vectors (
    node_id TEXT PRIMARY KEY,
    embedding BLOB,
    model TEXT DEFAULT 'bge-small-en-v1.5',
    dimension INTEGER DEFAULT 384,
    FOREIGN KEY (node_id) REFERENCES nodes(id)
);

-- Tags
CREATE TABLE tags (
    node_id TEXT,
    tag TEXT,
    PRIMARY KEY (node_id, tag)
);
```

### Indexes

```sql
CREATE INDEX idx_nodes_type ON nodes(node_type);
CREATE INDEX idx_nodes_updated ON nodes(updated_at);
CREATE INDEX idx_edges_source ON edges(source);
CREATE INDEX idx_edges_target ON edges(target);
CREATE INDEX idx_edges_type ON edges(type);
CREATE INDEX idx_tags_tag ON tags(tag);
```

## Performance Characteristics

### Database Operations

| Operation | Time | Notes |
|-----------|------|-------|
| Node lookup by ID | <1ms | Primary key index |
| Vector search (1000 docs) | ~10ms | FAFCAS dot product |
| Edge traversal | <5ms | Indexed queries |
| Full re-ingestion (1000 docs) | ~30s | Including embeddings |

### Vector Operations

```
Embedding generation: ~50ms per document (FastEmbed)
Vector normalization: <1ms (BentoNormalizer)
Similarity computation: <0.1ms per comparison
```

### Memory Usage

```
Base process: ~50MB
FastEmbed model: ~100MB (loaded on first use)
Reranker model: ~200MB (separate daemon)
SQLite cache: ~50MB (WAL + page cache)
```

## Configuration

**Main config:** `amalfa.config.json`

```json
{
  "sources": ["./docs", "./briefs", "./debriefs", "./playbooks"],
  "database": ".amalfa/resonance.db",
  "watch": {
    "enabled": true,
    "interval": 1000
  },
  "vector": {
    "model": "bge-small-en-v1.5",
    "dimension": 384,
    "daemon_port": 3010
  },
  "reranker": {
    "model": "bge-reranker-base",
    "daemon_port": 3011
  },
  "sonar": {
    "enabled": false,
    "daemon_port": 3012
  }
}
```

## Advanced Patterns

### Content Hydration

**Problem:** Search returns node IDs, but agent needs content.

**Solution:** `ContentHydrator` utility

```typescript
const hydrator = new ContentHydrator(gardener);

// Hydrate single result
const result = { id: "doc-123", score: 0.95 };
const withContent = await hydrator.hydrate(result);
// → { id, score, content: "full markdown..." }

// Hydrate batch
const results = vectorEngine.search(query, 20);
const hydratedResults = await hydrator.hydrateMany(results);
```

**Used by:**
- MCP `read_node_content` tool
- Sonar context extraction
- Reranking (needs full content)

### Graph Traversal

**Pattern:** Explore relationships beyond direct links.

```typescript
const graphEngine = new GraphEngine();
await graphEngine.load(db.getRawDb());

// Get neighbors
const neighbors = graphEngine.getNeighbors("doc-123");

// Get paths between nodes
const paths = graphEngine.findPaths("doc-123", "doc-456", maxDepth: 3);

// Get clusters
const clusters = await graphEngine.detectCommunities();
```

**Algorithms:**
- BFS/DFS traversal
- Louvain community detection
- Shortest path (Dijkstra)
- PageRank centrality

## Testing Patterns

**In-memory databases:**

```typescript
import { DatabaseFactory } from "@src/resonance/DatabaseFactory";

const db = DatabaseFactory.createTestDB(); // Uses :memory:
// ... run tests
db.close();
```

**Benefits:**
- Fast (no disk I/O)
- Isolated (each test gets fresh DB)
- Clean (automatic cleanup)

## Future Optimizations

### Vector Search
- [ ] HNSW index (hierarchical navigable small world)
- [ ] Product quantization (reduce memory)
- [ ] GPU acceleration (CUDA dot products)

### Database
- [ ] Partitioning by document type
- [ ] Separate read/write connections
- [ ] WAL checkpoint tuning

### Daemons
- [ ] HTTP/2 for daemon APIs
- [ ] gRPC for internal communication
- [ ] Shared memory for large vectors

## References

- **FAFCAS implementation:** `src/core/BentoNormalizer.ts`
- **Hollow nodes:** `src/core/GraphGardener.ts`
- **Vector engine:** `src/core/VectorEngine.ts`
- **Database layer:** `src/resonance/db.ts`
- **Schema definition:** `src/resonance/drizzle/schema.ts`
- **MCP server:** `src/mcp/index.ts`
