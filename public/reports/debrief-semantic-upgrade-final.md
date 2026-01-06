# Debrief: Semantic Linking Upgrade & Resonance Correction

**Date:** 2025-12-12
**Participants:** Antigravity, User

## 1. Objectives & Outcomes
*   **Enhance Semantic Linking:** Integrated `mgrep` into the Experience Graph pipeline.
    *   *Result:* `mgrep` was integrated but deemed too slow (~100s latency) for the dev loop.
    *   *Pivot:* Validated a **Pure Bun Vector Engine** (Ollama + SQLite BLOBs) as a superior local-first alternative.
*   **Database Unification:** Resolved a regression where `ctx.db` (legacy) was being treated as the source of truth.
    *   *Outcome:* `public/resonance.db` is now the Single Source of Truth. `ctx.db` is generated only as a compatibility artifact for the Sigma frontend.
*   **Tooling Showcase:** Updated with field notes on `rg`, `mgrep`, `ast-grep`, and the new Local Vector Engine.

## 2. Technical Decisions
*   **Pure Bun Vector Engine:**
    *   **Problem:** `bun:sqlite` cannot load `sqlite-vec` extension on macOS. `mgrep` is cloud-dependent.
    *   **Solution:** Store embeddings as `BLOB` (Float32Array) in the main DB. Perform brute-force Cosine Similarity in JavaScript.
    *   **Performance:** Excellent for our dataset scale (< 10k nodes). Zero external infra required (assuming user has Ollama).
*   **Ingestion Pipeline:**
    *   Disabled `mgrep` block in `ingest_experience_graph.ts` to restore sub-second build times.
    *   Added `VectorEngine.ts` as the future-proof capability for semantic linking.

## 3. Issues Resolution
*   **404s on Docs:** Fixed by moving docs to `public/docs` and correcting URLs.
*   **Missing Edges:** Caused by Ingestion writing to the wrong DB path. Fixed by unifying settings to `resonance.db`.
*   **Schema Mismatch:** Manually patched `nodes` (missing `external_refs`) and `edges` (renamed `relation` -> `type`) to match the Resonance Schema.

## 4. Next Steps
1.  **Integrate VectorEngine:** Fully replace the disabled `mgrep` block in ingestion with `VectorEngine.embed()` calls (batched).
2.  **Frontend Update:** Eventually teach Sigma Explorer to read `resonance.db` directly (simplifying the build).
