## Task: Phi3 Multi-Purpose Sub-Agent Implementation

**Objective:** Reduce search latency and improve relevance by implementing an optional Phi3-powered sub-agent for search intelligence, metadata enhancement, content analysis, and interactive chat interface.

**Target:** Reduce searches per answer from 7 to 2-3.

## High-Level Requirements

1.  **Optional Enhancement Service:** Works without breaking core system if simple search suffices.
2.  **Multiple Task Types:** Search intelligence, metadata enhancement, context extraction.
3.  **Two-Phase Metadata Strategy:**
    *   **Phase 1:** Fast Ingest (milliseconds) - Basic hash/frontmatter.
    *   **Phase 2:** Phi3 Enhancement (seconds) - Deep semantic themes, code patterns.
4.  **Graceful Degradation:** Fallback to vector-only search when Phi3 is unavailable.
5.  **Interactive Chat:** Natural language interface for corpus exploration.

## Key Actions Checklist

*   [ ] **Phase 1: Foundation:** Phi3 daemon, Ollama integration, graceful degradation.
*   [ ] **Phase 2: Search Intelligence:** Query analysis, re-ranking, smart snippets.
*   [ ] **Phase 3: Metadata Enhancement:** Batch analysis, auto-enhancement daemon.
*   [ ] **Phase 4: Integration:** MCP server updates, performance tuning.
*   [ ] **Phase 5: Chat Interface:** Interactive corpus assistant, natural language queries.

## Architecture Guidelines

### Service Architecture
*   **Daemon:** Single service (`src/daemon/phi3-agent.ts`) managing multiple endpoints.
*   **Endpoints:**
    *   `/search/*`: Real-time query analysis (High priority).
    *   `/metadata/*`: Background document enhancement (Low priority).
    *   `/chat/*`: Interactive session management.
    *   `/health`: Availability check.

### Ollama Integration
*   **Discovery:** Use CLI (`ollama list`) for reliability at startup.
*   **Inference:** Use HTTP (`POST /api/chat`) for speed and streaming.
*   **Model:** Default to `phi3:latest` (2.2GB), fallback to `mistral` or `llama3`.

### Two-Phase Strategy
1.  **Fast Ingest:** Immediate availability in vector store.
2.  **Enhancement:** Async background process adds `phi3_enhanced`, `themes`, `code_patterns`.

### Graceful Degradation Pattern
```typescript
const result = await (isPhi3Available() 
    ? enhancedSearch(query) 
    : basicVectorSearch(query));
```

## Success Metrics
*   **Primary:** Searches per answer < 3.
*   **Latency:** Search < 500ms (Total).
*   **Coverage:** 90% docs enhanced.
*   **Reliability:** Zero crashes on model failure (fallback works).
