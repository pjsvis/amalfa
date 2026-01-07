# Scripts: Legacy

This directory contains deprecated, experimental, or non-TS scripts that are no longer part of the active pipeline.

## Contents

### Original Legacy Scripts
- **`generate_context_index.py`:** Python indexing script (Pre-Bun).
- **`mistral/`:** Experimental Mistral-7B integration.

### polyvis.settings.json Deprecation (2026-01-07)

The following scripts were moved here during the migration to unified `amalfa.config.json`:

**Core Modules** (from src/):
- `HarvesterPipeline.ts` - Legacy tag harvesting
- `config.ts` - Old ResonanceConfig loader

**Pipeline Scripts** (from src/resonance/):
- `extract.ts`, `transform_docs.ts`, `cda.ts`, `migrate.ts`

**Lab/Debug**:
- `lab_daemon.ts`, `lab_mcp.ts`, `lab_web.ts`, `debug_mcp_connection.ts`
- `assess_db_weight.ts`, `diagnose_db.ts`, `dev.ts`

**Verify**:
- `audit_vectors.ts`, `consolidate-docs/index.ts`

All depend on the removed `polyvis.settings.json`. See [docs/LEGACY_DEPRECATION.md](../../docs/LEGACY_DEPRECATION.md) for migration guide.
