# Debrief: Front Page Polish & Navigation Fixes
**Date:** 2025-11-27


<!-- bento-id: bento-c603e90e -->
<!-- type: section -->
## Lessons Learned

### 1. The "Gremlins" of CSS
-   **Issue:** Unexpected purple links and alignment issues persisted despite initial fixes.
-   **Lesson:** Always check for global browser defaults or "brutalist" resets that might be overriding specific styles. The "Nuclear Option" (explicit global resets) was necessary here.

### 2. Server Configuration
-   **Issue:** Bun's `Bun.serve` does not handle directory indexing (serving `index.html` for `/folder/`) by default.
-   **Lesson:** When building custom dev servers, explicitly handle directory-to-index.html mapping. This caused the "broken links" perception when the server was actually returning 404s for valid directories.

### 3. Z-Index & Clickability
-   **Issue:** Navbar links appeared unclickable or were suspected of being intercepted.
-   **Lesson:** Even if `elementFromPoint` shows the element is top-most, applying explicit `z-index` and `position: relative` is a cheap and effective defensive measure against layout shifts or subtle overlaps.

### 4. Static vs. Dynamic
-   **Issue:** The Alpine.js navbar was complex to debug and hid `href`s from the source.
-   **Lesson:** For critical structural components like the main navbar, static HTML is often superior to client-side rendering for simplicity, SEO, and debugging.


<!-- bento-id: bento-122d890f -->
<!-- type: section -->
## Action Items
-   [x] Update `scripts/dev.ts` (Done)
-   [x] Hardcode Navbar (Done)
-   [ ] **Future:** Consider a lightweight static site generator or templating if the navbar needs to change frequently, to avoid manual updates across pages.


<!-- bento-id: bento-676d8500 -->
<!-- type: section -->
## Accomplishments



<!-- bento-id: bento-2d9d499f -->
<!-- type: section -->
## Problems


<!-- bento-id: bento-d03cbf06 -->
<!-- type: section -->
## Objectives
-   Match the front page visual design to a reference image.
-   Fix broken navigation links.
-   Resolve server configuration issues preventing directory indexing.


<!-- bento-id: bento-56612ee4 -->
<!-- type: section -->
## Key Outcomes
1.  **Visual Fidelity:** Achieved a high degree of match with the reference image using Open Props for harmonious spacing and colors.
2.  **Robust Navigation:** Moved from a fragile Alpine.js navbar to a robust static HTML implementation.
3.  **Improved DX:** The `bun run dev` script now automatically handles port conflicts and serves directory indices correctly.
