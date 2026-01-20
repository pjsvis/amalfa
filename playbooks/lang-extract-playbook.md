# LangExtract Sidecar Playbook

## Overview
The **LangExtract Sidecar** (Source: `src/sidecars/lang-extract`) allows Amalfa to leverage Python-based LLM libraries (like Google's LangExtract or direct Gemini calls) from within the Bun/TypeScript environment. It follows the **Sidecar Pattern** using the Model Context Protocol (MCP) over Stdio.

## Operations

### 1. Setup
Users must explicitly initialize the Python environment (using `uv`).

```bash
amalfa setup-python
```
_This checks for `uv` and installs dependencies defined in `src/sidecars/lang-extract/pyproject.toml`._

### 2. Configuration
The sidecar currently requires an API key in the environment:
- `GEMINI_API_KEY`: Required for the default Gemini model usage.

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

### 4. modifying the Sidecar
The Python code lives in `src/sidecars/lang-extract/server.py`.
- **Dependencies**: Add new packages via `cd src/sidecars/lang-extract && uv add <package>`.
- **Logic**: Update the `extract_graph` tool in `server.py`.
- **Schema**: If you change the return JSON structure, update the Zod schema in `LangExtractClient.ts`.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `Sidecar not detected` | `uv` not installed or `setup-python` not run | Run `amalfa setup-python` |
| `Error: GEMINI_API_KEY...` | Environment variable missing | Export the key in `.env` or shell |
| `429 Quota exceeded` | Free tier limits hit | Use a different model or wait |
| `404 model not found` | Model name invalid/deprecated | Check `google.genai` model list |
