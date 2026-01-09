---
title: "AMALFA Status vs. Plans: The Reality Check"
date: "2026-01-09"
type: "report"
tags: ["status", "architecture", "bicameral", "lessons-learned"]
---

# AMALFA Status vs. Plans: The Reality Check

**Date:** 2026-01-09  
**Status:** Phase 5 Verified  
**Observation:** The Map (Graph) is accurate, but noisy.

## 1. Development Status: Active & Operational
AMALFA has successfully transitioned from a prototype to a functioning **Daemon-driven Knowledge Engine**.

*   **Runtime:** `Bun` (verified 3x-10x speedup vs Node).
*   **Database:** `ResonanceDB` (SQLite in WAL mode) is stable and concurrent.
*   **Agent:** `Sonar` is now an autonomous research agent with recursive discovery capabilities.

## 2. Historical Plans vs. Implemented Reality

| Feature | Original Plan | Implemented Reality | Verdict |
| :--- | :--- | :--- | :--- |
| **Database** | Multi-DB "Bicameral" Split | **Unified "Hollow Node" DB** | **Better.** Simpler architecture, zero redundancy. |
| **Search** | Full-Text Search (FTS5) | **Vector + Graph Traversal** | **Smarter.** FTS was noisy; Vectors + Adamic-Adar find meaning. |
| **Content** | Store text in DB | **Read-on-Demand (JIT)** | **Efficient.** DB size dropped 60%; Source of Truth remains filesystem. |
| **Agents** | Complex "Society of Minds" | **Internal Monologue Loop** | **Faster.** One smart agent loop > many chatty agents. |

## 3. The "Noise Hub" Phenomenon
A key finding from recent tests is that **Test Files** (e.g., `ingest-test.ts`) have become accidental **Structural Hubs**.
*   **Why:** Tests import many modules, giving them high *Betweenness Centrality*.
*   **Effect:** When the agent looks for "Important Entry Points," it often lands in a test suite rather than the `README` or `Architecture` docs.
*   **Correction:** Future updates to `GraphGardener` must penalize test files in centrality calculations to prevent distraction.

## 4. Timeline of Recent Evolution
*   **Phase 1 (Foundation):** Migration to Bun, implementation of `ResonanceDB`.
*   **Phase 2 (Synthesis):** Louvain Community detection to find "Clusters of Meaning."
*   **Phase 3 (Chronos):** Temporal Grounding (Date metadata) to enable timeline narratives.
*   **Phase 4 (Topology):** In-memory Graph Engine with Neighborhood Traversal.
*   **Phase 5 (Discovery):** The Autonomous Research Loop (FAFCAS).

## 5. Conclusion
The project is leaner and faster than originally envisioned. By abandoning the "Heavy Database" model for the "Hollow Node" pattern, we created a system that feels alive and responsive. The main challenge remaining is **Focus**: tuning the graph algorithms to ignore "structural noise" (tests/configs) and prioritize "semantic signal" (docs/code).
