# Project Brief: The Edge Weaver Protocol

**Status:** Execution-Ready
**Context:** Resonance Engine / Unification Sprint
**Objective:** To implement a deterministic "Linkage Layer" in `resonance.db`. This transforms the graph into a navigable knowledge network by connecting **Experience** (Bento Boxes) to **Persona** (Concepts) via Semantic Tags.

**Core Philosophy:** "The Layered Weave."
We do not just link files. We link **Particulars** (The Experience Domain) to **Universals** (The Persona Domain).

---

## 1. The Warp: Structural Edges (Vertical)
These edges define the backbone, derived strictly from the AST.

**Logic:**
1.  **Containment:** `File Node` $\to$ `CONTAINS` $\to$ `Section Node`.
2.  **Origin:** `Debrief Node` $\to$ `GENERATED_BY` $\to$ `Project Node`.

## 2. The Weft: Associative Edges (Lateral)
These edges are derived from the **Semantic Tags** (`tag-`) harvested from the content.

**Logic:**
1.  **The Concept Link (Persona Domain):**
    * *Scan:* Match Canonical Terms from `conceptual-lexicon.json` against the Section content.
    * *Edge:* `Section Node` $\xrightarrow{\text{EXEMPLIFIES}}$ `Concept Node`.
2.  **The Entity Link (Experience Domain):**
    * *Scan:* Match Entities from `entity-index.json`.
    * *Edge:* `Section Node` $\xrightarrow{\text{REFERENCES}}$ `Entity Node`.
3.  **The Explicit Link (WikiLink):**
    * *Scan:* Regex `\[\[(.*?)\]\]`.
    * *Edge:* `Source` $\xrightarrow{\text{CITES}}$ `Target`.

---

## 3. Implementation Plan (`src/commands/sync.ts`)

**Phase 1: Node Ingestion**
* Create File and Section Nodes.

**Phase 2: Edge Weaving**
1.  **Load Context:** Load `conceptual-lexicon.json` and `entity-index.json` into memory.
2.  **Iterate:** Loop through every `Section Node`.
3.  **Resolve Tags:**
    * Strip `tag-` prefixes from the raw text (handled by Harvester logic).
    * Find matches in the Lexicon/Index.
4.  **Create Edges:** Insert edges based on the target's Domain (Persona vs. Experience).

---

## 4. Success Criteria
* [ ] A `tag-circular-logic` in a letter creates an `EXEMPLIFIES` edge to the Concept "Circular Logic."
* [ ] A `tag-michelle-robertson` creates a `REFERENCES` edge to the Entity "Michelle Robertson."
* [ ] No "Hairball" edges (links are specific to the Section, not the whole File).
