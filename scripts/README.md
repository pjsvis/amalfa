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

## 📂 `legacy/` & `fixtures/`
- **Legacy**: Deprecated code (Python, experiments).
- **Fixtures**: Static JSON reference data.

## 📂 `enlightenment/`
Exploratory scripts for understanding system behavior.
- **`analyze_*.ts`**: Analysis and discovery scripts.

## 📂 `maintenance/`
Operational and maintenance scripts.
- **`cleanup_*.ts`**: Repository cleanup operations.
- **`migrate_*.ts`**: Data migration scripts.

## ⚠️ Stability
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.