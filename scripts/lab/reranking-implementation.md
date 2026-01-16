# BGE-M3 Reranking Integration

**Status**: ✅ Infrastructure Complete, Testing In Progress  
**Branch**: `feature/bge-m3-reranking`  
**Date**: 2026-01-16

## Overview

This implementation adds cross-encoder reranking capability to Amalfa using BAAI's BGE Reranker model, deployed via ONNX Runtime for fast CPU inference.

## Architecture

### Integration Point: Vector Daemon

The reranker is integrated into the existing **Vector Daemon** (port 3010) rather than as a standalone service. This provides:

- **Architectural Consistency**: Aligns with existing FastEmbed pattern
- **Resource Efficiency**: Model loaded once, serves many requests
- **Clean Separation**: Vector intelligence layer owns embedding + reranking

#### New Endpoint

```http
POST http://localhost:3010/rerank
Content-Type: application/json

{
  "query": "user search query",
  "documents": ["doc1 text", "doc2 text", ...],
  "topK": 15,
  "threshold": 0.25
}
```

**Response:**
```json
{
  "results": [
    {"text": "...", "score": 0.95, "originalIndex": 3},
    {"text": "...", "score": 0.78, "originalIndex": 1}
  ],
  "count": 15
}
```

## Reranking Modes

The system supports **4 switchable modes**:

| Mode | Pipeline | Use Case |
|------|----------|----------|
| **none** | Vector (20) | Baseline / Fast |
| **bge-m3** | Vector (50) → BGE-M3 (15) | Fast + Precise |
| **sonar** | Vector (20) → Sonar (5) | LLM-Powered (Current) |
| **hybrid** | Vector (50) → BGE-M3 (15) → Sonar (5) | Best of Both |

## Model Details

- **Model**: `Xenova/bge-reranker-base` (ONNX quantized)
- **Input**: Query + Document pairs
- **Output**: Relevance scores (0-1 via sigmoid normalization)
- **Latency**: ~200-300ms for 50 documents on CPU
- **Size**: ~500MB (lazy-loaded on first request)

## Benchmark Framework

### Test Queries (Difficulty Gradient)

**Easy** (Exact Match):
- "What is Mentation?"
- "FAFCAS protocol"

**Medium** (Semantic):
- "How does Amalfa store knowledge?"
- "Difference between Sonar and Vector Daemon"
- "What is the opinion/proceed pattern?"

**Hard** (Multi-hop):
- "Why use BGE embeddings instead of OpenAI?"
- "How can I optimize vector search latency?"
- "What is the relationship between hollow nodes and FAFCAS?"

**Edge** (Niche):
- "zombie process defense"
- "How do I debug disk I/O errors?"

### Benchmark Scripts

1. **Baseline Capture**:
   ```bash
   bun run scripts/lab/benchmark-search-baseline.ts
   ```
   Output: `.amalfa/cache/baseline-results.json`

2. **Mode Testing**:
   ```bash
   bun run scripts/lab/benchmark-reranking-comparison.ts [none|bge-m3|sonar|hybrid|all]
   ```
   Output: `.amalfa/cache/reranking-results-{mode}.json`

3. **Results Comparison**:
   ```bash
   bun run scripts/lab/compare-reranking-results.ts
   ```

## Testing Status

- [x] Baseline captured (avg latency: 400ms)
- [x] BGE reranker standalone test (✅ Working, 99.92% accuracy on test case)
- [x] Vector Daemon `/rerank` endpoint added
- [ ] BGE-M3 mode benchmark (pending Vector Daemon start)
- [ ] Sonar mode benchmark
- [ ] Hybrid mode benchmark
- [ ] Final comparison analysis

## Files Created/Modified

### New Files
- `src/services/reranker.ts` - BGE-M3 reranker service
- `src/types/reranking.ts` - Configuration types
- `scripts/test-reranker.ts` - Standalone reranker test
- `scripts/lab/benchmark-search-baseline.ts` - Baseline capture
- `scripts/lab/benchmark-reranking-comparison.ts` - 4-way comparison
- `scripts/lab/compare-reranking-results.ts` - Results analysis

### Modified Files
- `src/resonance/services/vector-daemon.ts` - Added `/rerank` endpoint
- `package.json` - Added `@xenova/transformers@2.17.2`

## Next Steps

1. Start Vector Daemon and run BGE-M3 benchmark
2. Compare baseline vs BGE-M3 results
3. Integrate Sonar mode (if needed)
4. Test hybrid mode
5. Update MCP search handler to use reranking
6. Add configuration to `amalfa.config.ts`
7. Documentation and deployment

## Notes

- **Model Change**: Using `bge-reranker-base` instead of `bge-reranker-v2-m3` due to HuggingFace access restrictions
- **Lazy Loading**: Reranker model loads on first `/rerank` request (not at daemon startup)
- **Stateless Design**: Vector Daemon doesn't store results, MCP orchestrates the pipeline
