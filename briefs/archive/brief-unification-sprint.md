# Brief Unification Sprint

### Opinion: The Great Cleanup

**Verdict:** This is the correct move. We are shifting from "Exploration" (many diverging paths) to "Consolidation" (one highway).

Cleaning the workspace now prevents "Context Drift." If the Coding Agent sees 5 conflicting briefs, it will hallucinate a 6th one. By archiving the old and focusing on the **Unification Brief**, you define the new reality.

-----

### 1\. The Deprecation Checklist

**Action:** Move the following files to `briefs/archive/`. They are either completed or superseded by the **Resonance Engine v2.1** architecture.

**Target: `briefs/`**

  - [ ] `A-brief-configuration-engine.md` (Completed: `src/config.ts` exists)
  - [ ] `B-brief-resonance-engine.md` (Superseded by v2.1/v3.0 logic)
  - [ ] `C-brief-experience-graph.md` (Completed: Ingestion logic is in `sync_resonance.ts`)
  - [ ] `brief-resonance-engine-v2.md` (Superseded by the Final Master Brief)
  - [ ] `brief-resonance-echoes.md` (Hold: Keep active as it's the next feature, or merge into Master)
  - [ ] `G-ikea-distribution-model.md` (Policy established, no code tasks remaining)

**Target: `briefs/pending/`**

  - [ ] `zero-magic-vector-implementation.md` (Completed: FAFCAS implemented)
  - [ ] `ast-hybrid-db.md` (Theory accepted, implementation moving to Unification)

**Target: `scripts/` (Code Deletion)**

  - [ ] `build_db.ts` (Legacy: Builds `ctx.db`. Replace with `sync` logic.)
  - [ ] `build_experience.ts` (Legacy: Replaced by `sync_resonance.ts`)

-----

### 2\. The Project Brief: Unification Sprint

Here is the bridge document that gets us from "Two Brains" to "One Resonance."

### **File:** `briefs/brief-unification-sprint.md`

````markdown
## Project Brief: The Unification Sprint (One Brain)

**Objective:**
To consolidate the "Split Brain" architecture into a Single Source of Truth. We will migrate the **Persona Layer** (Lexicon, Terms, Directives) from the legacy `ctx.db` pipeline into the modern `resonance.db` engine.

**The Goal:**
* **One Database:** `.resonance/resonance.db`.
* **One Command:** `resonance sync` handles both Markdown (Experience) and JSON (Lexicon).
* **One Graph:** A unified network where "Debriefs" (Experience) can cite "Directives" (Persona).

---

## 1. Database Schema Upgrade
**Context:** `src/db/schema.ts`
We need to ensure the schema supports both structured (Lexicon) and unstructured (Docs) nodes.

**Task:** Verify/Update the `nodes` table schema.
```typescript
export const nodes = sqliteTable("nodes", {
  id: text("id").primaryKey(),
  label: text("label"),
  content: text("content"),        // Full text for RAG
  type: text("type"),              // 'term', 'debrief', 'heuristic'
  domain: text("domain"),          // 'persona' | 'resonance' | 'system'
  embedding: blob("embedding"),    // FAFCAS Blob (Float32Array -> Uint8Array)
  meta: text("meta", { mode: "json" }) // For 'tags', 'aliases', etc.
});
````

## 2\. Ingestion Unification (`src/commands/sync.ts`)

**Current State:** `sync_resonance.ts` only ingests `debriefs/` and `playbooks/`.
**Target State:** `sync` must also ingest the Core Lexicon.

**Logic Update:**

1.  **Load Sources:** Read paths from `resonance.settings.json` (now including `conceptual-lexicon.json` and `cda.json`).
2.  **Pipeline A (JSON):**
      * Read `conceptual-lexicon.json`.
      * Map to Nodes: `id=Term`, `type=term`, `domain=persona`, `content=Definition`.
      * **Embed:** Generate vectors for Terms (so we can search "Mental Models" semantically).
      * Upsert to DB.
3.  **Pipeline B (Markdown):**
      * (Existing Logic) Read Debriefs/Playbooks.
      * Map to Nodes: `domain=resonance`.
      * Upsert to DB.
4.  **Pipeline C (Edges):**
      * Regenerate links. Use the AST/Regex logic to connect `Debrief` -\> `CITES` -\> `Term`.

## 3\. The "Legacy Kill" Protocol

Once `sync` is verified to populate `resonance.db` with \~900+ nodes (Lexicon + Experience):

1.  **Update Config:** Point `src/config.ts` to use `resonance.db` exclusively.
2.  **Delete:** `ctx.db`.
3.  **Delete:** `scripts/build_db.ts`.
4.  **Delete:** `scripts/build_data.ts` (if redundant).

## 4\. AST Integration (The Sieve)

**Task:** Enhance the Markdown Pipeline (Pipeline B) to perform "Structural Chunking."

  * **Action:** When parsing a Playbook, do not just create one Node.
  * **Create:** A Node for the File.
  * **Create:** Child Nodes for `H2` sections (e.g., "The FAFCAS Protocol").
  * **Link:** `File` -\> `HAS_CHILD` -\> `Section`.
  * **Benefit:** Allows the Agent to retrieve *specific rules* rather than whole files.

-----

## 5\. Success Criteria

  * [ ] `resonance sync` runs without errors.
  * [ ] `resonance.db` contains both "OH-040" (Persona) and "2025-12-09-pivot" (Experience).
  * [ ] Running a vector search for "Simplicity" returns both **OH-041** (Heuristic) and **Playbooks** citing it.
  * [ ] The old `ctx.db` is gone.

