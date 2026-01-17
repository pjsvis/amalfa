# Reranker Alternatives Brief

**Date:** 2026-01-17  
**Status:** 🔍 Research  
**Context:** BgeReranker blocked by `sharp` dependency issue

## Problem

`@xenova/transformers` (used by BgeReranker) has `sharp` as a hard dependency for image processing. This causes native module build issues on macOS ARM64:

```
Cannot find module '../build/Release/sharp-darwin-arm64v8.node'
```

**Root cause:** Xenova Transformers supports vision models, so it includes image processing even though we only need text reranking.

## Why This Matters

- **Fragile:** Native modules break across platforms/architectures
- **Unnecessary:** We don't use image models, only text reranking
- **Maintenance burden:** Must manage platform-specific builds

## Alternatives

### Option 1: Fix Sharp (Not Recommended)

**Approach:**
```bash
# Rebuild sharp for ARM64
bun pm add sharp --build-from-source
# or
npm rebuild sharp --platform=darwin --arch=arm64v8
```

**Pros:**
- Keep existing BgeReranker code
- No code changes needed

**Cons:**
- Platform-specific issues will recur
- Adds ~50MB of native binaries
- Maintenance burden
- Same issue will hit on Linux/Windows

### Option 2: Use Xenova Text-Only Fork (If Exists)

**Approach:** Check if there's a text-only build of Xenova Transformers.

**Pros:**
- Same API, less dependencies

**Cons:**
- Probably doesn't exist
- Would need to maintain ourselves

### Option 3: Pure Python/HTTP Reranking Service

**Approach:** Run separate Python service with sentence-transformers.

```python
# External service (Python)
from sentence_transformers import CrossEncoder

model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
scores = model.predict([
    (query, doc) for doc in documents
])
```

**Pros:**
- Mature ecosystem (sentence-transformers)
- Many model options
- No native module issues in Amalfa
- Can use GPU

**Cons:**
- External dependency
- Requires Python runtime
- Network latency (if HTTP)
- More complex deployment

### Option 4: Cohere/Jina Rerank API

**Approach:** Use cloud reranking API.

```typescript
// Cohere Rerank API
const response = await fetch('https://api.cohere.ai/v1/rerank', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${COHERE_API_KEY}` },
  body: JSON.stringify({
    query,
    documents,
    model: 'rerank-english-v2.0'
  })
});
```

**Pros:**
- Zero dependencies
- Always up-to-date models
- No GPU/CPU load on local machine
- Professional quality

**Cons:**
- Costs money (~$1/1000 searches)
- Requires API key
- Network latency
- Privacy concerns (sends data to cloud)

### Option 5: Keep Sonar LLM Reranking Only

**Approach:** Remove BgeReranker, rely on Sonar's LLM-based reranking.

**Pros:**
- Already working
- No new dependencies
- Understands semantic intent better
- Zero infrastructure

**Cons:**
- Slower (2-5s vs 100ms)
- Requires Ollama running
- Higher compute cost per query

### Option 6: Implement Simple Reranking

**Approach:** Use simpler relevance scoring without ML models.

```typescript
// BM25 or TF-IDF reranking
function rerankBM25(query: string, docs: string[]) {
  // Tokenize and score based on term frequency
  // Much faster than cross-encoder
}
```

**Pros:**
- No ML dependencies
- Fast (<10ms)
- Deterministic

**Cons:**
- Lower quality than ML models
- Doesn't understand semantics
- Just glorified keyword matching

## Recommendation

**Short term:** Option 5 (Sonar only)
- Remove BgeReranker code
- Document that Sonar handles reranking
- Simplify architecture

**Long term:** Option 4 (Cloud API) or Option 3 (Python service)
- If speed becomes issue, add cloud reranking
- If privacy/cost matter, run Python service
- Both avoid native dependency hell

## Why Not Fix Sharp?

Native modules are the #1 source of Node.js deployment issues:
- Platform-specific (macOS, Linux, Windows)
- Architecture-specific (x64, ARM64)
- Node version specific
- Bun vs Node differences
- Docker/container issues

**Philosophy:** Avoid native dependencies unless absolutely necessary.

## Decision Criteria

| Criterion | Sonar | Cloud API | Python | Fix Sharp |
|-----------|-------|-----------|--------|-----------|
| Speed | 2-5s | 200ms | 100ms | 100ms |
| Cost | Free | $$ | Free | Free |
| Dependencies | None | API key | Python | Native |
| Quality | High | High | High | High |
| Maintenance | Low | Low | Medium | High |
| Privacy | ✅ | ❌ | ✅ | ✅ |

**Winner:** Sonar (simplicity) or Cloud API (if speed matters)

## Implementation: Remove BgeReranker

If we choose Sonar-only approach:

1. **Remove files:**
   - `src/services/reranker.ts`
   - `src/resonance/services/reranker-daemon.ts`
   - `scripts/test-reranker.ts`

2. **Remove CLI commands:**
   - `amalfa reranker start|stop|status`

3. **Update documentation:**
   - ARCHITECTURE.md - remove reranker mention
   - WARP.md - remove reranker commands
   - README.md - explain Sonar does reranking

4. **Update service status:**
   - Remove from `amalfa servers` output

5. **Git commit:**
   ```
   refactor: remove BgeReranker due to sharp dependency issues
   
   Xenova Transformers requires sharp (image processing) which
   causes native module build issues. Sonar LLM reranking is
   sufficient for current needs. Can revisit with cloud API or
   Python service if speed becomes critical.
   ```

## Alternative: Document Sharp Fix

If we want to keep BgeReranker:

Add to WARP.md:
```markdown
## Known Issues

### BgeReranker Sharp Dependency

BgeReranker requires `sharp` native module. If you encounter build errors:

**macOS ARM64:**
```bash
bun pm remove sharp
bun pm add sharp --build-from-source
```

**Linux:**
```bash
apt-get install libvips-dev  # For sharp
bun install
```

**Docker:**
```dockerfile
RUN apt-get update && apt-get install -y libvips-dev
```
```

## Next Steps

1. **Decide:** Sonar-only vs keep BgeReranker vs alternative
2. **If remove:** Clean up code and docs
3. **If keep:** Document sharp installation
4. **If alternative:** Evaluate cloud APIs or Python service

## Related Briefs

- `briefs/2026-01-17-reranker-investigation.md` - Initial investigation
- `briefs/2026-01-17-bge-reranker-operational.md` - Operationalization plan (now blocked)
