# Project Brief: Pipeline Integration & Documentation
**Status:** Execution-Ready | **Context:** Polyvis / Phase 2: Unification | **Target:** Coding Agent

## 1. Objective
To formalize the architecture of **Polyvis** by explicitly separating the **Factory** (Content Production) from the **Brain** (Knowledge Storage) and building the **Bridge** (Ingestion Pipeline) that connects them. This task involves code organization, architectural documentation, and the implementation of the `ingest` command.

## 2. Architectural Directive: The "Air Gap"
We are adhering to a strict separation of concerns to ensure the final "Map Server" is lightweight and the content pipeline is audit-safe.

### The Component Map
1.  **The Factory (`/src`)**:
    * **Role:** Deterministic Text Processing.
    * **Input:** Raw Canon Docs (`.md`).
    * **Output:** Bento-Boxed Files (`.md` with Locus Tags).
    * **Logic:** `BentoBoxer`, `FractureLogic`, `TagEngine` (Generation).
    * **State:** `bento_ledger.sqlite` (ID Consistency).

2.  **The Bridge (`/scripts/pipeline`)**:
    * **Role:** ETL (Extract, Transform, Load).
    * **Input:** Bento-Boxed Files + `bento_ledger.sqlite`.
    * **Action:**
        * Checks for new/changed Boxes (via Hash).
        * Generates Embeddings (via `resonance` service).
        * Weaves Edges (Structural + Semantic).
    * **Output:** Inserts/Updates into `resonance.db`.

3.  **The Brain (`/resonance`)**:
    * **Role:** Semantic Storage & Query Library.
    * **State:** `resonance.db` (The "Single File" Payload).
    * **Logic:** `ResonanceDB`, `Embedder`, Vector Search.

## 3. Implementation Tasks

### Task A: Code Organization & Cleanup
* **Move & Refactor:**
    * Ensure `EdgeWeaver.ts` is positioned to be used by the **Bridge** (Ingestion), not the **Boxer**. It relies on stable nodes, so it runs *after* boxing.
    * Verify `TagEngine.ts` in `src` is focusing purely on *generating* text tags, not writing to the DB.
* **Type Hygiene:**
    * Ensure strict import boundaries. `/src` should generally *not* import `/resonance` runtime code, only types if necessary. The **Bridge** script is allowed to import both.

### Task B: The Bridge Script (`scripts/pipeline/ingest.ts`)
Create the master ingestion script that populates the database.
* **Command:** `bun run scripts/pipeline/ingest.ts`
* **Logic:**
    1.  **Load Ledger:** Connect to `bento_ledger.sqlite` to read existing Locus IDs.
    2.  **Scan Content:** Read the `main` (boxed) Markdown files.
    3.  **Delta Check:** For each Box, compare its Hash against `resonance.db`.
        * *If Match:* Skip (Idempotency).
        * *If New/Changed:*
            * **Embed:** Generate Vector via `Resonance.Embedder`.
            * **Insert:** Write Node to `resonance.db`.
            * **Link:** Parse `tag-` tokens in content and create `RELATES_TO` edges.
            * **Sequence:** Create `NEXT` edges for sequential boxes.

### Task C: Documentation (The "Manual")
Create/Update `docs/architecture/pipeline.md` to canonize this workflow.
* **Diagram:** A textual diagram (Mermaid/ASCII) showing the flow: `Canon -> [Boxer] -> Main -> [Ingest] -> Resonance DB`.
* **Protocols:** Document the **"Diff-Safe"** audit protocol and the **"Single-File"** database delivery strategy.

## 4. Technical Constraints
* **Runtime:** Bun + TypeScript.
* **Vectors:** Use **FAFCAS** normalization (L2 Norm) before insertion (Scalar Product readiness).
* **Dependencies:**
    * `src` depends on `bento_ledger`.
    * `ingest` depends on `src` (parsers), `resonance` (db), and `filesystem`.

## 5. Success Criteria
* [ ] The `src` folder contains only "Factory" logic.
* [ ] `scripts/pipeline/ingest.ts` exists and successfully populates `resonance.db` from boxed files.
* [ ] `resonance.db` contains Vectors and Edges reachable via SQL.
* [ ] `docs/architecture/pipeline.md` accurately describes the system.

