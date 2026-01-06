# Debrief: MCP Capability Verification

**Date:** 2025-12-15
**Topic:** MCP Server & Polyvis Capability Matrix

## 1. Summary
We successfully consolidated the Resonance Engine and then performed a "Bingo Card" verification of the MCP Capabilities. While the underlying logic and database are sound (proven via script), the live MCP Server exhibited runtime issues with Search.

## 2. Findings

### ✅ The "Code" Works (Diagnostic Script)
We created `scripts/verify/mcp_matrix.ts` which successfully exercised every cell in the matrix against `public/resonance.db`:
- **Vector Search:** Found 5 matches for "pipeline".
- **FTS Search:** Found 10 matches for "pipeline".
- **Graph Traversal:** Found edges.
- **Node Lookup:** Found nodes.

### ⚠️ The "Runtime" Stalled (MCP Server)
The live tool `search_documents("pipeline")` returned `[]` (Empty).
- **Cause:** Likely environment discrepancy (CWD path resolution) or `fastembed` model loading failure in the long-running MCP process.
- **Action:** Instrumented `src/mcp/index.ts` to return specific error messages in the tool output instead of swallowing them.

## 3. The Matrix Status

| Cell | Tool | Status (Script) | Status (Live) |
| :--- | :--- | :--- | :--- |
| **A2** | Reading Nodes | ✅ PASS | ✅ PASS |
| **B3** | Exploring Links | ✅ PASS | ⚠️ Pending |
| **C1** | Vector Search | ✅ PASS | 🔴 FAIL (Empty) |
| **D1** | FTS Search | ✅ PASS | 🔴 FAIL (Empty) |
| **B4** | Stats | ✅ PASS | ✅ PASS |

## 4. Next Steps
1.  **Restart via System**: The user/system needs to restart the MCP server to pick up the code changes (especially the consolidation refactor and error instrumentation).
2.  **Verify Fix**: Run `search_documents` again. If it fails, report the specific error message now exposed.
