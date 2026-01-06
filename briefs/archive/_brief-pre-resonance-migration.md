#  Brief Pre Resonance Migration

### Project Brief: Schema Migration & Genesis (Pre-Resonance)

**File:** `briefs/brief-schema-migration.md`

**Objective:**
To refactor the database generation pipeline (`scripts/build_db.ts`) to support a **Multi-Domain Knowledge Graph**. This establishes the structural distinction between the "Persona" (Static Definition) and "Resonance" (Dynamic Experience) layers before we begin ingesting experience data.

**Constraints:**

  * **Non-Breaking:** The application must continue to function exactly as is after this migration.
  * **Rebuild-First:** We rely on the fact that `ctx.db` is ephemeral and rebuilt from source. We do not need SQL `ALTER TABLE` scripts; we modify the `CREATE TABLE` logic.

-----

## 1\. Schema Upgrade (`scripts/build_db.ts`)

**Task:** Modify the SQLite schema to include `domain` and `layer` columns for better partitioning.

**New Schema Definition:**

```typescript
db.exec(`
  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    label TEXT,
    type TEXT,       -- 'term', 'directive', 'heuristic' (Existing)
    domain TEXT,     -- 'persona' | 'resonance' | 'system' (NEW)
    layer TEXT,      -- 'ontology' | 'telemetry' (NEW - Optional but good for filtering)
    definition TEXT,
    external_refs TEXT
  );
`);
```

## 2\. Ingestion Logic Update

**Task:** Update the insertion logic in `scripts/build_db.ts` to populate these new fields.

1.  **Defaulting:** All nodes currently ingested from `conceptual-lexicon.json` and `cda.json` must be explicitly tagged:
      * `domain`: `'persona'`
      * `layer`: `'ontology'`
2.  **Code Update:** Update the `insertNode.run(...)` calls to include these constants.

## 3\. The Genesis Node Injection

**Task:** Inject a synthetic root node to anchor the graph.

  * **ID:** `000-GENESIS`
  * **Label:** `PolyVis Prime`
  * **Domain:** `system`
  * **Type:** `root`
  * **Definition:** "The singular origin point of the PolyVis context."

**Edge Logic (The Big Bang):**
Connect `000-GENESIS` to the "Heads" of the major trees to ensure graph connectivity without creating a hairball.

  * $\rightarrow$ `term-001` ("Mentation")
  * $\rightarrow$ `CIP-1` ("Persona")
  * $\rightarrow$ `OH-061` ("Orchestrator")

## 4\. Safety Update (`scripts/extract_terms.ts`)

**Task:** Ensure the term extractor doesn't accidentally pull in system nodes.

  * **Update Query:** Change the SQL query to explicitly filter for the persona domain.
    ```sql
    WHERE domain = 'persona' AND counts.neighbor_count >= 2
    ```

-----

## 5\. Implementation Checklist

  - [ ] **Schema:** Update `scripts/build_db.ts` with new columns.
  - [ ] **Genesis:** Implement `insertGenesisNode()` function in build script.
  - [ ] **Ingestion:** Update existing loop to set `domain='persona'`.
  - [ ] **Safety:** Update `scripts/extract_terms.ts` to filter by domain.
  - [ ] **Verify:** Run `bun run scripts/build_db.ts` and inspect `ctx.db` to confirm new columns and Genesis node exist.
  - [ ] **Visual Check:** Launch `bun run dev` and confirm the graph still renders (Genesis node should appear as a central anchor).

