# Database Capabilities Reference

**File:** `public/resonance.db`  
**Engine:** SQLite (via `bun:sqlite`)  
**Mode:** WAL (Write-Ahead Logging)  
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Core Capabilities](#core-capabilities)
3. [Schema](#schema)
4. [Search Capabilities](#search-capabilities)
5. [API Reference](#api-reference)
6. [Configuration](#configuration)
7. [Maintenance](#maintenance)

---

## Overview

The Resonance Database is a **hybrid graph-vector SQLite database** that stores:
- **Nodes:** Documents, concepts, directives (with optional vector embeddings)
- **Edges:** Relationships between nodes (semantic, hard links, references)
- **FTS Index:** Full-text search index for fast content queries

### Single Source of Truth

- **Generated File:** `public/resonance.db` (locally generated, NOT committed to git)
- **Source Data:** JSON fixtures in `scripts/fixtures/` + Markdown files in `briefs/`, `debriefs/`, `playbooks/`
- **Configuration:** `polyvis.settings.json` (canonical path: `settings.paths.database.resonance`)

---

## Core Capabilities

| Capability | Status | Implementation |
|------------|--------|----------------|
| **WAL Mode** | ✅ Enabled | `PRAGMA journal_mode = WAL` (auto-set in `ResonanceDB` constructor) |
| **Vector Embeddings** | ✅ Enabled | BLOB storage using FAFCAS protocol (normalized Float32Array) |
| **Full-Text Search** | ✅ Enabled | FTS5 virtual table with BM25 ranking |
| **Graph Edges** | ✅ Enabled | Indexed on `(source, target, type)` |
| **Concurrent Writes** | ✅ Supported | WAL mode enables multiple readers + single writer |
| **Vector Search** | ✅ Enabled | Dot product similarity via `findSimilar()` |
| **Semantic Linking** | ✅ Enabled | Edge weaving with lexicon-based entity extraction |

---

## Schema

### Nodes Table

```sql
CREATE TABLE nodes (
    id TEXT PRIMARY KEY,
    type TEXT,              -- 'concept', 'directive', 'document', 'playbook', 'debrief'
    title TEXT,             -- Display name (FTS indexed)
    content TEXT,           -- Full content (FTS indexed)
    domain TEXT,            -- 'persona' | 'experience' | 'knowledge'
    layer TEXT,             -- 'ontology' | 'directive' | 'experience'
    embedding BLOB,         -- Float32Array (FAFCAS normalized)
    hash TEXT,              -- Content hash for delta detection
    meta TEXT               -- JSON metadata (tags, source, semantic_tokens, etc.)
);
```

### Edges Table

```sql
CREATE TABLE edges (
    source TEXT,
    target TEXT,
    type TEXT,              -- 'mentions', 'related_to', 'defines', etc.
    PRIMARY KEY (source, target, type)
);

CREATE INDEX idx_edges_source ON edges(source);
CREATE INDEX idx_edges_target ON edges(target);
```

### FTS5 Virtual Table

```sql
CREATE VIRTUAL TABLE nodes_fts USING fts5(
    id UNINDEXED,
    title,
    content,
    tokenize = 'porter unicode61'
);
```

**Auto-Sync Triggers:**
- `nodes_fts_insert` - Adds to FTS on node insert
- `nodes_fts_delete` - Removes from FTS on node delete
- `nodes_fts_update` - Updates FTS on node update

---

## Search Capabilities

### 1. Full-Text Search (FTS5)

**Query Syntax:**
```typescript
db.searchText("graph AND vector", limit: 10)
// Returns BM25-ranked results with snippets
```

**Supported Operators:**
- `AND` - Both terms must match
- `OR` - Either term matches
- `NOT` - Exclude term
- `"exact phrase"` - Phrase matching
- `term*` - Prefix matching

**Example:**
```sql
SELECT id, title, snippet(nodes_fts, 2, '<mark>', '</mark>', '...', 32) as snippet
FROM nodes_fts
WHERE nodes_fts MATCH 'alpine AND (component OR state)'
ORDER BY bm25(nodes_fts)
LIMIT 10;
```

### 2. Vector Similarity Search

**Method:** Dot product (assumes normalized embeddings via FAFCAS)

```typescript
const similar = db.findSimilar(queryVector, limit: 5, domain: 'persona')
// Returns: [{ id, label, score }, ...]
```

**Performance:** O(N) scan with SIMD-optimized dot product

### 3. Graph Traversal

**Find Neighbors:**
```sql
SELECT target, type FROM edges WHERE source = ?;
```

**Find Reverse Links:**
```sql
SELECT source, type FROM edges WHERE target = ?;
```

---

## API Reference

### ResonanceDB Class

**Location:** `resonance/src/db.ts`

#### Constructor
```typescript
new ResonanceDB(dbPath?: string)
```
- Initializes database connection
- Creates schema if not exists
- Enables WAL mode

#### Methods

##### `insertNode(node: Node): void`
```typescript
db.insertNode({
    id: 'doc-001',
    type: 'document',
    label: 'My Document',
    content: 'Full text content...',
    domain: 'knowledge',
    layer: 'experience',
    embedding: Float32Array,  // Optional
    hash: 'sha256...',
    meta: { tags: ['ai', 'graph'] }
});
```

##### `insertEdge(source: string, target: string, type: string): void`
```typescript
db.insertEdge('doc-001', 'concept-042', 'mentions');
```

##### `searchText(query: string, limit: number): SearchResult[]`
```typescript
const results = db.searchText('alpine component', 5);
// Returns: [{ id, title, snippet, rank }, ...]
```

##### `findSimilar(queryVec: Float32Array, limit: number, domain?: string): SimilarNode[]`
```typescript
const similar = db.findSimilar(embedding, 5, 'persona');
// Returns: [{ id, label, score }, ...]
```

##### `getStats(): DbStats`
```typescript
const stats = db.getStats();
// Returns: { nodes, edges, vectors, semantic_tokens }
```

##### `getNodeHash(id: string): string | null`
```typescript
const hash = db.getNodeHash('doc-001');
// Returns stored hash for delta detection
```

---

## Configuration

### Settings File
**Location:** `polyvis.settings.json`

```json
{
  "paths": {
    "database": {
      "resonance": "public/resonance.db"
    }
  }
}
```

### Import Pattern (TypeScript)
```typescript
import settings from "@/polyvis.settings.json";
import { join } from "path";

const dbPath = join(process.cwd(), settings.paths.database.resonance);
```

**CRITICAL:** Never hardcode `"public/resonance.db"`. Always import from settings.

---

## Maintenance

### Regenerating the Database

```bash
# Full rebuild (clears and rebuilds from source)
bun run scripts/pipeline/ingest.ts

# Stats check
bun run scripts/verify/validate_db.ts
```

### Adding FTS5 (One-time migration)

```bash
bun run scripts/migrations/add_fts.ts
```

**Idempotent:** Safe to run multiple times.

### Verifying Integrity

```bash
# SQLite integrity check
sqlite3 public/resonance.db 'PRAGMA integrity_check;'

# Quick stats
sqlite3 public/resonance.db 'SELECT COUNT(*) FROM nodes; SELECT COUNT(*) FROM edges;'
```

### WAL Checkpointing

**Automatic:** SQLite checkpoints WAL automatically.

**Manual:**
```bash
sqlite3 public/resonance.db 'PRAGMA wal_checkpoint(TRUNCATE);'
```

This forces all WAL data back to the main database file.

---

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Insert Node | O(log N) | B-tree insert |
| Insert Edge | O(log N) | Composite index |
| FTS Query | O(log N) | FTS5 index |
| Vector Search | O(N) | Linear scan (acceptable for N < 10k) |
| Graph Traversal | O(log N) | Index lookup |

### Optimization Notes

- **Vector Search:** Consider implementing HNSW or IVF index if N > 10,000 nodes
- **FTS5:** Already optimal (inverted index with BM25)
- **WAL Mode:** Optimized for concurrent reads

---

## Troubleshooting

### "Database is locked"
- **Cause:** Multiple writers or stale WAL lock
- **Fix:** Ensure only one writer at a time. Run `PRAGMA wal_checkpoint(TRUNCATE);`

### "FTS search returns empty results"
- **Cause:** FTS5 not initialized
- **Fix:** Run `bun run scripts/migrations/add_fts.ts`

### "Table nodes has no column named X"
- **Cause:** Schema drift or missing migration
- **Fix:** Check schema in `resonance/src/db.ts` line 28-50

---

## Related Documentation

- [Ingestion Pipeline](../playbooks/development-workflow-playbook.md)
- [FAFCAS Protocol](../playbooks/embeddings-and-fafcas-protocol-playbook.md)
- [Schema Definition](../src/db/schema.ts)
- [Project Standards](./project-standards.md)

---

**Last Updated:** 2025-12-12  
**Schema Version:** 1.0.0  
**Migration Level:** FTS5 (2025-12-12)
