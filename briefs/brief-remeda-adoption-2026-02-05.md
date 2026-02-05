---
date: 2026-02-05
tags: [brief, refactor, remeda, jsonl, robustness]
status: draft
---

# Brief: Remeda Adoption for Ingestion Hardening

## Overview

Adopt the Remeda toolkit to harden ingestion pipelines with:
- `to()` wrapper for explicit error handling
- `R.pipe()` for linear data transformations
- Empty array early returns for type narrowing
- Immutable operations (no mutation)

## Context

The codebase has extensive JSONL pipelines in `src/pipeline/lexicon/` and `src/core/LexiconHarvester.ts`. Current issues:
- Manual `readFileSync` + split instead of streaming
- Nested `.map()` chains instead of piped transformations
- Silent `catch` blocks hiding errors
- Mutable array operations

## Deliverables

1. **Add `to()` wrapper to utilities** - `briefs/brief-add-to-wrapper.md`
2. **Refactor dashboard-daemon.ts** - `briefs/brief-refactor-dashboard-daemon.md`
3. **Refactor LexiconHarvester.ts** - `briefs/brief-refactor-lexicon-harvester.md`

## Success Criteria

- [ ] All JSONL operations use `JsonlUtils`
- [ ] All async error handling uses `to()` wrapper
- [ ] All multi-step transformations use `R.pipe()`
- [ ] No mutable array operations in pipeline code
- [ ] All tests pass

## See Also

- `playbooks/remeda-playbook.md` - Remeda patterns
- `playbooks/typescript-patterns-playbook.md` - TypeScript patterns
