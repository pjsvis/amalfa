---
date: 2026-01-30
tags: [dashboard, ui, monitoring, architecture, visualization, polyvis]
agent: antigravity
environment: local
---

# Debrief: Dashboard Integration & Refinement

## Accomplishments

- **Compact Dashboard UI:** Implemented a dense, terminal-inspired layout using Pico.css (MVP) that displays critical stats (Nodes, Edges, Vectors) without scrolling.
- **Service Monitoring:** Integrated comprehensive status tracking for 6 services: Vector, Reranker, Sonar, Dashboard, Ingest (Harvester), and Consolidate (Squash). Fixed PID file path resolution (`.amalfa/runtime/`).
- **Architecture Visualization:** Created a new `/architecture` page that renders interactive State Machine diagrams using `Viz.js`. The diagrams are dynamically parsed from `docs/architecture/state-machines.md` to ensure documentation matches reality.
- **E2E Lifecycle Verification:** Successfully tested the full data lifecycle: Create Docs -> Ingest (Watcher) -> Extract (LLM) -> Enrich (Squash) -> DB Update. Verified observability of each step in the Dashboard.
- **Resilience Analysis:** Identified the "Infinite Loop Risk" in the Ingest-Enrich cycle and documented it in the new Architecture spec.

## Problems

- **PID Path Mismatch:** The dashboard initially looked for PIDs in `.amalfa/pids/` but daemons wrote to `.amalfa/runtime/`.
    - *Resolution:* Updated `dashboard-daemon.ts` to use correct paths.
- **Paywall / Script Blocking:** The initial `d3-graphviz` implementation caused "Paywall" errors in the user's browser, likely due to CDN redirects or protocol-relative URLs.
    - *Resolution:* Switched to `Viz.js` (Graphviz port) served via version-pinned `jsdelivr` CDNs. This proved robust and faster.
- **Missing API Keys:** The Harvest E2E test initially failed due to missing Gemini keys.
    - *Resolution:* Verified failure handling in Dashboard (Errors displayed correctly) and fixed test run by switching to OpenRouter via env var.

## Lessons Learned

- **Nomenclature Matters:** We adopted a **Functional Naming Scheme** (Ingest, Extract, Enrich, Consolidate) which clarified the architecture significantly compared to the mix of component names (Harvester, Ember, etc.).
- **Visuals verify Logic:** Drawing the DOT diagrams revealed the potential "Squash Loop" bug that wasn't obvious in code. Visual documentation is a resilience tool.
- **Design System Reality:** While the Pico.css MVP is functional, it clashes with the project's "Terminal Brutalist" identity. The decision to migrate to the existing `PolyVis` assets for the next iteration is the correct strategic move for consistency.

## Next Steps (Transition to PolyVis)
1.  Replace `public/` with `_temp-files/client-side/public`.
2.  Update `dashboard-daemon.ts` to serve the PolyVis SPA.
3.  Bind the PolyVis frontend to the API endpoints created in this session.
