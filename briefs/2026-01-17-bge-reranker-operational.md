# BgeReranker Operational Brief

**Date:** 2026-01-17  
**Status:** 🔧 Implementation  
**Priority:** High  
**Context:** Interrupted development - need to complete and operationalize

## Goal

Get BgeReranker working as a reliable service and integrate into ingestion/enhancement pipeline. Keep it separate from Sonar's LLM-based reranking (both have value).

## Current State

### What Exists
- ✅ `BgeReranker` class (`src/services/reranker.ts`) - cross-encoder implementation
- ✅ Reranker daemon (`src/resonance/services/reranker-daemon.ts`) - HTTP wrapper
- ✅ CLI commands (`amalfa reranker start|stop|status`)
- ❌ Not integrated into any pipeline
- ❌ No tests
- ❌ Daemon marked STALE (process exists but might not be healthy)

### What Works
```typescript
// Basic usage pattern
const reranker = await BgeReranker.getInstance();
const results = await reranker.rerank(query, documents, topK, threshold);
```

## Implementation Plan

### Phase 1: Verify BgeReranker Works (30 min)

**Goal:** Confirm the reranker service actually functions.

**Tasks:**
1. Create test script to verify BgeReranker directly
2. Test daemon HTTP endpoints
3. Check model loading and initialization
4. Verify ONNX runtime works on macOS

