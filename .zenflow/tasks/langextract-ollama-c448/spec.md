# Technical Specification: LangExtract-Ollama

**Complexity**: Medium
**Date**: 2026-01-23

## Context

The LangExtract sidecar currently relies on Google's Gemini API for entity extraction. This requires:
- API key management (GEMINI_API_KEY)
- Network connectivity
- Rate limits on free tier (15 requests/min)
- ~6s latency per request

The project already uses Ollama for the Sonar service (local inference at `localhost:11434`), demonstrating local LLM capability.

## Objective

Add Ollama as an alternative backend for the LangExtract sidecar, enabling:
- **Local-first operation**: No API keys or internet required
- **Cost reduction**: Zero per-request costs
- **Privacy**: Data never leaves the machine
- **Configuration flexibility**: Choose between Gemini (cloud) and Ollama (local)

## Technical Context

**Languages**: Python 3.13+ (sidecar), TypeScript (client)
**Existing Dependencies**:
- Python: `google-generativeai>=0.8.6`, `mcp[cli]>=1.25.0`
- Current Ollama config: `localhost:11434`, model `qwen2.5:1.5b`

**Architecture**:
```
TypeScript Client (Bun)
    ↓ StdioClientTransport
Python Server (uv)
    ↓ HTTP/API
Gemini API OR Ollama (localhost:11434)
```

## Implementation Approach

### 1. Configuration Extension

Add to `amalfa.config.json`:
```json
{
  "langExtract": {
    "provider": "ollama",  // "ollama" | "gemini"
    "ollama": {
      "host": "localhost:11434",
      "model": "qwen2.5:1.5b",
      "timeout": 30000
    },
    "gemini": {
      "model": "gemini-flash-latest"
    }
  }
}
```

**Rationale**: Reuse existing Ollama infrastructure, allow per-service model selection.

### 2. Python Sidecar Changes

**File**: `src/sidecars/lang-extract/server.py`

- Add `ollama` Python package dependency to `pyproject.toml`
- Implement provider abstraction:
  ```python
  def extract_with_gemini(text: str, model: str) -> str
  def extract_with_ollama(text: str, host: str, model: str) -> str
  def extract_graph(text: str) -> str  # Router based on config
  ```
- Pass config from TypeScript via environment variables:
  - `LANGEXTRACT_PROVIDER` (ollama/gemini)
  - `LANGEXTRACT_OLLAMA_HOST`
  - `LANGEXTRACT_OLLAMA_MODEL`
  - `GEMINI_API_KEY` (existing, optional)

**Prompt Engineering**: Ensure Ollama prompt format matches Gemini's output structure (JSON with entities/relationships).

### 3. TypeScript Client Changes

**File**: `src/lib/sidecar/LangExtractClient.ts`

- Read config from `amalfa.config.json`
- Pass provider configuration via environment variables in `StdioClientTransport`
- No changes to public API (`extractEntities()` signature unchanged)

### 4. CLI Command Update

**File**: CLI command for setup (likely `src/cli.ts` or similar)

- Update `amalfa setup-python` to:
  - Install `ollama` package via `uv add ollama`
  - Check if Ollama is running (HTTP ping to configured host)
  - Suggest pulling required model if not present

## File Changes

### New Files
None (all changes to existing files)

### Modified Files

1. **`amalfa.config.json`** (or `amalfa.config.example.json`)
   - Add `langExtract` section with provider config

2. **`src/sidecars/lang-extract/pyproject.toml`**
   - Add `ollama>=0.4.5` to dependencies

3. **`src/sidecars/lang-extract/server.py`**
   - Add `extract_with_ollama()` function
   - Add `extract_with_gemini()` refactor (extract existing logic)
   - Add provider routing logic
   - Add config validation

4. **`src/lib/sidecar/LangExtractClient.ts`**
   - Import config reader
   - Pass langExtract config to sidecar via env vars

5. **`playbooks/lang-extract-playbook.md`**
   - Document Ollama setup steps
   - Document configuration options

6. **`src/sidecars/lang-extract/README.md`**
   - Update requirements section
   - Add Ollama configuration examples

## Data Model / Interface Changes

### Configuration Schema
```typescript
interface LangExtractConfig {
  provider: "ollama" | "gemini";
  ollama?: {
    host: string;
    model: string;
    timeout: number;
  };
  gemini?: {
    model: string;
  };
}
```

### No changes to:
- Python MCP tool interface (`extract_graph(text: str) -> str`)
- TypeScript client public API (`extractEntities(text: string) -> ExtractedGraph`)
- JSON response format (entities/relationships schema)

## Verification Approach

### Unit Tests
- Modify existing sidecar test to support both providers
- Add test: "LangExtract with Ollama provider"
- Add test: "LangExtract with Gemini provider"
- Add test: "Config validation (missing provider)"

### Integration Tests
1. **Ollama Availability Check**
   ```bash
   curl http://localhost:11434/api/tags | jq '.models[] | select(.name=="qwen2.5:1.5b")'
   ```

2. **End-to-End Extraction**
   ```typescript
   const client = new LangExtractClient();
   const result = await client.extractEntities("TypeScript is a programming language.");
   assert(result.entities.length > 0);
   ```

3. **Provider Switching**
   - Change config from `ollama` to `gemini`
   - Verify requests route to correct backend

### Manual Verification
- Run `amalfa setup-python` and verify Ollama package installs
- Test with Ollama running locally
- Test with Ollama not running (graceful error)
- Test with no API key (Ollama should work, Gemini should error)

### Performance Benchmark
Compare latency:
- Gemini API: ~6s (baseline)
- Ollama local: Target <10s (acceptable given hardware variance)

### Lint/Typecheck Commands
- TypeScript: `bun run check` (Biome)
- Python: `uv run ruff check` (if configured)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ollama model produces invalid JSON | High | Add retry logic with stricter prompt, fallback to regex |
| Local inference too slow | Medium | Document recommended models (small: qwen2.5:1.5b, larger: llama3.1:8b) |
| Users don't have Ollama installed | Low | `isAvailable()` already checks; clear error message |
| Prompt engineering differs between providers | Medium | Test both providers with same input corpus, adjust prompts |

## Success Criteria

- ✅ `provider: "ollama"` in config routes requests to Ollama
- ✅ Extraction completes without Gemini API key
- ✅ JSON output matches existing schema (passes Zod validation)
- ✅ Performance within acceptable range (<15s per request)
- ✅ Documentation updated with setup steps
- ✅ All existing tests pass (backward compatibility)
