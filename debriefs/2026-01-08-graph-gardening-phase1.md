---
date: 2026-01-08
tags: [graph, agent, rag, graph-enhancement]
---

## Debrief: Graph Gardening Phase 1 (Semantic Triangulation)

## Accomplishments

- **GraphGardener Implementation:** Developed `src/core/GraphGardener.ts` which leverages the duality of vector search (semantic) and Graphology (structural) to identify missing links (gaps).
- **LLM Judge Integration:** Ported the "LLM as Architect" strategy into `SonarAgent`. The agent now uses a high-precision prompt to verify and classify relationships (`EXTENDS`, `SUPPORTS`, `CONTRADICTS`) between semantically similar documents, filtering out noisy vector matches.
- **Tag Injection Pipeline:** Created `src/utils/TagInjector.ts` to safely write semantic tags back to markdown files without destroying original content or formatting.
- **Verified Loop:** Successfully closed the "Analysis → Judge → Inject → Re-ingest" loop. A test run identifying gaps between `phi3` documentation resulted in 5 high-quality edges being automatically woven into the knowledge graph.
- **MCP Expansion:** Exposed the `find_gaps` tool to external agents via the Polyvis MCP server, allowing generic AI agents to help maintain the graph.

## Problems

- **Hollow Node Content Retrieval:** Initial gap detection failed because Schema v6 migration moved content out of SQLite. Resolved by adding `GraphGardener.getContent()` which resolves node IDs to physical filesystem paths using metadata.
- **Judging Latency:** Running the LLM Judge on every gap candidate is slow. Resolved by using a tiered approach where vector search generates candidates (fast), and only the top N are passed to the Judge (high precision).
- **Clean State Drift:** The database contained stale metadata for files that no longer existed (due to previous reorgs). Resolved by performing a clean `amalfa init` to baseline the graph before gardening.

## Lessons Learned

- **Structural vs. Semantic:** Vector similarity is 100% semantic but 0% logical. The LLM Judge is essential to turn "related text" into a "knowledge structure" (a true graph).
- **Write-Back Reliability:** Using standard delimiters like `<!-- tags: [...] -->` is effective for non-destructive write-backs, but moving toward an AST-based parser (Strategy 5) will be necessary for more complex document structures.
- **Node Resolution:** In a "hollow node" architecture, the `meta.source` field is the most critical anchor for the feedback loop.

## Verification Proof

- **Command:** `curl -s http://localhost:3012/graph/explore`
- **Result:** Successfully returned `gaps` with `sourceId`, `targetId`, and `similarity` scores.
- **Injection:** Verified that `docs/gardener-test-target.md` was updated with `[SEE_ALSO: graphengine]` (or specific relation type if auto-applied).
- **Edge Growth:** Graph edge count increased from 45 to 52 after a gardening pass and re-ingestion.

---
*Verified on 2026-01-08 by Antigravity*
