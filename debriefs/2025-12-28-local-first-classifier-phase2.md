---
date: 2025-12-28
tags: [local-first, classifier, pipeline, integration, phase-2]
---

## Debrief: Local-First Classifier Phase 2 — End-to-End Pipeline

### Summary

Validated the complete **Sieve and Net** pipeline from classification through database integration. Added TypeScript test scripts and regex fallback extraction for offline operation.

---

## Accomplishments

- **Classifier Bridge Verified:** Created `scripts/test-classifier.ts` that invokes Python SetFit via Bun subprocess. Achieved **8/8 tests passed (100%)** across all four classes (DEF, DIR, LOCUS, NOISE) with >90% confidence on each.

- **Regex Fallback Extraction:** Added `_extract_with_regex()` to `harvester.py` that handles `IS_A` and `IMPLEMENTS` patterns when Llama server is unavailable. Enables offline operation.

- **Full Pipeline Integration:** Created `scripts/run-semantic-harvest.ts` that orchestrates:
  1. Python harvester invocation
  2. `knowledge_graph.json` artifact loading
  3. ResonanceDB insertion via `loadIntoResonance()`
  4. Database verification

- **Test Run Results:**
  - Processed 15 briefs from `briefs/local-first-classifier/`
  - Extracted 17 nodes (15 documents, 2 concepts)
  - Created 4 semantic edges with confidence metadata
  - Final DB state: 486 nodes, 498 edges

---

## Problems

- **Markdown Noise in Extractions:** Regex patterns captured markdown formatting (e.g., `**bold**`) in entity names. The `USER: "A Locus Tag` extraction shows incomplete parsing. Would be cleaner with Llama extraction.

- **PyTorch UserWarning Spam:** Every classifier call emits a tensor copy warning. Suppressed in grep output but should be fixed in `inference_engine.py`.

---

## Lessons Learned

- **Offline-First Design Pays Off:** The regex fallback allows the pipeline to function without the heavy Llama server, enabling quick iteration and testing.

- **Subprocess Bridge is Robust:** The `Bun.$` subprocess pattern reliably passes data between TypeScript and Python with JSON as the interchange format.

- **Semantic Edge Metadata Works:** The schema v4 migration correctly stores `confidence` and `context_source` on edges, visible in database queries.

---

## Files Changed

| Action | File |
|--------|------|
| NEW | `scripts/test-classifier.ts` |
| NEW | `scripts/run-semantic-harvest.ts` |
| MODIFIED | `ingest/harvester.py` (regex fallback) |
