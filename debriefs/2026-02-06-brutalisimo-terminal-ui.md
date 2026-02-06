---
date: 2026-02-06
tags: [ui, terminal, architecture, refactoring, feature]
agent: kilo
environment: local
---

# Debrief: Brutalisimo Terminal UI Implementation

## Accomplishments

- **Brutalisimo Pattern Established:** Created SmartBlock grid layout system at `/brutalisimo` and document browser at `/brutalisimo-doc` with consistent ID-based styling architecture
- **CSS Framework Migration:** Removed UnoCSS due to cascade conflicts, implemented Tailwind v4 with minimal config for layout utilities while using inline styles for concrete values
- **ID Hack Pattern:** Implemented element ID system (`header`, `nav`, `main`, `content`, `doc-*`) enabling AI-agent discoverability via CSS targeting like `[id^="doc-"] .markdown-body { ... }`
- **Navigation Cleanup:** Standardized nav across all pages (HOME | DOCS | LEXICON | GRAPH | ABOUT) with active state styling
- **About Page Integration:** Replaced placeholder About page with full Polyvis interactive experience served from `public/about/index.html`

## Problems

- **UnoCSS Cascade Conflicts:** UnoCSS's atomic CSS approach conflicted with the desire for cascade control in document styling; resolved by migrating to Tailwind v4
- **Scroll Container Height Management:** SmartBlock scroll height needed precise calculation (`calc(100vh - 9ch)`) to avoid header overlap; resolved with inline style approach
- **Document Styling Isolation:** Markdown content required isolation from global terminal styles; resolved with ID-targeted CSS using `:where()` for override capability

## Lessons Learned

- **AI-Friendly CSS Selectors:** Using explicit IDs and attribute selectors like `[id^="doc-"]` makes the stylesheet machine-readable and discoverable
- **Framework Minimalism:** Tailwind v4's native nesting and minimal config is sufficient when combined with inline styles for fixed values
- **Standalone Page Strategy:** Pages like `/about` with unique interactive behavior should remain as standalone HTML files served directly rather than fitting into the template system

## Files Changed

| File | Change Type |
|------|------------|
| `website/ssr-docs/components/SmartBlock.tsx` | New component |
| `website/ssr-docs/templates/brutalisimo.tsx` | New template |
| `website/ssr-docs/templates/brutalisimo-doc.tsx` | New template |
| `website/ssr-docs/templates/base.tsx` | Refactored with IDs |
| `website/ssr-docs/server.ts` | Routes + About page |
| `public/css/terminal.css` | Document styling |
| `public/css/input.css` | Tailwind v4 config |
| `playbooks/brutalisimo-playbook.md` | Documentation |

## Commits

- `2207ab5` - feat: Brutalisimo terminal UI with isolated document styling
- `4ed370a` - docs: add ID Hack section to Brutalisimo playbook
- `64e90cb` - refactor: use :where() for AI-friendly CSS overrides
- `a8fe82e` - feat: clean up nav with Graph and About pages
- `6fb9c2a` - feat: serve Polyvis About page from public/about/index.html
