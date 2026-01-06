---
date: 2025-12-29
tags: [logging, pino, mcp, hollow-node, migration, fts-removal]
---

## Debrief: Structured Logging & Hollow Node Completion

## Accomplishments

- **Protocol-Safe Logging:** Implemented `pino` based logging routed strictly to `stderr`. This ensures the MCP JSON-RPC protocol on `stdout` remains unpolluted, resolving the "connection closed" errors.
- **Hollow Node Finalization:** Systematic removal of the legacy Full-Text Search (FTS) engine (`searchText`, triggers, virtual tables). Search is now purely Vector+Graph based.
- **Unified Logger Factory:** Created `src/utils/Logger.ts` which provides component-aware loggers (e.g., `getLogger("MCP")`, `getLogger("Ingestor")`).
- **Pipeline Migration:** Refactored `Ingestor`, `SemanticHarvester`, and `Gardeners` to use the new structured logger, removing all unstructured `console.log` calls in critical paths.
- **Verification Suite:** Created `scripts/verify/debug_mcp_protocol.ts` to mathematically prove the separation of `stdout` (protocol) and `stderr` (logs).

## Problems

- **MCP Connection Instability:** The MCP server was crashing with `EOF` errors.
    - **Resolution:** Traced to `console.log` messages interfering with JSON-RPC over stdio. Solved by enforcing `pino.destination(2)` (stderr) for all logs.
- **Legacy FTS Tests:** Tests in `lifecycle.test.ts` and `mcp_matrix.ts` were failing because they relied on the removed `searchText` method.
    - **Resolution:** Removed these tests as they tested deprecated functionality.
- **Gardener Inheritance:** `BaseGardener` constructor was tricky to refactor without breaking subclasses.
    - **Resolution:** Initialized a generic `Logger` in the base constructor, allowing subclasses to use `this.log.info` immediately.

## Lessons Learned

- **Stdio Hygiene is Critical for MCP:** When building STDIO-based tools (LSP, MCP), `stdout` is a binary protocol stream. **Zero** application logs should go there. Always bind logs to `stderr` explicitly.
- **Hollow Node Simplicity:** Removing FTS drastically simplified the database schema and reduced the `resonance.db` size by ~60% (from 5.9MB to 2.3MB), confirming the "Vector is our Reality" thesis.
- **Structured Logs for Ops:** Structured JSON logs make it trivial to parse verification outputs (e.g., checking if specific tags were injected) programmatically, compared to parsing random console strings.
