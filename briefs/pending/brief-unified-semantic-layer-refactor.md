# Implementation Plan: Unified Semantic Layer Refactor

## 1. Objectives
- **Precision:** Move from Regex to AST for document splitting.
- **Integrity:** Prevent "Graph Hairballs" using Louvain gating.
- **Clarity:** Separate "Search" (Vectors) from "Structure" (Tags/Links).

## 2. Component Refactoring

### A. `src/core/BentoBoxer.ts` (The Structural Surgeon)
- **Current State:** Uses Regex to find "likely" break points.
- **Target State:** Uses AST to find "definite" break points.
- **Implementation Details:**
    - Use `unified` + `remark-parse` (Native JS/Bun friendly) or `ast-grep` via NAPI.
    - *Decision:* `remark` is often faster for pure Markdown manipulation in JS environments than spawning `sg` processes. We will evaluate `ast-grep` NAPI first for power, but fallback to `remark` if overhead is high.
    - **Logic:**
        ```typescript
        function fracture(node): Box[] {
            if (size(node) < LIMIT) return [box(node)];
            return node.children.flatMap(child => fracture(child));
        }
        ```

### B. `src/core/EdgeWeaver.ts` (The Electrician)
- **Current State:** Mixes explicit tags with some fuzzy logic options.
- **Target State:** **Strict Mode.**
    - Only generate edges for:
        - `[[WikiLinks]]` (Explicit citations)
        - `[Tag: Value]` (Explicit taxonomy)
        - `Header 1` -> `Header 2` (Structural hierarchy)
    - **Remove:** Any lingering "similarity threshold" edge creation. Leave that for the `SemanticWeaver` (Orphan Rescue) only.

### C. `resonance/src/db.ts` & `ingest.ts` (The Gatekeeper)
- **New Feature:** `LouvainGate` class.
- **Logic:**
    - Track "Degree Centrality" of target nodes.
    - If `Target.degree > Threshold` (e.g., 50 edges), apply penalty.
    - If `NewNode` tries to link to `SuperNode`, check if `NewNode` shares other neighbors with `SuperNode`.
    - **Pass:** `NewNode` is part of the cluster.
    - **Fail:** `NewNode` is just adding noise. Redirect to a sub-topic.

## 3. Verification Protocol
1.  **Run:** `scripts/verify/narrative_test.ts` (The existing test).
2.  **Run:** `scripts/verify/verify_graph_integrity.ts` (New test to check modularity).
3.  **Success Metric:**
    - Modularity ($Q$) of the new graph should be > $Q$ of the old graph.
    - "Orphan Count" should remain low (rescued by semantic tagging, not random linking).