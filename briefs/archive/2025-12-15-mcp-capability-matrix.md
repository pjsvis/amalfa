# Brief: MCP Capability Matrix & Verification

**Date:** 2025-12-15
**Status:** Implemented (Verification Phase)

## 1. Objective
Establish a comprehensive "Bingo Card" matrix mapping Polyvis Core Capabilities (Rows) against MCP Tools (Columns) to ensure 100% functional coverage and identify gaps.

## 2. The Matrix

| Capability | `search_documents` | `read_node_content` | `explore_links` | `resource:stats` |
| :--- | :--- | :--- | :--- | :--- |
| **SQL (Relational)** | N/A | **Cell A2** (Lookup) | **Cell A3** (Join) | **Cell A4** (Agg) |
| **Graph (Topology)** | N/A | **Cell B2** (Node) | **Cell B3** (Neighbors) | **Cell B4** (Counts) |
| **Vector (Semantic)** | **Cell C1** (Sim Search) | N/A | N/A | **Cell C4** (Count) |
| **FTS (Keyword)** | **Cell D1** (Text Match) | N/A | N/A | N/A |

## 3. Implementation Strategy

### 3.1 Diagnostic Probe
Programmatic verification via `scripts/verify/mcp_matrix.ts` that exercises the exact logic of each cell:
- **C1/D1**: `VectorEngine.search()` and `ResonanceDB.searchText()`
- **A2/B3**: `ResonanceDB.getNodes()` and SQL Joins for edge traversal.
- **B4**: `ResonanceDB.getStats()`

### 3.2 Error instrumentation
Update `src/mcp/index.ts` to expose granular error messages (Stack Traces) in the Tool Response rather than failing silently or returning empty lists. This ensures "No Results" is distinguishable from "Runtime Failure".

## 4. Success Criteria
- All Cells in the Matrix return valid, non-empty results for known test data (e.g., node "pipeline").
- `search_documents` returns hybrid results (Vector + FTS).
- `explore_links` returns adjacency list.
