# Debrief: Experience Tabs Integration
**Date:** 2025-11-29
**Topic:** UI/UX, Documentation, Experience Graph

## Context
We wanted to expose our "Library of Experience" (Playbooks and Debriefs) directly in the documentation viewer, alongside the standard Index and Outline.

## Achievements

### 1. UI Integration
-   **Tabs:** Added "Playbooks" and "Debriefs" tabs to the left sidebar in `public/docs/index.html`.
-   **Logic:** Updated `src/js/components/doc-viewer.js` to fetch `experience.json` and filter artifacts into these new categories.

### 2. Protocol Visibility
-   **AGENTS.md:** Configured the `processExperience` logic to find the "Agent Operational Protocols" (type: `protocol`) and pin it to the top of the Playbooks list. This ensures our core rules are always front-and-center.

## Outcome
The documentation now serves as a unified portal for both "Theory" (Docs) and "Practice" (Playbooks/Debriefs).

## Status
Complete.
