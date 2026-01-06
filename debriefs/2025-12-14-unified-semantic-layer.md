# Debrief: Unified Semantic Layer Refactor

**Date:** 2025-12-14
**Focus:** Transitioning from probabilistic heuristics to deterministic structural integrity.

## 🏆 Objectives Achieved

1.  **Precision (BentoBoxer v2):**
    -   **Change:** Replaced Regex with **AST (`unified`)**.
    -   **Logic:** Groups content by **H1, H2, H3, H4**. If >300 tokens ("Seaman Constant"), fractures by HR or Paragraphs.
    -   **Result:** Nodes +90% (356 → 676). High-resolution "Goldilocks Chunks" suitable for Vector Search.

2.  **Clarity (EdgeWeaver Strict):**
    -   **Change:** Removed fuzzy matching (`processSemanticTokens`).
    -   **Logic:** Edges created *only* for explicit `[[WikiLinks]]` and tags `[tag: Concept]`.
    -   **Result:** Edges -64% (1645 → 592). Noise eliminated.

3.  **Hygiene (LouvainGate):**
    -   **Change:** Implemented Degree Centrality checks in `db.insertEdge`.
    -   **Logic:** If target degree > 50, require **Triadic Closure** (Shared Neighbor) to allow link.
    -   **Result:** Super Nodes reduced from 1 (`002-EXPERIENCE`) to **0**. Graph is sparse (Density 0.0013).

## ⚠️ The Rebuild Drama (Lessons Learned)

The Teardown & Rebuild phase was not smooth. We encountered two major failures ("Strikes") before success.

### Strike 1: Missing Script
-   **Issue:** Attempted to run `build:data`, but the underlying script `scripts/build_data.ts` had been deleted in a previous cleanup without updating `package.json`.
-   **Fix:** Pointed `build:data` to the correct unified pipeline script: `scripts/pipeline/sync_resonance.ts`.

### Strike 2: The Self-Overwrite
-   **Issue:** `sync_resonance.ts` read from `public/resonance.db` (via settings) and then attempted to copy it *over itself* at the end of the process. This race condition corrupted the database.
-   **Fix:**
    1.  Added check: Only copy if `source !== dest`.
    2.  Implemented `db.checkpoint()` to force `PRAGMA wal_checkpoint(TRUNCATE)` before closing, ensuring data durability.

### The Save: TimeWeaver
-   **Context:** Strict Mode correctly removed implicit "fuzzy" edges, but this accidentally severed the "Timeline" (next/prev debrief connections).
-   **Fix:** Implemented specific `TimeWeaver` logic:
    1.  Sort debriefs by `meta.created`.
    2.  Explicitly link sequential debriefs with `SUCCEEDS` edges.
-   **Outcome:** Restored 96 chronological steps in the narrative.

### The Optimization: Thin Node Protocol
-   **Insight:** We were storing full file contents (10k+ tokens) in the DB, bloating it to 6MB+.
-   **Fix:** "The DB is an Index, not a Warehouse." We now only store a 500-char preview. Full content remains on disk (Local-First).
-   **Result:** DB resized to 2.2MB (-63%) without losing search capability (Lead Embedding retained).

### The "Chesterton's Fence" (FastEmbed Validation)
-   **Context:** We considered ripping out `FastEmbed` to unify everything under Ollama.
-   **Review:** We realized `FastEmbed` provides MS-latency generation essential for ingestion, whereas Ollama is SLOW (~100ms).
-   **Lesson:** FAFCAS is a *Storage Protocol* (Blob/RAM), not a *Generation Mandate*. We kept the fence up for a reason.

## 📊 Final Metrics (Rebuild)

| Metric | Pre-Refactor | Post-Refactor | Delta |
| :--- | :--- | :--- | :--- |
| **Nodes** | 356 | **676** | 📈 +90% |
| **Edges** | 1645 | **592** | 📉 -64% |
| **Super Nodes** | 1 | **0** | ✅ Fixed |
| **Orphans** | 25 | **137** | ⚠️ Managed |

## ⏭️ Next Steps
With a pristine, deterministic graph ("The Brain"), we must now focus on **"The Voice"**:
-   **LLM Unification:** Abstracting `Ollama` vs `OpenAI` client logic.
-   **Query Layer:** Connecting the Graph context to the LLM generation.
