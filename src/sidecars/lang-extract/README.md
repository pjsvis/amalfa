# LangExtract Sidecar

This directory contains the Python-based MCP server for performing advanced entity extraction using Google's generative models.

## Architecture

This component runs as a "Sidecar" alongside the main Amalfa application.
- **Main App (Bun)**: Spawns this process and communicates via Stdio using the MCP protocol.
- **Sidecar (Python)**: Uses `uv` to manage dependencies and runs `server.py`.

## Requirements

- Python 3.12+
- `uv` package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- `GEMINI_API_KEY` environment variable

## Development

Run locally for testing:
```bash
uv run server.py
```
