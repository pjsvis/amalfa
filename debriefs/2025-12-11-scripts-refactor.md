---
date: 2025-12-11
tags: [scripts, refactor, typescript, strict-mode]
---

## Debrief: Scripts Refactoring & Type-Safety

## Accomplishments

- **Comprehensive TypeScript Hygiene:** Achieved a clean build (`tsc --noEmit`) with zero errors across the entire codebase, including the newly reorganized `scripts/` directory.
- **Import Policy Standardization:** Successfully transitioned from fragile relative imports (e.g., `../../`) to robust path aliases (`@/` for root, `@src/` for source). This significantly improves maintainability and refactoring safety.
- **Strict Linting Enforcement:** Resolved numerous Biome and strict-mode TypeScript errors (implicit `any`, unused variables, assignment in expressions) in critical ingestion scripts like `ingest_experience_graph.ts` and `load_db.ts`.
- **Safe Deprecation Strategy:** Identified and commented deprecated `ctx.db` references without aggressively removing them, ensuring system stability while preparing for the migration to `ReconanceDB`.

## Problems

- **Circular Logic in Harvester:** The `EdgeWeaver` class initially had circular logic and type issues with `ResonanceDB` imports that required careful decoupling.
- **Module Resolution Ambiguity:** Mixing `bun run` (which handles some paths automatically) with `tsc` (which is strict about `tsconfig.paths`) led to "Module not found" errors that persisted until aliases were uniformly applied.
- **Fragile Relative Paths:** Many scripts assumed a specific directory depth (e.g., `import.meta.dir + '../../'`), which broke immediately upon moving files to subdirectories.

## Lessons Learned

- **Aliases are Mandatory:** For any project structure deeper than one level, Path Aliases (`@/*`) are not optional; they are critical for moving files safely.
- **CWD vs. meta.dir:** When building CLI tools or scripts intended to run from the project root, using `process.cwd()` is often more predictable than `import.meta.dir`, which ties logic to the physical file location.
- **Incremental Type Safety:** Fixing "everything at once" is overwhelming. Isolating the "Bento" scripts first, then hitting the "Legacy" scripts, proved to be an effective strategy.
