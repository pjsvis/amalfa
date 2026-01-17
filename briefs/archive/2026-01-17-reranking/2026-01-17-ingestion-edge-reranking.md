# Ingestion-Time Edge Reranking Brief

**Date:** 2026-01-17  
**Status:** 📋 Planning  
**Priority:** Medium  
**Context:** Complement to search-time reranking

## Problem Statement

Current edge creation is conservative (explicit links only):
- Misses implicit semantic connections
- Graph is sparse
- `explore_links` may not find related documents
- Manual `find_gaps` needed to discover connections

## Proposed Solution

**Two-phase ingestion:**

### Phase 1: Fast Initial Ingestion (current)
```
Document → Parse → Extract links → Create edges → Store
(~10ms per document, explicit edges only)
```

### Phase 2: Incremental Enhancement (new)
```
Document → Find candidates → BGE rerank → Create semantic edges
(~100ms per document, happens async after ingestion)
```

## Key Principles

1. **Fast first:** Initial ingestion should be instant
2. **Enhance later:** Graph improvements happen in background
3. **Default on:** BGE reranking for search (already implemented)
4. **Sonar separate:** LLM-based features are opt-in, not default

## Architecture

### Ingestion Pipeline

```
NEW DOCUMENT
    ↓
┌─────────────────────────────────┐
│ Phase 1: Fast Ingestion         │
│ - Parse markdown                │
│ - Extract explicit links        │
│ - Create basic edges            │
│ - Store in database             │
│ - DONE (user can search now)    │
└─────────────────────────────────┘
    ↓ (async)
┌─────────────────────────────────┐
│ Phase 2: Enhancement (optional) │
│ - Vector search (find similar)  │
│ - BGE rerank (score relevance)  │
│ - Create semantic edges         │
│ - Weight by rerank score        │
└─────────────────────────────────┘
```

### Search Pipeline (Already Implemented)

```
QUERY
    ↓
Vector Search (bi-encoder) → Top 50
    ↓
BGE Rerank (cross-encoder) → Top 20  ← DEFAULT
    ↓
Return Results

Optional: Sonar LLM → Top 5  ← OPT-IN (separate search mode)
```

## Implementation Design

### Option A: Extend EdgeWeaver

Add semantic edge creation to existing `EdgeWeaver.ts`:

```typescript
class EdgeWeaver {
  // Current: explicit links only
  async weaveEdges(node: Node): Promise<Edge[]> {
    const explicitEdges = this.extractMarkdownLinks(node);
    return explicitEdges;
  }

  // New: semantic edges (optional)
  async weaveSemanticEdges(
    node: Node,
    options: { enabled: boolean; threshold: number }
  ): Promise<Edge[]> {
    if (!options.enabled) return [];

    // 1. Find candidate documents (vector similarity)
    const candidates = await this.vectorEngine.search(
      node.content,
      20  // candidate limit
    );

    // 2. Rerank with BGE cross-encoder
    const reranked = await this.reranker.rerank(
      node.content,
      candidates.map(c => c.content)
    );

    // 3. Create edges with weight threshold
    const edges = [];
    for (const result of reranked) {
      if (result.score >= options.threshold) {
        edges.push({
          source: node.id,
          target: result.id,
          type: "semantic-similar",
          weight: result.score,
          metadata: { method: "bge-rerank" }
        });
      }
    }

    return edges;
  }
}
```

### Option B: Separate Enhancement Service

Create `EnhancementService` that runs after ingestion:

```typescript
class EnhancementService {
  async enhanceNode(nodeId: string) {
    // 1. Get node content
    const node = db.getNode(nodeId);
    const content = await gardener.getContent(nodeId);

    // 2. Find and rerank candidates
    const semanticEdges = await this.findSemanticEdges(
      nodeId,
      content
    );

    // 3. Store edges
    for (const edge of semanticEdges) {
      db.createEdge(edge);
    }
  }

  async enhanceAll(options: { batchSize: number }) {
    const nodes = db.getAllNodes();
    for (const node of nodes) {
      await this.enhanceNode(node.id);
      // Rate limit to avoid overload
      await sleep(100);
    }
  }
}
```

**Recommendation:** Option B (separate service)
- Cleaner separation of concerns
- Can run independently
- Easier to make optional
- Can batch process existing nodes

### Configuration

```json
// amalfa.config.json
{
  "ingestion": {
    "enhance_edges": true,
    "enhancement": {
      "threshold": 0.6,
      "max_edges_per_node": 10,
      "run_async": true
    }
  },
  "search": {
    "reranking": {
      "enabled": true,
      "method": "bge"  // "bge" | "sonar" | "both"
    }
  }
}
```

## Edge Types and Weights

### Edge Types

1. **Explicit edges** (Phase 1 - always created)
   - `references` - `[[wikilink]]` in markdown
   - `depends_on` - from frontmatter
   - `implements` - from frontmatter
   - Weight: 1.0 (explicit = high confidence)

