# LangExtract Sidecar Playbook

## Overview
The **LangExtract Sidecar** (Source: `src/sidecars/lang-extract`) allows Amalfa to leverage Python-based LLM libraries (like Google's LangExtract or direct Gemini calls) from within the Bun/TypeScript environment. It follows the **Sidecar Pattern** using the Model Context Protocol (MCP) over Stdio.

## Model Recommendations

### Top-Tier Models (Production Quality)

#### 1. **Google Gemini Models** (Recommended)
- **`google/gemini-2.5-flash`** (via OpenRouter)
  - Optimized for fast, accurate extraction tasks
  - Supports fenced output (required for LangExtract)
  - Long-context processing and structured schema constraints
  - Best for quick-start and general document extraction
  - **Cost:** Low (~$0.00001 per request)

- **`google/gemini-2.5-pro-exp-03-25:free`** (via OpenRouter)
  - 1M token context, recursive reasoning
  - Strong multimodal support
  - Best for complex, multi-pass extraction from long documents
  - **Cost:** Free tier available

- **`google/gemini-2.5-flash-lite`** (via OpenRouter)
  - Low-cost variant of flash
  - Good balance of speed and quality
  - **Test Results:** 100% success rate, 3x more entities than alternatives
  - **Cost:** Very low (~$0.000004 per request)

**Why Gemini Models Excel:**
- Native schema enforcement via `response_schema` and `response_mime_type=application/json`
- 97% schema adherence and 99% valid JSON syntax
- Controlled generation for high consistency
- Optimized for long-context & multi-pass extraction

#### 2. **OpenAI GPT Models**
- **`gpt-4o`** / **`gpt-4o-mini`**
  - JSON schema enforcement via function calling
  - High accuracy in structured extraction
  - Outperforms open models on complex tasks
  - **Cost:** Higher than Gemini alternatives
  - **Note:** Requires `fence_output=True` and proper API setup

#### 3. **Anthropic Claude**
- **`claude-3-5-haiku`** / **`claude-3-5-sonnet`**
  - Strong reasoning and structured output capabilities
  - Good balance of speed and accuracy
  - Excellent for complex prompts
  - **Cost:** Mid-range

### Free/Low-Cost Models (Development)

#### 1. **OpenRouter Free Models**
- **`mistralai/mistral-small-3.1-24b-instruct:free`**
  - JSON function calling support
  - Efficient for multi-step reasoning
  - Balanced performance

- **`deepseek/deepseek-r1-zero:free`**
  - Specialized in multi-step reasoning
  - Excellent for technical/research documents

- **`nousresearch/deephermes-3-llama-3-8b-preview:free`**
  - Fine-tuned for instruction following
  - Reliable, repeatable extraction with minimal hallucination

#### 2. **Ollama Local Models**
- **`nemotron-3-nano:30b-cloud`** (via Ollama)
  - Free, fast (~2-4s latency)
  - Good quality for most tasks
  - **Test Results:** 50% success rate, occasional JSON parsing issues
  - **Best For:** Development, offline scenarios

- **`gemma2:2b`** / **`llama3.1`** / **`mistral`**
  - Run locally via Ollama
  - Data privacy and no API costs
  - May require disabling `use_schema_constraints` and `fence_output`
  - **Note:** Slower and less accurate than cloud models

#### 3. **Hugging Face Open Models**
- **`openai/gpt-oss-120b`** / **`mistralai/mixtral-8x7b`**
  - Open-weight models with structured output support
  - Accessible via Hugging Face's OpenAI-compatible API
  - Requires `HF_TOKEN` and proper routing

### Model Selection Guide

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| **Production Quality** | `google/gemini-2.5-flash` | Best balance of speed, quality, and cost |
| **Complex Extraction** | `google/gemini-2.5-pro-exp-03-25:free` | 1M token context, recursive reasoning |
| **Development/Testing** | `google/gemini-2.5-flash-lite` | Low cost, high reliability |
| **Speed Priority** | `nemotron-3-nano:30b-cloud` | Fastest, free via Ollama |
| **Privacy Critical** | Local Ollama models | Data never leaves your machine |
| **Budget Conscious** | OpenRouter free tier models | No cost, reasonable quality |

## Operations

### 1. Setup
Users must explicitly initialize the Python environment (using `uv`).

```bash
amalfa setup-python
```

_This checks for `uv` and installs dependencies defined in `src/sidecars/lang-extract/pyproject.toml`._

### 2. Configuration
The sidecar requires API keys in the environment:

**Required:**
- `GEMINI_API_KEY`: For Gemini models (direct API or OpenRouter)
- `OPENROUTER_API_KEY`: For OpenRouter models

**Optional:**
- `OPENAI_API_KEY`: For GPT models
- `ANTHROPIC_API_KEY`: For Claude models
- `HF_TOKEN`: For Hugging Face models

### 3. Usage (Programmatic)
Use the `LangExtractClient` in the TypeScript codebase:

```typescript
import { LangExtractClient } from "@src/lib/sidecar/LangExtractClient";

const client = new LangExtractClient();

// Check if sidecar is installed/ready
if (await client.isAvailable()) {
    const result = await client.extractEntities("My text content...");
    console.log(result.entities);
}
```

### 4. Modifying the Sidecar
The Python code lives in `src/sidecars/lang-extract/server.py`.
- **Dependencies:** Add new packages via `cd src/sidecars/lang-extract && uv add <package>`
- **Logic:** Update the `extract_graph` tool in `server.py`
- **Schema:** If you change the return JSON structure, update the Zod schema in `LangExtractClient.ts`

## Lessons Learned

### 1. Shell Escaping Issues
**Problem:** curl commands fail with exit code 32 (broken pipe) when JSON payloads are too long or contain special characters.

**Solution:** Write JSON payloads to temp files and use `curl -d @filename` to avoid shell escaping issues.

```typescript
function writeTempFile(content: string): string {
  const tempDir = mkdtempSync(tmpdir());
  const tempFile = resolve(tempDir, "payload.json");
  writeFileSync(tempFile, content, "utf-8");
  return tempFile;
}

// Usage
const tempFile = writeTempFile(payload);
try {
  response = await $`curl -s "https://api.example.com" -d @${tempFile}`;
} finally {
  unlinkSync(tempFile);
}
```

### 2. Free Tier Limits
**Problem:** Gemini direct API has 20 requests/day limit on free tier, making it unusable for development.

**Solution:** Use OpenRouter for Gemini models instead of direct API. OpenRouter provides better free tier limits and model variety.

**Limits to Watch:**
- Gemini direct API: 20 requests/day
- OpenRouter free tier: Model-specific, generally more generous
- Ollama: No limits (local or device key based)

### 3. Health Checks Are Essential
**Problem:** Running full test suites without verifying API connectivity wastes credits and time.

**Solution:** Always run health checks before testing:

```bash
bun run tests/langextract-comparison/health-check.ts
```

This verifies:
- API keys are set correctly
- APIs are reachable
- Models are available
- Basic functionality works

### 4. Fail Fast with Reduced Test Suites
**Problem:** Running 6 files × 3 models = 18 tests is expensive and slow when debugging.

**Solution:** Use reduced test suites for development:
- 1 TypeScript file (complex code)
- 1 Markdown file (documentation)
- This provides enough data for comparison without wasting credits

### 5. Model Quality vs. Cost Trade-offs
**Findings:**
- `google/gemini-2.5-flash-lite`: 100% success, 3x more entities/relationships
- `nemotron-3-nano:30b-cloud`: 50% success, faster but JSON parsing issues
- `gemini` direct API: Unusable due to 20 requests/day limit

**Recommendation:** Use `google/gemini-2.5-flash-lite` for production quality, `nemotron-3-nano:30b-cloud` for speed when reliability is acceptable.

### 6. Accurate Cost Tracking
**Problem:** In a multi-agent system, it's difficult to know which component is spending money.

**Solution:** Use provider-specific headers to tag requests.
- **OpenRouter:** Add `HTTP-Referer` and `X-Title` headers.
- **Result:** Costs appear in the OpenRouter dashboard split by "App" (e.g., "AMALFA Knowledge Graph").

```typescript
headers: {
  "HTTP-Referer": "https://github.com/pjsvis/amalfa",
  "X-Title": "AMALFA Knowledge Graph"
}
```

### 7. Extreme Cost Efficiency Confirmed
**Findings (Jan 29, 2026):**
- **Model:** `google/gemini-2.5-flash-lite`
- **Workload:** 7 full source files (TS/MD)
- **Total Cost:** ~$0.007 USD
- **Efficiency:** ~1,000 files for $1.00 USD
- **Conclusion:** High-quality extraction is now negligible in cost. We can scale this aggressively without fear of budget blowouts.

### 8. JSON Parsing Issues
**Problem:** Some models return malformed JSON that fails to parse.

**Solution:** Implement robust error handling and retry logic:

```typescript
try {
  parsedContent = JSON.parse(contentStr);
} catch (parseError) {
  // Log the actual content that failed to parse
  console.log(`JSON parse error: ${parseError}`);
  console.log(`Content that failed: ${contentStr.substring(0, 500)}`);
  return {
    success: false,
    error: `JSON parse error: ${parseError}`,
  };
}
```

## Best Practices

### 1. Always Use Temp Files for JSON Payloads
Never pass JSON payloads inline to curl. Write to temp files first to avoid shell escaping issues.

### 2. Run Health Checks Before Tests
Verify API connectivity before running expensive test suites.

### 3. Monitor Quota and Costs
- Track API usage in real-time
- Set up usage alerts
- Use free tiers for development
- Switch to paid tiers for production

### 4. Cache Results
Avoid redundant API calls by caching extraction results:

```typescript
const extractionCache = new Map<string, ExtractedGraph>();

async function extractWithCache(content: string): Promise<ExtractedGraph> {
  const hash = hashContent(content);
  if (extractionCache.has(hash)) {
    return extractionCache.get(hash)!;
  }
  const result = await extract(content);
  extractionCache.set(hash, result);
  return result;
}
```

### 5. Implement Retry Logic
Handle transient failures with exponential backoff:

```typescript
async function extractWithRetry(content: string, maxRetries: number = 3): Promise<ExtractedGraph> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await extractWithModel(model, content);
      if (result.success) return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
  throw new Error("Max retries exceeded");
}
```

### 6. Use Appropriate Models for the Task
- **Simple extraction:** Use smaller/faster models
- **Complex extraction:** Use larger/more capable models
- **Batch processing:** Use low-cost models
- **Production:** Use high-quality models with retry logic

### 7. Persist Results to Files
Store test results in JSONL format for easy analysis:

```typescript
const RESULTS_FILE = resolve("tests/results.jsonl");

function saveResult(result: TestResult) {
  const line = JSON.stringify(result) + "\n";
  appendFileSync(RESULTS_FILE, line);
}
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `Sidecar not detected` | `uv` not installed or `setup-python` not run | Run `amalfa setup-python` |
| `Error: GEMINI_API_KEY...` | Environment variable missing | Export the key in `.env` or shell |
| `429 Quota exceeded` | Free tier limits hit | Use OpenRouter instead of direct API, or wait |
| `404 model not found` | Model name invalid/deprecated | Check provider's model list |
| `Exit code 32` | Shell escaping issues with curl | Use temp files for JSON payloads |
| `Failed to parse JSON` | Malformed JSON from model | Implement retry logic and error handling |
| `Empty response` | API error or network issue | Check API health and network connectivity |

## Testing

### Health Check
Run before any testing to verify API connectivity:

```bash
bun run tests/langextract-comparison/health-check.ts
```

### Model Comparison
Compare different models on representative files:

```bash
bun run tests/langextract-comparison/test-models.ts
```

**Note:** The test suite uses a reduced set of 2 files (1 TS, 1 MD) for faster, cheaper testing.

## Configuration Examples

### Development Configuration
```bash
# .env for development
OPENROUTER_API_KEY=sk-or-v1-...
LANGEXTRACT_PROVIDER=openrouter
LANGEXTRACT_MODEL=google/gemini-2.5-flash-lite
```

### Production Configuration
```bash
# .env for production
OPENROUTER_API_KEY=sk-or-v1-...
LANGEXTRACT_PROVIDER=openrouter
LANGEXTRACT_MODEL=google/gemini-2.5-flash
```

### Offline Configuration
```bash
# .env for offline/local use
LANGEXTRACT_PROVIDER=ollama
LANGEXTRACT_MODEL=nemotron-3-nano:30b-cloud
```

## References

- [OpenRouter Free Models](https://openrouter.ai/models)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [LangExtract Documentation](https://github.com/google/langextract)

## Version History

- **v2.0** (2026-01-29) - Added comprehensive model recommendations, lessons learned, and best practices
- **v1.0** (2026-01-20) - Initial playbook with basic setup and troubleshooting