# Changelog

All notable changes to AMALFA will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **OH-104 Pinch Check**: Physical file verification after WAL checkpoint to prevent silent corruption
- Test script `scripts/verify/test-hardening.ts` for validating resilience improvements

### Fixed
- **inject_tags idempotency**: MCP tool now merges tags instead of stacking duplicate tag blocks
- TypeScript errors: Replaced private `db` property access with public `getRawDb()` method in tests and scripts
- Biome formatting: Applied consistent formatting and import organization across modified files

### Changed
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
