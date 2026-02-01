# Full System Check Brief
**Date:** 2026-02-01  
**Updated:** 2026-02-01 14:00 (Post Cross-Domain Pipeline)
**Objective:** Verify system integrity, configuration compliance, and pipeline functionality (Document Ingestion + Conceptual Lexicon + Cross-Domain Linking).

## 1. Pre-Flight Checks
*   [ ] **Configuration:** Verify `amalfa.settings.json` is the sole config file (SSOT).
*   [ ] **Commit:** `git add amalfa.settings.json amalfa.settings.example.json .gitignore` (Ensure SSOT is tracked).
*   [ ] **Doctor:** Run `amalfa doctor` to verify environment and SSOT compliance.
*   [ ] **Baseline Stats:** Record `amalfa stats`.
*   [ ] **Log Check:** Inspect `.amalfa/logs/daemon.log` and related service logs for capture.

## 2. Test Suite
*   [ ] **Harness Test:** Run `bun run src/pipeline/lexicon/tests/harness.ts` to verify ingestion logic in isolation.
*   [ ] **FAFCAS Compliance:** Verify vector embeddings are unit-normalized (L2 norm = 1.0).
*   [ ] **Lint/Check:** Run `bun run check` to ensure code quality.

## 3. Document Ingestion Pipeline (Pipeline A)
*   [ ] **Command:** `amalfa init --force`
*   **Purpose:** Re-scans markdown files and populates the graph with "Source Documents".
*   **Expected Output:** ~797 document nodes (knowledge domain) with embeddings.
*   **Verification:** `sqlite3 .amalfa/resonance.db "SELECT COUNT(*) FROM nodes WHERE domain = 'knowledge';"` should return ~797.

## 4. Conceptual Lexicon Pipeline (Pipeline B)
*   [ ] **Step 1: Harvest:** `bun run src/pipeline/lexicon/01-harvest.ts`
*   [ ] **Step 2: Refine:** `bun run src/pipeline/lexicon/02-refine.ts`
*   [ ] **Step 3: Enrich:** `bun run src/pipeline/lexicon/03-enrich.ts`
*   [ ] **Step 4: Embed:** `bun run src/pipeline/lexicon/04-embed.ts`
*   [ ] **Step 5: Survey:** `bun run src/pipeline/lexicon/05-survey-edges.ts`
*   [ ] **Step 6: Ingest:** `bun run src/pipeline/lexicon/06-ingest.ts`
*   **Purpose:** Ingests the conceptual lexicon overlay.
*   **Expected Output:** ~915 lexicon nodes (lexicon domain) with embeddings.

## 5. Cross-Domain Edge Pipeline (Pipeline C) **NEW**
*   [ ] **Step 1: Generate:** `bun run src/pipeline/cross-domain/01-generate-edges.ts`
*   [ ] **Step 2: Ingest:** `bun run src/pipeline/cross-domain/02-ingest.ts`
*   **Purpose:** Creates semantic links between document and lexicon nodes.
*   **Expected Output:** ~4,575 "appears_in" edges linking knowledge ↔ lexicon domains.
*   **Verification:** `sqlite3 .amalfa/resonance.db "SELECT COUNT(*) FROM edges WHERE type = 'appears_in';"` should return ~4,575.

## 6. Service Infrastructure Verification **NEW**
*   [ ] **Dashboard Daemon:** Start `bun run src/services/dashboard-daemon.ts` and verify port 3013 responds.
*   [ ] **Health Check:** `curl http://localhost:3013/api/health` should return `{"status":"ok",...}`.
*   [ ] **Database Serving:** `curl -I http://localhost:3013/resonance.db` should return valid SQLite headers.
*   [ ] **Visualization:** Access dashboard and verify graph displays with proper node counts.

## 7. Post-Flight Verification
*   [ ] **Final Stats:** Record `amalfa stats`.
*   [ ] **Comparison:** Ensure Node/Edge counts match expectations:
    - **Nodes:** >1,600 (797 documents + 915 lexicon entities)
    - **Edges:** >6,000 (includes cross-domain links)
*   [ ] **Orphan Check:** Verify orphaned node count <200 (down from original 978).
*   [ ] **FAFCAS Verification:** Check vector norms are unit length (L2 norm ≈ 1.0).

## Notes
*   **SSOT:** All operations must respect `amalfa.settings.json` -> `.amalfa/resonance.db`.
*   **FAFCAS Protocol:** All vectors must be unit-normalized (L2 norm = 1.0) for optimized dot product search.
*   **Cross-Domain Edges:** Pipeline C connects knowledge and lexicon domains to reduce orphaned nodes.
*   **Service Dependencies:** Dashboard daemon (port 3013) required for visualization.
