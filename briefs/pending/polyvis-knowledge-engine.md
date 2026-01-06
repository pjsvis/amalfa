# Project Brief: Polyvis Knowledge Structuring Engine `[PB-002]`

**Context:** Polyvis (Sovereign Knowledge Artifact)
**Objective:** Build an autonomous pipeline that transforms unstructured text dumps into a "Living Knowledge Graph" via iterative ingestion, vector analysis, and automated inter-linking.
**Target State:** A "Self-Healing" dataset that grows smarter over time.

## 1. The Core Value: "The Knowledge Refinery"
We are not building a static database. We are building a **Refinery** that elevates raw text into structured assets.



**The Transformation Hierarchy:**
1.  **Raw Ore:** Unstructured Markdown files.
2.  **Sanitized Ingot (Pass 1):** Clean text, Metadata extracted, Vectors generated. *Queryable via FTS & Semantic Search.*
3.  **Linked Lattice (Pass 2):** Explicit links (`[[WikiLinks]]`) forged into a graph. *Traversable via Graphology.*
4.  **Enriched Crystal (Pass 3):** "Shadow Links" (inferred connections) detected by the machine and written back as annotations. *Enhanced density.*

## 2. The Cycle (The Engine)
The system operates as a continuous loop, allowing the user to dump files and watch the structure emerge.

**Step A: The Sieve (Ingest)**
* **Trigger:** File Watcher / Manual Run.
* **Action:** Atomic dual-write to `polyvis.sqlite`.
    * **Table A (`chunks`):** Vectors + Metadata.
    * **Table B (`chunks_fts`):** Search Index.
    * **Table C (`edges`):** Hard Links.

**Step B: The Gardener (Refine)**
* **Trigger:** Post-Ingest Hook / Nightly Cron.
* **Action:** Multi-Angle Inspection.
    * **Vector Angle:** "This clause is 95% similar to the 'Liability' concept."
    * **Community Angle:** "Both documents are in the 'Contract Law' cluster."
* **Result:** Append `` blocks to the source file.

**Step C: The Feedback (Re-Ingest)**
* **Trigger:** User accepts suggestions (or auto-accept config).
* **Action:** The Ingestion Daemon detects the change (file update).
* **Result:** The "Suggestion" becomes a "Hard Edge." The graph tightens.

## 3. The Architecture (The Monolith)

We maintain the "Sovereign Artifact" standard. All logic resides in portable scripts; all data resides in one file.

| Component | Responsibility | Tech Stack |
| :--- | :--- | :--- |
| **`ingest.ts`** | The "Mouth." Swallows text, spits out Vectors/SQL. | `bun:sqlite`, `marked`, `gray-matter` |
| **`vector-daemon.ts`** | The "Brain." Resident service for sub-50ms embedding. | `fastembed`, `bun serve` |
| **`refine.ts`** | The "Hands." Modifies source text based on graph analysis. | `bun:file` |
| **`polyvis.sqlite`** | The "Body." The single portable file. | `sqlite3` + `fts5` + `vec_dot` |

## 4. Use Case: "The Legal Dump"
1.  **Drop:** User drops 500 case files into `data/raw`.
2.  **Wait:** 5 minutes.
    * *System:* Vectors generated. Entities extracted.
    * *System:* Refinement runs. "Witness A" linked to "Exhibit B".
3.  **Query:** User opens Web UI (Local).
    * *User:* "Show me connections between 'Liability' and 'witnesses'."
    * *System:* Highlights the path across 12 documents that no human had time to read.

***

**Status:**
We have the **Vector Daemon** (Brain) planned.
We have the **Playbook** (Constitution) written.
We have the **Brief** (Blueprint) finalized.

