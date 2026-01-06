# Debrief: Document Scroll Fix
**Date:** 2025-11-29
**Topic:** UI/UX, Bug Fix


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
When navigating between documents, the new document would sometimes retain the scroll position of the previous one. This was because we were resetting `window.scrollTo(0, 0)`, but the actual scrollable container was `.app-main`.


<!-- bento-id: bento-2de1239f -->
<!-- type: section -->
## Fix
Updated `src/js/components/doc-viewer.js` to explicitly target the scroll container:
```javascript
const main = document.querySelector('.app-main');
if (main) main.scrollTop = 0;
```


<!-- bento-id: bento-52b8ffce -->
<!-- type: section -->
## Verification
-   **Test:** Opened a long document (AGENTS.md), scrolled down, then switched to a new document.
-   **Result:** The new document correctly started at the top.


<!-- bento-id: bento-ec53a8c4 -->
<!-- type: section -->
## Status
Fixed.
