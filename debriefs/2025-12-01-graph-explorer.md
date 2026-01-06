---
date: 2025-12-01
tags: [graph, visualization, louvain, semantic-edges]
---

# Debrief: Semantic Graph & Community Explorer

## Accomplishments

### 1. Semantic Edge Generation
- **Objective:** Increase graph density to create a "hairball" structure that reveals the complexity of the domain.
- **Implementation:** Modified `scripts/build_db.ts` to generate edges based on keyword usage in node definitions.
- **Result:** Generated ~3,200 semantic edges (up from ~48), creating a highly interconnected network.

### 2. Graph Hygiene (Gardening)
- **Objective:** Remove disconnected or empty nodes that distorted the layout.
- **Implementation:** Added an exclusion list in `sigma-explorer.js` to filter out specific nodes (`term-035`, `CIP-3`, `term-040`, `term-036`, `term-038`, `term-027`, `term-025`, `term-026`, `term-024`) during graph ingestion.
- **Decision:** Filtered at the *frontend* (View Layer) rather than the *backend* (Data Layer) to allow for easier toggling and "Source of Truth" integrity in the database.

### 3. Louvain Community Explorer
- **Objective:** Allow users to navigate the dense graph by breaking it down into semantic communities.
- **Features:**
    - **Community Dashboard:** A collapsible list of communities sorted by size.
    - **Rank-Based Coloring:** Implemented a consistent ROYGBIV palette where colors are assigned by rank (Largest = Red, 2nd = Orange, etc.) rather than arbitrary ID. This ensures visual stability even if IDs change.
    - **Dynamic Filtering:** Clicking a community isolates it (hides other nodes) and lowers the label visibility threshold (from 8px to 4px) for better readability.
    - **"Show All" Reset:** A dedicated button to smoothly return to the full graph view.

## Lessons Learned

- **Louvain Instability:** Removing even a single node can drastically change the community structure (count and composition) due to the iterative nature of the algorithm. Rank-based coloring is essential to mitigate the disorientation this causes.
- **Camera Animation Risks:** Auto-centering the camera while simultaneously hiding/showing nodes caused race conditions in the Sigma renderer (disappearing labels). We reverted to manual zoom/pan for stability.

## Next Steps

- **Substack Launch:** The visualization is now "Camera Ready." The next session will focus on preparing the Substack post (`substack-playbook-1.md`) and generating assets from this new graph.
