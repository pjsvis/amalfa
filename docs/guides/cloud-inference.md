# Cloud Inference with OpenRouter

Amalfa supports a **tiered inference strategy**: use fast, small models locally for rapid tasks, and optionally offload complex reasoning to powerful cloud models via OpenRouter.

## Overview

| Mode | Model | Use Case | Latency |
| :--- | :--- | :--- | :--- |
| **Local (Default)** | `qwen2.5:1.5b` | Query analysis, metadata, snippets | ~1-2s |
| **Cloud (Optional)** | `qwen/qwen-2.5-72b-instruct` | Research, deep synthesis | ~5-15s |

## Setup

### 1. Get an OpenRouter API Key
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Generate an API key from your dashboard

### 2. Configure Environment
Add your API key to `.env` in your project root:
```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
```

### 3. Enable Cloud Mode
Edit `amalfa.config.json`:
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

### 4. Restart Sonar
```bash
amalfa sonar restart
```

## How It Works

When cloud mode is enabled:
1. **All inference** goes through OpenRouter instead of local Ollama
2. The configured cloud model is used for all Sonar tasks
3. Requests include proper authentication headers

**Important:** Cloud mode replaces local inference entirely. For true "tiered" behavior (local for simple, cloud for complex), you would need to manually switch configs or use the `model` override in code.

## Supported Providers

| Provider | `provider` value | Notes |
| :--- | :--- | :--- |
| **OpenRouter** | `"openrouter"` | Aggregator, many models |
| **Self-hosted Ollama** | `"ollama"` | Your own GPU server |

## Model Recommendations

### For Search/Metadata (Speed Priority)
- `qwen2.5:1.5b` (local) - Very fast, good enough
- `google/gemma-2-9b-it:free` (cloud) - Free tier option

### For Research/Synthesis (Quality Priority)
- `qwen/qwen-2.5-72b-instruct` - Excellent reasoning
- `anthropic/claude-3.5-sonnet` - Best for complex tasks

## Troubleshooting

**"401 Unauthorized"**
- Check your `OPENROUTER_API_KEY` in `.env`
- Ensure the env file is in the project root

**"Model not found"**
- Verify the model name on [openrouter.ai/models](https://openrouter.ai/models)
- Some models require credits

**Slow responses**
- Cloud latency is inherent (~5-15s for large models)
- Consider disabling cloud for simple queries

## Cost Considerations

OpenRouter charges per token. Monitor usage at your dashboard.
- Small queries (~500 tokens): ~$0.001
- Research tasks (~5000 tokens): ~$0.01-0.05

For development, consider using `:free` suffix models when testing.

## See Also
- **Sonar Configuration:** `playbooks/sonar-manual.md`
- **Architecture:** `docs/services.md`
