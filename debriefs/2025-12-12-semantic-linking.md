# Debrief: Semantic Linking Implementation (mgrep)

**Date:** 2025-12-12
**Status:** Success (23 New Links Discovered)

## Objective
Enhance the CDA transformation pipeline to find "Soft Links" between Directives and Concepts that are semantically related but lack shared keywords.

## Solution
1.  **Tooling:** Integrated `mgrep` (Mixedbread Search) via a new `SemanticMatcher` utility class.
2.  **Strategy:** 
    -   Instead of searching the raw JSON lexicon (which `mgrep` filtered out), we pivoted to searching the **Public Documentation** (`public/docs`).
    -   Rationale: The "Knowledge Graph" should link Directives to where concepts are *explained* in the docs.
3.  **Pipeline:**
    -   For each Directive with a definition > 15 chars...
    -   Run `mgrep` semantic search against `public/docs`.
    -   If the matching doc content mentions a known Concept Title, create a `RELATED_TO` link.
    -   Source marked as `source: "semantic_search"`.

## Results
-   **Baseline:** 978 Candidate Relationships.
-   **Enriched:** 1001 Candidate Relationships.
-   **New Knowledge:** 23 semantic connections were discovered that keyword matching missed.

## Code Changes
-   `scripts/utils/SemanticMatcher.ts`: created wrapper for `mgrep` spawns.
-   `scripts/transform/transform_cda.ts`: integrated matcher into main loop.
-   `resonance/src/types/enriched-cda.ts`: updated schema.

## Next Steps
-   Refine the `mgrep` indexing to explicitly include `scripts/fixtures` if we want to link raw data.
-   Tune the confidence score (currently naive 0.65).
