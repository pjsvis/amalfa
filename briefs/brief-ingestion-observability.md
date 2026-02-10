# Brief: Ingestion Pipeline Observability & Round-Trip Verification

## 1. Objective
Enhance the AMALFA ingestion pipeline with real-time observability using the **Brutalisimo** design system, capture granular statistics from intermediate artifacts, and implement a round-trip test to ensure system integrity.

## 2. Pipeline Decomposition
The current pipeline operates in several distinct stages:
1.  **Discovery**: Globbing and filtering source files.
2.  **Sync (Pass 1)**: Node creation, ID resolution, and hash validation.
3.  **Transformation**: Embedding generation and semantic tokenization.
4.  **Weaving (Pass 2)**: Lexical link discovery and Edge creation.
5.  **Enrichment**: Ember-based semantic extraction (post-sync).

## 3. Proposal: Brutalisimo Observability
We will leverage the existing **Terminal-Brutalist** design components to visualize the pipeline's health and throughput.

### 3.1. Pipeline Telemetry Service
Identify a new `PipelineTelemetry` singleton that tracks stage-wise metrics:
- **Status**: `idle` | `active` | `warning` | `error`
- **Metrics**: Throughput (files/sec), Pending queue, Rejection counts (LouvainGate).

### 3.2. Dashboard Integration
Add a new widget to `dashboard.html` using the `PipelineRow` component:
- **Sync**: Status of file-to-node conversion.
- **Embedding**: Latency and success rate of vector generation.
- **Weave**: Link density and graph connectivity metrics.
- **Ember**: Enrichment progress and AI extraction stats.

## 4. Proposal: Intermediate Artifact Statistics
We want to capture and expose stats that were previously "dark data":
- **Semantic Tokens**: Average tokens per document, top recurring tokens.
- **Embeddings**: Dimensionality verification and generation duration.
- **Edges**: "Link Discovery Efficiency" (Edges per Node).

## 5. Proposal: Round-Trip "Canary" Test
Implement a script-based verification to confirm the pipeline is fully functional end-to-end.
- **Workflow**:
    1. Generate a temporary `.amalfa-canary.md` file.
    2. Trigger the ingestion daemon.
    3. Query the database for the canary node.
    4. Verify that edges have been woven to known "Anchor" nodes.
    5. Report the "Round-Trip Latency" and "Integrity Score".

## 6. Implementation Plan
1.  **Create `PipelineTelemetry` service** to centralize stage reporting.
2.  **Instrument `AmalfaIngestor.ts`** with telemetry calls.
3.  **Update `DashboardDaemon.ts`** to stream these metrics via SSE.
4.  **Enhance `dashboard.html`** with the new Pipeline UI.
5.  **Add `amalfa verify` command** for the round-trip test.

---
*Created by Antigravity | 2026-02-09*
