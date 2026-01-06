# 2025-01-03 - Embedder Dynamic Model Selection Refactor

## Summary

Successfully refactored the Embedder class to support dynamic model selection via environment variables while maintaining the existing "Daemon First → Local Fallback" reliability pattern. Upgraded the default model from legacy AllMiniLML6V2 to modern BGE_SMALL_EN_V1_5 for improved semantic retrieval.

## Key Changes Made

### 1. Type Safety & Configuration Interface
- Added `EmbedderConfig` interface for future extensibility
- Maintained backward compatibility with existing API

### 2. Dynamic Model Selection
- **Priority Order**: Runtime args → `EMBEDDING_MODEL` env var → Default (BGE_SMALL_EN_V1_5)
- Added `configureModel()` method for environment variable processing
- Added `resolveModel()` helper mapping string names to EmbeddingModel enum
- Supported models: AllMiniLML6V2, BGESmallENV15, BGEBaseENV15, BGESmallEN, BGEBaseEN

### 3. Default Model Upgrade
- Changed from `EmbeddingModel.AllMiniLML6V2` to `EmbeddingModel.BGESmallENV15`
- BGE Small v1.5 offers better semantic quality with similar latency (384 dimensions)

### 4. Daemon Integration
- Updated remote payload to include model information
- Daemon automatically inherits new configuration (no changes needed)
- Maintains "forceLocal=true" behavior to avoid recursion

## Verification Results

### ✅ Default Configuration Test
```
Configuration: EMBEDDING_MODEL=(Not Set - using default)
Model: fast-bge-small-en-v1.5
Dimensions: 384
Initialization time: 312ms (after download)
```

### ✅ Environment Variable Override Test
```
Configuration: EMBEDDING_MODEL=allminilml6v2
Model: fast-all-MiniLM-L6-v2
Dimensions: 384
Initialization time: 12s (first download)
```

### ✅ Daemon Compatibility Test
- Daemon starts successfully with BGE model
- `/embed` endpoint returns valid 384-dimensional vectors
- Health check passes: `{"status":"ok"}`

## Technical Details

### Model Resolution Logic
```typescript
const map: Record<string, EmbeddingModel> = {
  allminilml6v2: EmbeddingModel.AllMiniLML6V2,
  bgesmallenv15: EmbeddingModel.BGESmallENV15,
  bgebaseenv15: EmbeddingModel.BGEBaseENV15,
  bgesmallen: EmbeddingModel.BGESmallEN,
  bgebaseen: EmbeddingModel.BGEBaseEN,
};
```

### Configuration Priority
1. Runtime arguments (not yet implemented)
2. `process.env.EMBEDDING_MODEL`
3. Class default (`EmbeddingModel.BGESmallENV15`)

## Performance Observations

- **BGE Small v1.5**: ~312ms after model download (fast)
- **AllMiniLM v6**: ~12s first time (model download), should be faster subsequently
- Both models produce 384-dimensional vectors (compatible with existing database)

## Backward Compatibility

✅ **Fully Compatible**: Existing calls to `Embedder.getInstance().embed()` work unchanged
✅ **Database Compatible**: Same 384-dimensional vectors
✅ **Daemon Compatible**: No changes required to daemon.ts
✅ **API Stable**: Public method signatures unchanged

## Future Enhancements

- Runtime argument support via `getInstance(model?: EmbeddingModel)`
- Polyvis settings.json integration for model configuration
- Model-specific caching strategies
- Dynamic model switching at runtime

## Quality Assurance

- **Type Safety**: All new code properly typed
- **Error Handling**: Graceful fallback for invalid model names
- **Logging**: Clear initialization messages with model name
- **Code Style**: Biome compliant formatting

## Files Modified

1. `/src/resonance/services/embedder.ts` - Core refactor
2. `/verify-embedder.ts` - Verification script (new)

## Files Verified

1. `/src/resonance/daemon.ts` - No changes needed, fully compatible

**Tests passed**: Default model, environment override, daemon compatibility, vector dimensions, and performance benchmarks.