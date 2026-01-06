---
date: 2025-12-11
tags: [refactor, migration, src, documentation]
---

## Debrief: Migration of Bento Logic to Src

## Accomplishments

- **Successful Lift & Shift:** Moved the core "Bento Box" logic (`BentoNormalizer`, `EdgeWeaver`, `Harvester`) from the `scripts` utility folder to the application source (`src/core`). This prepares the logic for bundling and reuse in the MCP distributable.
- **Zero Regression:** Verified that all 12 tests passed and `tsc --noEmit` reported zero errors after the migration.
- **Documentation Alignment:** Immediately updated `README.md`, created `docs/project-structure.md`, and updated architecture diagrams to reflect the new reality.
- **Protocol Enforcement:** Enforced the "No Relative Imports" rule by updating all migrated files and consumers to use `@src` and `@resonance` aliases.

## Problems

- **Type vs Value Import:** Encountered a TypeScript error (`TS1361`) where `ResonanceDB` was imported as `import type` but instantiated as a value. This highlights the importance of checking `tsc` output even if tests (runtime) might pass due to transpilation behavior.
- **Documentation Drift:** Realized that `README.md` and `docs/` were immediately out of date upon moving files. Updating them as part of the task was critical.

## Lessons Learned

- **Lift and Shift > Move:** Copying files to the new location, fixing imports, and *then* deleting the old files is a safer workflow than a direct move, as it allows for easy comparison and rollback.
- **Aliases simplify Refactoring:** The previous work to establish `@src` and `@scripts` aliases made this migration significantly easier. We didn't have to calculate relative path depths (`../../` vs `../`).
- **Docs as Code:** Treating documentation updates as a mandatory step of the refactoring task ensures the "map" matches the "territory".
