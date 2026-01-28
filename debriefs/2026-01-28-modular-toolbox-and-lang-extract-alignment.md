---
date: 2026-01-28
tags: [phase-7, lang-extract, modular-toolbox, protocol, architecture]
agent: antigravity
environment: local
---

## Debrief: Modular Toolbox & LangExtract Alignment

## Accomplishments

### 1. LangExtract Pipeline Alignment (The "Left Brain" Fix)
- **Problem**: The `LangExtract` sidecar was generating rich structural data (Entities, Relations), but `EmberAnalyzer` was discarding it, keeping only flat tags. `SidecarSquasher` was also expecting a raw format, incompatible with the analyzer's output.
- **Solution**: 
    - Updated `EmberSidecar` schema to include an optional `graphData` field.
    - Refactored `EmberAnalyzer` to pass through the full LLM output.
    - Updated `SidecarSquasher` to intelligently unwrap and ingest this structured data.
- **Verification**: Ran a "One File Proof" on `src/core/GraphEngine.ts`.
    - **Yield**: 14 Symbols (Classes, Methods, Concepts) + 16 Semantic Edges.
    - **Verdict**: The capability is highly valuable for "Symbolic Search" once properly persisted.

### 2. Protocol: Modular Toolbox (Phase 7)
- **Goal**: Enable dynamic tool registration without modifying the core MCP server for every new capability.
- **Implementation**:
    - `src/types/tools.ts`: Defined `ToolSchema` and `ToolImplementation`.
    - `src/utils/ToolRegistry.ts`: Created a singleton registry for dynamic tool management.
    - `src/mcp/index.ts`: Refactored to query the registry for tools and route requests dynamically.
- **Benefit**: "Plugin" architecture. New tools can be dropped into `src/tools/` and registered in one line.

### 3. Surgical Extraction Tool (`ember_extract`)
- **Goal**: Allow agents to trigger expensive LLM extraction only when needed (e.g., "Analyze this directory"), rather than running it on every file change.
- **Implementation**: Created `EmberExtractTool` using the new modular protocol.
- **Capability**: Can now run `amalfa mcp call ember_extract path="src/core"` to populate the graph with deep code understanding for specific subsystems.

## Artifacts Created
- `src/types/tools.ts`
- `src/utils/ToolRegistry.ts`
- `src/tools/EmberExtractTool.ts`
- `src/tools/index.ts`
- `scripts/verify/tool-registry-test.ts`

## Next Steps
- **Substrates**: Implement adapters for different LLM providers (Ollama, etc.).
- **CLI**: Add `amalfa list-capabilities` to expose the new dynamic landscape.
- **Usage**: Agents can now use `ember_extract` to build "Mental Maps" of unfamiliar code sections on demand.
