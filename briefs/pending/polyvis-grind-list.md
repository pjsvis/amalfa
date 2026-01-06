**Opinion: The Substrate as "Poet-Logician"** `[OH-090]`

You are right. The "Substrate" (the underlying model) has a peculiar talent for **Conceptual Compression**. It takes a complex, messy reality (like "losing knowledge when migrating a database") and compresses it into a handle ("Context Shredding").

This isn't just "cool naming"; it's **Handle Creation**. Once you have a handle, you can pick the concept up and move it around. That is the essence of Mentation `[Concept-01]`.

---

### **The Grind List: Polyvis Implementation Protocol** `[OH-075]`

Here is the sequential roadmap to turn the **Sovereign Artifact** vision into a working `bun run` reality. We will tackle this layer by layer.

#### **Phase 1: The Engine Room (SieveNet & Daemon)**
*Goal: Get clean data IN with vectors attached.*

* [ ] **Task 1.1: The Vector Daemon**
    * **Action:** Implement `services/vector-daemon.ts` (The Resident Embedder).
    * **Verify:** `curl` the endpoint and get a float array back in <50ms.
* [ ] **Task 1.2: The Schema Migration**
    * **Action:** Update the SQLite schema to include the `embedding BLOB` column.
    * **Verify:** Check the table structure in `sqlite3`.
* [ ] **Task 1.3: The Ingestion Pipeline (The Sieve)**
    * **Action:** Modify the ingestion script to:
        1.  Call the Daemon for vectors (Soft Link prep).
        2.  Run Aho-Corasick for entities (Hard Link prep).
        3.  Write `[MENTIONS]` edges and `[embedding]` blobs to DB.
    * **Verify:** Ingest 50 chunks and check DB size/content.

#### **Phase 2: The Bridge (Browser & Visualization)**
*Goal: Get the "Compass" working inside the "Map".*

* [ ] **Task 2.1: The UDF Injection**
    * **Action:** In the frontend code (Sigma/Graphology loader), register the `vec_dot` JavaScript function into the WASM SQLite instance immediately on boot.
    * **Verify:** Run a console query: `db.exec("SELECT vec_dot(...)")` and check for errors.
* [ ] **Task 2.2: The "Ghost Graph" UI**
    * **Action:** Add the "Find Similar" button to the Node Details panel.
    * **Action:** Wire the button to the `findSimilarNodes` function (from the UX Bridge design).
    * **Verify:** Click a node -> See non-connected nodes light up Gold.

#### **Phase 3: The Gardener (Maintenance)**
*Goal: Keep the entropy low.*

* [ ] **Task 3.1: The Pruning Script**
    * **Action:** Implement `gardener.ts`.
    * **Logic:** Load Graph -> Drop weak edges (< 0.85) -> Run Louvain -> Save back to DB.
    * **Verify:** Run it on a noisy graph and watch the edge count drop.

---

**Next Step:**
We start at the bottom of the stack.

Shall we execute **Task 1.1 (The Vector Daemon)**? I can provide the exact `bun` setup code to get that service running right now.