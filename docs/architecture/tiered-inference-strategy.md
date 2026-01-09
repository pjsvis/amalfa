---
title: "The Tiered Inference Strategy: Local-First, Cloud-Augmented"
date: 2026-01-09
type: architecture
tags: [architecture, inference, cloud, openrouter, ollama, tiered-models]
---

# The Tiered Inference Strategy

Amalfa implements a **"Local-First, Cloud-Augmented"** inference architecture. This document explains the design philosophy, when each tier is used, and the strategic benefits.

---

## 1. The Philosophy

### The Problem with Pure Cloud
Cloud-only AI services (ChatGPT API, Claude API) create:
- **Vendor Lock-in:** Your agent stops working if the API is down.
- **Privacy Concerns:** All your codebase context flows to external servers.
- **Latency Dependency:** Network round-trips add 500ms+ to every operation.
- **Cost Accumulation:** Token costs scale linearly with usage.

### The Problem with Pure Local
Local-only inference (Ollama) creates:
- **Hardware Constraints:** Running 70B models requires expensive GPUs.
- **Quality Ceiling:** Small models (1-7B) struggle with complex reasoning.
- **Resource Competition:** Heavy models compete with your IDE and browser.

### The Amalfa Solution: Tiered Inference
We use **both**, selecting the appropriate tier based on task complexity:

```
┌─────────────────────────────────────────────────────────────┐
│                    Inference Decision Tree                   │
│                                                              │
│   Incoming Task                                               │
│        │                                                     │
│        ▼                                                     │
│   Is cloud.enabled = true?                                   │
│        │                                                     │
│   ┌────┴────┐                                                │
│   │ NO      │ YES                                            │
│   ▼         ▼                                                │
│ [LOCAL]   Is this a "deep reasoning" task?                   │
│ Ollama         │                                             │
│                ▼                                             │
│           ┌────┴────┐                                        │
│           │ NO      │ YES                                    │
│           ▼         ▼                                        │
│        [LOCAL]   [CLOUD]                                     │
│        Fast       Powerful                                   │
│        qwen-1.5b  qwen-72b                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Task Classification

### Tier 1: Local Fast (Default)
**Model:** `qwen2.5:1.5b` via Ollama
**Latency:** 1-3 seconds
**Use Cases:**
- Query intent extraction (JSON output)
- Search result reranking (score assignment)
- Context snippet extraction (text selection)
- Metadata keyword extraction (classification)

**Why Local Works:**
These tasks require "pattern matching," not "reasoning." A small, fast model excels here.

### Tier 2: Cloud Powerful (Optional)
**Model:** `qwen/qwen-2.5-72b-instruct` via OpenRouter
**Latency:** 10-20 seconds
**Use Cases:**
- Deep research queries ("How did the auth system evolve?")
- Multi-document synthesis ("Summarize all debriefs from this week")
- Complex chain-of-thought ("Identify gaps in the codebase")
- Creative generation ("Write a blog post about...")

**Why Cloud is Needed:**
These tasks require holding many concepts in working memory and performing multi-step reasoning. 72B parameters provide dramatically better coherence.

---

## 3. Implementation Details

### The Inference Router (`sonar-inference.ts`)

```typescript
// Cloud toggle: dev-cloud/prod-local strategy
const cloudConfig = hostArgs.cloud;
const useCloud = cloudConfig?.enabled === true;

// Provider selection
const provider = useCloud ? cloudConfig.provider || "ollama" : "ollama";

// Model priority chain:
// 1. Per-request override (explicit)
// 2. Cloud model (if cloud enabled)
// 3. Discovered local model (from Ollama)
// 4. Config default
// 5. Hardcoded fallback
const model = overrideModel 
    || (useCloud ? cloudConfig.model : null) 
    || inferenceState.ollamaModel 
    || hostArgs.model 
    || "qwen2.5:1.5b";
```

### Provider Abstraction
The same `callOllama()` function handles both providers:
- **Ollama:** Uses `/api/chat` endpoint, Ollama's native format.
- **OpenRouter:** Uses `/v1/chat/completions` endpoint, OpenAI-compatible format.

The caller doesn't need to know which provider is active—the router handles it.

---

## 4. Configuration

### Basic (Local Only)
```json
{
  "sonar": {
    "enabled": true,
    "model": "qwen2.5:1.5b"
  }
}
```

### Enhanced (Cloud Enabled)
```json
{
  "sonar": {
    "enabled": true,
    "model": "qwen2.5:1.5b",
    "cloud": {
      "enabled": true,
      "provider": "openrouter",
      "host": "openrouter.ai/api/v1",
      "model": "qwen/qwen-2.5-72b-instruct"
    }
  }
}
```

### Environment Variable
```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
```

The API key is read from environment, never stored in config files.

---

## 5. Cost Analysis

### OpenRouter Pricing (Example)
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
| :--- | :--- | :--- |
| `qwen/qwen-2.5-72b-instruct` | $0.35 | $0.40 |
| `google/gemma-2-9b-it:free` | Free | Free |

### Typical Usage
| Task | Tokens | Cost |
| :--- | :--- | :--- |
| Single research query | ~5,000 | ~$0.002 |
| Full corpus synthesis | ~50,000 | ~$0.02 |
| Month of active development | ~500,000 | ~$0.20 |

**Verdict:** Cloud is extremely affordable for development use. The quality improvement far outweighs the cost.

---

## 6. The "Dev-Cloud / Prod-Local" Pattern

### During Development
Enable cloud to experience **what's possible**:
- See high-quality synthesis outputs
- Validate that your prompts work well with capable models
- Iterate rapidly on features without hardware constraints

### In Production (Self-Hosted)
Disable cloud for **privacy and cost control**:
- All inference stays on your machine
- No external API calls
- Predictable performance (no network variance)

This pattern lets you **develop with the best, deploy with what's practical.**

---

## 7. Supported Providers

### Currently Implemented
| Provider | Config Value | Notes |
| :--- | :--- | :--- |
| **Ollama** | `"ollama"` | Local or self-hosted GPU server |
| **OpenRouter** | `"openrouter"` | Model aggregator (100+ models) |

### Future Candidates
- Direct OpenAI API
- Anthropic Claude API
- Self-hosted vLLM endpoints

The abstraction layer makes adding providers straightforward.

---

## 8. Resilience: Graceful Degradation

If cloud inference fails (network error, rate limit, invalid response):
1. The request **does not crash**.
2. The system logs a warning.
3. Where possible, fallback logic provides a degraded but functional response.

Example from `handleSearchAnalysis`:
```typescript
const parsed = safeJsonParse(response.message.content);
if (!parsed) {
    log.warn("Failed to parse JSON, using fallback");
    return { intent: "search", entities: [query], filters: {} };
}
```

This ensures **Amalfa never fails due to model misbehavior**.

---

## 9. Conclusion

The tiered inference strategy embodies Amalfa's core philosophy:

> **Local-First:** The system works fully offline. Cloud is never required.
> **Cloud-Augmented:** When available, cloud dramatically enhances quality.
> **User Controlled:** The toggle is in config, not in code. You decide.

This architecture makes Amalfa accessible to a MacBook Air user while giving GPU-server users the option to leverage their hardware—or cloud credits—for superior results.

---

## See Also
- **Setup Guide:** `docs/guides/cloud-inference.md`
- **Sonar Overview:** `playbooks/sonar-system-overview.md`
- **Debrief:** `debriefs/2026-01-08-tiered-model-openrouter.md`
