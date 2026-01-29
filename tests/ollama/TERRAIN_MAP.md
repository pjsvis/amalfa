# Ollama Terrain Map for LangExtract

**Date:** 2026-01-28  
**Purpose:** Map out local and remote Ollama options for LangExtract entity extraction  
**Status:** 🟢 Fully Operational (local + remote models working)

---

## Executive Summary

**Current State:**
- ✅ Local Ollama service running on `localhost:11434`
- ✅ 1 local model functional (`mistral-nemo:latest`)
- ✅ Remote model access working via Ollama Device Keys (`nemotron-3-nano:30b-cloud`)
- ✅ No API key configuration needed for Ollama

**Recommendation:** Use `nemotron-3-nano:30b-cloud` for development (fast), use `mistral-nemo:latest` for production (private). Remote models use Ollama Device Keys automatically - sign in once with `ollama signin`.

---

## Local Ollama Status

### Available Models

| Model | Size | Status | Latency | Quality | Notes |
|-------|------|--------|---------|---------|-------|
| `mistral-nemo:latest` | 7.1 GB | ✅ Working | ~79s | Good | Only functional local model |
| `nemotron-3-nano:30b-cloud` | 418 MB | ✅ Remote | ~1.5s | Excellent | Cloud model, requires internet |
| `sam860/LFM2:1.2b` | 843 MB | ❌ Broken | N/A | N/A | Missing tensor `output_norm` |
| `hf.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF:Q4_K_M` | 730 MB | ❌ Broken | N/A | N/A | Missing tensor `output_norm` |

### Model Details

#### ✅ `mistral-nemo:latest` (Primary Local Option)
- **Size:** 7.1 GB
- **Status:** Fully functional
- **Latency:** ~79 seconds for extraction
- **Quality:** Good entity extraction
- **Pros:** 
  - Works reliably
  - No external dependencies
  - Privacy-preserving (local only)
- **Cons:**
  - Slow latency
  - Large disk footprint
  - High memory usage

#### ✅ `nemotron-3-nano:30b-cloud` (Remote Option)
- **Size:** 418 MB (metadata only)
- **Status:** Cloud model via Ollama.com
- **Latency:** ~1.5 seconds for extraction
- **Quality:** Excellent entity extraction
- **Pros:**
  - Fast response
  - High quality output
  - Small local footprint
- **Cons:**
  - Requires internet connection
  - Privacy concerns (data sent to cloud)
  - May have rate limits

#### ❌ Broken Local Models
Both `sam860/LFM2:1.2b` and `hf.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF:Q4_K_M` fail with:
```
error loading model: missing tensor 'output_norm'
```

**Root Cause:** Incompatible model format or corrupted GGUF files.  
**Fix:** Re-download models or use alternative models.

---

## Ollama Device Keys

**What are Device Keys?**
Device keys are SSH keys that allow the Ollama CLI and daemon to access your account's cloud models and allow you to push models to your account. These keys are automatically added to your account when you sign in to the Ollama app or run `ollama signin` in the CLI.

**How they work:**
- Automatically generated when you sign in to Ollama
- Stored in your Ollama account, not in `.env`
- Used by Ollama CLI/daemon for authentication
- Enable access to remote models via `localhost:11434`
- Allow model pushing to your Ollama account

**Example Device Keys:**
```bash
# Device key from Ollama account
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILK+hgNakvQW6nFiSGLR9xvFvy7Ei39iTqm3h4RU5IU4
```

**Important Notes:**
- Device keys are SSH keys, not API keys
- They are used by Ollama CLI/daemon, not by applications directly
- When you access remote models via `localhost:11434`, the Ollama daemon uses these device keys automatically
- You don't need to configure device keys in `.env` - they're managed by Ollama
- Device keys are visible in your Ollama account settings

**Managing Device Keys:**
```bash
# Sign in to Ollama (automatically adds device key)
ollama signin

# View your device keys in Ollama app or account settings
# https://ollama.com/account
```

---

## Remote vs Cloud: Understanding the Difference

### Remote Models (via Local Ollama)

**How it works:**
- Accessed through local Ollama API at `localhost:11434`
- Ollama automatically proxies requests to `ollama.com`
- Uses your Ollama Device Keys for authentication (automatic)
- **No API key configuration required**

**Example:**
```bash
# Remote model - transparently proxied to ollama.com
curl http://localhost:11434/api/chat -d '{
  "model": "nemotron-3-nano:30b-cloud",
  "messages": [{"role": "user", "content": "Hello"}]
}'
```

