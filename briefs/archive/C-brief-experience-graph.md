# Project Brief: The Experience Graph Integration

**Objective:**
Upgrade the PolyVis Knowledge Graph (`ctx.db`) to include "Operational Telemetry" (Debriefs, Playbooks, Protocols) as first-class nodes. This enables meta-cognitive analysis (e.g., "Which protocols are frequently cited in failed sessions?").

**Core Directives:**
* **Preserve Existing Functionality:** The current Lexicon graph (Terms/Directives) and the Doc Viewer must remain 100% functional.
* **Additive-Only:** We are adding nodes/edges, not modifying the schema.
* **Verification-First:** We must prove the data integrity *before* enabling UI features.

---

## 1. Architecture: The "Sidecar" Pipeline

We will not modify the stable `scripts/build_db.ts`. Instead, we will create a new downstream processor.

**Current Flow:**
`JSON Source` $\to$ `build_db.ts` $\to$ `ctx.db` (Lexicon Only)

**New Flow:**
1.  `JSON Source` $\to$ `build_db.ts` $\to$ `ctx.db` (Lexicon Base)
2.  `Markdown Source` $\to$ `build_experience.ts` $\to$ `experience.json` (Doc Index)
3.  **[NEW]** `ctx.db` + `experience.json` $\to$ **`scripts/ingest_experience_graph.ts`** $\to$ `ctx.db` (Enriched Graph)

---

## 2. Implementation Specs

### A. The Ingestion Script (`scripts/ingest_experience_graph.ts`)
**Logic:**
1.  Load `experience.json`.
2.  Open `ctx.db`.
3.  **Inject Nodes:** Insert every Debrief and Playbook as a node.
    * `id`: Filename (e.g., `2025-11-29-css-isolation`)
    * `type`: `debrief` | `playbook`
    * `label`: Title
    * `definition`: Relative path (for file opening)
4.  **Generate Edges (Heuristic Scan):**
    * Read the *content* of each markdown file.
    * **Regex Match:** `OH-[0-9]{3}`, `PHI-[0-9]+`, `COG-[0-9]+`.
    * **Action:** Create edge `CITES` from `FileNode` to `ProtocolNode`.
    * **Regex Match:** `[[filename]]` or explicit text references to Playbooks.
    * **Action:** Create edge `UPDATES` or `REFERENCES`.

### B. The Verification Suite (`scripts/verify_graph_integrity.ts`)
**Instruction:** Create this *before* running the ingestion.
**Checks:**
1.  **Baseline:** Count nodes/edges in `ctx.db` (Lexicon only).
2.  **Augmented:** Count nodes/edges after ingestion.
3.  **Integrity:** Ensure no existing Lexicon nodes were deleted or modified.
4.  **Linkage:** Assert that at least *one* Debrief connects to *one* Protocol (proof of logic).

---

## 3. UI Update (Low Risk)

**File:** `public/sigma-explorer/index.html` (or separate Audit page)
**Task:** Add a new "Filter Mode" to the graph visualizer.
* **Button:** "Show Experience Layer"
* **Action:** Unhide `debrief` and `playbook` nodes (which should be hidden by default in the standard view to prevent clutter).

---

## 4. Execution Checklist for Agent

1.  **[ ] Assessment:** Review `scripts/build_db.ts` and `scripts/build_experience.ts` to understand data structures.
2.  **[ ] Baseline Verification:** Create `scripts/verify_graph_integrity.ts` and run it against the current DB to establish a baseline.
3.  **[ ] Script Creation:** Author `scripts/ingest_experience_graph.ts`.
4.  **[ ] Dry Run:** Run the new script.
5.  **[ ] Validation:** Run `verify_graph_integrity.ts` again. Fail if Lexicon nodes are missing.
6.  **[ ] UI wiring:** (Optional/Next Phase) Expose the data in Sigma.

The catch phrase for this brief is prioritize **System Integrity** over feature velocity.