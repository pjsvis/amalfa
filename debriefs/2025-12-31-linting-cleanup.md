---
date: 2025-12-31
tags: [linting, typescript, biome, cleanup]
---

## Debrief: Biome & TypeScript Strictness

## Accomplishments

- **Strict Type Safety:** Eliminated all use of `any` in core database logic (`ResonanceDB`, `HarvesterPipeline`, `EnlightenedProvider`, `migrate.ts`, etc.) by replacing them with `unknown` or specific interfaces.
- **Linting Zero-Inbox:** Resolved ~100+ Biome warnings, specifically targeting `noExplicitAny`, `noStaticOnlyClass`, and `noNonNullAssertion`.
- **Structural Improvements:** Refactored "Static-Only Classes" (like `ZombieDefense`, `EnvironmentVerifier`) into cleaner `export const` object literals or direct function exports.
- **Robustness:** Added explicit null checks and optional chaining in `EnlightenedProvider` and integrity scripts to prevent runtime crashes on malformed data.

## Problems

- **Legacy "Any" Debt:** The codebase had accumulated significant technical debt in the form of `as any` casts, particularly in database query results, masking potential schema mismatches.
- **Circular Type Dependencies:** Some scripts relied on inferred loose typing which broke when `strict: true` behavior was enforced manually.
- **False Positives:** Biome's `useIterableCallbackReturn` flagged single-line arrow functions returning `console.log` (which returns void) but also looked like value returns. Fixed by wrapping in `{}`.

## Lessons Learned

- **Database Typing:** SQLite results are `any` by default. Always define an interface for the expected row shape and cast immediately: `.all() as RowType[]`.
- **Static Classes vs Objects:** In TypeScript/JS, a class with only static methods is an anti-pattern. Use `export const Service = { method() {} }` or just export functions.
- **Any vs Unknown:** Using `unknown` forces you to perform a type check before usage, which is much safer than `any` which disables checking.

## Next Steps

- **Benchmarks:** Verify that the "Hollow Node" architecture (referenced in changelog) is performing as expected now that the code is cleaner.
- **Test Coverage:** The `verify_integrity.ts` script is good, but more unit tests for `ResonanceDB` edge cases would be beneficial.
