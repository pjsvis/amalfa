# Debrief: Unification Complete (Polyvis on ResonanceDB)

**Date:** 2025-12-09
**Status:** SUCCESS
**Related Task:** The Unification Sprint (One Brain)

## 1. Overview
We have successfully completed the "Unification Sprint". The "Split Brain" architecture (managing `ctx.db` for Persona and `resonance.db` for Experience separately) has been eliminated. The entire Polyvis application now runs on a single source of truth: `resonance.db`.

## 2. Key Accomplishments

### A. Unified Database Architecture
- **Single DB:** `resonance.db` now contains all system data:
    - **Persona Domain:** Concepts, Terms, and System Directives (CDA).
    - **Experience Domain:** Debriefs, Playbooks, and AST Sections.
- **Schema Codification:** `src/db/schema.ts` (Drizzle) was updated to match the production `ResonanceDB` schema, ensuring type safety and documentation.

### B. Frontend Wiring
- **Lexicon Service:** Updated to query the unified `nodes` table. Adapted SQL to map new schema columns (`title` -> `name`, `content` -> `definition`).
- **Sigma Explorer:** 
    - Updated to fetch `public/resonance.db`.
    - Adapted graph visualization to handle new node types (`term`, `directive`, `section`).
    - Fixed a critical bug where "Orphan Nodes" (Terms without edges) were being hidden, causing an empty graph for the Persona domain.

### C. Enhanced Ingestion Pipeline
- **CDA Integration:** Added `scripts/cda-ref-v63.json` to the ingestion pipeline. System Directives (e.g., `PHI-1`, `OH-058`) are now first-class nodes.
- **Edge Extraction:** Implemented logic to parse relationship tags (e.g., `[Implements: PHI-2]`) into actual graph edges. The Persona graph now exhibits rich connectivity (~170 edges) instead of being a collection of isolated nodes.

## 3. Technical Changes
- **Modified:** `scripts/sync_resonance.ts` (Added CDA, Edge Parsing)
- **Modified:** `src/js/components/sigma-explorer/graph.js` (Visual styling for `directive`, `section`; Disabled orphan pruning)
- **Modified:** `polyvis.settings.json` (Added CDA to sources)
- **Verified:** `tsc --noEmit` checks passed after fixing type errors in `resonance/src/db.ts`.

## 4. Next Steps
- **Graph Tuning:** The Louvain community detection for the Persona graph is functional but may require further tuning (resolution parameters) to optimize cluster aesthetics.
- **Search UI:** Verify that the "Mixed Domain" search in the UI correctly routes users to the appropriate view (Lexicon Modal vs. Doc Viewer) for different node types.

## 5. Lessons Learned (Wisdom Development)

### A. The "Silent Failure" of UI Filtering
**Incident:** Initially, the Persona graph appeared empty despite successful data ingestion.
**Root Cause:** The `graph.js` component included a logic block to `Prune Orphan Nodes`. Since our initial Lexicon terms had no edges, the UI silently filtered them all out, leading us to suspect a database failure.
**Wisdom:**
- **UI != Data:** Never rely solely on the UI to verify backend processes. Always validate with raw queries (SQLite CLI) or targeted test scripts (`test_persona_roundtrip.ts`).
- **Default Open:** Visualization tools should default to showing *everything* (even unconnected noise) during development, to prove existence before refining the view.

### B. Implicit vs. Explicit Graphs
**Incident:** Once visible, the Persona graph was a collection of "islands" (disconnected nodes).
**Root Cause:** The relationship data existed but was buried in implicit metadata tags (`[Implements: PHI-2]`) rather than explicit graph edges.
**Wisdom:**
- **ETL is Key:** The value of a Knowledge Graph lies in the *connections*, not just the entities. Ingestion pipelines must actively "explode" implicit metadata (tags, refs) into first-class Edges to unlock the graph's potential.
- **Islands suggest missing logic:** If a graph looks like islands, you are likely failing to parse a relationship that exists in the source text.

### C. The Cost of "Split Brain"
**Observation:** Moving from `ctx.db` + `resonance.db` to a single `resonance.db` immediately clarified the architecture. We found frontend code querying tables (`terms`) that no longer existed, highlighting how the previous split had allowed schema drift.
**Wisdom:**
- **Single Source of Truth:** Unification forces consistency. By constraining the system to one database schema, we exposed and resolved accumulation of technical debt in the frontend layer.

### D. Dirty Checking as an Accelerator
**Observation:** Implementing hash-based dirty checking reduced the "Playbook" ingestion time from ~seconds to near-instant (0 processed).
**Wisdom:**
- **Feedback Loops:** Fast ingestion pipelines are critical for developer experience ("DevX"). If a sync takes 10 seconds, you check it less often. If it takes 100ms, you check it constantly. Optimization facilitates verification.
