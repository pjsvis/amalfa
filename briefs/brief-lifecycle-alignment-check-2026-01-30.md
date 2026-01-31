---
date: 2026-01-30
tags: [verification, alignment, gap-analysis, infrastructure]
agent: [Agent Name]
environment: local
---

# Brief: Document Lifecycle & Logic Alignment Check

**Objective:** Conduct a "Gedanken" and code-level assessment of the current Amalfa codebase to identify gaps between the stated **Document Lifecycle Protocol (DLP)** and the actual implementation.

## Core Checklist:

- [ ] **Ingest-Extract Link**: Confirm that the Watcher correctly triggers the Ember service only on genuine content changes.
- [ ] **Ghost Signature Implementation**: Verify that `get_substance_hash` is MIME-aware and functioning as the primary loop-prevention gate.
- [ ] **The "Missing" EdgeMaker**: Search the codebase for where (or if) scalar products and entity-overlaps are currently being calculated. 
- [ ] **FAFCAS Standardization**: Ensure embeddings are being normalized via FAFCAS before being stored in `ResonanceDB`.
- [ ] **Sidecar Lifecycle**: Confirm that `EmberSquasher` is successfully deleting sidecars after a write-back to the Markdown file.
- [ ] **Database vs. File**: Verify that the database is treated as a *runtime cache* and can be fully reconstructed from the file frontmatter.

## Additional Notes & Observations:
*(Agent to fill this out during the check)*

- **Observation 1:** [e.g., Found that embeddings are still stored in sidecars—Recommendation: Move to DB-only.]
- **Observation 2:** [e.g., Edge generation is currently manual—Recommendation: Automate in Graph-Sync worker.]

## Verification Instructions:
1. Review `src/daemon/`, `src/services/`, and `src/ember/`.
2. Compare logic against the **DLP** (Document Lifecycle Protocol).
3. Flag any "Double Work" (redundant storage) or "Broken Gates" (loop risks).

---

### Artifact 1: The Document Lifecycle Protocol (DLP)

**1. The Ingest Gate (Watcher)**

* **Trigger:** File creation or modification.
* **Action:** Update `ResonanceDB` with file metadata (Path, UUID).
* **Verification:** Check **Ghost Signature** (`amalfa_hash`). If match, **Abort** (Self-write detected).

**2. The Ember Factory (Extraction)**

* **Trigger:** Ingest success on a "New" or "Modified" file.
* **Process A (Semantic):** LLM extracts entities and concepts into a temporary **Sidecar JSON**.
* **Process B (Vector):** Embedding model generates a **FAFCAS-normalized vector**.
* **Action:** Store Vector and Entities in `ResonanceDB`.

**3. The Resonance Logic (Edge Generation)**

* **Trigger:** New vector/entity arrival in `ResonanceDB`.
* **Logic A:** Perform **Scalar Product** scan for neighbors.
* **Logic B:** Identify **Entity Overlaps** with existing nodes.
* **Action:** Create temporary "Edges" (links) in the runtime database.

**4. The Squash (Consolidation)**

* **Trigger:** Batch command (`amalfa ember squash`).
* **Action:** Merge Sidecar data + DB Edges into the **File Frontmatter**.
* **Sealing:** Update `amalfa_hash` and **Delete Sidecar**.

---