---
date: 2026-01-20
tags: [feature, sidecar, python, mcp, lang-extract]
agent: antigravity
environment: local
---

# Debrief: LangExtract Sidecar Implementation

## Overview
Successfully implemented the **LangExtract Sidecar**, allowing the Amalfa Bun/TypeScript application to execute Python-based entity extraction via the Model Context Protocol (MCP). This unlocks access to powerful Python AI libraries (specifically `google.genai`) without rewriting them in JS or managing complex microservices.

## Accomplishments

### 1. Robust Sidecar Architecture
- Implemented the **Sidecar Pattern** where the Node.js app manages a Python child process.
- Used **MCP over Stdio** for strict, typed communication between languages.
- Leveraged **fast-mcp** in Python for rapid server development.

### 2. Dependency Isolation
- Used **`uv`** (Universal Python Package Manager) to manage the sidecar's environment.
- This ensures the sidecar doesn't pollute the user's system Python or require global installs.
- Created `amalfa setup-python` CLI command to bootstrap this environment easily for users.

### 3. Integration & Testing
- Built `LangExtractClient.ts` with **Zod validation** to ensure Python outputs match TypeScript expectations.
- Verified end-to-end functionality with a live test against **Gemini Flash (gemini-flash-latest)**.
- Achieved **~6s** latency for a full round-trip extraction request.

## Problems & Resolutions

### 1. Python Package Confusion (`google.generativeai` vs `google.genai`)
- **Issue**: The `google.generativeai` package is deprecated, but `google.genai` is the new standard. Additionally, model names vary between libraries.
- **Resolution**: Stuck with `google.generativeai` for now but suppressed warnings. Switched model to `gemini-flash-latest` which works reliably on the API.

### 2. Free Tier Rate Limits
- **Issue**: `gemini-2.0-flash` on the free tier has essentially zero quota (`limit: 0`).
- **Resolution**: Downgraded default model to `gemini-flash-latest` (likely 1.5) which has a generous free tier (15 requests/min).

### 3. Environment Variable Propagation
- **Issue**: `uv run` inside a subprocess didn't inherit `.env` variables automatically.
- **Resolution**: Explicitly passed the `env` block in `StdioClientTransport`.

## Lessons Learned

- **Sidecars works perfectly**: The MCP Stdio transport is an incredibly effective way to bridge languages locally. It feels "native" to the caller.
- **uv is essential**: Without `uv`, managing Python venvs for a distributed Node app would be a nightmare.
- **Legacy Models**: "Newest" isn't always available on "Free". Always fallback to stable tiers for default configurations.
