# Debrief: Document Scroll Fix
**Date:** 2025-11-29
**Topic:** UI/UX, Bug Fix

## Lessons Learned


## Accomplishments


## Problems

## Context
When navigating between documents, the new document would sometimes retain the scroll position of the previous one. This was because we were resetting `window.scrollTo(0, 0)`, but the actual scrollable container was `.app-main`.

## Fix
Updated `src/js/components/doc-viewer.js` to explicitly target the scroll container:
```javascript
const main = document.querySelector('.app-main');
if (main) main.scrollTop = 0;
```

## Verification
-   **Test:** Opened a long document (AGENTS.md), scrolled down, then switched to a new document.
-   **Result:** The new document correctly started at the top.

## Status
Fixed.
