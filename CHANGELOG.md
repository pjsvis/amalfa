# Changelog

All notable changes to the **PolyVis** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-12-31
### Added
- **UI:** Implemented "Terminal Brutalist" design system (High-Contrast / Low-Noise).
- **UI:** Added "Vision Helper" (`window.__AGENT_THEME__`) for programmatic theme detection by agents.
- **UI:** Added "Style Auditor" (`window.runStyleAudit()`) for runtime CSS integrity checks.
- **UI:** Added "Hollow" vs "Full" node visualization states in `sigma.js` renderer.
- **UI:** Added "Agent Activity" indicator color (`--ansi-orange` / `#FF8C00`).
- **Arch:** Added "FAFCAS" Protocol (Feature Alignment / Frequency Correction / Amplitude Scaling) for normalized embeddings.
- **Docs:** Added `CHANGELOG.md` as a primary context source.

### Changed
- **UI:** Replaced generic color palette with strict **ANSI Standard** variables (`basecoat-css`).
- **UI:** Enforced `border-radius: 0px` global reset.
- **UI:** Refactored Home Page to "Vertical Monolith" layout (5:8 Aspect Ratio).
- **UI:** Updated Navbar Brand to use `--ansi-cyan` (System Identity).
- **UI:** Implemented "Semantic Inversion" for hover states (High Contrast).
- **Arch:** Initiated migration from `fastembed` to `model2vec` (Pending Benchmark results).
- **Arch:** Deprecated "Context Engineering" in favor of "Constraint Stacking" for Agent prompts.

### Fixed
- **Code:** Resolved all Biome linting issues (`noExplicitAny`, `noStaticOnlyClass`).
- **Code:** Eliminated strict TypeScript errors across the codebase.
- **Code:** Refactored static-only classes to `export const` objects for better tree-shaking and simplicity.
- **Code:** Strong typing for Database Query results (removed `any` casting).

### Removed
- **UI:** Removed all shadows, gradients, and non-monospace fonts.
- **UI:** Removed "Soft" interaction states (transitions/fades) in favor of "Hard" inversions.

## [1.0.0] - 2025-12-29
### Added
- **Core:** Initial release of the "Hollow Node" architecture.
- **Runtime:** Validated **Bun** + **SQLite** (`bun:sqlite`) substrate.
- **Visor:** Canvas-based Graph rendering via `sigma.js`.
- **Agent:** MCP Server implementation with `search_documents` and `read_node` tools.
- **Pipeline:** "Semantic Harvester" python bridge for initial ingestion.