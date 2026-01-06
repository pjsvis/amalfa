# Database Baseline

**Last Updated:** 2025-12-17 21:20

---

## Current State

**Location:** `public/resonance.db`

| Metric | Count |
|--------|-------|
| **Nodes** | 441 |
| **Edges** | 489 |
| **Vectors** | 256 |
| **DB Size** | 3.9 MB |
| **Status** | ✅ **CLEAN** - Fresh ingestion from current disk files |

---

## Known Good Backup

**Location:** `backups/db/benchmarks/resonance.db.pre-benchmark-20251217-184046`

| Metric | Count |
|--------|-------|
| **Nodes** | 434 |
| **Edges** | 634 |
| **Vectors** | 247 |
| **DB Size** | 8.5 MB |
| **Status** | ✅ **ARCHIVED** - Pre-refactoring state (18:40) |

---

## History

### 2025-12-17 21:20
**Fresh ingestion after reverting broken code**
- Current files: 263 markdown files on disk
- Result: 441 nodes, 489 edges
- Debriefs: 101, Briefs: 85, Playbooks: 33, Docs: 37
- Status: Working ingestion pipeline
- Note: Difference from backup (+7 nodes) due to new files created tonight

### 2025-12-17 20:34
**P0 refactoring broke ingestion**
- Transaction boundaries prevented disk writes
- Ingestion reported success but created 0-byte files
- Reverted Ingestor.ts to pre-refactoring state
- Lesson: Transaction wrappers require careful testing

### 2025-12-17 18:40
**Pre-refactoring backup created**
- Backup saved before P0/P1/P2 work
- This represents the working state before tonight's changes
