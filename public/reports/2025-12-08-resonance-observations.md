# Report: Resonance Convergence & Pre-Migration

**Date:** 2025-12-08
**Status:** Analysis Complete

## 1. Observations

### The Two Graphs
We currently have two distinct graph ecosystems:
1.  **The Conceptual Graph (`ctx.db`):** Managed by `scripts/build_db.ts`. Contains "Ontology" (Concepts, Terms definitions).
2.  **The Experience Graph (`resonance.db`):** Managed by the new `resonance` CLI. Contains "Wisdom" (Playbooks, Debriefs).

### The Migration Brief (`_brief-pre-resonance-migration.md`)
This brief mandates immediate upgrades to the **Conceptual Graph (`ctx.db`)**:
*   **Schema Update:** Add `domain` and `layer` columns.
*   **Genesis Node:** Inject `000-GENESIS` as the root anchor.
*   **Safety:** Filter out system nodes during term extraction.

### The Resonance Brief (`_brief-resonance-summary.md`)
This brief defines `resonance` as a "Knowledge Package Manager".
*   It requires a **Configuration Module** (currently missing in v1.0).
*   It explicitly mentions "ingests artifacts into a local graph (`resonance.db`)".

## 2. The Gap
The user verified that "the target database is `ctx.db`" and it will be renamed to `resonance.db` later.
*   **Current State:** `resonance sync` creates a *new* DB (`.resonance/resonance.db`) with a simple schema.
*   **Target State:** `resonance sync` should likely interact with the *existing* `ctx.db` (soon to be `resonance.db`), or at least reside in the same ecosystem.

## 3. Proposal

### Phase 1: Configuration (Immediate)
Implement the missing configuration layer in the `resonance` CLI.
*   Create `resonance/src/config.ts`.
*   Load `resonance.settings.json` (defaults to `.resonance/resonance.settings.json`).
*   Define `dbPath` in settings.
*   **Action:** Update `resonance sync` to respect this path (allowing us to point it at `ctx.db` or `resonance.db` as needed).

### Phase 2: Pre-Resonance Migration (Legacy Script Upgrade)
Before strictly relying on the `resonance` CLI for everything, "fix" the `ctx.db` generation.
*   Modify `scripts/build_db.ts`:
    *   Add `domain`, `layer` to table creation.
    *   Insert `000-GENESIS`.
*   Modify `scripts/extract_terms.ts`:
    *   Add domain filtering.

### Phase 3: Unification
*   Once `ctx.db` has the new schema, and `resonance` has config, we can decide:
    *   Does `resonance sync` *append* to `ctx.db`?
    *   Or do we retain two tables (`terms` vs `nodes`) in one DB?
    *   *Recommendation:* Use `resonance.settings.json` to define the target DB path, effectively merging the files storage-wise.

## 4. Execution Plan
1.  **Implement Config:** `resonance/src/config.ts` & `settings` schema.
2.  **Execute Migration:** Update `scripts/build_db.ts` to implement Genesis/Schema changes.
3.  **Verify:** Check `ctx.db` integrity.
