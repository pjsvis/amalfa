---
date: 2026-02-02
tags: [feature, documentation, ssr, bun, markdown, web]
agent: minimax
environment: local
---

# Debrief: SSR Markdown Documentation Browser

## Accomplishments

- **Created `website/ssr-docs/` directory** with SSR markdown doc browser implementation
- **Implemented hybrid SSR + client-side navigation** pattern that mirrors existing client-side docs browser
- **Server-side markdown parsing** with TOC generation from headings (H2-H3 levels)
- **Wiki-link support** for `[[Reference]]` and `BRIEF-001` patterns
- **3-panel layout** matching existing docs browser (nav sidebar, content, TOC)
- **Pico.css styling** for clean, responsive design
- **API endpoints** for document listing and parsing (JSON)
- **URL sync** with browser back/forward button support

## Problems

- **Path resolution issues:** Initial `DOCS_PATH` used relative paths that didn't resolve correctly when running with `bun run --cwd`. Fixed by using absolute path `/Users/petersmith/Dev/GitHub/amalfa/docs`.

- **Hono router regex issues:** Hono's param patterns (`:slug{.*}`) caused regex compilation errors. Abandoned Hono in favor of Bun.serve with manual routing for simplicity.

- **Navigation persistence:** Initial implementation did full page reloads, causing nav sidebar to reset. Fixed by adding client-side JS that intercepts nav clicks, fetches JSON, and updates only content/TOC areas.

- **TypeScript type errors:** Various type issues with imports (needed `type` keyword for verbatimModuleSyntax) and async/await in fetch callback. Resolved by proper type annotations and async function declaration.

## Lessons Learned

- **Hybrid SSR approach works well:** Initial SSR for SEO/first-paint + client-side nav for snappy transitions provides best of both worlds.

- **Bun.serve + vanilla JS is sufficient:** No need for Hono or SSR-JSX frameworks. Bun's native HTTP server with vanilla JS client navigation is simpler and has fewer moving parts.

- **Navigation persistence requires client-side logic:** Pure SSR does full page loads. To persist nav, need client-side interception of clicks and DOM updates.

- **Absolute paths for file operations:** When running with `--cwd`, process.cwd() behavior can be unexpected. Using absolute paths ensures reliability.
