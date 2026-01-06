# Debrief: Hybrid Audit & Graph Gardening

**Date:** 2025-12-14
**Participants:** User, Agent (Antigravity)
**Context:** Post-Rebuild, we needed to verify the semantic integrity of the graph beyond just structural metrics.

## 1. The Innovation: Agentic Inquiry (Hybrid Audit)
We moved from "Graph RAG" (User asking Graph) to **"Graph Self-Reflection"** (Agent asking Graph).
We built `scripts/lab/hybrid_audit.ts` to compare **Topological Distance** (Dijkstra) vs **Semantic Similarity** (Cosine).

### The Taxonomy of Anomalies
| AnomalyType | Logic | Meaning | Action |
| :--- | :--- | :--- | :--- |
| **The Wormhole** | Dist > 3 & Sim > 0.92 | Missing Link (Implicit Connection) | Create Edge |
| **The False Bridge** | Dist = 1 & Sim < 0.4 | Bad Link (Semantic Drift) | Review/Delete |
| **The Echo Chamber** | Sim > 0.98 | Duplicate Ontology (Twins) | Merge/Link |

## 2. The Findings
-   **Wormholes:** Initially 177. Found disjointed clusters.
-   **False Bridges:** 0. (Validates `EdgeWeaver` Strict Mode).
-   **Echo Chambers:** 76 pairs.
    -   **Discovery:** Found "Twin Nodes" across domains (e.g., `Mentation` as Concept vs Term).

## 3. The Fix: `link_twins.ts`
We implemented a gardener script to auto-heal the Echo Chambers.
-   **Logic:** Filter for Sim > 0.98.
-   **Action:** Insert bidirectional `SAME_AS` edges.
-   **Result:** 62 new edges created. Wormhole count dropped to 146.

## 4. Lessons Learned
1.  **Periodicity:** This audit is not a one-off. It is "Graph Linting."
2.  **FastEmbed Validation:** We kept `FastEmbed` for this exact reason—running O(N^2) vector checks on 700 nodes takes milliseconds. Relying on an LLM API would have been prohibitively slow.
3.  **Strict Mode Works:** The lack of False Bridges proves our "Strict Linking" policy is keeping the graph clean, if sparse.

## 5. Next Steps
-   Run `link_twins.ts` as a post-ingestion hook?
-   Manually review the remaining 146 Wormholes for "Gold" links.
