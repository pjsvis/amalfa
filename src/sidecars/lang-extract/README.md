# LangExtract Sidecar

This directory contains the Python-based MCP server for performing advanced entity extraction using multiple LLM providers.

## Architecture

This component runs as a "Sidecar" alongside the main Amalfa application.
- **Main App (Bun)**: Spawns this process and communicates via Stdio using the MCP protocol.
- **Sidecar (Python)**: Uses `uv` to manage dependencies and runs `server.py`.

## Supported Providers

LangExtract supports multiple LLM providers for entity extraction:

### 1. Google Gemini (Default)
- Fast, reliable, with generous free tier
- Requires `GEMINI_API_KEY` environment variable
- Default model: `gemini-flash-latest`

### 2. Local Ollama
- Run LLMs locally on your machine
- No API keys required
- Requires Ollama installation and model download
- Recommended models: `qwen2.5:1.5b`, `phi3:mini`, `tinyllama:latest`

### 3. Cloud Ollama
- Use remote Ollama instances (GPU servers, corporate proxies)
- Supports authentication via API key
- Can use larger models than local hardware allows

### 4. OpenRouter
- Access to many models via OpenRouter API
- Requires `OPENROUTER_API_KEY` environment variable
- Default model: `qwen/qwen-2.5-72b-instruct`

## Requirements

### Base Requirements
- Python 3.12+
- `uv` package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)

### Provider-Specific Requirements

**Gemini:**
- `GEMINI_API_KEY` environment variable

**Local Ollama:**
- Ollama installed: `curl -fsSL https://ollama.ai/install.sh | sh`
- Model downloaded: `ollama pull qwen2.5:1.5b`

**Cloud Ollama:**
- Remote endpoint configured in `amalfa.config.json`
- Optional API key for authentication

**OpenRouter:**
- `OPENROUTER_API_KEY` environment variable

## Configuration

Configure your provider in `amalfa.config.json`:

```json
{
  "langExtract": {
    "provider": "ollama",
    "ollama": {
      "host": "http://localhost:11434",
      "model": "qwen2.5:1.5b"
    },
    "ollama_cloud": {
      "host": "https://your-gpu-server.com:11434",
      "model": "qwen2.5:7b",
      "apiKey": ""
    }
  }
}
```

### Environment Variables

You can also configure via environment variables:

- `LANGEXTRACT_PROVIDER` - Provider to use (gemini, ollama, ollama_cloud, openrouter)
- `GEMINI_API_KEY` - Google Gemini API key
- `OLLAMA_HOST` - Local Ollama endpoint (default: http://localhost:11434)
- `OLLAMA_MODEL` - Local Ollama model (default: qwen2.5:1.5b)
- `OLLAMA_CLOUD_HOST` - Cloud Ollama endpoint
- `OLLAMA_CLOUD_API_KEY` - Cloud Ollama authentication key
- `OLLAMA_CLOUD_MODEL` - Cloud Ollama model (default: qwen2.5:7b)
- `OPENROUTER_API_KEY` - OpenRouter API key
- `OPENROUTER_MODEL` - OpenRouter model

## Ollama Setup Guide

### Local Ollama (Recommended for Privacy)

1. **Install Ollama:**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama daemon:**
   ```bash
   ollama serve
   ```

3. **Download a model:**
   ```bash
   # Recommended for code understanding (fast, accurate)
   ollama pull qwen2.5:1.5b
   
   # Alternative: Phi-3 Mini (3.8B parameters)
   ollama pull phi3:mini
   
   # Alternative: TinyLlama (very fast, less accurate)
   ollama pull tinyllama:latest
   ```

4. **Verify installation:**
   ```bash
   ollama list
   ```

5. **Configure in amalfa.config.json:**
   ```json
   {
     "langExtract": {
       "provider": "ollama",
       "ollama": {
         "host": "http://localhost:11434",
         "model": "qwen2.5:1.5b"
       }
     }
   }
   ```

### Cloud Ollama (For GPU Acceleration)

1. **Set up a remote Ollama instance:**
   - Spin up a GPU server (AWS, GCP, or your own hardware)
   - Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
   - Start with external access: `OLLAMA_HOST=0.0.0.0:11434 ollama serve`

2. **Download a larger model:**
   ```bash
   ollama pull qwen2.5:7b
   ```

3. **Configure in amalfa.config.json:**
   ```json
   {
     "langExtract": {
       "provider": "ollama_cloud",
       "ollama_cloud": {
         "host": "https://your-gpu-server.com:11434",
         "model": "qwen2.5:7b",
         "apiKey": "your-api-key-if-required"
       }
     }
   }
   ```

## Development

Run locally for testing:
```bash
uv run server.py
```

## Troubleshooting

### Ollama Not Found
- Check if Ollama is installed: `ollama --version`
- Verify daemon is running: `ps aux | grep ollama`
- Check if models are downloaded: `ollama list`

### Connection Errors
- Verify host URL in configuration
- Check firewall settings for local Ollama
- Test endpoint manually: `curl http://localhost:11434/api/tags`

### Extraction Failures
- Check logs for detailed error messages
- Verify API keys are set correctly
- Try switching to a different provider
