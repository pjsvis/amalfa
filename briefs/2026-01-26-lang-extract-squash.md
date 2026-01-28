# Brief: LangExtract Sidecar Squash (The Symbolic Ingestion)

**Date:** 2026-01-26
**Status:** Proposed
**Context:** Ingestion Pipeline & Graph Construction
**Dependencies:** [LangExtract Sidecar Implementation](../debriefs/2026-01-20-lang-extract-sidecar.md)

## The Problem: Ghost Data

We have successfully implemented the **LangExtract Sidecar**, which uses Python and LLMs to extract rich, structured data (Entities, Classes, Relationships) from our source code.
However, this data currently lives in ephemeral JSON responses or unverified sidecar files. It is "Ghost Data"—it exists, but the `ResonanceDB` (our central knowledge graph) knows nothing about it.

Until this data is "Squashed" (ingested) into the database, our "Left Brain" search cannot use it. We are restricted to simple Grep (text matching) rather than true Symbolic Search ("Find all classes that inherit from `BaseAgent`").

## The Solution: The Squash Protocol

We will implement a **Squash Routine** that systematically reads generated Sidecar JSON files and merges them into the SQLite Graph.

### 1. The Data Flow

```mermaid
graph LR
    A[Source Code (.ts)] -->|LangExtract Sidecar| B[Sidecar File (.ts.json)]
    B -->|Squash Routine| C[ResonanceDB (Nodes/Edges)]
```

### 2. The Mechanics

The Squash Routine will perform the following actions for each Sidecar File:

1.  **Resolution:** Identify the "Parent Node" (the Source File) in the DB.
2.  **Entity Upsert:** For each extracted **Entity** (e.g., `Class:GraphEngine`):
    *   Create a "Ghost Node" in the extracted layer (e.g., `layer='symbol'`).
    *   Link it to the Parent Node via a `DEFINES` edge.
3.  **Relationship Upsert:** For each extracted **Relationship** (e.g., `GraphEngine USES Database`):
    *   Resolve targets (fuzzy match existing nodes or create placeholders).
    *   Create the Edge in the DB (e.g., `source='GraphEngine', target='Database', type='USES'`).

### 3. Implementation Plan

#### Phase 1: The Squash Service
Create `src/core/SidecarSquasher.ts`:
*   **Input:** Glob pattern for `**/*.json` sidecars (or specific target).
*   **Logic:**
    *   Parse JSON using Zod (`GraphDataSchema`).
    *   Transactionally insert/update `nodes` and `edges`.
    *   **Idempotency:** Ensure running squash multiple times doesn't duplicate data. Use `INSERT OR IGNORE` or upsert logic.

#### Phase 2: CLI Integration
Update `src/cli/commands/ingest.ts` (or create `squash.ts`):
*   Add `amalfa squash` command.
*   Options: `--watch` (auto-squash when sidecar changes), `--force` (re-import all).

#### Phase 3: The "Ghost Node" Strategy
*   **Symbol Nodes:** Entities extracted from code (classes, functions) should be distinguished from "File Nodes".
*   **Semantic Texture (Definitions):**
    *   **Requirement:** The `description` field from the Sidecar JSON **must** be stored in the DB (e.g., in a `summary` column or `meta.description`).
    *   **Why:** This turns "Hollow Nodes" into "textured" targets. It allows the Reranker to match concepts (e.g., matching "cleanup" to a node defined as "prunes data") and enables token-efficient **Context Injection** (feeding definitions instead of full files to the LLM).
*   **Metadata:** Store the extraction confidence and origin in the `meta` JSON column.

#### Phase 4: Model Independence Research
*   **Goal:** Move beyond the hardcoded `google-generativeai` dependency to support Local (Ollama) and other Cloud (OpenAI/Anthropic) providers.
*   **Investigation:**
    *   Evaluate **LiteLLM** or **Instructor** as a unified interface.
    *   Benchmark Local Models (e.g., `Llama-3-8B`, `Phi-4`) for extraction quality. Can they output valid JSON/Graph structures reliably?
    *   Test constrained generation (Grammars/JSON Mode) for local models.
* From the LangExtract documentation at [community_providers](https://github.com/google/langextract/blob/main/COMMUNITY_PROVIDERS.md) we can obtain a plugin for Llama.cpp.


##### OpenAI models

LangExtract supports OpenAI models (requires optional dependency: pip install langextract[openai]):

```bash
import langextract as lx

result = lx.extract(
    text_or_documents=input_text,
    prompt_description=prompt,
    examples=examples,
    model_id="gpt-4o",  # Automatically selects OpenAI provider
    api_key=os.environ.get('OPENAI_API_KEY'),
    fence_output=True,
    use_schema_constraints=False
)
```

Note: OpenAI models require fence_output=True and use_schema_constraints=False because LangExtract doesn't implement schema constraints for OpenAI yet.

##### Local models via Ollama

LangExtract supports local inference using Ollama, allowing you to run models without API keys:

```bash
import langextract as lx

result = lx.extract(
    text_or_documents=input_text,
    prompt_description=prompt,
    examples=examples,
    model_id="gemma2:2b",  # Automatically selects Ollama provider
    model_url="http://localhost:11434",
    fence_output=False,
    use_schema_constraints=False
)
```

## Success Criteria

1.  **Persistence:** Extracted entities appear in `SELECT * FROM nodes`.
2.  **Connectivity:** Extracted relationships appear in `SELECT * FROM edges`.
3.  **Searchability:** We can query the graph for "Symbols" distinct from "Files".
4.  **Idempotency:** Re-running the squash on unchanged files produces zero net changes.

## Next Steps

1.  Implement `SidecarSquasher.ts`.
2.  Register `amalfa squash` command.
3.  Update **Hybrid Search** to leverage these new specific edge types.
