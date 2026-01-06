# Debrief: Resonance Engine Pivot (DB & Deps)

**Date:** 2025-12-08
**Topic:** Database Architecture, Dependency Management, and Schema Integrity.

## 1. Context
We attempted to implement the "Resonance Engine" (v2.0) starting with `sqlite-vec` (Native Extension) and `@xenova/transformers` (JS Embeddings). We aimed for a "fresh start" in `.resonance/resonance.db`.

## 2. What We Learned
*   **Bun & Native Extensions:** `bun:sqlite` is statically compiled without `loadExtension` support on macOS. This kills `sqlite-vec` usage in the standard runtime.
*   **Dependency Hell:** `@xenova/transformers` depends on `sharp` for image processing, which failed to install/build in Bun despite `trustedDependencies`.
*   **The "Pure Bun" Pivot:** We verified that `bun:sqlite` CAN store `Float32Array` vectors as `BLOB`. This allows us to build a **Pure JS Vector Engine** (storing blobs, computing similarity in JS) without any fragile native dependencies.
*   **Schema Safety:** We almost wiped an existing DB. The user clarified that a Drizzle-managed Schema (`src/db/schema.ts`) already exists and must be respected/migrated, not overwritten.

## 3. Artifacts
*   `resonance/src/config.ts`: Zod schema for configuration.
*   `resonance/src/db.ts`: (POC) Class for hybrid DB operations.
*   `scripts/check_blob_fix.ts`: Proof that Bun handles BLOBs correctly.

## 4. Next Steps (Phase 3: Migration)
1.  **Audit Schema:** Analyze `src/db/schema.ts`.
2.  **Draft Migration:** Create a Drizzle migration to add `embedding` (BLOB) and `content` (TEXT) columns to the existing `nodes` table.
3.  **Test Migration:** Apply to a temporary copy of the DB.
4.  **Implement Sync:** Build the `sync` command against this evolved schema.
