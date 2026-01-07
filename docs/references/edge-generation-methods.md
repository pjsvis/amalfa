# Edge Generation Methods

## Overview

ResonanceDB uses multiple methods to generate edges between nodes. This document tracks each method and its contribution to the knowledge graph.

---

## Methods

| # | Method | Edge Type | Description |
|---|--------|-----------|-------------|
| 1 | **ConceptualLexicon** | MENTIONS | Concept → Term relationships from structured JSON |
| 2 | **TimelineWeaver** | SUCCEEDS | Chronological debrief chain |
| 3 | **SemanticHarvester** | IS_A, IMPLEMENTS | ML-extracted from markdown (SetFit + Llama) |

---

## Current Edge Distribution

*As of 2025-12-28*

| Source | Type | Count | % |
|--------|------|-------|---|
| ConceptualLexicon | MENTIONS | 386 | 77% |
| TimelineWeaver | SUCCEEDS | 110 | 22% |
| SemanticHarvester | CONCEPT, EXEMPLIFIES | 3 | <1% |
| **Total** | | **499** | 100% |

---

## Implementation Details

### ConceptualLexicon Ingestor
- **Source:** `src/pipeline/Ingestor.ts`
- **Input:** `experiments/json2md/*.json`
- **Generates:** Bulk MENTIONS edges from structured concept definitions

### TimelineWeaver
- **Source:** `src/pipeline/Ingestor.ts` (TimelineWeaver class)
- **Logic:** Links debriefs by date via SUCCEEDS edges
- **Automatic:** Runs on every ingestion

### SemanticHarvester
- **Source:** `ingest/harvester.py`, `src/pipeline/SemanticHarvester.ts`
- **Logic:** SetFit classification → Llama.cpp extraction (or regex fallback)
- **Manual:** Run via `scripts/run-semantic-harvest.ts`

---

## Future Methods

Potential edge generators not yet implemented:

- **TagWeaver** — Link documents sharing common tags
- **VectorSimilarity** — Create edges between semantically similar nodes
- **ExplicitLinks** — Parse `[[wikilinks]]` from markdown
