---
date: 2026-01-31
tags: [audit, architecture, lifecycle, logic-check]
status: DRAFT
---

# Brief: Document Lifecycle & Synaptic Alignment

**Objective:** Audit the Amalfa codebase to ensure the **Squash** process is effectively transforming isolated documents into a connected **Negentropy Map** using **Lexicon Nodes** and **Edges**.

## 1. The Document Lifecycle (Verification)
- [ ] **Ghost Signature Gate:** Confirm the `Ingest` service correctly reads the `amalfa_hash` to prevent redundant processing.
- [ ] **Reasoning Extraction:** Check if `LangExtract` is capturing a `rationale` or `reasoning_trace` (System 2 memory) to explain the *why* of a document change.
- [ ] **FAFCAS Purity:** Ensure embedding vectors are stored in the **Database** only, keeping the Markdown files and Sidecars clean of vector bloat.

## 2. The Squash Process (Structural Integrity)
- [ ] **Edge Persistence:** Verify the Squasher creates `related_nodes` (Edges) in the file frontmatter based on **Resonance** (Scalar Product > Noise Floor).
- [ ] **Lexicon Node Generation:** Does the Squash identify key terms and link the document to a corresponding **Lexicon Node**? If the Lexicon Node doesn't exist, does the Squasher initiate its creation?
- [ ] **Orphan Mitigation:** Analyze why nodes remain orphaned. Is the **Noise Floor** threshold preventing valid connections, or is the **EdgeMaker** logic failing to identify shared entities?

## 3. Metrics & Settlement
- [ ] **Settlement Index:** Does the system provide a metric for "Pending" vs. "Settled" (Sidecar count vs. Database synchronization)?
- [ ] **Cleanup:** Confirm that the `.ember.json` sidecar is deleted immediately after the Squash commits data to the File and Database.

## Observations & Gaps:
*(Agent to record findings here—specifically looking for "File Spam" or "Managerial Overreach")*