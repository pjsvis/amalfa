## Task: Phase 1 - Cleanup & Hygiene

**Objective:** Remove dead code, stale assets, and legacy artifacts to establish a clean baseline before adding new features.

**TODO Items:** #7, #8, #10, #13, #17

- [ ] Remove SemanticHarvester dead code (#7)
- [ ] Clean up orphaned directories with stale READMEs (#8)
- [ ] Delete empty `src/resonance/transform/` (#10)
- [ ] Scripts folder cleanup - delete legacy/dead scripts (#13)
- [ ] Delete stale `local_cache/` directory (#17)

## Key Actions Checklist:

### Dead Code Removal
- [ ] Delete `src/pipeline/SemanticHarvester.ts` (or move to `legacy/`)
- [ ] Delete `src/resonance/cli/` directory (README only, no code)
- [ ] Delete `src/resonance/pipeline/` directory (README only, no code)
- [ ] Delete `src/resonance/transform/` directory (empty)

### Scripts Cleanup
- [ ] Delete `scripts/legacy/*` entirely
- [ ] Delete one-time fixes: `fix_lexicon_json.ts`, `fix_oh125_db.ts`
- [ ] Delete superseded: `setup_mcp.ts`, `lift-to-amalfa*.sh`
- [ ] Delete PolyVis artifacts: `validate-css-variables.js`
- [ ] Delete dead references: `test-classifier.ts`, `run-semantic-harvest.ts`
- [ ] Delete `scripts/fix/*` directory

### Stale Assets
- [ ] Run `rm -rf local_cache`
- [ ] Verify `local_cache/` is in `.gitignore`

## Verification:

- [ ] `bun test` passes
- [ ] `amalfa doctor` passes
- [ ] No import errors from deleted files
