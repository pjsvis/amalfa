---
title: Domain Vocabulary Playbook
version: 1.0.0
last_updated: '2025-12-11'
status: active
tags:
  - '#protocol'
  - '#process'
  - '#data-governance'
  - metadata
  - vocabulary
  - agent-driven
related_documents:
  - embeddings-and-fafcas-protocol-playbook
  - ingestion-pipeline
---

# Domain Vocabulary Playbook

## 1. Overview
The **Domain Vocabulary** is the foundation of the Resonance Engine's semantic capabilities. In a "Zero Magic" architecture (using deterministic NLP via `compromise` rather than probabilistic LLMs), the system only "knows" what we explicitly teach it.

**Context Grounding:** Vocabulary defines the entities that matter (e.g., "Bun" is a Runtime, not bread).
**Edge Density:** Nodes are linked based on shared vocabulary terms. A rich vocabulary yields a highly connected graph.

## 2. The Vocabulary Lifecycle

### Phase 1: Harvesting (Automated)
Before ingesting a new domain or documentation set:
1.  **Scan Source Files:** Run a frequency analysis on the raw text.
2.  **Extract Candidates:** Identify capitalized phrases, acronyms (e.g., `FAFCAS`, `OH-058`), and high-frequency nouns.
3.  **Generate Candidate List:** Output a raw list of potential terms.

### Phase 2: Curation (Human-In-The-Loop)
A human engineer (or agent) reviews the candidates:
1.  **Filter Noise:** Remove common stopwords or irrelevant terms.
2.  **Classify Entities:** Assign types to terms:
    - `Technology` (e.g., SQLite, Bun)
    - `Concept` (e.g., Embeddings, Zero Magic)
    - `Protocol` (e.g., OH-001, FAFCAS)
    - `Project` (e.g., Resonance, Polyvis)
    - `Organization` (e.g., Microsoft, Google)
3.  **Update Lexicon:** Add validated terms to `scripts/fixtures/conceptual-lexicon-ref-vX.XX.json`.

### Phase 3: Ingestion (System)
During the Ingestion Pipeline run:
1.  **Load Lexicon:** The `TokenizerService` loads the JSON lexicon.
2.  **Train Tokenizer:** Terms are injected into `compromise` on the fly.
    - `nlp.plugin({ words: { "Bun": "Technology", "Zero Magic": "Concept" } })`
3.  **Extract & Tag:** As documents are processed, these terms are recognized as first-class entities (`#Technology`, `#Concept`).
4.  **Weave Edges:** `EdgeWeaver` creates relationships based on these entities.

## 3. Maintenance Protocols

### OH-vocab-1: Lexicon as Source of Truth
The `conceptual-lexicon-ref.json` file is the single source of truth for the domain. Do not hardcode terms in the codebase.

### OH-vocab-2: Project Initiation Requirement
**No new project ingestion shall occur without a Vocabulary Review.**
Starting a project without defining its core terms leads to a "flat" graph with poor connectivity.

### OH-vocab-3: Operational Heuristic Detection
All `OH-XXX`, `PHI-XXX`, and `OPM-XXX` identifiers are automatically treated as `Protocol` entities. This is a reserved pattern in the Resonance ecosystem.

## 4. Implementation Details
- **Service:** `TokenizerService` (resonance/src/services/tokenizer.ts)
- **Library:** `compromise` (compromise.cool)
- **Config:** `resonance.settings.json` defines the active lexicon path.
