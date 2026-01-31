---
title: Extract Service
type: architecture
tags: [extract, llm, sidecar, python]
status: stable
---

# Extract Service (LLM / Left Brain)

## 1. Stephensonian Review

- **Who**: `LangExtractClient` (Node.js) & `server.py` (Python Sidecar).
- **What**: Semantic Analysis using Large Language Models (Gemini/OpenRouter).
- **Where**: `src/services/LangExtractClient.ts` & `src/sidecars/lang-extract/`.
- **When**: Triggered by `Enrich Service` upon cache miss.
- **Why**: To extract structured entities, relationships, and tags from unstructured text.

## 2. State Machine

![Extract Service Diagram](./diagrams/02-extract.svg)

<details>
<summary>Source (DOT)</summary>

```dot
digraph ExtractService {
    rankdir=TD;
    node [shape=box, fontname="Courier New"];
    
    Request [label="Request\n(from Enrich)"];
    CheckCache [label="Check Cache\n(HarvesterCache)"];
    Spawn [label="Spawn Sidecar\n(uv run server.py)"];
    Provider [label="LLM Provider\n(Gemini/OpenRouter)"];
    Parse [label="Parse JSON\n(Zod Schema)"];
    Response [label="Return Graph Data"];
    Error [label="Error State"];
    
    Request -> CheckCache;
    CheckCache -> Response [label="Hit"];
    CheckCache -> Spawn [label="Miss"];
    
    Spawn -> Provider [label="STDIN"];
    Provider -> Parse [label="STDOUT"];
    
    Parse -> Response [label="Valid"];
    Parse -> Error [label="Invalid/SafeFail"];
}
```

</details>

## 3. Operational Notes

*   **Cost/Latency**: This is the most expensive operation. Caching (`HarvesterCache`) is essential.
*   **Robustness**: The Python sidecar includes retry logic for API limits (429).
*   **Validation**: Zod schemas enforce the JSON structure coming back from the LLM, protecting the unpredictable nature of stochastic parrots.
