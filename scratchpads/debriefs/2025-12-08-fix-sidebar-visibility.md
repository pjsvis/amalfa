# Fix Sidebar Visibility in Reference Mode

**Date:** 2025-12-08


<!-- bento-id: bento-c603e90e -->
<!-- type: section -->
## Lessons Learned



<!-- bento-id: bento-676d8500 -->
<!-- type: section -->
## Accomplishments



<!-- bento-id: bento-2d9d499f -->
<!-- type: section -->
## Problems


<!-- bento-id: bento-3b878279 -->
<!-- type: section -->
## Overview
Addressed a bug where the Left Hand Side (LHS) sidebar would unexpectedly disappear when a user clicked a wiki-link (e.g., "OH-008") within the documentation viewer.


<!-- bento-id: bento-642facf6 -->
<!-- type: section -->
## Issue
The documentation viewer uses a `viewMode` state to manage layout.
- `browse`: Left Sidebar + Main Content
- `reference`: Left Sidebar + Main Content + Right Sidebar (Reference Panel)

The LHS sidebar's visibility was controlled by an Alpine.js `x-show` directive that only accounted for `browse` mode or if the sidebar was manually toggled open (`leftOpen`):
```html
x-show="viewMode === 'browse' || leftOpen"
```
When a wiki-link was clicked, the `viewMode` switched to `reference`, causing the LHS sidebar to hide because `reference` was not in the allowed conditions.


<!-- bento-id: bento-b5a4b64b -->
<!-- type: section -->
## Resolution
Updated the `x-show` directive in `public/docs/index.html` to explicitly include `reference` mode:
```html
x-show="viewMode === 'browse' || viewMode === 'reference' || leftOpen"
```


<!-- bento-id: bento-fbad4b6f -->
<!-- type: section -->
## verification
A browser subagent simulation was performed:
1.  Navigated to the docs.
2.  Clicked a document link.
3.  Clicked a wiki-link ("OH-008").
4.  Verified via screenshot that the Left Sidebar remained visible alongside the Main Content and Reference Panel.