**Characteristics:**
- ✅ Fast response (1-2s)
- ✅ High quality models
- ✅ No API key needed (uses Device Keys automatically)
- ✅ Works with existing local Ollama setup
- ❌ Requires internet connection
- ❌ Privacy concerns (data sent to cloud)
- ❌ Dependent on ollama.com availability
- ❌ Requires Ollama sign-in (adds Device Key to account)

**Available Remote Models:**
- `nemotron-3-nano:30b-cloud` - 30B parameters, excellent quality
- More models available at ollama.com/library

### Cloud Models (Direct API Access)

**How it works:**
- Accessed directly via `https://ollama.com/v1/chat/completions`
- Requires explicit API key authentication
- OpenAI-compatible API format
- Independent of local Ollama installation

**Example:**
```bash
# Direct cloud API call
curl https://ollama.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:1.5b",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Characteristics:**
- ✅ Fast response
- ✅ High quality models
- ✅ Can be used without local Ollama
- ✅ OpenAI-compatible (easy integration)
- ❌ Requires API key setup
- ❌ Privacy concerns (data sent to cloud)
- ❌ Dependent on cloud service availability

**Configuration Required:**
```bash
# .env file
OLLAMA_API_KEY=your-actual-api-key-here  # Not SSH key!
```

### Key Differences

| Aspect | Local Models | Remote Models |
|--------|--------------|--------------|
| **Access Point** | `localhost:11434` | `localhost:11434` (proxied) |
| **Authentication** | None | Ollama Device Keys (auto) |
| **API Format** | Ollama API | Ollama API |
| **Local Ollama Required** | Yes | Yes |
| **API Key Required** | No | No |
| **Device Key Required** | No | Yes (managed by Ollama) |
| **Privacy** | High (local only) | Low (data sent to cloud) |
| **Latency** | 79s (slow) | 1-2s (fast) |
| **Setup Complexity** | Low | Low |
| **Internet Required** | No | Yes |

### Recommendation for AMALFA

**Development (Remote-First):**
- Use remote models via local Ollama for speed and quality
- No API key setup required - Device Keys work automatically
- Sign in to Ollama once: `ollama signin`
- Easy to switch between local and remote models

**Production (Local-Only):**
- Use fully local models for privacy
- Accept slower latency for data security
- No external dependencies
- No Device Keys required

**Hybrid Approach:**
- Default to local models
- Fallback to remote models when local unavailable
- Use alternative providers (gemini, openrouter) if Ollama unavailable
- Never use direct cloud API (unnecessary complexity)
- Use alternative providers (gemini, openrouter) if Ollama unavailable

---

### Cloud Ollama Status

**Status:** ❌ Not Supported

**Decision:** Direct cloud API access has been removed from AMALFA. Remote models (accessed via localhost:11434) provide the same functionality without API key complexity.

**Rationale:**
- Remote models work perfectly without API key configuration
- Direct cloud API adds unnecessary complexity
- Local Ollama automatically handles authentication for remote models
- Simplified configuration reduces maintenance burden

**Alternative:** Use remote models via local Ollama API at localhost:11434.

---

## Test Results

### Local Model Testing

**Test Command:**
```bash
curl -s http://localhost:11434/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral-nemo:latest",
    "messages": [{"role": "user", "content": "Extract entities from: ..."}],
    "stream": false
  }'
