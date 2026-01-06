# Debrief: Experience Tabs Integration
**Date:** 2025-11-29
**Topic:** UI/UX, Documentation, Experience Graph


<!-- bento-id: bento-c603e90e -->
<!-- type: section -->
## Lessons Learned



<!-- bento-id: bento-676d8500 -->
<!-- type: section -->
## Accomplishments



<!-- bento-id: bento-2d9d499f -->
<!-- type: section -->
## Problems


<!-- bento-id: bento-ad4e2064 -->
<!-- type: section -->
## Context
We wanted to expose our "Library of Experience" (Playbooks and Debriefs) directly in the documentation viewer, alongside the standard Index and Outline.


<!-- bento-id: bento-f5c7922d -->
<!-- type: section -->
## Achievements

### 1. UI Integration
-   **Tabs:** Added "Playbooks" and "Debriefs" tabs to the left sidebar in `public/docs/index.html`.
-   **Logic:** Updated `src/js/components/doc-viewer.js` to fetch `experience.json` and filter artifacts into these new categories.

### 2. Protocol Visibility
-   **AGENTS.md:** Configured the `processExperience` logic to find the "Agent Operational Protocols" (type: `protocol`) and pin it to the top of the Playbooks list. This ensures our core rules are always front-and-center.


<!-- bento-id: bento-cf73bd58 -->
<!-- type: section -->
## Outcome
The documentation now serves as a unified portal for both "Theory" (Docs) and "Practice" (Playbooks/Debriefs).


<!-- bento-id: bento-ec53a8c4 -->
<!-- type: section -->
## Status
Complete.
