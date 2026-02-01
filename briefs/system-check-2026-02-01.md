# Full System Check Brief
**Date:** 2026-02-01
**Objective:** Verify system integrity, configuration compliance, and pipeline functionality (Document Ingestion + Conceptual Lexicon).

## 1. Pre-Flight Checks
*   [ ] **Configuration:** Verify `amalfa.settings.json` is the sole config file (SSOT).
*   [ ] **Commit:** `git add amalfa.settings.json amalfa.settings.example.json .gitignore` (Ensure SSOT is tracked).
*   [ ] **Doctor:** Run `amalfa doctor` to verify environment and SSOT compliance.
*   [ ] **Baseline Stats:** Record `amalfa stats`.
*   [ ] **Log Check:** Inspect `harvest.log` and `harvest-final.log` for capture.

## 2. Test Suite
*   [ ] **Harness Test:** Run `bun run src/pipeline/lexicon/tests/harness.ts` to verify ingestion logic in isolation.
*   [ ] **Lint/Check:** Run `bun run check` to ensure code quality.

## 3. Document Ingestion Pipeline (Pipeline A)
*   [ ] **Command:** `amalfa init --force`
*   **Purpose:** Re-scans markdown files and populates the graph with "Source Documents".
*   **Verification:** Check node count increment.

## 4. Conceptual Lexicon Pipeline (Pipeline B)
*   [ ] **Step 1: Harvest:** `bun run src/pipeline/lexicon/01-harvest.ts`
*   [ ] **Step 2: Refine:** `bun run src/pipeline/lexicon/02-refine.ts`
*   [ ] **Step 3: Enrich:** `bun run src/pipeline/lexicon/03-enrich.ts`
*   [ ] **Step 4: Embed:** `bun run src/pipeline/lexicon/04-embed.ts`
*   [ ] **Step 5: Survey:** `bun run src/pipeline/lexicon/05-survey-edges.ts`
*   [ ] **Step 6: Ingest:** `bun run src/pipeline/lexicon/06-ingest.ts`
*   **Purpose:** Ingests the conceptual lexicon overlay.

## 5. Post-Flight Verification
*   [ ] **Final Stats:** Record `amalfa stats`.
*   [ ] **Comparison:** Ensure Node/Edge counts match expectations (>900 Nodes).
*   [ ] **Dashboard:** Verify dashboard is reachable (curl check).

## Notes
*   **SSOT:** All operations must respect `amalfa.config.json` -> `.amalfa/resonance.db`.
