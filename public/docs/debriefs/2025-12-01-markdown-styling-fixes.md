---
date: 2025-12-01
tags: [css, markdown, zero-magic, refactor]
---

# Debrief: Markdown Styling Fixes


## Lessons Learned

- **Lesson 1:** **External CSS Libraries are "Magic":** Importing a massive stylesheet like `github-markdown-css` violates the "Zero Magic" protocol because it introduces hundreds of unmanaged values. Building from scratch using our own tokens is cleaner and more maintainable.
- **Lesson 2:** **Tailwind Tree-Shaking is Aggressive:** If a variable is defined in a source file but only used in a static public file, Tailwind will delete it. Variables used exclusively by static assets should be defined in those static assets.
- **Lesson 3:** **The "Strip-it-Back" Heuristic Works:** When fighting specificity wars with a library, the best solution is often to remove the library and implement only what you need.

## Accomplishments

- **Fixed Code Wrapping:** Resolved a persistent issue where code blocks were overflowing the layout. Applied `white-space: pre-wrap` directly to the `code` element to override external library styles.
- **Implemented "Zero Magic" Markdown:** Completely removed the `github-markdown-css` dependency. Replaced it with a custom `markdown.css` that maps standard HTML tags directly to our Open Props design tokens (`theme.css`).
- **Created Markdown Test Suite:** Added `public/docs/markdown-test.md` covering typography, lists, code blocks, tables, and edge cases to verify styling changes visually.
- **Fixed Tailwind Tree-Shaking Issue:** Resolved a bug where markdown-specific CSS variables were being stripped by Tailwind. Moved the variable definitions into `markdown.css` (which is outside the build pipeline) to ensure they persist.
- **Refined UX:** Added `scroll-margin-top` to card headers to ensure proper visibility when navigating via anchor links.

## Problems

- **Problem 1:** Code blocks were not wrapping despite `pre-wrap` being set on the `pre` container.
    - **Resolution:** Discovered that `github-markdown-css` was setting `white-space: pre` on the `code` element itself. We initially overrode this with `!important`, but ultimately removed the library entirely to solve the root cause.
- **Problem 2:** Changing CSS variables in `theme.css` had no effect on the markdown styles.
    - **Resolution:** Identified that Tailwind's tree-shaking was removing "unused" variables because it doesn't scan the `public/` directory. We moved the variables to `markdown.css` to bypass the build process.