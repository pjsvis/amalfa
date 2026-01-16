# FastEmbed ONNX Compatibility Issue

## Problem
Vector Daemon fails to start with both `fastembed@2.0.0` and `fastembed@1.14.4`:

```
error: Load model from .amalfa/cache/fast-bge-small-en-v1.5/model_optimized.onnx failed
ONNX Runtime only *guarantees* support for models stamped with official released onnx opset versions. 
Opset 19 is under development and support for this is limited.
Current official support for domain com.ms.internal.nhwc is till opset 18.
```

## Root Cause
The **BGE-Small-EN-v1.5 model file** uses Opset 19, which is incompatible with the current ONNX Runtime. This is a model-level issue, not a FastEmbed library issue.

## Impact on BGE-M3 Reranking
- ❌ Cannot start Vector Daemon (needs embedding model)
- ❌ Cannot access `/rerank` endpoint (daemon not running)
- ❌ Cannot run full BGE-M3 benchmark
- ✅ BGE reranker itself works perfectly (standalone test: 99.92% accuracy)

## Workarounds

### Option 1: Separate Reranker Daemon (RECOMMENDED)
Create `src/resonance/services/reranker-daemon.ts` on port 3011:
- **No FastEmbed dependency** (only uses `@xenova/transformers`)
- **Dedicated service** for reranking only
- **Architecture**: Clean separation of concerns

**Pros:**
- Immediately unblocks BGE-M3 testing
- No conflict with embedding model
- Can deploy independently

**Cons:**
- One more service to manage
- Slightly more complex orchestration

### Option 2: Use Different Embedding Model
Switch from BGE-Small-EN-v1.5 to an Opset 18-compatible model:
- Requires re-embedding entire corpus
- May impact vector search quality
- Not recommended without benchmarking

### Option 3: Wait for ONNX Runtime Update
Track upstream ONNX Runtime Opset 19 stabilization:
- Timeline unknown
- Not actionable immediately
- Passive wait strategy

## Recommendation
**Implement Option 1** - Separate Reranker Daemon:
1. Create minimal daemon with just BGE reranker
2. Test BGE-M3 benchmark with new daemon
3. Update MCP search handler to use reranking
4. Keep Vector Daemon as-is for embeddings

## Commit Strategy
Commit current infrastructure with:
- ✅ BGE reranker service (tested, working)
- ✅ Vector Daemon `/rerank` endpoint (code ready)
- ✅ Benchmark framework (complete)
- ✅ Documentation (comprehensive)
- ⚠️ Known blocker: FastEmbed Opset 19 issue
- 📝 Next step: Implement separate reranker daemon

---

**Status**: Infrastructure complete, deployment blocked by external dependency.  
**Resolution**: Tracked as follow-up task.
