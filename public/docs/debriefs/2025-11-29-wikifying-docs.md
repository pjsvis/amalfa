# Debrief: Wikifying Documentation
**Date:** 2025-11-29
**Topic:** Interactive Documentation, Data Privacy, Frontend Architecture

## Lessons Learned
-   **Narrative Transformation:** Converting structured data to narrative markdown at build time is a powerful pattern for keeping the frontend simple and the data secure.
-   **Regex vs AST:** For simple reference linking, Regex post-processing of the HTML is significantly faster and simpler than hooking into the Markdown AST, provided the patterns are distinct (e.g., `OH-XXX`).

## Status
Complete. The documentation is now a "Wiki".

## Accomplishments


## Problems

## Context
The goal was to make the documentation interactive by linking references (e.g., `OH-008`) to their definitions without exposing proprietary data structures.

## Achievements

### 1. Privacy-First Data Build
-   **Strategy:** Implemented a "Whitelist" approach in `scripts/build_data.ts`.
-   **Outcome:** The script extracts *only* the ID, Title, and Narrative Content from the proprietary source files. Structured data (like heuristic steps) is flattened into Markdown strings.
-   **Result:** `public/data/references.json` is safe for public distribution.

### 2. Interactive Frontend
-   **Strategy:** Updated `doc-viewer.js` to fetch the reference data and use Regex to auto-link patterns like `\b([A-Z]{2,}-\d+)\b`.
-   **Outcome:** Users can click references to open a dedicated "Reference Card" in the RHS sidebar.
-   **Fix:** Resolved a bug where deep links (`?file=...`) were ignored on initial load.

## Artifacts Created
-   `scripts/build_data.ts`: The data aggregation script.
-   `public/data/references.json`: The generated public data file.
