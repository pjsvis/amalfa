---
date: 2026-03-05
tags: [feature, refactoring, semantic-web, rdf, visualization, persona-factory, pipeline]
agent: gemini-cli
environment: local
---

## Debrief: RDF Semantic Layer & Persona Factory Foundation

## Accomplishments

- **TypeScript Hardening:** Resolved 300+ project-wide TypeScript errors across `src/` and `scripts/`, achieving a clean `tsc --noEmit` baseline.
- **Isolated Semantic Database:** Established `semantic.db` as a dedicated, high-fidelity graph storage distinct from the probabilistic `resonance.db`.
- **Persona Factory (OH-132):** Implemented a deterministic JSONL-based ingestion pipeline. Transitioned from nested JSON fixtures to atomic records, ensuring 100% accountability and auditability.
- **High-Signal Governance Skeleton:** Correctly ingested and categorized 185 core persona nodes (Directives and Concepts) with 287 internal governance relationships.
- **Side-by-Side Visualization:** Expanded the Dashboard Daemon and Sigma Explorer to support real-time comparison between the Heuristic Mesh and the Semantic Skeleton.
- **Ontological Layering:** Implemented a new taxonomy distinguishing between the `philosophical` core (The Soul) and `operational` competencies (The Skills).

## Problems

- **ID Clobbering:** Discovered that simple slugification led to collisions between different directives sharing similar IDs. Resolved by using high-fidelity slugging based on full titles.
- **Generic Noun Noise:** Initial extraction was creating thousands of low-signal edges between common words (e.g., "model", "text"). Resolved by implementing a **Dual-Lexicon Strategy** (Strict for Fixtures, Loose for Docs).
- **Frontend Categorization drift:** Nodes were falling into the `misc` cluster and becoming invisible. Resolved by implementing `ensureKnownFolder` metadata mapping.
- **Path Resolution:** The scripts folder had lost its `@src/*` alias resolution due to a missing `bun` type definition in `scripts/tsconfig.json`.

## Lessons Learned

- **JSONL is Mandatory (OH-132):** Moving to JSONL transformed the pipeline from a "black box" to a "verifiable stream." Counting records is the ultimate QA tool.
- **Isolation over Pollution:** Keeping `semantic.db` separate allowed us to experiment with aggressive extraction rules without risking the stability of the production graph.
- **The Dual-Graph Worldview:** We confirmed that heuristic links and formal semantic triples occupy different relational planes with almost zero overlap (0.2%), proving that both are necessary for a complete "brain."

## Verification Proof
- `bun run build` passes.
- `bun run scripts/semantic/verify-categorization.ts` reports 0 misc nodes.
- `bun run scripts/semantic/analyze-cda-cl.ts` confirms 185 unique persona nodes.
- `http://localhost:3013/sigma-explorer/semantic.html` renders the high-fidelity skeleton.
