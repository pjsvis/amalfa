# Project Brief: The Semantic Harvester (Scaffolding Protocol)

**Status:** Execution-Ready
**Context:** Resonance Engine / Unification Sprint
**Objective:** To implement a high-precision "Discovery Engine" that harvests emerging concepts using explicit **Semantic Tags** (`tag-token`). This operationalises the **"Air-Lock"** workflow to validate concepts, cluster them via embeddings, and route them to the correct Graph Domain.

**Core Philosophy:** "Tag, You're It."
We replace the cognitive burden of "defining" with the imperative action of "tagging." Agents and Users simply *flag* concepts in real-time (`tag-`), leaving the heavy lifting of definition for a dedicated "Gardening" phase.

---

## 1. The Strategy: Active Discovery

**The Token Standard:**
* **Syntax:** `tag-{concept-name}` (e.g., `tag-circular-logic`, `tag-statutory-harm`).
* **Constraint:** Use **Prefixes** (`tag-risk`) not Suffixes (`risk-tag`) for imperative clarity and visual scanning.

**The Bootstrap Protocol (Domain Seeding):**
* Agents load a `domain-tags.md` file at session start.
* **Directive:** "If you see evidence of these known domain concepts (e.g., Regulatory Breach), you MUST tag them. Do not invent new tags for known concepts."

**The Double-Loop Protocol:**
* **Action:** Agents run a "Wrap-Up" scan on their own output.
* **Output:** Append a `metadata` block with `tag-` candidates discovered during the task.

---

## 2. The Workflow: The "Air-Lock" Cycle

**Phase 1: Mutation (The Tag)**
* User/Agent writes `tag-procedural-default` in a Bento Box.
* State: **Scaffolding.**

**Phase 2: Harvesting (The Scout)**
* **Tool:** `resonance harvest` (CLI).
* **Logic:** Scans all files for `tag-[a-z-]+`.
* **Output:** Collects unique, unknown tags into a buffer.

**Phase 3: Curation (The Smart Garden)**
* **Tool:** Embedding Model.
* **Logic:** Clusters tags by semantic similarity.
* **Output:** Populates `_staging.md` with organized clusters.

**Phase 4: Ratification (The Sorting Hat)**
* **Command:** `resonance promote`.
* **Action:** User defines terms and routes them:
    * **Persona Domain:** Universal Concepts $\to$ `conceptual-lexicon.json`.
    * **Experience Domain:** Specific Entities $\to$ `entity-index.json`.
* **Cleanup:** System strips the `tag-` prefix from the source text.

---

## 3. Success Criteria
* [ ] Worker agents successfully use `tag-` syntax.
* [ ] `resonance harvest` identifies tags and clusters them in `_staging.md`.
* [ ] The Promote CLI forces a Domain Decision (Persona vs. Experience).
* [ ] The system successfully strips the `tag-` scaffolding after ratification.