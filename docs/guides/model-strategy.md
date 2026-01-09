# Model Strategy Guide

> **Philosophy:** Use the cloud to discover what works, then run it locally.

## The Dev-Cloud / Prod-Local Pattern

AMALFA supports a flexible model deployment strategy that lets you:
1. **Develop with cloud models** — Access large models (32B+) without expensive hardware
2. **Deploy with local models** — Run production workloads on your own infrastructure

This pattern helps you:
- **Avoid over-investing** in hardware before you know what you need
- **Establish a quality baseline** using best-available models
- **Right-size your deployment** based on actual requirements

---

## Configuration

### Local Mode (Default)

```json
{
  "sonar": {
    "enabled": true,
    "model": "qwen2.5:1.5b",
    "host": "localhost:11434"
  }
}
```

### Cloud Mode (Development)

```json
{
  "sonar": {
    "enabled": true,
    "model": "qwen2.5:1.5b",
    "host": "localhost:11434",
    "cloud": {
      "enabled": true,
      "host": "your-gpu-server.example.com:11434",
      "model": "qwen2.5:32b",
      "apiKey": "optional-bearer-token"
    }
  }
}
```

When `cloud.enabled: true`:
- All inference requests go to `cloud.host`
- Uses `cloud.model` instead of local model
- Adds `Authorization: Bearer <apiKey>` header if provided

---

## Recommended Workflow

### Step 1: Establish Quality Baseline
Enable cloud mode and test with a large model:
```json
"cloud": {
  "enabled": true,
  "host": "gpu-server:11434",
  "model": "qwen2.5:32b"
}
```

Run your typical workloads:
- `amalfa enhance --batch`
- Research tasks
- Chat queries

Document the quality of results.

### Step 2: Test Local Alternatives
Disable cloud and test local models:
```json
"cloud": { "enabled": false }
```

Try progressively smaller models:
1. `mistral-nemo:latest` (12B) — Best quality/performance balance
2. `qwen2.5:1.5b` — Fast, good for quick tasks
3. `tinydolphin:latest` — Minimal, fallback option

Compare results to your baseline.

### Step 3: Right-Size Hardware
Based on testing, determine:

| Model | Min RAM | Recommended Hardware |
|-------|---------|---------------------|
| `qwen2.5:1.5b` | 8GB | MacBook Air M1/M2/M3/M4 (16GB+) |
| `mistral-nemo` | 16GB | MacBook Pro (24GB+) or Mac Studio (32GB) |
| `qwen2.5:32b` | 48GB | Mac Studio (64GB+) |
| `llama3.1:70b` | 80GB | Mac Studio (128GB) or GPU server |

---

## Tiered Model Strategy

AMALFA automatically uses different models for different tasks:

| Task Type | Default Model | Why |
|-----------|---------------|-----|
| `garden` (Logic) | `meta-llama/llama-4-maverick:free` | 400B MoE for high-precision architectural judging |
| `synthesis` | `mistralai/devstral-2-2512:free` | Optimized for agentic coding and multi-file dependencies |
| `timeline` | `google/gemini-2.0-flash-exp:free` | Massive context window for batch chronological analysis |
| `enhance` | `qwen2.5:1.5b` | Speed matters for batch processing |
| `search` | `qwen2.5:1.5b` | Low latency for interactive queries |
| `research` | `mistral-nemo:latest` | Quality matters for complex reasoning |

### OpenRouter Free Tier Strategy

As of 2026, OpenRouter provides several high-performance models for free (usually rate-limited). AMALFA's Orchestrator uses these to achieve "Maverick-level" intelligence without hardware overhead:

1. **The Judge (Garden)**: Uses `llama-4-maverick` (400B) to verify logical gaps.
2. **The Summarizer (Synthesis)**: Uses `devstral-2` for code-aware community insights.
3. **The Chronologist (Chronos)**: Uses `gemini-2.0-flash` for high-volume date extraction and narration.

To enable this, set `sonar.cloud.provider` to `"openrouter"` and add your `OPENROUTER_API_KEY` to `.env`.

You can override per-task via the task JSON:
```json
{
  "type": "research",
  "query": "What is the project roadmap?",
  "model": "qwen2.5:32b"
}
```

---

## Cloud Providers

### Self-Hosted GPU Server
Run Ollama on a cloud GPU instance:
```bash
# On your GPU server
ollama serve --host 0.0.0.0

# In your config
"cloud": {
  "enabled": true,
  "host": "your-server-ip:11434",
  "model": "llama3.1:70b"
}
```

### Ollama Cloud (Future)
When Ollama releases their hosted API:
```json
"cloud": {
  "enabled": true,
  "host": "api.ollama.ai",
  "model": "llama3.1:70b",
  "apiKey": "your-api-key"
}
```

---

## Best Practices

1. **Start with cloud** — Don't buy hardware until you know what you need
2. **Document baselines** — Save example outputs from cloud models
3. **Test degradation gracefully** — Ensure smaller models produce *acceptable* results
4. **Keep local as fallback** — Always have a working local config for offline use
5. **Monitor resource usage** — Use `top` or Activity Monitor during inference

---

## Permanent Cloud Mode

If you decide cloud-only works for your use case:
```json
"cloud": {
  "enabled": true,
  "host": "your-gpu-provider.com:11434",
  "model": "qwen2.5:32b"
}
```

Benefits:
- No hardware investment
- Access to largest models
- Automatic scaling

Trade-offs:
- Requires internet connection
- Ongoing cloud costs
- Data leaves your machine

---

*Last Updated: 2026-01-08*
