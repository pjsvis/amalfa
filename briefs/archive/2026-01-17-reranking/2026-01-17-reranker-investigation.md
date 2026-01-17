# Reranker Investigation Brief

**Date:** 2026-01-17  
**Status:** 🔍 Investigation  
**Priority:** Medium

## Problem Statement

We have a `BgeReranker` class in `src/services/reranker.ts` that implements the BAAI/bge-reranker-v2-m3 cross-encoder. However:

1. **Is it actually being used?** The MCP search flow uses Sonar for reranking, not BgeReranker
2. **Do we need both?** Sonar does LLM-based reranking, BgeReranker does cross-encoder reranking
3. **How would we know if it's working?** No metrics, logging, or tests for reranking effectiveness

## Current State

### What Exists

**1. BgeReranker Service** (`src/services/reranker.ts`)
- Implements `Xenova/bge-reranker-base` cross-encoder
- Singleton pattern with lazy loading
- Method: `rerank(query, documents, topK, threshold)`
- Returns: Scored and sorted results

**2. Reranker Daemon** (`src/resonance/services/reranker-daemon.ts`)
- HTTP server on port 3011
- Endpoints: `/health`, `/rerank`
- Wraps BgeReranker service
- Managed via `amalfa reranker start|stop|status`

**3. Sonar Reranking** (`src/daemon/sonar-logic.ts`)
- LLM-based reranking via Ollama
- Used in MCP search flow (line 303 in `src/mcp/index.ts`)
- Analyzes relevance using natural language reasoning
- Returns `relevance_score` field

### Actual Search Flow (MCP)

```typescript
// src/mcp/index.ts (search_documents tool)
1. Vector search → candidates
2. IF Sonar available:
   a. Hydrate content
   b. sonarClient.rerankResults() ← Uses Ollama LLM
   c. Extract context with Sonar
3. Return results
```

**Key finding:** `BgeReranker` is NOT used in MCP search flow. Only Sonar reranking is used.

### Where BgeReranker MIGHT Be Used

Searched codebase:
- **Reranker daemon:** Exists as standalone HTTP service
- **Not called by MCP:** MCP only calls Sonar
- **Not called by CLI:** New CLI search commands don't use it
- **Not called by vector search:** VectorEngine returns raw results

**Conclusion:** BgeReranker appears to be unused infrastructure.

## Questions to Answer

### 1. Usage
- [ ] Is BgeReranker daemon ever started in production?
- [ ] Are there any clients calling port 3011?
- [ ] Check logs for reranker initialization

### 2. Comparison
- [ ] Sonar (LLM) vs BgeReranker (cross-encoder) - which is better?
- [ ] Speed: Cross-encoder should be faster than LLM
- [ ] Accuracy: LLM might understand intent better
- [ ] Cost: Cross-encoder is free, LLM requires Ollama

### 3. Integration
If BgeReranker is worth keeping:
- [ ] Should MCP search use it instead of/before Sonar?
- [ ] Should CLI search commands support it?
- [ ] Should it be part of the core pipeline?

### 4. Metrics
How do we measure reranking quality?
- [ ] Compare vector scores vs reranked scores
- [ ] Track position changes (did rank 5 move to rank 1?)
- [ ] User feedback / click-through rates (not available)
- [ ] Manual evaluation on test queries

## Investigation Plan

### Phase 1: Check Current Usage (15 min)

```bash
# Check if reranker daemon runs
amalfa servers

# Check logs for reranker initialization
grep -r "Reranker" ~/.amalfa/logs/

# Check if port 3011 is ever used
lsof -i :3011

# Search codebase for reranker HTTP calls
grep -r "localhost:3011" .
grep -r "3011" . --include="*.ts"
```

### Phase 2: Test BgeReranker Directly (30 min)

Create test script:
```typescript
// test-reranker.ts
import { BgeReranker } from "./src/services/reranker";

const query = "How do I implement authentication?";
const documents = [
  "OAuth 2.0 flow with JWT tokens",
  "Database schema for users table",
  "JWT token refresh patterns in Express",
  "CSS styling for login forms",
];

const reranker = await BgeReranker.getInstance();
const results = await reranker.rerank(query, documents);

console.log("Original order:", documents);
console.log("Reranked order:", results.map(r => ({
  text: r.text.slice(0, 40),
  score: r.score,
  originalIndex: r.originalIndex
})));
```

Expected: Should reorder documents with most relevant first.

### Phase 3: Compare Sonar vs BgeReranker (1 hour)

Test same query with both:
1. Run query through vector search
2. Rerank with BgeReranker (cross-encoder)
3. Rerank with Sonar (LLM)
4. Compare:
   - Speed (ms)
   - Ranking changes
   - Subjective quality

### Phase 4: Decide & Document (30 min)

Options:
1. **Remove BgeReranker** - If unused and Sonar is better
2. **Integrate BgeReranker** - If faster/better than Sonar
3. **Hybrid approach** - BgeReranker first (fast), then Sonar (smart)
4. **Make optional** - Let users choose via config

## Success Criteria

After investigation, we should know:
- ✅ Whether BgeReranker is currently used anywhere
- ✅ Performance comparison: Sonar vs BgeReranker
- ✅ Quality comparison: Which produces better rankings
- ✅ Decision: Keep, remove, or integrate BgeReranker
- ✅ Documentation: Update architecture docs with findings

## Potential Outcomes

### Outcome A: BgeReranker is Better
**Action:**
- Integrate into MCP search (before or instead of Sonar)
- Add to CLI search commands
- Document when to use which reranker
- Add metrics/logging

### Outcome B: Sonar is Better
**Action:**
- Remove BgeReranker code
- Remove reranker daemon
- Simplify architecture
- Update documentation

### Outcome C: Both Have Value
**Action:**
- Hybrid pipeline: BgeReranker (fast) → Sonar (smart)
- Make reranker configurable
- Document trade-offs
- Add benchmarks

## Notes

### Cross-Encoder vs Bi-Encoder
- **Bi-encoder (FastEmbed):** Separate embeddings for query and documents. Fast but less accurate.
- **Cross-encoder (BgeReranker):** Joint encoding of query+document pairs. Slower but more accurate.
- **LLM (Sonar):** Natural language reasoning. Slowest but understands intent.

Typical pipeline: Bi-encoder (retrieve) → Cross-encoder (rerank) → LLM (refine)

### Model Details
- BgeReranker uses: `Xenova/bge-reranker-base` (quantized ONNX)
- Should be fast enough for <100 documents
- CPU-optimized

## Related Files
- `src/services/reranker.ts` - BgeReranker implementation
- `src/resonance/services/reranker-daemon.ts` - HTTP daemon
- `src/daemon/sonar-logic.ts` - Sonar reranking (line 223)
- `src/mcp/index.ts` - MCP search flow (line 303)
- `src/utils/sonar-client.ts` - Sonar client (line 153)

## Next Steps

1. Run Phase 1 investigation commands
2. Document findings
3. Create debrief with recommendation
4. Implement decision (remove/integrate/document)
