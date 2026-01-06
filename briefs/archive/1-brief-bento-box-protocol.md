# Project Brief: The Bento Box Protocol (Document Normalization)

**Status:** Execution-Ready
**Context:** Resonance Engine / Unification Sprint
**Objective:** To implement a "Normalization Layer" in the ingestion pipeline. This ensures all input documents conform to a strict semantic hierarchy (The Bento Standard) *before* they are parsed into the Knowledge Graph.

**Core Philosophy:** "The Atomic Unit of Knowledge."
We define the **Bento Box** not by its level (H2/H3), but by its role as a container of *Atomic Meaning*. By supporting **Two Levels of Nesting**, we ensure retrieval is precise (H3) while maintaining context (H2).

---

## 1. The "Bento" Standard
Every document must conform to this schema to be considered "Resonance-Ready."

**The Schema:**
1.  **The Container (File):** Must have frontmatter and a filename that implies its ID.
2.  **The Label (H1):** ONE and ONLY ONE H1 tag at the top.
3.  **The Box (H2 & H3):** The atomic units of storage.
    * **Logic:** Both H2 and H3 headers are parsed as **Section Nodes**.
    * **Hierarchy:** H2 Nodes generate `CONTAINS` edges to their child H3 Nodes.
    * **Orphans:** Text must live under an H2 or H3. Text directly under H1 is discouraged.

---

## 2. The Normalization Logic (`scripts/normalize_docs.ts`)

We implement a "Linter & Fixer" script that runs before the AST Sieve.

**Heuristic A: The "Headless" Fix**
* *Detection:* Document starts with text, no H1.
* *Action:* Insert `# {Filename_Title_Case}` at line 0.

**Heuristic B: The "Shouting" Fix**
* *Detection:* Document uses multiple H1s.
* *Action:* Demote subsequent H1s to H2s.

**Heuristic C: The "Deep Nesting" Flattening**
* *Detection:* Document uses H4, H5, H6.
* *Action:* These are treated as **Content**, not Nodes. They remain part of the parent H3's body text. We stop the graph granularity at H3 to prevent fragmentation.

---

## 3. Integration Plan

**A. The Pipeline Update**
1.  **Read File.**
2.  **Run Normalizer.**
3.  **AST Sieve:** Parse content into **Section Nodes** (H2 and H3).
4.  **Graph Construction:**
    * Create File Node.
    * Create H2 Nodes (Link: `File` $\to$ `H2`).
    * Create H3 Nodes (Link: `H2` $\to$ `H3`).
5.  **Write:** Upsert all Nodes to `resonance.db`.

**B. The Verification**
* *Graph Check:* Edges originate from `Section: Resource Allocation` (H3), not just `Section: Strategy` (H2).

---

## 4. Success Criteria
* [ ] `scripts/normalize_docs.ts` exists and passes unit tests.
* [ ] The Graph structure reflects the hierarchy: `File > H2 > H3`.
* [ ] Tags found in an H3 creates an edge *only* from that H3, preserving precision.