---
date: 2026-02-01
tags:
  - protocol
  - edge-generation
  - structure
  - heuristics
agent: antigravity
environment: local
---

# Structural Surfacing Protocol (The Edge Surveyor)

## Purpose
To transform a "Bag of Nodes" into a meaningful Graph by identifying and generating connections (Edges) between them. This protocol prioritizes structural heuristics and existing extracted intelligence over brute-force embedding similarity.

## Philosophy: "Linting for Meaning"
We treat the corpus like code. We look for the "Call Graph" of human language: mentions, definitions, and hierarchies.
*   **Don't Read Everything:** Use the structure (TOC, Headings, Intros) to infer importance.
*   **Don't Waste Intelligence:** Use the relationships already found by the LLM sidecars.
*   **Nodes First:** We ONLY generate edges between validated "Golden Nodes".

## The Pipeline

### 1. The Input
*   **Golden Lexicon:** The validated list of 966+ Nodes.
*   **Sidecars:** The `LangExtract` outputs (containing semantic `relationships`).
*   **Raw Corpus:** The `.md` and code files (for structural scanning).

### 2. Strategy A: Sidecar Harvesting (The Semantic Layer)
*   **Source:** `*.ember.json` -> `relationships` array.
*   **Logic:**
    *   Iterate all relationships found by `LangExtract`.
    *   **Filter:** Check if *both* `source` and `target` exist in the **Golden Lexicon**.
    *   If yes, promote to a valid Edge.
    *   **Type:** Use the extracted type (e.g., `USES`, `DEPENDS_ON`).

### 3. Strategy B: Structural Scouting (The Structural Layer)
*   **Source:** Raw text files.
*   **Logic:**
    *   **The Heading Heuristic:** If Node A is in a Heading, and Node B is in the paragraph below, create Edge `A -> B` (Type: `CONTEXT`).
    *   **The Proximity Heuristic:** If Node A and Node B appear in the first 10% of a document (The Abstract), they are `CO_THEMATIC` (High Weight).
    *   **The Definition Heuristic:** If Node A appears in a sentence like "X is a Y", and "Y" is Node B, create Edge `A -> B` (Type: `IS_A`).

### 4. The Output
*   **Artifact:** `proposed-edges.jsonl`.
*   **Format:**
    ```json
    {
      "source": "node-a-id",
      "target": "node-b-id",
      "type": "USES",
      "weight": 1.0,
      "meta": { "origin": "sidecar-hash", "method": "llm-extract" }
    }
    ```

## Implementation Plan
1.  **Refactor:** Ensure `LexiconHarvester` or a new `EdgeSurveyor` script can access raw files.
2.  **Optimization:** Use extracted Golden IDs for fast lookup (Aho-Corasick or Set lookups).
3.  **Validation:** Count "Orphan Nodes" (Nodes with 0 edges). Too many orphans = failed survey.

## Definition of Done
Topological Analysis allows us to make statements like:
*   "This corpus is coherent" (Low Orphan Count, clear Hubs).
*   "This corpus is fragmented" (Many unconnected clusters).
