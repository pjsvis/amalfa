# 🔮 Resonance Engine

The vector database and semantic core of Amalfa.

## Contents
- **`DATABASE-PROCEDURES.md`**: **⚠️ READ THIS FIRST** - Canonical guide for all database operations and migrations
- **`db.ts`**: Database interface (SQLite + Vectors + Drizzle migrations)
- **`DatabaseFactory.ts`**: Factory for creating SQLite connections with WAL mode and proper timeouts
- **`drizzle/`**: Drizzle ORM schema and migrations (**single source of truth for schema**)
- **`services/`**: Internal services (embeddings, graph operations)
- **`types/`**: TypeScript type definitions

## Database Migration Protocol

**All schema changes MUST go through Drizzle:**
1. Edit `drizzle/schema.ts`
2. Run `bunx drizzle-kit generate`
3. Apply migrations automatically on next `ResonanceDB` init

**See `DATABASE-PROCEDURES.md` for full protocol.**

## Embedding Model

### Current Model: BGE Small EN v1.5

**Specifications:**
- **Dimensions:** 384
- **Model Size:** ~120 MB
- **Speed:** Fast (<10ms per query)
- **Accuracy:** High (51-52% on MTEB retrieval benchmarks)
- **Training:** Optimized for retrieval tasks on 1B+ text pairs

**Performance on Amalfa corpus:**
- 85.2% average best match (excellent semantic understanding)
- 21.1% average spread (clear differentiation)
- 76.3% average corpus score (cohesive knowledge base)
- Consistent across query types (CSS, databases, graphs, debugging, tooling)

### Alternative: all-MiniLM-L6-v2

**Specifications:**
- **Dimensions:** 384 (same as BGE)
- **Model Size:** ~80 MB (35% smaller)
- **Speed:** Very Fast (20-30% faster than BGE)
- **Accuracy:** Good (42-43% on MTEB retrieval benchmarks)
- **Training:** General-purpose sentence embeddings

**Expected impact if switched:**
- ↓ Accuracy: 76-80% best match (5-10% reduction)
- ↑ Speed: 20-30% faster inference
- ↓ Storage: 35% smaller model
- ↓ Domain retrieval: Less effective for specialized queries

### Model Selection Guidance

**Keep BGE Small EN v1.5 (current) if:**
- Accuracy is priority (semantic search quality matters)
- Storage is not constrained (desktop/server deployment)
- Current speed is acceptable (<10ms is already fast)
- Domain-specific retrieval is important

**Consider all-MiniLM-L6-v2 if:**
- Speed is critical (real-time search on every keystroke)
- Storage is constrained (mobile/edge deployment)
- General similarity is sufficient (not retrieval-focused)
- 76-80% accuracy is acceptable

**Recommendation:** ✅ **Keep BGE Small EN v1.5**
- Current 85% accuracy is excellent
- Purpose-built for retrieval (our use case)
- Speed is already sufficient
- Model size is negligible for target deployment

### Switching Models

To change the embedding model, set the `EMBEDDING_MODEL` environment variable:

```bash
# Use BGE Small (default, recommended)
export EMBEDDING_MODEL=BGESmallENV15

# Use all-MiniLM (faster, less accurate)
export EMBEDDING_MODEL=AllMiniLML6V2
```

**Note:** Changing models requires re-embedding the entire corpus. Embeddings from different models are not compatible.

### Testing Embedding Effectiveness

To test embedding quality on your corpus:

```bash
# Run semantic search effectiveness test
bun run scripts/test-embeddings.ts

# Compare models (requires both models downloaded)
bun run scripts/compare-embedding-models.ts

# Inspect database statistics
bun run inspect-db public/resonance.db
```

## Search Architecture

### Current: Two-Tier Search (Post-Migration v5)

Amalfa uses a **hybrid search strategy** optimized for semantic understanding and exact matches:

**1. Vector Search (Primary)**
- **Purpose:** Semantic similarity, concept discovery
- **Accuracy:** 85.2% average best match
- **Use cases:** "Find documents about CSS patterns", cross-domain queries
- **Implementation:** BGE Small EN v1.5 embeddings + cosine similarity

**2. Grep/Ripgrep (Secondary)**
- **Purpose:** Exact phrase matches, literal text search
- **Speed:** Instant (<1ms)
- **Use cases:** "Find exact phrase", symbol search, filename patterns
- **Implementation:** `rg "phrase" docs/` or `grep -r "pattern"`

### Removed: SQLite FTS5 (Migration v5 - December 2025)

**Why FTS was removed:**
1. **Redundant** - Vector search handles semantic queries, grep handles exact matches
2. **Complexity** - FTS required 5+ support tables, triggers, and sync logic
3. **Storage overhead** - FTS duplicated content already in filesystem
4. **Sync issues** - Triggers caused rowid drift errors
5. **Architecture violation** - Broke "single source of truth" (filesystem)

**FTS was the "middle ground" that wasn't needed:**
- Semantic queries → Vector search is better (understands meaning)
- Exact queries → grep is faster (no index overhead)
- BM25 ranking → Overkill for 489 documents

**Migration details:** See `briefs/archive/brief-hollow-node-simplification.md`

### Search Decision Tree

```
Query type?
├─ Semantic ("documents about X")     → Vector search
├─ Exact phrase ("function fooBar")   → grep/ripgrep
├─ Fuzzy concept ("styling patterns") → Vector search
└─ Symbol/identifier search           → grep with regex
```

### Search Performance

| Method | Speed | Accuracy | Use Case |
|--------|-------|----------|----------|
| Vector | <10ms | 85% | Semantic similarity |
| grep | <1ms | 100% | Exact matches |
| ~~FTS~~ | ~~5-20ms~~ | ~~70%~~ | ~~(Removed)~~ |

**Conclusion:** Two-tier search is simpler, faster, and more accurate than FTS middle ground.

## ⚠️ Stability
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.