**Test Script:**
```typescript
// scripts/test-reranker.ts
import { BgeReranker } from "@src/services/reranker";

const query = "vector database implementation";
const docs = [
  "SQLite schema with vector columns and FAFCAS protocol",
  "React component styling with CSS modules",
  "FastEmbed integration for semantic search",
  "Authentication middleware for Express routes",
];

console.log("🔧 Testing BgeReranker...\n");
const reranker = await BgeReranker.getInstance();
console.log("✅ Model loaded\n");

const results = await reranker.rerank(query, docs);
console.log("Results:");
results.forEach((r, i) => {
  console.log(`${i + 1}. [${r.score.toFixed(3)}] ${r.text} (was #${r.originalIndex + 1})`);
});
```

**Acceptance:**
- Script runs without errors
- Model initializes
- Documents are reranked with scores
- Most relevant docs score higher

### Phase 2: Fix Daemon Reliability (30 min)

**Goal:** Make reranker daemon stable and observable.

**Issues to Fix:**
1. **STALE status** - Process exists but health check might be failing
2. **No health monitoring** - Can't tell if model is loaded
3. **No error logging** - Silent failures

**Tasks:**
1. Review daemon health check implementation
2. Add initialization logging
3. Test daemon start/stop lifecycle
4. Verify HTTP endpoints respond correctly

**Health Check Enhancement:**
```typescript
// Add to reranker-daemon.ts
app.get("/health", async (c) => {
  const modelReady = rerankerInstance !== null;
  return c.json({
    status: modelReady ? "ok" : "initializing",
    model: "Xenova/bge-reranker-base",
    port: 3011,
  });
});
```

### Phase 3: Integration Point - Where Does It Fit? (1 hour)

**Goal:** Determine where BgeReranker adds value in pipeline.

**Options:**

#### Option A: Ingestion-Time Reranking
Rerank related documents during ingestion to improve edge weights.

```typescript
// In EdgeWeaver or similar
const candidates = findSimilarDocuments(newDoc);
const reranked = await rerankerClient.rerank(newDoc.content, candidates);
// Use reranked scores for edge weights
```

**Pros:**
- One-time cost at ingestion
- Better graph structure
- Fast queries (no runtime reranking)

**Cons:**
- Slow ingestion
- Static rankings (don't adapt to query)

#### Option B: Query-Time Reranking (Before Sonar)
Fast reranking layer before expensive LLM reranking.

```typescript
// MCP search flow
1. Vector search → 100 candidates
2. BgeReranker → Top 20 (fast, cross-encoder)
3. Sonar → Top 5 (slow, LLM understanding)
4. Return results
```

**Pros:**
- Query-specific relevance
- Fast (cross-encoder faster than LLM)
- Reduces Sonar load

**Cons:**
- Runtime cost on every query
- Requires daemon to be running

#### Option C: Incremental Enhancement (Ember-like)
Background process that improves graph quality.

```typescript
// Similar to Ember scan
amalfa rerank-graph --strategy=content-similarity
// Analyzes all documents
// Proposes better edge weights
// Updates graph incrementally
```

**Pros:**
- Doesn't slow queries or ingestion
- Can run periodically
- Improves graph over time

**Cons:**
- Complex implementation
- Requires graph reprocessing

### Phase 4: Implement Integration (2 hours)

Based on chosen option, implement integration.

**Likely choice: Option B (Query-Time)**
Why: Immediate value, leverages existing infrastructure, complements Sonar.

**Implementation:**
1. Add reranker client utility
2. Integrate into MCP search flow
3. Add to CLI search commands (optional)
4. Make configurable (can disable if daemon not running)
5. Add metrics/logging

### Phase 5: Testing & Validation (1 hour)

**Tests:**
1. Unit tests for BgeReranker
2. Integration tests for daemon
3. End-to-end search with reranking
4. Performance benchmarks

**Metrics to Track:**
- Reranking latency (target: <500ms for 20 docs)
- Score distribution changes
- Position changes (how many docs move >3 ranks?)
- Search quality (subjective evaluation)

## Technical Details

### BgeReranker Architecture

**Model:** `Xenova/bge-reranker-base`
- Cross-encoder (not bi-encoder)
- Input: Query + Document pairs
- Output: Relevance scores (logits → sigmoid)
- ONNX quantized (CPU-optimized)

**How It Works:**
```
1. Tokenize pairs: [CLS] query [SEP] doc [SEP]
2. Pass through transformer
3. Extract logit scores
4. Apply sigmoid normalization
5. Sort by score
```

### Daemon Architecture

**HTTP Server:**
- Port: 3011
- Framework: Hono (same as Sonar)
- Endpoints:
  - `GET /health` - Status check
  - `POST /rerank` - Reranking request

**Request Format:**
```json
{
  "query": "string",
  "documents": ["doc1", "doc2"],
  "topK": 10,
  "threshold": 0.0
}
```

**Response:**
```json
{
  "results": [
    {"text": "doc", "score": 0.95, "originalIndex": 2}
  ]
}
```

## Success Criteria

- ✅ BgeReranker loads model successfully
- ✅ Daemon starts and responds to health checks
- ✅ Reranking produces sensible results (relevant docs score higher)
- ✅ Integration point chosen and documented
- ✅ Basic integration implemented
- ✅ Tests pass
- ✅ Performance acceptable (<500ms for typical load)

## Out of Scope

- Comparing BgeReranker vs Sonar quality (future investigation)
- Fine-tuning reranker model
- Alternative reranking models
- Reranking for graph construction (Option A)

## Dependencies

- ✅ Xenova Transformers installed
- ✅ ONNX runtime available
- ⚠️ Sufficient memory (model is ~400MB)
- ⚠️ Daemon lifecycle management working

## Related Files

**Core:**
- `src/services/reranker.ts` - BgeReranker class
- `src/resonance/services/reranker-daemon.ts` - Daemon wrapper

**Integration Points:**
- `src/mcp/index.ts` - MCP search flow (line 303)
- `src/cli/commands/search.ts` - CLI search
- `src/daemon/sonar-logic.ts` - Sonar reranking (for comparison)

**Config:**
- `amalfa.config.json` - Could add reranker config
- `src/config/defaults.ts` - Default settings

## Next Steps

1. Create test script (Phase 1)
2. Verify BgeReranker works in isolation
3. Fix daemon health checks (Phase 2)
4. Decide integration point (Phase 3)
5. Implement chosen integration (Phase 4)
6. Add tests and metrics (Phase 5)
7. Update documentation

## Notes

### BgeReranker vs Sonar

**BgeReranker (Cross-Encoder):**
- Fast (~100ms for 20 docs)
- No LLM required
- Good at relevance matching
- Can't understand complex intent

**Sonar (LLM):**
- Slow (~2-5s for 20 docs)
- Requires Ollama
- Understands intent and context
- Can explain reasoning

**Ideal:** Use both in sequence (fast filter → smart refine)

### Why Cross-Encoders Are Better Than Bi-Encoders

Current pipeline: FastEmbed (bi-encoder) for vector search.

**Bi-encoder:**
- Embed query: `E(query) → vector_q`
- Embed docs: `E(doc_i) → vector_i`
- Score: `dot(vector_q, vector_i)`
- Fast but approximate

**Cross-encoder:**
- Encode pairs: `E(query, doc_i) → score_i`
- Attention between query and doc
- Slower but more accurate

Standard RAG pipeline: Bi-encoder (retrieval) → Cross-encoder (rerank)
