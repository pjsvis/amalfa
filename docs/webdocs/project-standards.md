# PolyVis Project Standards & Protocols

## 1. Single Source of Truth (SSOT)

To prevent "Split Brain" architecture and configuration drift, the following rules are **ABSOLUTE**:

### Configuration
*   **File:** `polyvis.settings.json`
*   **Status:** This is the ONLY configuration file.
*   **Deprecated:** `resonance.settings.json` (Deleted)
*   **Usage:** All scripts and applications MUST load settings from this file. Hardcoded paths are PROHIBITED.

### Database
*   **File:** `public/resonance.db`
*   **Status:** This is the ONLY database file.
*   **Deprecated:** `scripts/ctx.db`, `public/data/ctx.db`, `public/ctx.db`.
*   **Usage:**
    *   **Backend:** Scripts write directly to `public/resonance.db`.
    *   **Frontend:** The web application fetches `/resonance.db` via HTTP.
    *   **Ingestion:** The pipeline creates/updates this file in place. There are no "intermediate" databases.

### Schema
*   **Definition:** `src/db/schema.ts` (Drizzle ORM)
*   **Status:** Defines the canonical structure for `nodes` and `edges`.
*   **Migration:** Any changes to the schema must be reflected in `scripts/pipeline/migrate_db.ts` or handled via Drizzle Kit.

## 2. Terminology
*   **Resonance Engine:** The collective set of tools (Ingest, Harvest, Embed, Weave) that operate on the graph.
*   **PolyVis:** The overarching project and the frontend visualization layer.
*   **Legacy:** Any reference to `ctx.db` is considered legacy and should be removed immediately upon discovery.

## 3. Developer Workflow
*   **Reset:** `bun run scripts/build_db.ts` (Rebuilds the graph from scratch)
*   **Ingest:** `bun run scripts/pipeline/ingest.ts` (Updates the graph with new content)
*   **Dev:** `bun run dev` (Starts the frontend)

## 4. Frontend Protocol
*   The frontend uses `sql.js` (WASM) to load the database in-memory.
*   It performs a `GET /resonance.db` request.
*   It does NOT rely on any other data artifacts (like `terms.json` or `experience.json`) for the core graph visualization, though `terms.json` may be used for autocomplete suggestions.
