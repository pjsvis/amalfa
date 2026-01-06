# Ingestion Pipeline Playbook

## Overview
This playbook documents the architecture, operation, and debugging of the Polyvis Ingestion Pipelines (`PERSONA` and `EXPERIENCE`).

## Architectue: Two Pipelines, One Lake
We utilize a "Context Lake" architecture where distinct pipelines ingest data into a shared SQLite database (`resonance.db`), separated by the `domain` field.

### 1. PERSONA Pipeline
- **Source:** `scripts/fixtures/cda-ref-v63.json` (CDA), `conceptual-lexicon-ref-v1.79.json` (Lexicon).
- **Transformation:** `scripts/transform/transform_cda.ts` -> `.resonance/artifacts/*-enriched.json`.
- **Ingestion:** `scripts/pipeline/ingest.ts`.
- **Domain:** `persona`.

### 2. EXPERIENCE Pipeline (The Bifurcated Ingestion)
The Experience pipeline is split into two layers to support the "Hot/Cold" architecture:

#### Layer A: The "Hot Path" (Structure)
- **Script:** `scripts/pipeline/ingest_experience_graph.ts`
- **Domain:** `resonance`
- **Role:** Structural telemetry. Connects `debrief` nodes to `persona` directives.
- **Vectors:** NO. Fast, cheap, structural.

#### Layer B: The "Cold Path" (Knowledge)
- **Script:** `scripts/pipeline/ingest.ts`
- **Domain:** `knowledge`
- **Role:** Semantic search. Chunks content and generates embeddings.
- **Vectors:** YES. Expensive, rich, searchable.

## Observability Points
*(To be populated during verification)*

## Common Issues & Fixes
-   **Duplicated Nodes:** Run `scripts/fix/link_twins.ts` to merge semantic twins.
-   **Missing Embeddings:** Ensure `fastembed` is installed and `bun run scripts/pipeline/ingest.ts` completed "Layer B" processing.

## Phase 2 Update: The Hybrid Bridge
As of Phase 2, the pipeline supports a Hybrid Query model:
1.  **Ingest:** `ingest.ts` calculates `384d` embeddings using `fastembed`.
2.  **Storage:** Saved as blobs in `nodes.embedding` column.
3.  **Query:** Client-side (SQL.js) or Server-side (Bun) uses `vec_dot` UDF to query.
