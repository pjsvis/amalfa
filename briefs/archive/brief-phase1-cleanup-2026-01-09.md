---
date: 2026-01-09
tags: [cleanup, hygiene, phase1, dead-code, legacy-scripts, verification, mcp-server]
agent: claude
environment: local
---

## Task: Phase 1 - Cleanup & Hygiene

**Objective:** Remove dead code, stale assets, and legacy artifacts to establish a clean baseline before adding new features.

**TODO Items:** #7, #8, #10, #13, #17

- [x] Remove SemanticHarvester dead code (#7) - Completed 2026-01-09
- [x] Clean up orphaned directories with stale READMEs (#8) - Completed 2026-01-09
- [x] Delete empty `src/resonance/transform/` (#10) - Completed 2026-01-09
- [x] Scripts folder cleanup - delete legacy/dead scripts (#13) - Completed 2026-01-09
- [x] Delete stale `local_cache/` directory (#17) - Verified absent 2026-01-09

## Key Actions Checklist:

### Dead Code Removal
- [x] Delete `src/pipeline/SemanticHarvester.ts` (or move to `legacy/`) - DELETED
- [x] Delete `src/resonance/cli/` directory (README only, no code) - README deleted
- [x] Delete `src/resonance/pipeline/` directory (README only, no code) - README deleted
- [x] Delete `src/resonance/transform/` directory (empty) - DELETED

**Additional Dead Code Removed:**
- Deleted `scripts/run-semantic-harvest.ts` (SemanticHarvester user)
- Deleted `scripts/test-classifier.ts` (SemanticHarvester test script)

### Scripts Cleanup
- [x] Delete `scripts/legacy/*` entirely - DELETED (entire directory with 6 files)
- [x] Delete one-time fixes: `fix_lexicon_json.ts`, `fix_oh125_db.ts` - DELETED
- [x] Delete superseded: `setup_mcp.ts`, `lift-to-amalfa*.sh` - DELETED (CLI command fully replaces these)
- [x] Delete PolyVis artifacts: `validate-css-variables.js` - DELETED
- [x] Delete dead references: `test-classifier.ts`, `run-semantic-harvest.ts` - DELETED
- [x] Delete `scripts/fix/*` directory - DELETED (playbook reference removed)

**Additional Scripts Removed:**
- Deleted `scripts/remove-node-deps.ts` (one-time migration script)
- Deleted `scripts/setup_mcp.ts` (superseded by `amalfa setup-mcp` CLI command)
- Deleted `scripts/lift-to-amalfa.sh` (migration script - PolyVis → AMALFA complete)
- Deleted `scripts/lift-to-amalfa-auto.sh` (migration script - PolyVis → AMALFA complete)
- Deleted `scripts/fix/link_twins.ts` (playbook reference removed)

### Stale Assets
- [x] Run `rm -rf local_cache` - Verified: directory does not exist
- [x] Verify `local_cache/` is in `.gitignore` - Confirmed present

## Verification:

- [x] `bun test` passes - 23 pass, 5 skip, 0 fail (2026-01-09)
- [x] `amalfa doctor` passes - All checks passed (2026-01-09)
- [x] No import errors from deleted files - Confirmed via grep search

## Summary of Cleanup Actions:

**Total Files/Directories Deleted:** 17 items
- 4 SemanticHarvester-related files (dead code)
- 2 orphaned README files
- 1 empty directory
- 6 legacy scripts (entire legacy/ directory)
- 2 one-time fix scripts
- 3 superseded migration/setup scripts
- 1 fix script with removed playbook reference

**Total Lines of Code Removed:** ~500+ lines

**Verification Status:** ✅ All systems operational
- All tests passing
- Health check successful
- No import errors
- Documentation updated

**Documentation Updates Completed:**
- Updated `README.md` to use `amalfa setup-mcp` instead of deleted script
- Updated `docs/setup/MCP_SETUP.md` to use CLI command
- Updated `docs/setup/QUICK_START_MCP.md` to use CLI command
- Updated `docs/setup/SETUP_COMPLETE.md` to use `bunx amalfa` for local clones
- Removed `setup_mcp.ts` entry from `src/config/scripts-registry.json`
- Updated `docs/ARCHITECTURAL_OVERVIEW.md` to remove SemanticHarvester references
- Updated `docs/references/edge-generation-methods.md` to remove SemanticHarvester section
- Updated `playbooks/ingestion-pipeline-playbook.md` to remove link_twins.ts reference
