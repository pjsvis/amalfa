
# Debrief: Experience Graph Tuning & Densification

**Date:** 2025-12-08
**Topic:** Experience Graph Visualization, Data Densification, and Configuration Unification.

## Lessons Learned


## Accomplishments


## Problems

## 1. Context
The user successfully refactored the Sigma Explorer but found the "Experience Graph" (visualizing Playbooks and Debriefs) to be sparse, disconnected, and visually distorted. We needed to tune the visualization, densify the connections, and ensure robust configuration.

## 2. What Went Well
*   **Semantic Densification:** We successfully adapted the keyword-matching logic from the Persona graph to the Experience graph. By identifying "Signifier Keywords" (e.g., "Sigma", "CSS") in titles and scanning content, we increased graph connectivity from **5 edges** (structural only) to **900+ edges** (rich semantic web).
*   **Visualization Tuning:**
    *   **Dynamic Resolution:** Implemented domain-specific Louvain resolution settings in `polyvis.settings.json` (Persona: 1.1, Experience: 1.0).
    *   **Orphan Pruning:** Added logic to `graph.js` to automatically drop nodes with Degree 0, ensuring a clean visual output (removing the dangling `bun-playbook`).
    *   **Camera Centering:** Fixed a UX issue where switching domains left the camera looking at empty space; now calls `zoomReset()` automatically.
*   **Configuration Unification:** Refactored `build_experience.ts` to read source paths from `polyvis.settings.json` instead of hardcoded arrays, establishing a Single Source of Truth.
*   **Bug Fixing:** Identified and resolved a "Graph Distortion" issue caused by the ingestion script accumulating duplicate edges (8x duplication). Added specific cleanup logic to `ingest_experience_graph.ts`.

## 3. What Went Wrong (and how we fixed it)
*   **Edge Duplication:**
    *   *Issue:* `bun-playbook` was being pulled intensely towards the center, distorting the physics.
    *   *Root Cause:* The ingestion script was running multiple times without clearing previous data, creating 8 identical `BELONGS_TO` edges for the same node.
    *   *Fix:* Added a cleanup step (`DELETE FROM ...`) at the start of `ingest_experience_graph.ts`.
*   **Initial Sparsity:**
    *   *Issue:* The graph was initially empty (only 5 edges) because our docs lacked explicit `[[WikiLinks]]`.
    *   *Fix:* We couldn't wait for content updates, so we implemented the Semantic Semantic Linker (heuristic keyword matching) to "bootstrap" connectivity.

## 4. Artifacts
*   **Scripts:** `scripts/ingest_experience_graph.ts` (Cleaner, Linker), `scripts/build_experience.ts` (Config-aware), `src/js/components/sigma-explorer/graph.js` (Orphan Pruning).
*   **Config:** `public/polyvis.settings.json` (Unified sources).
*   **Documentation:** `briefs/experience-graph-tuning.md` (Implementation Plan).

## 5. Next Steps
*   **Resonance Engine:** With the visualization layer stabilized and the Experience graph proving the value of our data pipeline, we are ready to proceed with the full "Resonance Engine" CLI implementation.
