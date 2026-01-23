# Technical Specification: Ollama Support for LangExtract Sidecar

## Task Classification

**Difficulty: Medium**

- Requires adding a new LLM provider abstraction layer
- Multiple configuration scenarios (local/remote)
- Authentication and connection management
- Backward compatibility with existing Gemini implementation
- Testing across different deployment modes

---

## Technical Context

**Language**: Python 3.13+
**Dependencies**: 
- Current: `google-generativeai`, `mcp[cli]`
- New: `ollama` (official Python SDK) or `requests` for custom HTTP handling

**Existing Architecture**:
- LangExtract sidecar at `src/sidecars/lang-extract/`
- MCP server implementation in `server.py`
- Single tool: `extract_graph(text: str)` using Gemini
- TypeScript client: `LangExtractClient.ts`
- Configuration via environment variables

---

## Implementation Approach

### 1. Provider Abstraction

Create a provider pattern to support multiple LLM backends:

```
src/sidecars/lang-extract/
  ├── server.py           # MCP server (updated)
  ├── providers/
  │   ├── __init__.py
  │   ├── base.py         # Abstract provider interface
  │   ├── gemini.py       # Existing Gemini implementation
  │   └── ollama.py       # New Ollama implementation
  ├── pyproject.toml      # Updated dependencies
  └── README.md           # Updated documentation
```

### 2. Ollama Provider Features

**Connection Modes:**
1. **Local** (default): `http://localhost:11434`
2. **Remote**: Custom URL with optional authentication

**Configuration Parameters:**
- `model_id`: Ollama model name (e.g., "gemma2:2b", "llama3:8b")
- `model_url`: Base URL (default: "http://localhost:11434")
- `api_key`: Optional authentication token
- `auth_header`: Header name (default: "Authorization")
- `auth_scheme`: Auth scheme (default: "Bearer")
- `timeout`: Request timeout in seconds (default: 300)

**Safety Features:**
- Warning when using `api_key` with `localhost` (unusual configuration)
- Graceful fallback if Ollama is unavailable
- Clear error messages for connection failures

### 3. Configuration Strategy

**Environment Variables:**
```bash
# Provider selection
LANGEXTRACT_PROVIDER=ollama|gemini  # Default: gemini (backward compatible)

# Gemini (existing)
GEMINI_API_KEY=...

# Ollama
OLLAMA_MODEL=gemma2:2b              # Required for ollama provider
OLLAMA_URL=http://localhost:11434   # Optional (default shown)
OLLAMA_API_KEY=...                  # Optional (for remote instances)
OLLAMA_TIMEOUT=300                  # Optional (default shown)
```

**Provider Selection Logic:**
1. Check `LANGEXTRACT_PROVIDER` env var
2. If not set, check for `GEMINI_API_KEY` → use Gemini (backward compatible)
3. If not set, check for `OLLAMA_MODEL` → use Ollama local
4. If neither, return error with setup instructions

---

## Source Code Changes

### New Files

1. **`src/sidecars/lang-extract/providers/__init__.py`**
   - Export provider registry
   - Provider factory function

2. **`src/sidecars/lang-extract/providers/base.py`**
   - Abstract base class `LanguageModelProvider`
   - Interface: `extract_graph(text: str) -> str`

3. **`src/sidecars/lang-extract/providers/gemini.py`**
   - Extract existing Gemini logic from `server.py`
   - Implement `LanguageModelProvider` interface

4. **`src/sidecars/lang-extract/providers/ollama.py`**
   - New Ollama provider implementation
   - HTTP client for Ollama API (`/api/generate` endpoint)
   - Connection validation and error handling
   - Authentication logic

### Modified Files

1. **`src/sidecars/lang-extract/server.py`**
   - Replace hardcoded Gemini logic with provider factory
   - Update `extract_graph` tool to use selected provider
   - Add provider selection and initialization logic

