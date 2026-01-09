# Changelog

All notable changes to AMALFA will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.30] - 2026-01-09

### Security
- **Dependabot**: Updated `@modelcontextprotocol/sdk` to `1.25.2` to resolve ReDoS vulnerability (GHSA-8r9q-7v3j-jr4g).

## [1.0.29] - 2026-01-09

### Added
- **Phase 5: Autonomous Research & Recursive Discovery (FAFCAS)**: Implemented a multi-step "Internal Monologue" research agent.
  - **Discovery Loop**: Iterative SEARCH → READ → EXPLORE → ANALYZE cycles.
  - **Topological Discovery**: Hub-aware entry points using PageRank and Betweenness Centrality.
  - **EXPLORE Action**: Physical graph neighborhood traversal for non-semantic lead discovery.
  - **Chain Verification**: Autonomous "AMALFA Auditor" that double-checks research findings for truthfulness.
  - **Robust JSON Recovery**: Defensive parsing to handle non-compliant LLM outputs.
- **Phase 4: Topological Intelligence**: Integrated structural link prediction into the gardening loop.
  - **Adamic-Adar Index**: Implemented topological relationship scoring in `GraphEngine`.
  - **Structural Gap Detection**: 2-hop shared neighbor analysis to find "missing links."
- **Phase 3 (Chronos) Completion**: Advanced "Timeline Weaving" and temporal grounding verified.
- **Cross-Corpus Readiness**: Infrastructure for multi-repo research initiated.

### Changed
- **Architectural Refactor**: decoupled `sonar-agent.ts` daemon from task logic.
- **Modular Task Handlers**: Synthesis, Timeline, Garden, and Research logic moved to `sonar-logic.ts`.
- **Bun-Native Async I/O**: Switched to `Bun.write` and `fs/promises` for all task processing and reporting.
- **Strict Type Safety**: Replaced `any` assertions with explicit API request interfaces.

## [1.0.28] - 2026-01-08

### Added
- **OpenRouter Cloud Integration**: New `sonar.cloud` config with `openrouter` provider for accessing cloud LLMs
- **Dev-Cloud/Prod-Local Strategy**: Test with large cloud models, deploy with smaller local ones
- **Model Strategy Guide**: New `docs/guides/model-strategy.md` documentation
- **RAG Pipeline**: Vector search now augments chat context for grounded responses
- **ENV API Key**: `OPENROUTER_API_KEY` read from `.env` for secure credential handling

### Changed
- **Tiered Model Strategy**: Research tasks use cloud config, quick tasks use local `qwen2.5:1.5b`
- **Expanded Ingestion Sources**: Root markdown files now included in knowledge graph
- **Model Priority**: Updated to prioritize `qwen2.5:1.5b` as default local model

### Removed
- Cleaned up unused Ollama models: `tinydolphin`, `tinyllama`, `phi3`, `functiongemma`, `nomic-embed-text`, `llama3.1:8b`, `mistral:7b-instruct`


### Added
- **Staleness Detection**: `amalfa stats` now warns (`⚠️ STALE`) if source files are newer than the database.
- **JSON Mode (GBNF)**: Sonar Agent now enforces valid JSON output for `tinydolphin` compatibility.
- **Phi3 Sub-Agent**: Robust daemon (`amalfa phi3`) managing local LLM interactions for chat and analysis.
- **Search Intelligence**: New endpoints `/search/analyze`, `/search/rerank`, `/search/context`.
- **Metadata Enhancement**: AI-powered document enrichment via `/metadata/enhance` connected to ResonanceDB.
- **CLI Tooling**: 
  - `amalfa phi3 chat` (Interactive chat with real-time feedback)
  - `amalfa phi3 status` (Rich diagnostics)
  - `amalfa enhance` (Batch/Single doc enhancement)
- **FAFCAS Optimization**: Prioritized `tinydolphin` (1.1B) model for instant CPU inference.
- **OH-104 Pinch Check**: Physical file verification after WAL checkpoint to prevent silent corruption
- Test script `scripts/verify/test-hardening.ts` for validating resilience improvements

### Changed
- **Sonar Refactor**: Renamed "Phi3" sub-agent to "Sonar Agent" (daemon, CLI, config) for better naming.
- **Default Model**: Switched from `phi3` to `tinydolphin` for vastly improved local performance.
- Hardened ingestion pipeline with explicit file size checks after database checkpoints
- Enhanced MCP gardening tool with tag deduplication logic

## [1.0.19] - 2026-01-07

### Fixed
- Version reporting: CLI now reads version from `package.json` instead of hardcoded value, ensuring single source of truth
- Added missing `validate-config` script to package.json for pre-publish checks

### Documentation
- Added pre-publish checklist to prevent release issues

## [1.0.18] - 2026-01-07

### Added
- **Configurable notifications**: New `watch.notifications` config option to enable/disable desktop notifications from the daemon
- Comprehensive documentation for notification settings in example config

### Changed
- **Cache consolidation**: Moved ML model cache from `.resonance/cache` to `.amalfa/cache` for cleaner project structure
- All runtime artifacts now in single `.amalfa/` directory (database, logs, PIDs, cache)
- Updated `.gitignore` and `.npmignore` to reflect new cache location

### Fixed
- Removed legacy `.resonance/` folder - single source of truth for runtime artifacts
- Cache directory auto-creates on first use with proper error handling

### Documentation
- Added brief and debrief for cache consolidation implementation
- Updated example config with notification settings
- Clarified single `.amalfa/` directory structure in docs

## [1.0.17] - 2026-01-07

### Added
- Added `briefs/` folder to watched sources
- Comprehensive test suite improvements

### Fixed
- EdgeWeaver tests: Added `getRawDb()` mock for LouvainGate compatibility
- DatabaseFactory tests: Corrected parameter order for `connectToResonance()`
- Updated verify scripts with correct DatabaseFactory parameters

### Removed
- Removed unnecessary tests: `olmo_parsing.test.ts`, `schema.test.ts` (outdated after v6 migration)
- Skipped daemon integration tests that require full infrastructure

### Testing
- All core tests passing: 18 pass, 5 skip, 0 fail
- Database validation passing
- Deterministic ingestion verified (tear down and rebuild test)

## [1.0.16] - Previous Release

Initial stable release with MCP server, daemon, and vector search capabilities.

---

**Note**: For full details on each release, see the git commit history and associated debrief documents.
