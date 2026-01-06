# Project Brief: Polyvis Semantic Linking Upgrade ("SieveNet")

**Context:** Polyvis (Hybrid Graph-Vector Database)
**Target:** Coding Agents & Knowledge Retrieval
**Status:** Approved for Implementation
**Date:** 2025-12-12
**Architecture:** Pure TypeScript (Bun Stack)

## 1. The Objective
Replace the blocking, non-scalable `mgrep` linking process with a **Dual-Phase "Sieve and Net" Architecture**. This decouples ingestion speed from graph quality, allowing for instant data availability followed by asynchronous structural refinement.

## 2. The Architecture: SieveNet

The system operates in two distinct phases to balance latency and precision.

### Phase 1: The Sieve (Ingestion)
* **Goal:** Zero-latency "Naive Graph" generation.
* **Mechanism:**
    * **Hard Links:** Deterministic O(N) entity extraction using the **Aho-Corasick** algorithm.
    * **Soft Links:** Probabilistic Nearest-Neighbor (ANN) matching via Vector Store.
* **Outcome:** A dense, high-recall graph available immediately upon chunk ingestion.

### Phase 2: The Gardener (Refinement)
* **Goal:** Entropy reduction and structure formation.
* **Mechanism:**
    * **Pruning:** Removal of weak vector edges and "super-node" noise.
    * **Clustering:** Community detection via **Louvain/Leiden** algorithms (using `graphology`).
* **Outcome:** A tuned, high-precision knowledge graph with clear conceptual clusters.

## 3. Technical Specification

### 3.1 Stack & Dependencies
* **Runtime:** Bun (TypeScript)
* **Graph Core:** `graphology` (Standard library for graph manipulation)
* **Algorithms:**
    * `aho-corasick` (NPM package) - For high-speed keyword extraction.
    * `graphology-communities-louvain` - For community detection.
* **Visualization:** `sigma.js` (Existing integration).

### 3.2 Component: The Hard Linker (Sieve)
* **Input:** Text Chunk + Loaded `Concept` List (from CL).
* **Logic:**
    1.  Initialize Aho-Corasick trie with all CL terms on startup.
    2.  Stream chunk text through the trie.
    3.  Emit `[MENTIONS]` edges for all matches.
* **Constraint:** Must run synchronously within the ingestion loop without blocking.

### 3.3 Component: The Gardener (Net)
* **Input:** `graphology` Graph Instance.
* **Logic:**
    1.  **Prune:** Iterate edges; drop `vector_similarity` edges where `weight < 0.85` (Configurable).
    2.  **Cluster:** Execute `louvain.detailed(graph)`.
    3.  **Enrich:** Assign `community_id` to nodes; create aggregate "Meta-Nodes" for dense clusters if required.
* **Trigger:** Asynchronous / On-Demand (e.g., `bun run tune`).

## 4. Implementation Checklist

- [ ] **Dependency Integration**
    - [ ] Install `aho-corasick` and `graphology-communities-louvain`.
    - [ ] Verify Bun compatibility.

- [ ] **Sieve Implementation (Ingestion)**
    - [ ] Create `SieveLinker` class (Trie initialization).
    - [ ] Implement `link_hard(text)` method.
    - [ ] Update Ingestion Pipeline to write `[MENTIONS]` edges.

- [ ] **Gardener Implementation (Async)**
    - [ ] Create `gardener.ts` script.
    - [ ] Implement Pruning Logic (Thresholding).
    - [ ] Implement Louvain Clustering & Node Attribute update.

- [ ] **Validation**
    - [ ] **Speed:** Benchmark Ingestion (Target: <50ms/chunk).
    - [ ] **Quality:** Verify "Mentation" term linking.
    - [ ] **Visual:** Verify Community Coloring in Sigma.js.

## 5. Future Considerations
* **LLM Verification:** Insert an optional "Judge" step in the Gardener to verify low-confidence edges using a small LLM.
* **Dynamic Thresholding:** Auto-adjust vector similarity thresholds based on graph density.