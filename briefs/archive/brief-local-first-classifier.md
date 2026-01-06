**Locus Tag:** `[Locus: Project_Brief_Synthesis]`

I have synthesised the entire session into a comprehensive **Project Brief**. This artifact adheres to **OH-075 (Agentic Brief Robustness Protocol)** and **OH-095 (The TASE Mandate)**, providing a singular, "happy path" documentation for the **Polyvis Ingestion & Visualisation Pipeline**.

---

# Project Brief: Polyvis Sovereign Ingestion Pipeline

**Version:** 1.0 (Draft)
**Status:** `AWAITING_EXECUTION`
**Owner:** Ctx / pjsvis
**Date:** 2025-12-25
**Designation:** Sovereign AI Knowledge Graph Architecture

## 1. Executive Summary

This project implements a fully **local-first ("sovereign")** pipeline to transform unstructured text ("Stuff") into a structured Knowledge Graph ("Things") within the **AntiGravity IDE**. It leverages the **"Sieve and Net" Protocol** to efficiently extract semantic triples using a hybrid of lightweight classification (**SetFit**) and precise LLM extraction (**Llama.cpp**), persisting the result in a **SQLite Runtime** optimised for high-performance visualisation via **Graphology/Sigma.js**.

## 2. Core Directives & Heuristics

* **[PHI-12] Conceptual Entropy Reduction:** The primary function is to distill order from chaos.
* **[OH-041] Principle of Optimal Simplicity:** Avoid external API dependencies (Walled Gardens); prioritise local, maintainable tools.
* **[OH-040] Principle of Factored Design:** Decouple "Semantic Truth" (Harvester) from "Visual Beauty" (Sigma.js).
* **[OH-095] The TASE Mandate:** **T**est (Classifiers), **A**utomate (Harvester), **S**cale (SQLite Runtime), **E**vangelise (Visualisation).

## 3. The Architecture: "Sieve, Net, and Runtime"

### 3.1 Component Stack

1. **Substrate:** `llama-server` running a quantized LLM (e.g., Mistral 7B) + `SetFit` (Sentence Transformer).
2. **The Sieve (Classifier):** A fast, Python-based SetFit model trained to flag text as `DEF_CANDIDATE` or `DIR_CANDIDATE`.
3. **The Net (Extractor):** Llama.cpp constrained by **GBNF Grammars** to output strict JSON triples (`source`, `rel`, `target`) from flagged text.
4. **The Artifact (Sidecar):** `knowledge_graph.json` – An idempotent, human-readable file containing all extracted knowledge.
5. **The Runtime (DB):** A **SQLite** database acting as the live memory. It uses an **Upsert Strategy** to refresh semantic data while preserving visual layout state.
6. **The Visualiser:** **Graphology** (Logic) + **Sigma.js** (Render) + **Louvain** (Community Detection) running on the frontend/backend hybrid.

## 4. Operational Workflow

| Stage | Action | Tool | Output |
| --- | --- | --- | --- |
| **1. Ingest** | Scan document stream for "High Entropy" signals. | `harvester.py` (SetFit) | Flagged Sentences |
| **2. Extract** | Convert sentences to structured Triples. | `harvester.py` (Llama+GBNF) | `knowledge_graph.json` |
| **3. Hydrate** | Load Triples into SQLite, preserving visual state. | `loader_v2.py` | `polyvis_runtime.db` |
| **4. Structure** | Calculate Communities based on `Veracity` weight. | `calc_communities.py` | `node_layout` (Updated) |
| **5. Visualise** | Render graph with persistent coordinates. | Sigma.js | Visual Output |

## 5. Implementation Roadmap (Status)

* [x] **Phase 1: Concept & Validation** (Completed in session)
* Defined "Sieve and Net" strategy.
* Selected stack: SetFit + Llama.cpp + SQLite.


* [ ] **Phase 2: Implementation (The "Heavy Lifting")**
* **Training:** Generate `training_data.json` and run `train_classifier.py` to build the Sieve.
* **Grammar:** Deploy `graph_triples.gbnf` to the local Llama server.
* **Harvest:** Run `harvester.py` against the document corpus.


* [ ] **Phase 3: Integration (The "Live Wire")**
* **Loader:** Implement `loader_v2.py` with `UPSERT` logic for visual stability.
* **Community:** Run `calc_communities.py` to bake "7 Communities" logic into the layout.
* **Frontend:** Connect Graphology to the SQLite `node_layout` table.



## 6. Key Innovations

* **Idempotent "Sidecar":** The database can be nuked at any time; the `knowledge_graph.json` is the source of truth.
* **Veracity Weighting:** Visual clustering (Louvain) is driven by the *truthfulness* (`veracity` * `confidence`) of connections, not just their existence.
* **Visual Persistence:** The "Smart Loader" ensures that re-running the extraction pipeline does not destroy manual layout adjustments.

## 7. Next Immediate Action

**Execute `run_ingest.sh**`. This single command will validate the environment, train the classifier (if missing), check the Llama server, run the harvester, and hydrate the database.

---

**Would you like me to generate the "README.md" file for the repository to accompany this brief?**