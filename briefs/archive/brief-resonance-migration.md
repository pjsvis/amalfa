# Brief: Resonance Engine Migration

**Date:** 2025-12-16
**Status:** In Progress
**Objective:** Consolidate core Resonance Engine logic from `scripts/` to `src/resonance/` to enable "lift and shift" portability.

## Strategy
We function atomically:
1.  **Move:** Relocate a single file.
2.  **Refactor:** Fix imports and paths.
3.  **Verify:** Run `tsc --noEmit` and execute the script (if applicable).
4.  **Document:** Update the source README (remove) and destination README (add).
5.  **Commit:** (Implied) We persist a stable state before moving to the next.

## Migration Manifest

### Phase 1: Completed (Initial Consolidation)
- [x] `scripts/pipeline/ingest.ts` -> `src/resonance/cli/ingest.ts`
- [x] `scripts/daemon.ts` -> `src/resonance/daemon.ts` (Merged logic)

### Phase 2: Remaining Engine Components (To Do)

#### 1. Transformation Logic
- **Source:** `scripts/transform/transform_cda.ts`
- **Destination:** `src/resonance/transform/cda.ts`
- **Purpose:** Transforms raw CDA JSON into graph nodes.

#### 2. Term Extraction
- **Source:** `scripts/pipeline/extract_terms.ts`
- **Destination:** `src/resonance/pipeline/extract.ts`
- **Purpose:** Extracts high-value terms from the graph for the frontend.

#### 3. Database Migration
- **Source:** `scripts/pipeline/migrate_db.ts`
- **Destination:** `src/resonance/cli/migrate.ts`
- **Purpose:** Manages SQLite schema changes.

#### 4. Document Transformation
- **Source:** `scripts/pipeline/transform_docs.ts`
- **Destination:** `src/resonance/pipeline/transform_docs.ts`
- **Purpose:** Prepares markdown documents for ingestion.

## Directory Structure (Target)
```
src/resonance/
├── cli/          # Entry points (ingest, migrate)
├── transform/    # Core logic (cda, docs?)
├── pipeline/     # Pipeline steps (extract, transform_docs?)
├── daemon.ts     # Service Manager
├── db.ts         # DB Interface
└── ...
```
