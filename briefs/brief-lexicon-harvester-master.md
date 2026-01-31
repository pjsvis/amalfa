# Master Brief: Lexicon Harvester ("The Smelter")

**Date:** 2026-01-31  
**Status:** 🚀 Active  
**Precedes:** Graph Linking, Community Detection (Leiden)  
**Dependencies:** JSONL Adoption, Ember Sidecars

## Executive Summary

The **Lexicon Harvester** (or "Smelter") is the process that transforms raw extraction data (from `*.ember.json` sidecars) into the "Golden Lexicon" of the knowledge graph.

It adheres to a critical **"Nodes First, Edges Second"** philosophy to strictly control graph quality and prevent "exponential bullshit" (hairball graphs). It leverages **JSONL (Newline Delimited JSON)** for all intermediate data streams to ensure performance on standard hardware.

---

## core Philosophy: The "Sovereign" Filter

1.  **Nodes First:** We never create an edge to a concept that doesn't exist. We must validate the *atoms* (Nodes) before we validate the *molecules* (Edges).
2.  **Count Before Commit:** We measure the weight of connections before we write them to the database.
3.  **Stream, Don't Load:** We use IO-bound streaming (JSONL) instead of memory-bound loading (JSON Blob).

---

## Phase 1: The Node Harvester (The Census)

*Goal: Establish the population of the graph.*

### 1. Input Stream
*   **Source:** Iterate `*.ember.json` sidecars in `.amalfa/cache/` (or via Watcher stream).
*   **Extraction:** Collect `entities`, `concepts`, `keywords`.
*   **Attributes:**
    *   `term`: Normalized (lowercase, singular).
    *   `source_doc`: UUID of the document.
    *   `type`: Entity vs Concept.

### 2. Aggregation Logic
*   **Stop-List Check:** Check against `stop-list.json`. If found, discard silently.
*   **Golden Check:** Check against existing `golden-lexicon.jsonl`.
*   **Accumulate:** For new terms, maintain a frequency count and source list.

### 3. Output Artifact: `lexicon-candidates.jsonl`
A streamable file for human/agent triage.

```jsonl
{"term": "negentropy", "frequency": 14, "sources": ["doc-1", "doc-5"], "status": "candidate"}
{"term": "machine learning", "frequency": 4, "sources": ["doc-2"], "status": "candidate"}
```

### 4. Triage (The Human/Agent Loop)
*   **Promote:** Move term to `golden-lexicon.jsonl`. (Becomes a **Node**).
*   **Demote:** Move term to `stop-list.json`. (Ignored forever).
*   **Ignore:** Leave in candidates for later.

---

## Phase 2: The Edge Surveyor (The Topology)

*Goal: Map the connections between Golden Nodes.*

### 1. The Evidence
*   **Inputs:** `golden-lexicon.jsonl` (The Sovereignty) AND `*.ember.json` (The Evidence).

### 2. Permutation
*   For each document:
    *   Identify all **Golden Terms** present.
    *   Generate **Potential Edges** (Co-occurrence) between them.
    *   *Constraint:* We are essentially building a Clique for each document, but summing the weights across the corpus.

### 3. Aggregation & Weighting
*   **Key:** `SourceTerm:TargetTerm` (lexicographically sorted to avoid directionality issues if undirected).
*   **Value:** `Weight` (Count of documents where they co-occur).

### 4. Output Artifact: `proposed-edges.jsonl`
A streamable file representing the potential graph topology.

```jsonl
{"source": "negentropy", "target": "information theory", "weight": 12, "type": "co-occurrence"}
{"source": "negentropy", "target": "syntax", "weight": 1, "type": "co-occurrence"}
```

### 5. The "Exponential Bullshit" Check (Sanity Gate)
*   **Metric:** Calculate Graph Density (`Edges / Nodes`).
*   **Heuristic:** If Density > Threshold (e.g., 20) or if a single node connects to > 50% of graph, **ABORT**.
*   **Resolution:** Identify the "Hub" terms causing the explosion (likely generic terms like "System" or "Application") and move them to `stop-list.json`. Refactor.

### 6. Commit
*   Only valid, filtered edges are written to `ResonanceDB`.

---

## Technical Stack

*   **Format:** JSONL (strictly).
*   **Utilities:** `JsonlUtils.ts` (Streaming reader/writer).
*   **Runtime:** Bun (TypeScript).
*   **State:**
    *   `golden-lexicon.jsonl` (Master List).
    *   `stop-list.json` (Deny List).
    *   `lexicon-candidates.jsonl` (Inbox).
    *   `.amalfa/cache/*.ember.json` (Source).

---

## Future Alignment
*   Once the Graph is stable (Post-Phase 2), we feed it to the **Leiden Optimizer** (`brief-leiden-algo-ops.md`) to detect communities.
