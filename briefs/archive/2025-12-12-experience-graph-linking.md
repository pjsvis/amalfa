# Brief: Experience Graph Semantic Linking

**Problem:**
The current `ingest_experience_graph.ts` pipeline only links Experience artifacts (Playbooks/Debriefs) to *each other* based on title keyword matching. It fails to link them to the **Persona Graph** (Concepts/Directives), resulting in an isolated graph island.

**Objective:**
Connect the Experience Layer to the Persona Layer using `mgrep` (Semantic Search).

**Strategy:**
1.  **Load Persona Context:** Read `.resonance/artifacts/lexicon-enriched.json`.
2.  **Semantic Search:**
    -   For each Experience node (Playbook/Debrief), use its **Narrative** (summary) as a query.
    -   Search against the **Lexicon** (concept definitions).
3.  **Edge Creation:**
    -   If a semantic match is found, create a `MENTIONS` edge from the Experience Node to the Persona Concept.
    -   Source: `semantic_search`.

**Implementation:**
-   Modify `scripts/pipeline/ingest_experience_graph.ts`.
-   Import `SemanticMatcher`.
-   Initialize it.
-   Add a new linking loop targeting Persona Concepts.

**Expected Outcome:**
-   Experience Graph will densely connect to the core Persona ontology.
-   "Orphaned" playbooks will disappear.
