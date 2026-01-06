# Ingestion Pipeline: The Lifecycle

This document describes the standard procedure for managing the Polyvis Knowledge Graph.

## 1. Initial Ingestion (The Big Bang)
**Goal:** Create a clean slate database from the source documents.
**Command:** `bun run build:data` (with empty DB)

1.  **Ingest Persona:** Loads Core Directive Array (CDA) and Conceptual Lexicon.
2.  **Ingest Experience:** Scans `debriefs/`, `playbooks/`, `briefs/`.
3.  **Process Content:**
    *   **BentoBoxer:** Semantic Chunking (AST-based, H1-H4).
    *   **EdgeWeaver:** Strict Edge creation (WikiLinks + Tags).
    *   **Embedder:** Generates Vectors for Search.

## 2. Tuning (The Signal)
**Goal:** Ensure the graph structure is useful and noise-free.

*   **Strict Mode:** Prevents fuzzy edges. Only explicit connections.
*   **LouvainGate:** Prevents super-nodes (>50 edges) to keep communities distinct.
*   **Thin Node Protocol:**
    *   **Concept:** The Database is an *Index*, not a *Warehouse*.
    *   **Implementation:** We store vectors and structure in SQLite. The heavy text remains on the filesystem.
    *   **Retrieval:** The UI should use the `meta.source` path to load the full document on demand (Local-First Architecture).

## 3. Delta Updates (The Gardener)
**Goal:** Keep the system updated as new documents arrive.
**Command:** `bun run build:data`

1.  **Hash Check:** The script compares the hash of the file on disk vs. the DB.
2.  **Skipping:** Unchanged files are skipped (`⏩ Skipping ...`).
3.  **Updating:** Changed/New files are re-processed, re-chunked, and re-embedded (`📝 Updating ...`).
4.  **TimeWeaver:** Re-runs at the end to stitch the chronological narrative timeline.

## 4. MCP & Library Readiness
Codebase Status (`src/core`):
-   **Core Logic:** `BentoBoxer`, `EdgeWeaver`, and `TagEngine` are clean classes.
-   **Database:** `ResonanceDB` is a self-contained wrapper.
-   **Dependency:** Currently relies on `polyvis.settings.json` injection.
-   **(Moved)**: `extract_terms.ts` -> `src/resonance/pipeline/extract.ts`. Ready for extraction to `@resonance/core` library with minor refactoring (config injection).
-   **(Moved)**: `transform_docs.ts` -> `src/resonance/pipeline/transform_docs.ts`. Ready for extraction to `@resonance/core` library with minor refactoring (config injection).
