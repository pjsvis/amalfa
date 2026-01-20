# Implementation Plan: LangExtract Sidecar Integration

**Status:** Proposed
**Feature:** Python-based Entity Extraction Sidecar via MCP
**Brief:** [briefs/future/brief-lang-extract-sidecar.md](../../briefs/future/brief-lang-extract-sidecar.md)

## 1. Overview
We will implement the "Sidecar Pattern" to integrate the Python-based `LangExtract` library into the Amalfa Bun/TypeScript ecosystem using the Model Context Protocol (MCP). This allows advanced entity extraction without rewriting core logic or introducing heavy HTTP services.

## 2. Prerequisites
- [x] **uv** (Fast Python package manager) installed.
- [x] **Bun** installed.
- [ ] **LangExtract** MCP server implemented in Python.

## 3. Implementation Steps

### Phase 1: Python Sidecar (The Server)
Create a lightweight Python MCP server that wraps `LangExtract`.

1.  **Directory Setup**: Create `src/sidecars/lang-extract/`.
2.  **Environment**: Initialize `uv` project.
3.  **Dependencies**: Install `mcp`, `langextract`, `google-generativeai`.
4.  **Server Code**: Implement `server.py` using `FastMCP` (or standard `mcp` SDK) to expose an `extract_graph(text: str)` tool.

### Phase 2: TypeScript Integration (The Client)
Update the Amalfa pipeline to spawn and control the sidecar.

1.  **Client Factory**: Create `src/lib/sidecar/LangExtractClient.ts`.
    *   Use `StdioClientTransport` to spawn `uv run src/sidecars/lang-extract/server.py`.
    *   Implement connection management (start/stop).
    *   Add `isAvailable()` check to verify Python environment presence.
2.  **Zod Schema**: Define the expected Graph/Node/Edge shape in TypeScript using Zod to validate Python outputs.
3.  **Integration**: Add a method `extractEntities(text: string)` that calls the MCP tool if available, falls back to Regex if not.

### Phase 3: Distribution & Setup (The "Opt-In")
Make the feature usable for end-users who install via NPM.

1.  **Packaging**: Update `package.json` `files` array to include `src/sidecars`.
2.  **Setup Command**: Create `amalfa setup-python` CLI command.
    *   Checks for `uv` (prompts install if missing).
    *   Runs `uv sync` in the sidecar directory to build the environment on the user's machine.
3.  **Config**: Update `amalfa.config.json` to store sidecar state (enabled/disabled).

### Phase 4: Pipeline Usage
Integrate the capability into the main ingestion flow.

1.  **Ingestion Hook**: In `Ingestor.ts`, optionally route text chunks to the sidecar for enhanced extraction.
2.  **Merging**: Strategies for merging sidecar-extracted entities with existing Regex/AST based entities.

## 4. Verification Plan
*   **Unit Test**: Create `tests/sidecar-test.ts` to spin up the sidecar and extract entities from a sample string.
*   **Install Test**: Verify `amalfa setup-python` works on a fresh environment.
*   **Performance Benchmark**: Measure latency of `uv` startup vs. request processing time.

## 5. File Structure
```
src/
  sidecars/
    lang-extract/
      pyproject.toml   # Python dependencies
      server.py        # MCP Server implementation
  lib/
    sidecar/
      LangExtractClient.ts  # Bun adapter
```
