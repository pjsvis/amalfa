# The Golden Lexicon Pipeline

## Purpose
This pipeline transforms the raw "Chaos" of the corpus into the "Order" of the **Resonance Knowledge Graph**. It is a **Unidirectional, Multi-Stage Industrial Process**.

## Core Philosophy
1.  **Artifact-Driven:** Each stage produces a verified JSONL artifact.
2.  **Idempotent:** Stages can be re-run safely.
3.  **Observability:** Every stage reports stats (Input Count, Output Count, Drop Rate).
4.  **Zero-Magic:** No hidden state. Everything is in the JSONL files.

## The Stages

### 1. Harvest (`01-harvest.ts`)
*   **Input:** Raw File System scan.
*   **Action:** Tokenizes text, extracts "Entities" (Potential Nodes).
*   **Output:** `lexicon-candidates.jsonl` (Thousands of candidates).

### 2. Refine (`02-refine.ts`)
*   **Input:** Candidates.
*   **Action:** Filters by Frequency (>=2), Length, and Stop Words. Removes "Noise".
*   **Output:** `golden-lexicon.jsonl` (High-Signal Nodes).

### 3. Enrich (`03-enrich.ts`)
*   **Input:** Golden Nodes + Sidecars.
*   **Action:** Connects Nodes to their LLM-extracted definitions. Fills the "Hollow Nodes".
*   **Output:** `golden-lexicon-enriched.jsonl` (Nodes + Descriptions).

### 4. Embed (`04-embed.ts`) (NEW)
*   **Input:** Enriched Nodes.
*   **Action:** Generating 1536d (or 384d) vectors for each node label/description.
*   **Output:** `final-nodes.jsonl` (Ready for DB).

### 5. Edge Survey (`05-survey-edges.ts`)
*   **Input:** Enriched Nodes + Sidecars.
*   **Action:** Identifies relationships using Strategy A (Sidecar) and Strategy B (Structure).
*   **Output:** `proposed-edges.jsonl`.

### 6. Ingest & Verify (`06-ingest.ts`)
*   **Input:** `final-nodes.jsonl` + `proposed-edges.jsonl`.
*   **Action:**
    1.  Atomic Transaction Insert into `ResonanceDB`.
    2.  **Round Trip Test:** Immediately SELECT counts and random samples to verify integrity.
*   **Output:** `ResonanceDB` (Updated).

## Usage
Run the dashboard to monitor progress:
```bash
bun run src/pipeline/lexicon/dashboard.ts
```
Then trigger the pipeline (can be done via UI or CLI).
