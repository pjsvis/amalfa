# Website Page Inventory

**Last Updated:** 2026-02-05
**Status:** Needs review and consolidation

## Page Inventory

| File | Status | Purpose | Tech |
|------|--------|---------|------|
| `public/index.html` | DEPRECATED | Old Alpine.js dashboard | Alpine.js, polling |
| `public/index-star.html` | REFERENCE | DataStar SSE reference | DataStar, SSE |
| `website/dashboard.html` | **PRODUCTION** | Current terminal dashboard | DataStar, SSE |
| `public/lexicon.html` | **PRODUCTION** | Entity/term browser | Vanilla JS |
| `public/tts.html` | DEVELOPMENT | Web Speech API test | PicoCSS, vanilla |
| `public/about/index.html` | REFERENCE | FAFCAS art demo | Space Mono, CSS art |
| `public/sigma-explorer/` | **PRODUCTION** | Graph visualization | Graphology |
| `public/docs/index.html` | **PRODUCTION** | Doc browser | Vanilla JS |

## Consolidation Plan

### Phase 1: Navigation Component
Create shared nav used by all pages:
- Consistent header across all pages
- Link to: Dashboard, Lexicon, Graph, Docs, About

### Phase 2: Merge Destinations
- `public/index.html` → DELETE (superseded by dashboard.html)
- `public/index-star.html` → KEEP as reference, point to dashboard.html
- `website/dashboard.html` → KEEP as production

### Phase 3: Static Pages
- `public/tts.html` → Move to `/experiments/tts.html`
- `public/about/` → Move to `/meta/about.html`

## Page Naming Convention

```
/                           → Dashboard (production)
/dashboard                   → Dashboard (alias)
/lexicon                    → Entity browser
/graph                      → Sigma Explorer
/docs                       → Documentation
/meta/about                 → FAFCAS art
/experiments/tts            → TTS test (development)
/reference/index-star.html  → DataStar reference (for agents)
```

## Quick Links for Agents

When working on web UI:

1. **Production dashboard**: `website/dashboard.html`
2. **DataStar reference**: `public/index-star.html`
3. **Navigation component**: `website/components/nav.tsx`
4. **Terminal CSS**: `public/terminal.css`
5. **Main CSS**: `public/style.css`
