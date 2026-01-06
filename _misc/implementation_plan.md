# Implementation Plan: Semantic Linking Upgrade

**Goal:** Integrate `mgrep` into the `transform_cda.ts` pipeline to generate "Semantic Soft Links" between Directives and Concepts.

## Phase 1: Infrastructure Setup
1.  **Create `scripts/utils/SemanticMatcher.ts`:**
    -   A reusable class that wraps the `mgrep` CLI.
    -   Handles `bun:spawn` to execute searches.
    -   Parses `mgrep` JSON output into typed results.
    -   Implements rudimentary caching (optional but good for dev speed).

## Phase 2: Pipeline Integration
2.  **Modify `scripts/transform/transform_cda.ts`:**
    -   Import `SemanticMatcher`.
    -   Initialize the matcher pointing to the **Lexicon** source directory.
    -   Ensure the Lexicon is indexed (`mgrep watch` or just rely on its state).
    -   In the transformation loop:
        -   For each Directive entry...
        -   Run `matcher.findCandidates(entry.definition)`.
        -   Map results to `CandidateRelationship` objects (`type: "RELATED_TO"`, `source: "semantic_search"`).
        -   Merge with existing Keyword/Explicit relationships.

## Phase 3: Verification
3.  **Run Transformation:** Execute the script.
4.  **Inspect Artifacts:** Check `.resonance/artifacts/cda-enriched.json`.
5.  **Validate:** Confirm new relationships exist that *would not* have been found by simple keyword matching.

## Technical Details
- **mgrep command:** `mgrep search --json -m 3 "QUERY" [PATH_TO_LEXICON]`
- **Thresholds:** We will accept the top 3 semantic matches.
- **Confidence:** We'll assign a dynamic confidence score based on rank (e.g., Rank 1 = 0.65, Rank 2 = 0.55).

## Dependencies
- `mgrep` must be installed and authenticated (already done).
- `bun` environment.
