# Master Project Brief: Polyvis Sovereign Knowledge Engine `[PB-MASTER]`

**Context:** Polyvis is a local-first, offline-capable knowledge graph that transforms unstructured Markdown into a queryable "Sovereign Artifact."
**Core Philosophy:** "Docs are Code." The filesystem is the source of truth; the database is the compiled artifact; the refinement process is a code review workflow.
**Goal:** Build a "Self-Healing" knowledge base that supports Semantic Search (Vector), Keyword Search (FTS), and Structural Navigation (Graph) in a single portable file.

---

## 1. Architecture: The "Monolith" Strategy

We utilize a single SQLite file (`polyvis.sqlite`) as the container for all data views. We strictly separate **Storage** (Filesystem) from **Index** (Database).

### 1.1 The Schema (Target State)
* **`chunks` (Semantic Core):** Stores the Vector Embeddings and Metadata.
* **`chunks_fts` (Search Index):** A Virtual Table (FTS5) for full-text search. *Note: Uses External Content pattern to avoid data duplication.*
* **`edges` (Topology):** Stores graph connections (`MENTIONS`, `RELATED_TO`).

### 1.2 The "Refinery" Pipeline (Data Flow)
1.  **Ingest (Pass 1):** Raw Markdown $\rightarrow$ Clean Text + Vectors + Explicit Links.
2.  **Refine (Pass 2):** Database Analysis $\rightarrow$ "Shadow Links" detected $\rightarrow$ Source Files Annotated.
3.  **Re-Ingest (Pass 3):** Annotated Files $\rightarrow$ New "Inferred Edges" in Graph.

---

## 2. Implementation Phases (The Grind)

### Phase 1: The Engine Room (Infrastructure)
*Goal: Establish the storage layer and the vector generation service.*

* [ ] **Task 1.1: The Vector Daemon**
    * **Spec:** Create `services/vector-daemon.ts` using `fastembed`.
    * **Requirement:** Must serve 384-dim float arrays via HTTP POST in <50ms.
    * **Artifact:** Resident Service.
* [ ] **Task 1.2: The Schema Migration**
    * **Spec:** Create `db/schema.sql`.
    * **Tables:** `chunks` (BLOB embedding), `chunks_fts` (FTS5), `edges` (Source/Target/Weight).
    * **Artifact:** `polyvis.sqlite` with correct structure.

### Phase 2: The Sieve (Ingestion Pipeline)
*Goal: Transform Markdown files into database records.*

* [ ] **Task 2.1: The Parser (Markdown Logic)**
    * **Spec:** Configure `marked` with a custom tokenizer for `[[WikiLinks]]`.
    * **Spec:** Configure `gray-matter` for Frontmatter extraction (`type`, `project`, `id`).
* [ ] **Task 2.2: The Ingest Script**
    * **Spec:** Create `scripts/ingest.ts`.
    * **Logic:**
        1.  Scan `data/raw/*.md`.
        2.  Parse Frontmatter & WikiLinks.
        3.  Call Vector Daemon for Embedding.
        4.  Atomic Dual-Write: Insert into `chunks` + `chunks_fts` + `edges`.
    * **Verification:** `bun run ingest` populates the DB.

### Phase 3: The Gardener (Refinement Loop)
*Goal: Automate the discovery of hidden connections.*

* [ ] **Task 3.1: The Analyzer**
    * **Spec:** Create `scripts/refine.ts`.
    * **Logic:** Find unconnected nodes with Vector Similarity > 0.90 OR shared Louvain Community.
* [ ] **Task 3.2: The Annotator (Write-Back)**
    * **Logic:** Append `` blocks to the source Markdown files for discovered links.
    * **Workflow:** User runs `git diff` to audit changes before committing.

### Phase 4: The Bridge (Frontend & Query)
*Goal: Visualize and query the artifact in the browser.*

* [ ] **Task 4.1: The UDF Injection**
    * **Spec:** Register `vec_dot` (Dot Product) in the `sqlite-wasm` instance on boot.
* [ ] **Task 4.2: The "Ghost Graph" UI**
    * **Spec:** Connect the "Find Similar" button to a SQL query using `vec_dot`.
    * **Visual:** Highlight non-connected, semantically similar nodes in Gold.

---

## 3. Technical Standards & Constraints
* **Runtime:** `Bun` (v1.1+).
* **Database:** `bun:sqlite` (Backend), `sqlite-wasm` (Frontend).
* **Vector Model:** `BAAI/bge-small-en-v1.5` (384 dimensions).
* **File Format:** `.md` (UTF-8).
* **Edge Types:**
    * `MENTIONS` (Explicit, Weight 1.0)
    * `RELATED_TO` (Inferred, Weight 0.5-0.9)

