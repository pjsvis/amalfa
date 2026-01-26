# llama.cpp Playbook

## Overview
This playbook provides instructions for using llama.cpp to run local language models with GGUF format, especially useful when models aren't supported by Ollama.

## Installation

llama.cpp is installed via Homebrew:
```bash
brew install llama.cpp
```

Verify installation:
```bash
llama-cli --version
```

## Model Storage

Models are stored in:
```
~/.ollama/models/
```

Recommended structure:
```
~/.ollama/models/
├── lfm2.5/
│   └── LFM2.5-1.2B-Instruct-Q4_K_M.gguf
├── mistral/
└── llama/
```

## Finding and Downloading Models

### Hugging Face GGUF Models
Search for models on Hugging Face with `-GGUF` suffix:
- [LiquidAI/LFM2.5-1.2B-Instruct-GGUF](https://huggingface.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF)
- [TheBloke](https://huggingface.co/TheBloke) - Large collection of GGUF quantizations

### Download a Model
```bash
# Create directory for the model
mkdir -p ~/.ollama/models/lfm2.5

# Download from Hugging Face
curl -L -o ~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf \
  "https://huggingface.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF/resolve/main/LFM2.5-1.2B-Instruct-Q4_K_M.gguf"
```

## Quantization Types

GGUF models come in different quantization levels (trade-off between size/speed and quality):

| Quantization | Size | Quality | Speed | Use Case |
|--------------|------|---------|-------|----------|
| `Q2_K` | Smallest | Lowest | Fastest | Testing only |
| `Q4_0` | Small | Good | Fast | General use, CPU |
| `Q4_K_M` | Medium | Good | Fast | **Recommended for most** |
| `Q5_K_M` | Medium+ | Better | Medium | Balanced quality |
| `Q6_K` | Large | High | Slower | High quality needed |
| `Q8_0` | Very Large | Very High | Slowest | Near-original quality |
| `F16` | Largest | Original | Slowest | GPU with lots of VRAM |

**Recommendation**: Start with `Q4_K_M` for best size/quality balance.

## Running Models

### Basic Usage
```bash
llama-cli -m ~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf \
  -p "Your prompt here" \
  -n 100
```

### Common Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `-m` | Path to model file | `-m ~/.ollama/models/model.gguf` |
| `-p` | Prompt text | `-p "Explain quantum computing"` |
| `-n` | Max tokens to generate | `-n 500` |
| `-t` | Number of threads | `-t 8` |
| `-ngl` | GPU layers to offload | `-ngl 35` (Mac Metal auto-detects) |
| `--temp` | Temperature (0-2) | `--temp 0.7` |
| `--top-p` | Top-p sampling | `--top-p 0.9` |
| `--top-k` | Top-k sampling | `--top-k 40` |
| `--repeat-penalty` | Repetition penalty | `--repeat-penalty 1.1` |
| `-c` | Context size | `-c 4096` |
| `-i` | Interactive mode | `-i` |
| `--color` | Colorized output | `--color` |

### Interactive Mode
For chat-like interaction:
```bash
llama-cli -m ~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf \
  -i \
  --color \
  -c 4096 \
  --temp 0.7 \
  -n -1
```

Commands in interactive mode:
- Type your prompt and press Enter
- `Ctrl+C` or type `/exit` to quit
- `/clear` to clear context

### One-Shot Generation
```bash
llama-cli -m ~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf \
  -p "Write a Python function to calculate fibonacci numbers" \
  -n 500 \
  --temp 0.2
```

### Using Chat Templates
For instruct/chat models, use the built-in chat template:
```bash
llama-cli -m ~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf \
  --chat-template chatml \
  -p "What is machine learning?" \
  -n 200
```

## Model-Specific Settings

### LFM2.5-1.2B-Instruct
```bash
llama-cli -m ~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf \
  -p "Your prompt" \
  --temp 0.1 \
  --repeat-penalty 1.05 \
  -n 512 \
  -c 32768
```

**Notes**:
- Temperature: 0.1-0.2 (model tuned for deterministic output)
- Context: 32k tokens supported
- Best for: Agentic tasks, data extraction, RAG
- Not recommended for: Programming, knowledge-intensive tasks

## Performance Tips

### macOS (Apple Silicon)
- llama.cpp automatically uses Metal GPU acceleration
- No special flags needed for GPU offload
- Expect 40-90 tokens/s generation on M-series chips

### CPU-Only Systems
```bash
llama-cli -m model.gguf -t $(sysctl -n hw.ncpu) -p "prompt"
```

### Memory Management
If you get out-of-memory errors:
- Use a smaller quantization (Q4_0 instead of Q6_K)
- Reduce context size: `-c 2048`
- Reduce batch size: `-b 256`

## Troubleshooting

### Model Won't Load
```bash
# Check file integrity
ls -lh ~/.ollama/models/lfm2.5/*.gguf

# Re-download if corrupted
rm ~/.ollama/models/lfm2.5/*.gguf
# ... then download again
```

### Slow Generation
- Use smaller quantization (Q4_K_M instead of Q8_0)
- Reduce context size with `-c`
- Check CPU/GPU usage during generation

### Gibberish Output
- Increase temperature: `--temp 0.7`
- Adjust repetition penalty: `--repeat-penalty 1.1`
- Ensure you're using the correct chat template

## Comparison: llama.cpp vs Ollama

| Feature | llama.cpp | Ollama |
|---------|-----------|--------|
| Model Support | All GGUF formats | Limited by version |
| Ease of Use | Command-line flags | Simple commands |
| Control | Fine-grained | High-level |
| Setup | Manual model download | Automatic |
| Best For | Testing new models | Production use |

## Example Workflows

### Quick Test
```bash
llama-cli -m ~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf \
  -p "Hello! Introduce yourself." \
  -n 50
```

### Long-Form Generation
```bash
llama-cli -m ~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf \
  -p "Write a detailed article about renewable energy." \
  -n 2000 \
  --temp 0.7 \
  -c 4096
```

### Code Generation
```bash
llama-cli -m ~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf \
  -p "Write a Python class for a binary search tree with insert and search methods." \
  -n 1000 \
  --temp 0.2 \
  --top-p 0.95
```

## Resources

- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)
- [Hugging Face GGUF Models](https://huggingface.co/models?library=gguf)
- [GGUF Format Spec](https://github.com/ggerganov/ggml/blob/master/docs/gguf.md)

## Current Setup

### Installed Models
```bash
# List all downloaded models
ls -lh ~/.ollama/models/*/*.gguf
```

Current models:
- `~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf` (697MB)

### Quick Reference
```bash
# Run LFM2.5
llama-cli -m ~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf -p "Your prompt" -n 200

# Interactive session
llama-cli -m ~/.ollama/models/lfm2.5/LFM2.5-1.2B-Instruct-Q4_K_M.gguf -i --color

# Help
llama-cli --help
```
