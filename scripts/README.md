# Scripts Documentation

The operational scripts for the Amalfa Resonance Engine and Bento Box Protocol are organized into the following functional directories:

## 📂 `pipeline/`
Ingestion and synchronization workflows.
- **`sync_resonance.ts`**: Master sync script (`fs` -> `resonance.db`).
- **`ingest_experience_graph.ts`**: Sub-pipeline for briefs/debriefs.
- **`migrate_db.ts`**: Schema migrations.

## 📂 `cli/`
Manual tools for the user.
- **`dev.ts`**: `npm run dev` entry point.
- **`harvest.ts`**: Run the harvester manually.
- **`promote.ts`**: Move terms from Candidate to Taxonomy.
- **`normalize_docs.ts`**: Fix markdown formatting.

## 📂 `verify/`
Health checks and debugging.
- **`verify_*.ts`**: Integrity suites.
- **`debug_*.ts`**: Node/Edge inspection.

## 📂 `benchmarks/`
Performance and quality benchmarks.
- **`benchmark-*.ts`**: Latency and accuracy measurement suites.
- **`compare-*.ts`**: Regression testing tools.
- Strict type checking enabled.

## 📂 `lab/`
Experimental scripts and scratchpad code.
- Not strictly type-checked (excluded from `tsconfig.json`).
- Place for temporary experiments before graduation.

## 📂 `legacy/` & `fixtures/`
- **Legacy**: Deprecated code (Python, experiments). Not type-checked.
- **Fixtures**: Static JSON reference data.

## ⚠️ Stability & Policies

### Type Checking Policy
- **Strict Checking**: `pipeline/`, `cli/`, `verify/`, `benchmarks/`, `maintenance/`.
- **Loose Checking**: `lab/`, `legacy/`.
- **Reason**: Lab/Legacy contain experimental or deprecated code that should not block builds or require maintenance overhead.
- **Graduation**: Once a lab script is valuable/stable, move it to `benchmarks/` or another typed folder.

### Architectural Warning
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.