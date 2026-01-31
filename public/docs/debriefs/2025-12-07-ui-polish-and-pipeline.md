# Debrief: UI Polish & Pipeline Repairs

**Date:** 2025-12-07
**Participants:** User, Antigravity

## Lessons Learned
*   **String Escaping:** In TypeScript/JS, `join("\\n")` produces literal backslash-n characters, effectively effectively serializing the file into a single line for some parsers. Always use `join("\n")` for actual line breaks.
*   **Forced Themes:** When forcing a container to a specific theme (e.g., `#right-sidebar` forced to Light Mode), **never** use theme-reactive variables (like `var(--text-1)`) inside it. They will flip based on the *Root* theme, not the container's context. hardcode or use static tokens.

## Accomplishments
*   **UI Polish:**
    *   **Navbar:** Removed legacy "Source" link; strengthened "POLYVIS" branding (bold, larger); prevented text wrapping.
    *   **Sigma Explorer:** Fixed "Analysis Guide" contrast in the forced-light sidebar (replaced theme-reactive variables with static dark tokens).
    *   **Home Page:** Restored layout of the "Business Card" by increasing its width container from `size-content-2` (45ch) to `size-content-3` (60ch).
*   **Pipeline Engineering (`build_experience.ts`):**
    *   **Fixed Heading Levels:** Resolved the "All H1" bug by correcting the newline join string (from `\\n` to `\n`).
    *   **Section Reordering:** Implemented robust regex-based section detection to reliably move "Lessons Learned" to the top of debriefs, handling numbered headers and fuzzy matching.
*   **Feature Implementation:**
    *   **Wiki Links:** Added support for `[[Wiki Link]]` syntax in `doc-viewer.js` to auto-link to references.
*   **Housekeeping:**
    *   **Playbook Rationalization:** Consolidated 10 fragmented CSS playbooks into a single authoritative `playbooks/css-master-playbook.md`.

*   **Visual Stability:** Home page and Sigma Explorer are visually consistent and readable in both Light and Dark modes.
*   **Docs Integrity:** Debriefs now ingest correctly with proper H1/H2 hierarchy and "Lessons Learned" prioritized.
*   **Agent Context:** Reduced context noise by deleting 10 redundant playbook files.

## Problems

## 1. Context
Following the CSS Lint Sprint, we identified several visual regressions (Business Card broken, Nav contrast) and pipeline issues (Docs heading levels, missing wiki-link support). The goal was to polish the UI and stabilize the data ingestion workflow.
