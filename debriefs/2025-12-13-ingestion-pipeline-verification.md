# Mission: Verify Ingestion Pipelines

## Aspiration (The Brief)
We need to verify that the `PERSONA` and `EXPERIENCE` ingestion pipelines are distinct, observable, and produce separable graphs based on the `domain` field. This confirms the "Context Lake" architecture where multiple domains can be "smashed" together or queried independently.

**Objectives:**
1.  **Pipeline Audit:** Ensure both pipelines have documented "observation and data capture points" (logs, metrics, validation).
2.  **Domain Verification:** Confirm that `PERSONA` data ends up in the `persona` domain and `EXPERIENCE` data ends up in the `experience` (or `resonance`) domain.
3.  **Separability:** Verify that we can query these graphs independently.

## Constraints
- Do not modify the existing pipelines unless they are broken.
- Use `bun` for all execution.

## Execution Log
- [ ] Created this Mission Artifact.
- [ ] Created `playbooks/ingestion-pipeline-playbook.md`.
- [ ] Created `scripts/verify/check_domains.ts`.
- [ ] Ran Ingestion Suite.

## Debrief (The Reality)
**Status:** COMPLETE ✅

### Accomplishments
1.  **Bifurcation Verified:** We confirmed that the pipelines produce distinct, separable domains in the same database.
    *   `persona` (185 nodes): Directives and Concepts.
    *   `resonance` (66 nodes): Usage telemetry and structural graph layers ("Hot Path").
    *   `knowledge` (107 nodes): Vectorized content chunks ("Cold Path").
2.  **Tools Created:**
    *   `scripts/verify/check_domains.ts`: A reusable tool to audit the "Context Lake" composition.
    *   `playbooks/ingestion-pipeline-playbook.md`: Documentation of the dual-pipeline architecture.

### Problems
1.  **Validation Noise:** The `ingest.ts` script fails validation (`exit 1`) because it expects to add nodes every time, but its idempotency checks skip existing nodes. This causes "False Failure" signals in the pipeline.
2.  **Domain Naming Divergence:** The split between `resonance` (structure) and `knowledge` (vectors) for the *same files* is implicit. It works for the "Hot/Cold" architecture but could be confusing for new agents.

### Lessons Learned
*   **The "Context Lake" is Real:** We successfully "smashed" three distinct layers (`persona`, `telemetry`, `vectors`) into a single SQLite file without schema conflicts.
*   **Separability is Key:** We can query `SELECT * FROM nodes WHERE domain='persona'` to isolate the rules, or `domain='knowledge'` to search the vectors.
*   **Validation Needs Tuning:** Pipeline validators should account for idempotent runs (e.g., "0 nodes added" is success if hashes match).

### Playbooks Updated
*   `playbooks/ingestion-pipeline-playbook.md`: Added "Bifurcation Strategy" section.
