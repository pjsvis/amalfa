---
date: 2026-01-09
tags: [review, discovery, todo, technical-debt, documentation]
---

## Debrief: Codebase Review & Discovery Session

## Accomplishments

- **Documentation Update:** Updated `docs/user-guide.md` with current `amalfa` CLI commands, replacing legacy `bun run` commands.

- **New Documentation Created:**
  - `docs/services.md` - Current service architecture (MCP, Vector Daemon, Sonar)
  - `docs/guides/cloud-inference.md` - OpenRouter setup guide
  - `docs/architecture/expanded-source-ingestion.md` - Significance of expanded source patterns
  - `docs/architecture/tiered-inference-strategy.md` - Local-First, Cloud-Augmented philosophy

- **Automation Script:** Created `scripts/maintenance/doc-consistency-check.ts` to audit CLI commands vs documentation (85.7% coverage).

- **Sonar UX Improvements:**
  - `/health` endpoint now returns `provider` (local/cloud) and `model` name
  - Chat startup displays provider info: `[☁️ Cloud: qwen/qwen-2.5-72b-instruct]`
  - `amalfa sonar chat` now auto-starts the Sonar Agent if not running

- **TODO Backlog Created:** Comprehensive `TODO.md` with 19 prioritized items discovered during review.

- **Released v1.0.35:** Published to NPM with auto-start chat and provider visibility features.

## Problems

- **Legacy "Polyvis" References:** Found ~50+ files still using "Polyvis" instead of "Amalfa". Added to TODO #6.

- **Dead Code Discovered:**
  - `SemanticHarvester.ts` - References non-existent `ingest/` directory
  - Orphaned READMEs in `src/resonance/cli/`, `src/resonance/pipeline/` describing non-existent files
  - Empty `src/resonance/transform/` directory

- **Missing Folder READMEs:** Agents lack context when entering code folders. 12 directories missing guardrail READMEs.

- **Stale Assets:** `local_cache/` with old MiniLM model (~170MB) still on root. Code now uses `.amalfa/cache/`.

## Lessons Learned

- **Discovery Before Execution:** During code review, focus on surfacing and recording issues—not fixing them immediately. This prevents scope creep and ensures thorough coverage.

- **Folder READMEs as Agent Guardrails:** Every code folder should have a README with:
  1. Purpose and key files
  2. Design patterns to follow
  3. **Stability clause:** "Do NOT refactor without consulting user first"

- **Deprecation Hygiene:** Deprecation notices are for transition periods, not archives. Once the old way is dead, delete both the code AND the `@deprecated` tag.

- **Scripts Classification:** Distinguish between:
  - KEEP: Active utilities (release, validate, pre-commit)
  - DELETE: One-time fixes, superseded scripts
  - PROMOTE: Diagnostics worth adding to CLI/API

## TODO Summary (19 Items)

| Priority | Count | Key Items |
| :--- | :--- | :--- |
| **High** | 1 | #4 Colocated folder READMEs with guardrails |
| **Medium** | 10 | #3 Hono, #6 Excise Polyvis, #12 Drizzle, #13-14 Scripts, #16 Test coverage, #19 Pin versions |
| **Low** | 8 | #1-2 LouvainGate, #7-10 Cleanups, #17 local_cache, #18 Graphology features |

## Verification Proof

- v1.0.35 published: `npm info amalfa version` → `1.0.35`
- Git tag created: `git tag -l v1.0.35` → `v1.0.35`
- Doc consistency check: `bun run scripts/maintenance/doc-consistency-check.ts` → 85.7% coverage
- Sonar health check: `curl localhost:3012/health` → `{"provider":"cloud","model":"qwen/qwen-2.5-72b-instruct"}`
