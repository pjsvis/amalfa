
# Implementation Plan: Experience Graph Tuning

## Objective
Refine the Experience Graph visualization to achieve parity with the Persona graph's clustering quality and information density. This involves fixing hardcoded settings, tuning the Louvain resolution, and **generating semantic edges** to fix graph sparsity.

## Current State
- **Hardcoded Resolution:** Fixed in `viz.js`.
- **Inconsistent Thresholds:** Fixed in `viz.js`.
- **Graph Sparsity:** The graph has only 4 edges (structural). This is because the markdown content lacks explicit citations (`OH-xxx` or `[[WikiLinks]]`).

## Implementation Steps

### 1. Code Fixes (System Logic) [COMPLETED]
- [x] **Dynamic Resolution:** Update `src/js/components/sigma-explorer/viz.js` to select the Louvain resolution based on `this.activeDomain`.
- [x] **Consistent Thresholds:** Update `cycleLouvainGroup` in `viz.js` to use a threshold of **5**.

### 2. Data Enrichment (Edge Generation) [NEW]
- [ ] **Semantic Linker:** Update `scripts/ingest_experience_graph.ts` to implement heuristic linking:
    - Load all Experience Node Titles.
    - Scan the content of each node.
    - If `Title A` (e.g., "Sigma.js Playbook") appears in the content of `Node B`, create a `MENTIONS` edge.
    - Use a stop-list to avoid matching generic terms like "Playbook".

### 3. Tuning & Verification
- [ ] **Data Check:** Run ingestion and verify edge count > 4.
- [ ] **Visual Check:** Load the Experience Graph.
- [ ] **Cluster Analysis:** Observe clusters.
- [ ] **Tuning:** Adjust `experience` resolution in `polyvis.settings.json` if needed.

### 4. Finalization
- [x] **Commit:** Save the tuned settings and code fixes.

## Phase 2: Keyword Enrichment (Semantic Density)

## Objective
Replicate the Persona Graph's keyword-based edge generation logic to densify the Experience Graph. The current internal linking is sparse because it relies on exact title matches or explicit Wikilinks, which are rare in the corpus.

## Methodology
1.  **Stop Word Protocol:**
    - Re-use the linguistic stop words from `build_db.ts`.
    - Supplement with **Experience-Specific Stop Words** to prevent broad, low-value clustering (e.g., "playbook", "debrief", "session", "update", "fix").
    
2.  **Keyword Extraction:**
    - For each Experience Node, tokenize its `title`.
    - Filter tokens against the Stop Word list and length constraints (len > 3).
    - Result: A set of "Signifier Keywords" for each node (e.g., "Sigma.js Playbook" -> `["sigma"]`).
    
3.  **Semantic Scanning:**
    - Scan the content of every other node.
    - If a **Signifier Keyword** appears in the content, generate a `MENTIONS` edge.
    - *Constraint:* Use regex boundary checks (`\bkeyword\b`) to prevent partial matches.

## Implementation Checklist
- [x] **Dependencies:** Import `stopWords` logic (or duplicate) into `ingest_experience_graph.ts`.
- [x] **Enhancement:** Update the "Semantic Linking" block to perform Keyword Matching instead of Exact Title Matching.
    ```typescript
    const keywords = other.title.split(/[\s-]+/).filter(w => !stopWords.has(w)...);
    if (keywords.some(k => content.includes(k))) insertEdge...
    ```
- [x] **Verification:** Run ingestion and verify edge count increases significantly (Target: > 5).