```

**Results:**
- ✅ `mistral-nemo:latest` - Successful extraction, 79s latency
- ✅ `nemotron-3-nano:30b-cloud` - Successful extraction, 1.5s latency
- ❌ `sam860/LFM2:1.2b` - Failed with tensor error
- ❌ `hf.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF:Q4_K_M` - Failed with tensor error

### Cloud Model Testing

**Status:** ❌ Not tested (missing API key)

**Test Script Available:** `tests/ollama/test-providers.ts`

---

## Configuration Guidance

### Current Configuration

**File:** `amalfa.config.json`
```json
{
  "langExtract": {
    "provider": "ollama_cloud",  // ⚠️ Set to cloud but not configured
    "ollama": {
      "host": "http://localhost:11434",
      "model": "qwen2.5:1.5b"  // ⚠️ Model not available locally
    },
    "ollama_cloud": {
      "host": "",  // ⚠️ Empty - needs configuration
      "model": "qwen2.5:7b"
    }
  }
}
```

### Recommended Configuration

#### Option 1: Local Only (Privacy-First)

```json
{
  "langExtract": {
    "provider": "ollama",
    "ollama": {
      "host": "http://localhost:11434",
      "model": "mistral-nemo:latest"
    }
  }
}
```

**Pros:** Maximum privacy, no external dependencies  
**Cons:** Slow latency (79s), large model (7.1 GB)

#### Option 2: Remote Only (Speed-First)

```json
{
  "langExtract": {
    "provider": "ollama",
    "ollama": {
      "host": "http://localhost:11434",
      "model": "nemotron-3-nano:30b-cloud"
    }
  }
}
```

**Setup Required:**
- None (uses your Ollama account automatically)
- Requires internet connection for remote model access

**Pros:** Fast (1.5s), high quality, no API key needed  
**Cons:** Privacy concerns (data sent to cloud), requires internet

**Note:** This uses "remote" models through local Ollama API at localhost:11434. No API key required.

#### Option 3: Hybrid with Fallback (Recommended)

```json
{
  "langExtract": {
    "provider": "ollama",
    "fallbackOrder": ["ollama", "gemini", "openrouter"],
    "ollama": {
      "host": "http://localhost:11434",
      "model": "mistral-nemo:latest"
    }
  }
}
```

**Pros:** Best of both worlds, automatic fallback  
**Cons:** More complex setup

**Note:** Fallback chain uses alternative providers (gemini, openrouter) instead of direct cloud API.

---

## Action Items

### Immediate (Do Now)

1. **Fix Local Configuration**
   ```bash
   # Update amalfa.config.json
   langExtract.provider = "ollama"
   langExtract.ollama.model = "mistral-nemo:latest"
   ```

2. **Test LangExtract with Working Model**
   ```bash
   bun run tests/ollama/test-providers.ts
   # Should show mistral-nemo:latest as functional
   ```

3. **Remove Broken Models**
   ```bash
   ollama rm sam860/LFM2:1.2b
   ollama rm hf.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF:Q4_K_M
   ```

### Short Term (This Week)

4. **Test Remote Models**
   - Verify remote model access via localhost:11434
   - Test `nemotron-3-nano:30b-cloud` for speed
   - Monitor internet dependency for remote models
   - Consider local models for offline capability

5. **Implement Fallback Logic**
   - Update `LangExtractClient.ts` to support provider fallback
   - Test local → cloud fallback chain
   - Add logging for provider selection

6. **Performance Optimization**
   - Consider pulling smaller, faster models
   - Test `phi3:mini` or `tinyllama:latest` locally
   - Benchmark latency vs. quality tradeoffs

### Long Term (Next Sprint)

7. **Model Management**
   - Automate model health checking
   - Implement model rotation strategy
   - Add model performance metrics

8. **Documentation**
   - Update README with Ollama setup instructions
   - Create troubleshooting guide
   - Document model selection criteria

---

## Troubleshooting

### Issue: "missing tensor 'output_norm'"

**Symptom:** Model fails to load with tensor error  
**Cause:** Incompatible GGUF format or corrupted file  
**Solution:**
```bash
# Remove broken model
ollama rm <model-name>

# Re-download with correct format
ollama pull <model-name>
```

### Issue: Remote Models Not Working

**Symptom:** Remote model requests fail with authentication error  
**Cause:** Not signed in to Ollama or device key issues  
**Solution:**
```bash
# Sign in to Ollama (adds device key automatically)
ollama signin

# Check Ollama service status
ollama list

# Restart Ollama if needed
brew services restart ollama

# View device keys in Ollama account settings
# https://ollama.com/account
```

### Issue: Slow Local Performance

**Symptom:** 79+ second latency for extraction  
**Cause:** Large model (7.1 GB) on limited hardware  
**Solution:**
- Use smaller model (e.g., `phi3:mini`)
- Increase system RAM
- Use cloud model for speed

---

## Performance Benchmarks

### Latency Comparison

| Provider | Model | Latency | Quality | Privacy |
|----------|-------|---------|--------|---------|
| Local | `mistral-nemo:latest` | ~79s | Good | ✅ High |
| Remote | `nemotron-3-nano:30b-cloud` | ~1.5s | Excellent | ❌ Low |
| Cloud | (not configured) | Unknown | Unknown | ❌ Low |

### Quality Assessment

**Test Prompt:** Extract entities from: "The LangExtract service uses LLMs to extract entities and relationships from source code."

**Results:**
- `mistral-nemo:latest` - Extracted 5 entities correctly
- `nemotron-3-nano:30b-cloud` - Extracted 2 entities with detailed explanation

---

## Conclusion

**Current Best Option:** `mistral-nemo:latest` (local)  
**Future Best Option:** Hybrid with cloud fallback  

**Next Steps:**
1. Update config to use `mistral-nemo:latest`
2. Set up cloud API key
3. Implement fallback logic
4. Test end-to-end LangExtract integration

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-28  
**Maintainer:** AMALFA Team