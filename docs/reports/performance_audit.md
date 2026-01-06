# Performance Audit & Optimization Brief
**Date**: 2025-12-16
**Status**: DRAFT

## 1. Executive Summary
We identified a major inefficiency in the **Search Inner Loop** (`VectorEngine.ts`) and several smaller optimizations.
- **Biggest Choke Point**: `VectorEngine.search()` fetches the full `content` of every node in the database into the JavaScript heap just to perform vector similarity checks.
- **Impact**: O(N) memory allocation and SQLite-to-JS bridge traffic on every search. As the graph grows, search latency and memory usage will explode.
- **Complexity**: Low effort to fix (splitting the query).

## 2. Analyzed Components

### A. `VectorEngine.ts` (Read Path) - ✅ OPTIMIZED
**Optimization Implemented**: "Slim Search"
-   We now specifically select `id, embedding` for the ranking phase.
-   `content` is only hydrated for the top K results.
-   **Result**: Massive reduction in search I/O and memory pressure.

### B. `ResonanceDB` (Core I/O)
**Observations**:
-   `getNodes(domain?)`: **CRITICAL RISK**. Performs `SELECT * FROM nodes` with **NO LIMIT**.
    -   Fetches `content` (large) and `embedding` (binary) for the entire graph.
    -   **Verdict**: Abusing Limits (by undefined limits). Will crash with large graphs.
-   `findSimilar(...)`: **Redundant**.
    -   Reimplements the dot-product logic found in `VectorEngine`.
    -   Excludes `content` (Good) but still loads all embeddings into memory.
    -   **Verdict**: Should be deprecated in favor of `VectorEngine`.

### C. `EdgeWeaver` (Graph Construction)
**Observations**:
-   Uses an in-memory `lexicon` Map for O(1) lookups during weaving.
-   **Startup**: Loads full lexicon from DB. Acceptable for current ontology size (<10k items), but worth monitoring.
-   **Thread Safety**: No locking, but `insertEdge` uses `INSERT OR IGNORE`.

## 3. Recommended Actions (Impact vs Effort)

| Optimization | Impact | Effort | Description |
| :--- | :--- | :--- | :--- |
| **Slim Search Loop** | High | Low | **DONE**. `VectorEngine.search` now optimal. |
| **Fix `getNodes`** | High | Low | Add `limit` and `offset` parameters. Add option to exclude `content`/`embedding` columns (`SELECT id, title...`). |
| **Deprecate `findSimilar`** | Med | Low | Remove `db.findSimilar` and route all vector search through `VectorEngine` to ensure single optimized path. |
| **Cache Embeddings** | High | Med | In long-running processes (`mcp`, `daemon`), cache the `Float32Array`s in memory to avoid `BLOB -> JS` deserialization overhead. |
