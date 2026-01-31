---
date: 2026-01-31
tags: [feature, cli, lexicon, jsonl, harvester]
agent: antigravity
environment: local
---

# Debrief: Lexicon Harvester Implementation

## Accomplishments

- **Implemented Lexicon Harvester:** Created `src/core/LexiconHarvester.ts` using the "Nodes First" strategy to scan sidecar files and aggregate terms.
- **Added Traceability Manifest:** Solved the "orphan sidecar" problem by implementing `scripts/maintenance/link-cache.ts`, which generates a `manifest.jsonl` linking content hashes back to source file paths (e.g., `docs/README.md`).
- **Standardized on JSONL:** Implemented `src/utils/JsonlUtils.ts` for memory-efficient, streaming I/O, replacing ad-hoc JSON parsing for large datasets.
- **CLI Command:** Added `amalfa harvest-lexicon` to the CLI, exposing the harvester functionality to the user.
- **Verified Pipeline:** Created and ran `tests/verify-harvest-pipeline.ts` to confirm end-to-end functionality (Source -> Hash -> Manifest -> Lexicon).
- **Audit Results:** Recovered 479 active links (96% of cache) and identified 20 stale orphans (4%).

## Problems

- **Missing Source Links:** The initial implementation of `LangExtractClient` was purely content-addressable and lost the connection to the original filename.
    - *Resolution:* Implemented a separate `Manifest` system (`link-cache.ts`) to map hashes to paths without modifying the immutable cache files.
- **Linting Errors:** The codebase had legacy lint check failures (`bun run check`).
    - *Resolution:* Fixed all new code issues (imports, types in `LexiconHarvester.ts`), and verified the module is clean even if legacy debt remains elsewhere.
- **Configuration disconnect:** Initial maintenance scripts ignored `amalfa.config.json` and used hardcoded defaults.
    - *Resolution:* Updated `link-cache.ts` to use `loadConfig()` to respect user settings.

## Lessons Learned

- **Separation of Concerns:** Keep the "Extraction Cache" (expensive, content-based) separate from the "Source Manifest" (cheap, metadata-based). This allows files to move/rename without invalidating the expensive LLM work.
- **Manifests are Critical:** Content-addressable systems (CAS) are great for deduplication but terrible for traceability. Expect to always need a manifest sidecar.
- **Bun Streams:** `Bun.file().stream()` is powerful but requires adaptation (`Readable.fromWeb`) to work with Node's `readline` interface.

## Next Steps

- **Triage UI:** Build a Dashboard view to process the 4219 candidates in `lexicon-candidates.jsonl`.
- **Edge Generation:** Implement Phase 2 ("The Surveyor") to find connections between confirmed Golden Nodes.