2. **Semantic edges** (Phase 2 - optional)
   - `semantic-strong` - rerank score > 0.7
   - `semantic-medium` - rerank score 0.5-0.7
   - `semantic-weak` - rerank score 0.4-0.5
   - Weight: actual rerank score

### Hairball Prevention

**Strategy 1: Score threshold**
```typescript
if (score < 0.4) continue; // No edge
```

**Strategy 2: Top-K limit**
```typescript
const topEdges = reranked
  .filter(r => r.score >= 0.4)
  .slice(0, 10); // Max 10 semantic edges per node
```

**Strategy 3: Asymmetric edges**
```typescript
// A → B (0.8) doesn't automatically create B → A
// Must rerank from B's perspective separately
```

**Strategy 4: Prune weak edges periodically**
```typescript
// Remove semantic edges with score < 0.5 that are rarely traversed
amalfa enhance --prune-weak-edges
```

## Performance Considerations

### Ingestion Time Impact

**Current (Phase 1 only):**
- 100 documents × 10ms = 1 second

**With Phase 2 (async):**
- Phase 1: 100 documents × 10ms = 1 second (same)
- Phase 2: 100 documents × 100ms = 10 seconds (background)
- **User sees:** 1 second (no change)

### Storage Impact

**Explicit edges only:**
- Average: 3 edges per document
- 1000 docs = 3000 edges

**With semantic edges:**
- Average: 3 explicit + 7 semantic = 10 edges per document
- 1000 docs = 10,000 edges
- **Storage:** Minimal (edges are lightweight)

### Query Performance

**Benefit:** Better `explore_links` results
**Cost:** Slightly more edges to traverse (still manageable with top-K)

## Implementation Phases

### Phase 1: Infrastructure (1-2 hours)
- [x] HfBgeReranker working (done)
- [x] Reranker client utility (done)
- [ ] EnhancementService class
- [ ] Configuration schema

### Phase 2: Integration (2-3 hours)
- [ ] Hook into ingestion pipeline
- [ ] Make async/optional
- [ ] Add to file watcher daemon
- [ ] CLI command: `amalfa enhance --edges`

### Phase 3: Testing (1 hour)
- [ ] Test on small corpus
- [ ] Measure quality improvement
- [ ] Verify no hairball
- [ ] Performance benchmarks

### Phase 4: Batch Enhancement (1 hour)
- [ ] Command to enhance existing nodes
- [ ] Progress tracking
- [ ] Rate limiting
- [ ] Resume capability

## Success Criteria

- ✅ Fast ingestion (<10ms per doc) unchanged
- ✅ Semantic edges improve `explore_links` quality
- ✅ No graph hairball (configurable limits work)
- ✅ Async enhancement doesn't block ingestion
- ✅ Can disable if not needed

## Decision: Search Strategy

### Default Search (Production)
```
Vector Search → BGE Rerank → Return
(~50ms overhead, always enabled)
```

### Sonar Search (Separate Mode)
```
Vector Search → BGE Rerank → Sonar LLM → Return
(~2-5s overhead, opt-in via flag or separate endpoint)
```

**Reasoning:**
- BGE reranking has clear value (3x quality improvement)
- ~50ms overhead is acceptable for all searches
- Sonar 2-5s overhead too expensive for default
- Sonar better as separate "deep search" mode

## CLI Interface

```bash
# Default search (with BGE reranking)
amalfa search "query"

# Deep search (with Sonar LLM)
amalfa search "query" --deep
# or separate command:
amalfa sonar-search "query"

# Enhance edges (ingestion-time reranking)
amalfa enhance --edges               # Enhance all nodes
amalfa enhance --edges --node <id>   # Enhance specific node
amalfa enhance --edges --recent      # Only recently added nodes
```

## MCP Interface

```typescript
// Default: BGE reranking always on
search_documents(query, limit) → results with BGE reranking

// Optional: Sonar deep search as separate tool
sonar_search(query, limit) → results with Sonar LLM
```

## Next Steps

1. Document current implementation (search-time reranking done)
2. Create EnhancementService for edge reranking
3. Add configuration options
4. Test on sample corpus
5. Measure impact on graph quality
6. Deploy if beneficial

## Related Work

- `src/services/reranker-hf.ts` - BGE reranker (done)
- `src/utils/reranker-client.ts` - Client utility (done)
- `src/mcp/index.ts` - Search with reranking (done)
- `src/core/EdgeWeaver.ts` - Current edge creation (explicit only)
- `src/ember/` - Ember service (community detection, uses edge weights)

## References

- Search reranking debrief: `debriefs/2026-01-17-reranker-implementation-debrief.md`
- Model comparison: `briefs/2026-01-17-reranker-model-comparison.md`
