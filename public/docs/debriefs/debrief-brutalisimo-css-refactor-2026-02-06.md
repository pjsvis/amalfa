---
date: 2026-02-06
tags: [css, refactoring, brutalisimo, tailwind, cleanup]
agent: claude
environment: local
---

## Debrief: Brutalisimo CSS Refactoring

### Accomplishments

- **Removed UnoCSS dependency:** Removed UnoCSS from project after cascade issues caused scrolling bugs
- **Added and removed Tailwind v4:** Installed Tailwind v4, configured with CSS-first config, but ultimately removed due to conflicting styles causing dark-on-dark visibility issues
- **Settled on inline styles approach:** All styling now uses plain inline styles with explicit hex colors
- **Fixed SmartBlock scrolling:** Resolved vertical scrolling issue by using concrete `height: calc(100vh - 9ch)` instead of percentages
- **Created canonical playbook:** Consolidated all Brutalisimo patterns into single `playbooks/brutalisimo-playbook.md`
- **Documented vertical scroll trap:** Added technical post-mortem explaining why scrolling defeats AI agents

### Problems

- **UnoCSS cascade interference:** UnoCSS classes were overridden by unknown CSS, causing scrolling to break
- **Tailwind conflicting with inline styles:** Tailwind's default colors and our CSS variables created dark-on-dark rendering issues
- **Percentage height in flex context:** `height: 100%` didn't establish concrete height for scroll containers
- **AI regenerating structural code:** When asked to change colors, AI regenerated entire HTML tags and lost structural properties

### Lessons Learned

- **Inline styles win for simplicity:** No cascade, no build step, no hidden rules. Explicit hex colors work reliably
- **Concrete values over percentages:** Use `height: calc(100vh - Xch)` for scroll containers instead of `height: 100%` in flex
- **Jail and Prisoner model:** Separate scroll container structure (hard shell) from content (AI modifiable)
- **Strip and rebuild debugging:** When CSS breaks visually, strip to plain inline styles, verify it works, then layer back up
- **No percentage heights in flex:** `height: 100%` doesn't work predictably. Use concrete `vh`/`ch` values
- **Manual browser inspection needed:** agent-browser Playwright setup had version conflicts. Direct browser inspection faster for visual debugging

### Files Changed

- `website/ssr-docs/server.ts` - Removed UnoCSS imports and generator
- `website/ssr-docs/templates/brutalisimo.tsx` - Inline styles only
- `website/ssr-docs/templates/brutalisimo-doc.tsx` - Inline styles only
- `website/ssr-docs/components/SmartBlock.tsx` - Inline styles with concrete scroll height
- `website/ssr-docs/templates/base.tsx` - Removed Tailwind CSS link
- `public/css/input.css` - Removed (Tailwind v4 config)
- `website/ssr-docs/uno.config.ts` - Deleted
- `playbooks/brutalisimo-playbook.md` - Created canonical playbook

### Verification

- `/brutalisimo-doc` now shows visible scrolling document content
- `/brutalisimo` shows SmartBlock grid with visible tiles
- Both routes return HTTP 200