2. **`src/sidecars/lang-extract/pyproject.toml`**
   - Add optional dependency: `ollama` or `requests`
   - Keep existing dependencies

3. **`src/sidecars/lang-extract/README.md`**
   - Document new Ollama configuration options
   - Add examples for local and remote usage

### TypeScript Client Changes

**`src/lib/sidecar/LangExtractClient.ts`** (optional enhancement):
- Pass new environment variables to sidecar process
- Update documentation in comments

---

## Data Model / API Changes

**No changes to the MCP interface:**
- Tool name: `extract_graph` (unchanged)
- Input: `text: str` (unchanged)
- Output: JSON with `entities` and `relationships` (unchanged)

**Internal provider interface:**
```python
class LanguageModelProvider(ABC):
    @abstractmethod
    def extract_graph(self, text: str) -> str:
        """Returns JSON string with entities and relationships"""
        pass
```

---

## Verification Approach

### 1. Development Testing

```bash
# Test local Ollama
cd src/sidecars/lang-extract
export LANGEXTRACT_PROVIDER=ollama
export OLLAMA_MODEL=gemma2:2b
uv run server.py

# Test remote Ollama
export OLLAMA_URL=https://remote-server.com
export OLLAMA_API_KEY=sk-...
uv run server.py

# Test Gemini (backward compatibility)
unset LANGEXTRACT_PROVIDER
export GEMINI_API_KEY=...
uv run server.py
```

### 2. Integration Testing

Create test script `scripts/test-langextract-ollama.ts`:
```typescript
import { LangExtractClient } from "@src/lib/sidecar/LangExtractClient";

// Test with Ollama provider
process.env.LANGEXTRACT_PROVIDER = "ollama";
process.env.OLLAMA_MODEL = "gemma2:2b";

const client = new LangExtractClient();
const result = await client.extractEntities("Test text about Neo4j and Cypher.");
console.log("Entities:", result?.entities);
```

### 3. Validation Checklist

- [ ] Local Ollama connection works
- [ ] Remote Ollama with API key works
- [ ] Gemini still works (backward compatibility)
- [ ] Clear error messages when provider unavailable
- [ ] Warning shown for localhost + API key
- [ ] TypeScript client receives valid JSON
- [ ] Zod schema validation passes
- [ ] No breaking changes to existing users

### 4. Lint and Type Check

**Python:**
```bash
cd src/sidecars/lang-extract
uv run ruff check .
uv run mypy . --ignore-missing-imports
```

**TypeScript:**
```bash
bun run typecheck  # If project has this script
biome check src/lib/sidecar/LangExtractClient.ts
```

---

## Migration Strategy

**Backward Compatibility:**
- Default provider remains Gemini (no breaking changes)
- Existing users continue to use `GEMINI_API_KEY` without modifications
- New Ollama support is opt-in via `LANGEXTRACT_PROVIDER=ollama`

**Documentation Updates:**
1. Update `playbooks/lang-extract-playbook.md` with Ollama examples
2. Update `src/sidecars/lang-extract/README.md` with configuration options
3. Add troubleshooting section for Ollama connectivity

---

## Risk Assessment

**Low Risk:**
- Provider abstraction is internal implementation detail
- No changes to MCP tool interface
- Backward compatible by default

**Potential Issues:**
1. Ollama API differences vs Gemini (prompt formatting)
2. Model quality variance (different extraction quality)
3. Network connectivity issues for remote Ollama

**Mitigation:**
- Comprehensive testing with multiple models
- Clear error messages and fallback behavior
- Document model recommendations in playbook

---

## Success Criteria

- [ ] Users can use local Ollama models for entity extraction
- [ ] Users can connect to remote/cloud Ollama instances
- [ ] Existing Gemini users unaffected
- [ ] Documentation clearly explains configuration options
- [ ] All tests pass (local and remote scenarios)
- [ ] Code follows project patterns (biome, Zod validation)
