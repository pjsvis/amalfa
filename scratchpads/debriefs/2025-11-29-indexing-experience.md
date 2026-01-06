# Debrief: Indexing Experience Artifacts
**Date:** 2025-11-29
**Topic:** Knowledge Management, Build Pipeline, Documentation


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
We recognized that "Experience Artifacts" (Playbooks and Debriefs) represent the "Territory" (ground truth) of the project, whereas Briefs are just the "Map". We needed a way to treat these artifacts as first-class citizens in the documentation system.


<!-- bento-id: bento-f5c7922d -->
<!-- type: section -->
## Achievements

### 1. Automated Ingestion Pipeline
-   **Script:** Created `scripts/build_experience.ts`.
-   **Function:** Scans `playbooks/`, `debriefs/`, and `AGENTS.md`.
-   **Output:** Generates `public/data/experience.json`, a structured index ready for future graph integration.
-   **Links:** `AGENTS.md` is copied to the root of `public/docs/`, preserving relative links to playbooks and debriefs.

### 2. Build Integration
-   **Command:** Added `build:data` to `package.json`.
-   **Workflow:** Now runs both reference generation and experience indexing in one go.


<!-- bento-id: bento-e226710d -->
<!-- type: section -->
## Data Structure
The `experience.json` file uses a flat node structure:
```json
{
  "id": "filename-without-ext",
  "type": "playbook", // or "debrief"
  "title": "Extracted Title",
  "path": "playbooks/filename.md",
  "tags": []
}
```
This prepares us for a future where these documents are nodes in the project's knowledge graph.


<!-- bento-id: bento-1b920337 -->
<!-- type: section -->
## Next Steps
-   **UI Integration:** The data is ready. The next logical step is to update `doc-viewer.js` to consume `experience.json` and display these artifacts, perhaps in a dedicated "Library" tab or intermingled with the main docs.


<!-- bento-id: bento-ec53a8c4 -->
<!-- type: section -->
## Status
Infrastructure Complete.
