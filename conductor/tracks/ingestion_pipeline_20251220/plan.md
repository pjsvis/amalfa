# Track Plan: Refactor and Stabilize Ingestion Pipeline

This plan outlines the steps to refactor the ingestion pipeline for idempotency, speed, and SSoT integrity.

---

## Phase 1: Analysis and Architecture Setup
Establish the foundation for the new pipeline, including state tracking and baseline verification.

- [ ] Task: Audit current ingestion scripts and identify hotspots for duplication.
- [ ] Task: Write Tests for the `BentoBox` normalization schema.
- [ ] Task: Implement `BentoBox` normalization schema using Drizzle.
- [ ] Task: Write Tests for the Document Hashing and Cache mechanism.
- [ ] Task: Implement Document Hashing and Cache mechanism to track SSoT changes.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Analysis and Architecture Setup' (Protocol in workflow.md)

## Phase 2: Idempotent Ingestion Logic
Implement the core logic that ensures nodes and edges are updated or created without duplication.

- [ ] Task: Write Tests for Idempotent Node Upsert logic.
- [ ] Task: Implement Idempotent Node Upsert logic.
- [ ] Task: Write Tests for Idempotent Edge Weaving logic (based on document annotations).
- [ ] Task: Implement Idempotent Edge Weaving logic.
- [ ] Task: Write Tests for the "Purge Orphan" logic (removing nodes/edges no longer in SSoT).
- [ ] Task: Implement "Purge Orphan" logic.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Idempotent Ingestion Logic' (Protocol in workflow.md)

## Phase 3: Performance Optimization and Integration
Optimize database interactions and integrate with the existing `resonance.db` pipeline.

- [ ] Task: Write Tests for Batch Processing and Transactional integrity.
- [ ] Task: Implement Batch Processing and Transactional integrity for SQLite writes.
- [ ] Task: Refactor `src/resonance/cli/ingest.ts` to use the new idempotent kernel.
- [ ] Task: Update `scripts/build_db.ts` to integrate the refactored pipeline.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Performance Optimization and Integration' (Protocol in workflow.md)

## Phase 4: Final Verification and Cleanup
Validate the end-to-end flow and ensure the frontend remains functional.

- [ ] Task: Run full ingestion against the entire project dataset and verify idempotency (zero-diff on second run).
- [ ] Task: Verify that the Sigma.js explorer correctly renders data from the refactored database.
- [ ] Task: Remove deprecated or redundant legacy ingestion scripts.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Verification and Cleanup' (Protocol in workflow.md)
