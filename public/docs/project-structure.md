# Project Structure

This document outlines the organization of the Polyvis codebase, following the "Lift and Shift" reorganization of December 2025.

## Root Directory

| Directory/File | Description |
| :--- | :--- |
| `src/` | Application Source Code (Core Logic, UI, Styles). |
| `scripts/` | Data Pipeline, CLI Tools, and Verification Scripts. |
| `public/` | Static Assets served to the browser (HTML, Data). |
| `docs/` | Project Documentation. |
| `playbooks/` | Operational Protocols and How-To Guides. |
| `resonance/` | The Resonance Engine (AI/Embedding logic). |
| `tests/` | Unit and Integration Tests (Bun Test). |

## `src/` (Application Source)

The `src` directory contains the code destined for the application bundle or MCP distribution.

- **`core/`**: The "Bento Box" logic (shared kernel).
    - `BentoNormalizer.ts`: Normalizes raw Markdown (headlines, frontmatter).
    - `EdgeWeaver.ts`: Links Nodes -> Edges using Lexicon.
    - `Harvester.ts`: Scans codebase for `tag-` tokens.
- **`config/`**: Shared constants and configuration.
- **`css/`**: Styling source (imported by build process).
- **`data/`**: Runtime data structures (e.g., `LocusLedger`).
- **`db/`**: Database Schema definitions (Drizzle ORM).
- **`types/`**: Shared TypeScript interfaces (`IngestionArtifact`, etc.).

## `scripts/` (Pipeline & Tooling)

Scripts are organized by function to prevent clutter.

- **`core/`**: *Deprecated/Empty* (Logic moved to `src/core`).
- **`pipeline/`**: The Data Ingestion Pipeline.
    - `sync_resonance.ts`: Main logic to sync Markdown -> DB.
    - `load_db.ts`: Raw SQL loading into `resonance.db`.
    - `ingest_experience_graph.ts`: Legacy experience ingestion.
- **`cli/`**: Human-facing CLI commands.
    - `harvest.ts`: Run the harvester manually.
    - `normalize_docs.ts`: Test normalization on files.
- **`verify/`**: Integrity Checks.
    - `verify_integrity.ts`: DB vs Source truth.
    - `find_refs.ts`: Deprecation scanner.
- **`legacy/`**: Old scripts kept for reference (deprecated).

## `public/` (Web Root)

- **`data/`**: Contains the generated SQLite databases.
    - `ctx.db`: The Legacy Knowledge Graph.
    - `resonance.db`: The New unified graph.
- **`explorer/`**: The SigmaJS Graph Explorer.

## Key Configuration Files

- **`polyvis.settings.json`**: Central configuration for paths (DB locations, source dirs).
- **`tsconfig.json`**: TypeScript configuration, including Path Aliases:
    - `@/*`: Root
    - `@src/*`: `src/`
    - `@scripts/*`: `scripts/`
    - `@resonance/*`: `resonance/`
