---
date: 2025-12-26
tags: [local-first, classifier, setfit, llama-cpp, schema-migration, python-integration]
---

## Debrief: Local-First Classifier Phase 1 Implementation

### Summary

Implemented the foundational **"Sieve and Net"** sovereign ingestion pipeline based on the extensive briefs in `briefs/local-first-classifier/`. This phase established the infrastructure for hybrid Python-TypeScript semantic extraction.

---

## Accomplishments

- **Python ML Pipeline Created:** Built complete `ingest/` directory with SetFit classifier infrastructure:
  - `train_classifier.py` — Few-shot model trainer
  - `inference_engine.py` — Classification wrapper with confidence scoring
  - `harvester.py` — Sieve+Net coordinator with Hollow Node URI support
  - `graph_triples.gbnf` — GBNF grammar for constrained LLM output
  - `training_data.json` — 32 curated examples (8 per class)

- **TypeScript Integration Completed:** Created `src/pipeline/SemanticHarvester.ts` that bridges Python via Bun subprocess, with `loadIntoResonance()` method for database integration.

- **Schema Migration v4 Applied:** Added semantic edge metadata columns to both Drizzle ORM (`src/db/schema.ts`) and SQLite migration (`src/resonance/schema.ts`):
  - `confidence` — SetFit classification confidence (REAL, default 1.0)
  - `veracity` — Judicial truth weight for Louvain clustering (REAL, default 1.0)
  - `context_source` — Source file path (TEXT)

- **Llama Server Script Created:** `experiments/enlightenment/start_llama_server.sh` for GBNF-enforced extraction.

- **Database Integrity Verified:** Backup created, migration applied, ingestion pipeline ran successfully (469 nodes, 494 edges, 284 vectors).

---

## Problems

- **Brief Documentation Sprawl:** The 12 brief documents contained overlapping and sometimes contradictory information (e.g., different schema proposals). Required careful synthesis to identify the canonical approach.

- **Pre-existing Orphaned Edges:** Ingestion flagged 2 orphaned edges unrelated to our changes. These exist in the database pointing to non-existent nodes — likely from a previous incomplete ingestion run.

---

## Lessons Learned

- **Subprocess Pattern Wins:** Keeping heavy ML dependencies (PyTorch, SetFit) isolated in Python venv and invoking via subprocess is cleaner than trying to bridge Python/TypeScript at the library level. JSON artifact handoff is explicit and debuggable.

- **Drizzle + Raw SQL Dual Schema:** The project maintains both Drizzle ORM types (`src/db/schema.ts`) and raw SQL migrations (`src/resonance/schema.ts`). Both must be updated in sync when schema changes.

- **Migration v4 Pattern:** The existing migration system handles schema evolution gracefully. New columns are added with safe defaults and wrapped in duplicate-column try/catch.

---

## Next Steps

User action required to complete Phase 1:
1. Create Python venv: `cd ingest && python3 -m venv .venv`
2. Install dependencies: `.venv/bin/pip install -r requirements.txt`
3. Train classifier: `.venv/bin/python train_classifier.py`
4. (Optional) Download Llama model: `ollama pull mistral:7b-instruct-v0.3-q4_K_M`

Phase 2 will focus on end-to-end testing of the Sieve+Net pipeline and integration with the Sigma.js frontend for graph visualization.
