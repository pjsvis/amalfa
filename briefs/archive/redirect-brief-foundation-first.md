# Redirect Brief: Operation "Foundation First"

**Status:** `CRITICAL`
**Directive:** **STOP** all "feature" work. **REVERT** to foundational engineering.
**Context:** We have identified two critical gaps between our Architecture (`Best Practices`) and our Implementation (`Reality`). The current codebase is relying on fragile heuristics (Regex) where it requires deterministic parsers (AST). We will not proceed until these are rectified.

## The "Anti-Thrash" Mandate
Do not attempt to "patch" the current regex logic. Do not attempt to "optimize" the current ingestion speed.
**Your sole purpose is to replace the engine components with the correct, specified parts.**

---

## Task 1: The "Iron Stomach" (Gap-2 Repair)
**Target:** `src/core/BentoBoxer.ts`
**Current State:** Fragile `REGEX_PIVOT` logic that fails on nested content.
**Required State:** Robust `ast-grep` (or `remark`) parsing.

**Execution Protocol:**
1.  **Dependency Check:** Verify `ast-grep` (napi) or `remark-parse` availability.
2.  **Implementation:** Rewrite `BentoBoxer.ts` to operate on **Syntax Nodes**, not text strings.
    * *Requirement:* A "Box" must be a valid AST node (e.g., a Header and its children).
    * *Constraint:* Never split inside a Code Block or Table.
3.  **Verification:** Create `scripts/verify/verify_ast_split.ts`.
    * *Input:* A Markdown file with a code block containing `# Fake Header`.
    * *Pass Criteria:* The boxer does NOT split on `# Fake Header` (Regex would have failed this).

## Task 2: The "Gatekeeper" (Gap-1 Repair)
**Target:** `resonance/src/db.ts` & `scripts/pipeline/ingest.ts`
**Current State:** Unbounded edge creation (Hairball risk).
**Required State:** Topological Gating (Louvain Heuristic).

**Execution Protocol:**
1.  **Logic Implementation:** Create `src/core/LouvainGate.ts`.
    * Implement the **"Local Modularity Check"**: Before adding an edge $A \to B$, check if $A$ shares neighbors with $B$'s community.
    * If $B$ has $>50$ edges and $A$ shares $0$ neighbors, **REJECT** the edge.
2.  **Pipeline Integration:** Modify `ingest.ts` to call `LouvainGate.check()` before `db.insertEdge()`.
    * *Strike 1:* Try primary semantic link. (Gate check).
    * *Strike 2:* Try secondary link. (Gate check).
    * *Strike 3:* Link to generic "Orphanage" node.
3.  **Verification:** Run `scripts/verify/verify_graph_integrity.ts`.
    * *Pass Criteria:* Ingest 100 random notes. Ensure maximum node degree $< 20$ (or reasonable limit).

---

## The "Definition of Done" (Strict)
This brief is NOT complete until:
1.  `grep "REGEX_PIVOT" src/core/BentoBoxer.ts` returns nothing.
2.  `verify_ast_split.ts` returns `PASS: Code block integrity maintained`.
3.  `ingest.ts` logs show `[LouvainGate] Rejected edge due to low modularity`.

**Note to Agent:**
Speed is not the goal. **Correctness is the goal.** Do not hallucinate a solution. If `ast-grep` integration is difficult, document the blocker and implement `remark`, but **do not revert to regex.**
