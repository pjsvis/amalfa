# Changelog

All notable changes to AMALFA will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-01-26

### Added
- **LangExtract Sidecar**: Integrated Python-based entity extraction via MCP/Stdio bridge.
  - New robust Node.js client (`src/services/LangExtractClient.ts`) with Zod validation and Pino logging.
  - Automatically enriches documents >200 chars during `amalfa ember scan`.
  - Handles API rate limits (429) gracefully.
- **Reranker Integration**: Finalized BGE-M3 cross-encoder support.
  - Added `--rerank` flag to `amalfa search` CLI command.
  - Integrated `ContentHydrator` for retrieving document content for reranking.
  - Verified end-to-end quality improvement.
- **Example Config**: Added `amalfa.config.example.json` reference file.

### Changed
- **Service Naming**: Renamed `amalfa daemon` to `amalfa watcher` to align with internal naming and reduce confusion.
  - `amalfa daemon` is now deprecated but still works (with warning).
  - Updated `package.json` scripts to use `watcher`.
- **Ember Hardening**: Fixed critical bug in tag parsing logic that caused garbage tags (single characters).
  - Implemented strict array checking for tags.
  - Added hygiene filters to remove numeric-only and short tags.
  - Updated `EmberAnalyzer` to use project-relative paths for portable sidecars.

### Fixed
- **Tag Corruption**: Identified and fixed corrupted metadata in documentation files (`newbie-onboarding.md`, etc.) caused by previous buggy runs.
- **Git Hygiene**: Added `*.ember.json` to `.gitignore` to treat sidecars as ephemeral artifacts.

## [1.4.4] - 2026-01-17
### Added
- **Consistency Audit System**: Automated consistency checker for documentation/code alignment
  - 6 check categories: CLI commands, file paths, service naming, config schema, cross-references, legacy commands
  - Integrated into precommit hook with 80% threshold
  - JSON output for dashboard integration
  - Command: `bun run consistency-report`

### Improved
- **MCP Tool Descriptions**: Enhanced all 8 tool descriptions with strategic guidance
  - When to use each tool (search_documents, explore_links, find_gaps, etc.)
  - Value proposition and trigger scenarios
  - Better agent understanding of tool purpose
- **User Prompting Guide**: Added comprehensive section to README.md
  - Effective prompts during and after work
  - Building institutional memory patterns
  - When NOT to prompt (novel problems, fresh thinking)
- **Agent Developer Documentation**: New 113-line section in MCP-TOOLS.md
  - Strategic tool usage patterns
  - When to encourage debriefs and playbooks
  - Proactive vs reactive search patterns
  - TypeScript integration examples

### Documentation
- **Fixed Consistency Issues**: Improved from 76% to 98% consistency score
  - Documented all CLI commands (validate, enhance, scripts, kill alias)
  - Fixed daemon file path references in ARCHITECTURE.md
  - Replaced legacy `rm -rf .amalfa/` with staged recovery approach
  - Created `amalfa.config.example.json`
  - Updated all legacy command references

### Developer Experience
- **Precommit Hook Enhancement**: Now includes 4 checks
  - TypeScript compilation
  - Biome lint/format
  - **NEW:** Consistency audit (80% threshold)
  - Changelog verification

## [1.4.3] - 2026-01-16
### Documentation
- Bump to 1.4.3

## [1.4.2] - 2026-01-16
### Documentation
- Created `docs/USER-MANUAL.md` as the definitive guide for configuration and operations.
- Refactored `README.md` to be a lighter landing page.

## [1.4.1] - 2026-01-16
### Documentation
- Updated README.md with Tiered Maintenance Strategy and Sub-Agent documentation.

## [1.4.0] - 2026-01-16

### Added
- **BGE-M3 Reranking Infrastructure**: Implemented cross-encoder reranking Service.
  - **Standalone Reranker Daemon**: New service on port 3011 using `Xenova/bge-reranker-base` (ONNX).
  - **Benchmark Framework**: Comprehensive 4-way comparison tool (none/bge-m3/sonar/hybrid).
  - **High Accuracy**: Validated 99.92% accuracy on semantic filtering tasks.
  - **Vector Daemon Integration**: Added `/rerank` endpoint (currently proxies to reranker daemon).
  - **CLI Integration**: Added `amalfa reranker` commands and included in `stop-all`.



## [1.3.0] - 2026-01-13

### Changed
- **Database Schema**: Migrated to Drizzle ORM for schema management (internal implementation detail)
- **Content Storage**: Database now stores only metadata and embeddings (hollow nodes). Content read from filesystem via `GraphGardener.getContent()`
- **Vector Search**: Fixed embedding model consistency - now uses `BGESmallENV15` throughout for improved recall accuracy
- **Sonar Integration**: Added proper content hydration before reranking to resolve empty placeholder issue

### Added
- **Content Hydrator**: `src/utils/ContentHydrator.ts` for explicit filesystem content loading
- **Database Procedures**: `src/resonance/DATABASE-PROCEDURES.md` documenting canonical database operations
- **Sonar Diagnostics**: Test suite and assessment tools for reranking service quality

### Fixed
- **Vector Recall**: Resolved embedding model mismatch causing poor search results
- **Sonar Content**: Fixed hollow node issue where Sonar received empty content

### Removed
- **Custom Migration System**: Replaced with Drizzle ORM (232 lines deleted from `src/resonance/schema.ts`)

### Migration

**The database is a disposable runtime artifact.** If experiencing issues after upgrade:

```bash
rm -rf .amalfa/
bun run scripts/cli/ingest.ts
```

