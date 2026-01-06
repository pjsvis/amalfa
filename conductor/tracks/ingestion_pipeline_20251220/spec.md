# Track Spec: Refactor and Stabilize Ingestion Pipeline

## Overview
The goal of this track is to refactor the Polyvis ingestion pipeline to ensure it is robust, performant, and idempotent. The pipeline must treat source Markdown documents as the single source of truth (SSoT) and use diffing logic to update the `resonance.db` efficiently.

## Objectives
- **Idempotency:** Repeatedly running the ingestion pipeline against the same source documents should result in the same database state without duplicate nodes or edges.
- **Source of Truth:** All semantic data (nodes, edges, properties) must be derived from or traceable to the source documents in `docs/`, `debriefs/`, `briefs/`, and `playbooks/`.
- **Diffing Logic:** Implement a mechanism to detect changes in source documents (hashes or timestamps) and only process modified files.
- **Performance:** Optimize SQLite operations using batching and transactions to ensure the pipeline remains fast even as the dataset grows.
- **Bento Box Standardization:** Ensure all extracted data adheres to the "Bento Box" semantic structure.

## Technical Requirements
- **Runtime:** Bun
- **Database:** `bun:sqlite`
- **ORM:** Drizzle ORM
- **Parsing:** Unified/Remark for Markdown AST analysis.
- **Hashing:** Use a fast hashing algorithm (e.g., SHA-256 or similar) to track document versions in a local cache.

## Acceptance Criteria
- [ ] Ingestion pipeline runs to completion without errors.
- [ ] Re-running the pipeline on an unchanged dataset results in zero database modifications.
- [ ] Adding an annotation to a document (e.g., a new edge) is correctly reflected in the database after the next run.
- [ ] The pipeline can process the entire current baseline dataset (debriefs, briefs, etc.) in under 5 seconds.
- [ ] Unit tests cover core diffing and normalization logic with >80% coverage.
