# Implementation Plan: AMALFA Graph Enhancement "To the Hilt"

This plan outlines the staged implementation of the strategies defined in `docs/graph-enhancement-strategies.md`, focusing on turning the LLM into an "Architect" and the Graph into a "Self-Healing Map."

## Phase 1: The "Judge" (Semantic Triangulation)
**Objective:** Replace raw vector similarity with LLM-verified "Strong Edges."

- [ ] **GraphGardener Upgrade:** Add `judgeGap(source, target)` method.
- [ ] **LLM Integration:** Create a specialized prompt for relationship classification (SUPPORTS, EXTENDS, CONTRADICTS, SEE_ALSO).
- [ ] **Sonar Task Update:** Modify the `garden` task to run the "Judge" before auto-applying tags.
- [ ] **Outcome:** Edges are no longer just "similar text" but logical relationships.

## Phase 2: Synthesis Layer (Community Insights)
**Objective:** Move from atomic notes to "Conceptual Clusters."

- [ ] **Cluster Analysis:** Implement `summarizeCluster(nodes[])` in `GraphGardener`.
- [ ] **Virtual Nodes:** Create a mechanism in `AmalfaIngestor`/`ResonanceDB` to support "Summary Nodes" (nodes that don't exist as files but represent clusters).
- [ ] **Recursive Linking:** Link cluster members to their respective Summary Nodes.
- [ ] **Outcome:** The graph gains a "Higher Order" layer for easier navigation.

## Phase 3: Chronos Layer (Timeline Weaver)
**Objective:** Incorporate the arrow of time as a first-class structural dimension.

- [ ] **Temporal Anchor Extraction:** Implement LLM-based date extraction for both explicit (frontmatter) and implicit (text analysis) dates.
- [ ] **Sequential Edges:** Automatically inject `PRECEDES`/`FOLLOWS` relationships based on chronology.
- [ ] **Interpolation Engine:** Use neighbor proximity to estimate dates for un-dated nodes.
- [ ] **Outcome:** Temporal navigation (e.g., "Show me the evolution of the Search pipeline").

## Phase 4: Topological Intelligence (Structural Link Prediction)
**Objective:** Find relationships that content alone might miss.

- [ ] **Adamic-Adar Integration:** Implement topological link prediction in `GraphEngine` using `graphology` structural metrics.
- [ ] **Cross-Engine Comparison:** Compare topological suggestions vs. vector suggestions.
- [ ] **Outcome:** Multi-signal edge discovery (Semantic + Structural).

## Phase 5: Ontology Guard (Normalization)
**Objective:** Unified naming and relationship taxonomy.

- [ ] **Refactor Utility:** Create a script to batch-rename tags and relationship types throughout the Markdown corpus.
- [ ] **LLM Unification:** Create a task that scans all unique tags and proposes a "Gold Standard" ontology.
- [ ] **Outcome:** Clean, queryable taxonomy with no synonym duplication.

## Testing & Inclusion Criteria
1. **Precision Test:** Does the "Judge" correctly reject noisy vector matches (e.g., "Apple Pie" vs "Apple MacBook")?
2. **Cohesion Metric:** Does "Gardening" increase the Graph Density without creating an unreadable "Hairball"?
3. **Synthesis Utility:** Does a Summary Node actually help the LLM answer a high-level question like "What are the main architectural patterns here?" cleaner than raw RAG?

---
*Created: 2026-01-08*