Your documents are the single source of truth. Database can be regenerated anytime.

## [1.2.0] - 2026-01-13

### Added
- **Scratchpad Protocol (Phase 7)**: Intercepts large MCP tool outputs (>4KB) and caches them to `.amalfa/cache/scratchpad/`, returning a reference with preview instead of full content. Reduces context window usage for verbose responses.
  - New `scratchpad_read` and `scratchpad_list` MCP tools for retrieving cached content.
  - Content-addressable storage with SHA256 deduplication.
  - Configurable threshold, max age (24h), and cache size limit (50MB).

## [1.1.0] - 2026-01-13

### Added
- **Graphology Workflows (Phase 6)**:
  - Added Adamic-Adar ("Friend-of-a-Friend") link prediction strategy.
  - Added PageRank ("Pillar Content") identification strategy.
  - Added Louvain ("Global Context") community detection strategy.
  - Added `amalfa enhance --strategy=<strategy>` CLI command to expose these analyses.
- **Autonomous Research (Phase 5)**:
  - **LouvainGate**: Configurable thresholds for super-node detection.
  - **Pipeline History**: Added `history` table to track graph mutations.
  - **CLI Promotion**: `amalfa stats --orphans` and `amalfa validate --graph` for advanced diagnostics.
  - **Graph Features**: Exposed `GraphEngine.traverse()` (BFS) and `validateIntegrity()`.

### Changed
- **CLI Architecture**: Refactored monolithic `src/cli.ts` into modular command files (`src/cli/commands/*.ts`) for maintainability.
- **Cleanup**: Deprecated legacy `tag-slug` syntax in EdgeWeaver.

## [1.0.40] - 2026-01-09

### Added
- **Ember Phase 2**: Integrated `EmberService` into the `AmalfaDaemon`.
- **Optimization**: Changes to file content now trigger immediate sidecar generation (if applicable).
- **Configuration**: Added `tests` to default `excludePatterns`.
- **CLI**: Added `amalfa stop-all` (alias `kill`) to stop all running services.

## [1.0.39] - 2026-01-09

### Fixed
- **Documentation**: Updated CHANGELOG.md to include recent Ember Service changes (missed in 1.0.38).
- **Testing**: Fixed `analyzer.test.ts` to correctly pass file content, resolving pre-commit failures.
- **Process**: Added Changelog version verification to `pre-commit` hook to prevent future ghost releases.

## [1.0.38] - 2026-01-09

### Added
- **Ember Service**: Introduced the `amalfa ember` command suite for automated documentation enrichment.
  - `amalfa ember scan`: Analyzes documents using graph communities to suggest missing tags (Sidecar generation).
  - `amalfa ember squash`: Safely merges sidecar suggestions into markdown frontmatter using `gray-matter`.
- **Graph Intelligence**: Integrated `GraphEngine` into Ember for community detection (Louvain) and neighbor-based tag recommendation.
- **Stub Detection**: Added heuristics to automatically tag short content as `stub`.

### Changed
- **Ingestion Pipeline**: Upgraded `AmalfaIngestor` to use `gray-matter` for robust frontmatter parsing (replacing legacy regex).
- **CLI**: Expanded `src/cli.ts` to include `ember` command handling.

### Fixed
- **Testing**: Resolved content read logic in `analyzer.test.ts`.

## [1.0.37] - 2026-01-09

### Added
- **Drizzle Integration**: Added Drizzle ORM for schema management and migrations using `drizzle-kit`.
- **Hono Migration**: Migrated Sonar Agent to Hono for robust routing and standard middleware support.
- **Guardrails**: Added explicit "No ORM Runtime" policy for FAFCAS compliance (Drizzle for schema only).

### Changed
- **Dependency Pinning**: Pinned all dependencies in `package.json` to exact versions to prevent drift.
- **Cleanup**: Removed stale deprecations and unused imports across the codebase.

## [1.0.36] - 2026-01-09

### Fixed
- **Pre-commit Checks**: Resolved TypeScript regex match narrowing issues in `doc-consistency-check.ts`
- **Biome Configuration**: Excluded lab/legacy scripts from linting to focus on core code quality
- **Branch Protection**: Added local pre-commit hook to prevent direct commits to main branch

### Added
- **Documentation**: Comprehensive README files added throughout codebase (`src/`, `scripts/`, `src/cli/`, `src/config/`, `src/daemon/`, `src/resonance/services/`, `src/resonance/types/`, `src/types/`, `src/utils/`)
- **Development Tooling**: Pre-commit hook script for local branch protection

## [1.0.35] - 2026-01-09

### Changed
- **Version Bump**: Minor version increment for release preparation

## [1.0.34] - 2026-01-09

### Changed
- **Code Quality**: Applied Biome formatting and lint fixes across the entire codebase to improve consistency and maintainability.

## [1.0.32] - 2026-01-09

### Fixed
- **CLI**: `setup-mcp` now correctly includes the `--cwd` flag in the generated JSON config. This prevents `EROFS` (read-only file system) errors when the MCP server is launched by clients (like Claude Desktop or Antigravity) that might use a read-only root as the working directory. It forces the server to run in the user's project root where it has write permissions for logs and databases.

## [1.0.31] - 2026-01-09

### Fixed
- **Publishing**: Included `tsconfig.json` in the published package files. This ensures that global installations (via `npm` or `bun`) can correctly resolve path aliases (e.g., `@src/`) when running the CLI or MCP server.
- **CLI**: Improved CWD handling when running from system root.

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
