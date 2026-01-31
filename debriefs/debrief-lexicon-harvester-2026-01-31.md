# Debrief: Lexicon Harvester ("The Smelter") v1.0
**Date:** 2026-01-31
**Agent:** Antigravity
**Status:** ✅ Complete

## 1. Objective
Implement the "Smelter" utility to transform raw sidecar extraction data into a refined "Golden Lexicon" candidate list.

## 2. Key Accomplishments
- **JSONL Architecture:** Adopted `JSONL` for streamable, scalable intermediate storage.
- **Node-First Logic:** Implemented `LexiconHarvester.ts` following the "Generate -> Count -> Commit" strategy.
- **CLI Integration:** Added `amalfa harvest-lexicon` command.
- **Performance:** Verified JSONL performance (0.84x small scale / O(1) memory scale).
- **Result:** processed 499 sidecars -> 4219 unique candidates in <1s.

## 3. Technical Decisions
- **Missing UUIDs:** The `LangExtract` cache sidecars do not contain Source UUIDs. Adapted the harvester to fallback to the **Content Hash** (filename) as the Source ID. This preserves traceability even without re-scanning documents.
- **Bun Streams:** Used `Bun.file(path).stream()` converted to Node Readable streams for robust JSONL processing.

## 4. Problems & Solutions
- **CLI Corruption:** A merge error duplicated the `main` function in `src/cli.ts`.
    - *Fix:* Surgically removed duplicate block and restored `cmdHarvest` import.
- **Cache Content:** Cache files were raw `entities` arrays, missing top-level metadata.
    - *Fix:* Updated logic to handle cache format directly.

## 5. Next Steps
- **Triage UI:** We need a way to review these 4219 candidates.
- **Edge Generation:** Phase 2 ("The Surveyor") to count connections between Golden Nodes.
- **Stop-List:** Populate `stop-list.json` with obvious noise found in the 4219 candidates.
