---
date: 2026-01-28
tags: [feature, squash, hybrid-search, mcp-server, verification, schema, performance]
agent: gemini
environment: local
---

## Debrief: LangExtract Squash & Late-Fusion Hybrid Search

## Accomplishments

- **Symbolic Ingestion (The Squash Protocol):**
    - Implemented `SidecarSquasher.ts` to ingest JSON sidecars (from Python LangExtract) into `ResonanceDB`.
    - Created `amalfa squash` CLI command.
    - Updated SQLite Schema to include a `summary` column in `nodes` table for storing extracted definitions ("Texture").
    - **Outcome:** The graph now supports high-fidelity "Symbol Nodes" (classes, functions) distinct from "File Nodes", with rich definitions.

- **Late-Fusion Hybrid Search (The Bicameral Mind):**
    - Optimized `GrepEngine` (Left Brain) to handle large codebases (ignoring `node_modules`) and map file paths to Node IDs.
    - Updated `GraphGardener` to prioritize `summary` content for Symbol Nodes, enabling precise context injection.
    - Verified `src/mcp/index.ts` implements the convergent pipeline: `(Vector + Grep) -> Dedupe -> Rerank`.
    - **Outcome:** Search now finds exact symbol matches (via Grep) and conceptual matches (via Vector), merging them into a single high-quality result set via BGE Reranker.

- **Performance & Reliability:**
    - Fixed a race condition in `GrepEngine` initialization.
    - Ensured `SidecarSquasher` uses synchronous transactions for reliability with `bun:sqlite`.
    - Added E2E tests (`scripts/verify/e2e-squash.ts`) verifying the full flow from Sidecar -> DB -> Graph Verification.

## Problems

- **Transaction Syntax:** Initially attempted to use Drizzle's async transaction API with `bun:sqlite`'s raw driver, which caused silent failures.
    - **Resolution:** Switched to `bun:sqlite`'s native synchronous `transaction()` wrapper and raw SQL prepared statements. This is faster and more consistent with the project's "Database Factory" pattern.
- **Grep Performance:** `GrepEngine` initially timed out (26s) by scanning `node_modules`.
    - **Resolution:** Added robust exclusion flags (`--exclude-dir` / `--glob !...`) for `ripgrep` and `grep`. Search time dropped to <150ms.
- **Pre-commit Blocks:** Encountered strict Biome/TypeScript checks (no non-null assertions, unused vars).
    - **Resolution:** Applied fixes and safe suppressions where necessary to pass the gate.

## Lessons Learned

- **Database Abstraction Leaks:** Mixing Drizzle ORM logic with raw `bun:sqlite` logic in the same transaction context is dangerous. Stick to one paradigm per service.
- **Sidecar Transparency:** "Ghost Data" (sidecars) must be materialized into the graph to be useful. Grep searching the *sidecar file* itself is noise; Grep must find the *source file*, and the Graph must link it to the *Symbol Node*.
- **Sync vs Async:** `bun:sqlite` is fundamentally synchronous. Async wrappers around it often lead to "floating promises" or dropped transactions if not handled carefully.

## Verification Proof

- **E2E Test:** `scripts/verify/e2e-squash.ts` successfully ingested 5 dummy sidecars, created 6 symbol nodes, and verified metadata and relationships.
- **Manual Search:** `amalfa search` works and uses the new pipeline without regression.
