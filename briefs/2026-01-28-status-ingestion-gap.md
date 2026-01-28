# Status Brief: Modular Toolbox & LangExtract Ingestion Gap

**Date:** 2026-01-28
**Session ID:** `v_73831f11f742bb6a`
**Agent:** Antigravity

## 🚨 Critical Issue: Ingestion Gap
We successfully implemented the **Modular Toolbox** and the **LangExtract Tool**, but verifying them revealed a deeper inconsistency in the project's state.

### The Symptom
Running the new `ember_extract` tool on `src/core` generated valid sidecars, but the **DB Squash failed** (0 nodes added). The squasher couldn't find the parent nodes (e.g., `src/core/GraphEngine.ts`) in the database.

### The Root Cause (Hypothesis)
The `amalfa init` command (our primary ingestion mechanism) may not be ingesting TypeScript files, despite the configuration saying it should.
- **Config:** `amalfa.config.json` sources include `src`.
- **Code:** `AmalfaIngestor.ts` uses `glob("**/*.{md,ts,js}")`.
- **Reality:** Querying the DB for `src/core` nodes yielded ambiguity (script failed on column name, but previous checks implied emptiness).

### ❓ Knowledge Gaps
1.  **Schema Reality:** Is the node label column named `label` or `title`? My verification script crashed on `label`.
2.  **Ingestion Scope:** Did the last `amalfa init` actually ingest `src/`? The logs showed "Found 712 markdown files" (explicitly mentioning markdown), which suggests TS files might be filtered out or the log message is misleading.
3.  **ID Generation:** Are we generating IDs like `src-core-graphengine` or `src/core/graphengine`? The mismatch would cause the squasher to miss the parent.

### 🛑 Context Rot Warning
We are making assumptions about the DB schema and content that are proving fragile. We need to stop, reset context, and approach the "Ingestion Verification" with fresh eyes.

## Next Session Objectives
1.  **Inspect Schema:** Run `PRAGMA table_info(nodes)` to definitively map the schema.
2.  **Verify Content:** Check if `src/core` files exist in the DB using the *correct* column names and ID patterns.
3.  **Fix Ingestion:** If missing, debug why `AmalfaIngestor` is skipping TS files despite the glob.
4.  **Re-Run Squash:** Once parents exist, re-run `ember_extract` to prove the end-to-end flow.

## Artifacts Ready for Next Session
- `scripts/verify/check-db-content.ts` (Needs column fix)
- `src/tools/EmberExtractTool.ts` (Implemented & waiting)
- `.amalfa/resonance.db.bak` (Safety backup created)
