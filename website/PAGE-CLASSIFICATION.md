# Website Page Classification

## Classification Legend

| Status | Meaning |
|--------|---------|
| **PRODUCTION** | Active, maintained, used daily |
| **DEVELOPMENT** | Active development, may be unstable |
| **REFERENCE** | Kept for documentation/learning |
| **DEPRECATED** | Should not be used, marked for deletion |
| **ORPHAN** | No clear purpose or context |

## Page Inventory

### PRODUCTION

| Path | File | Purpose |
|------|------|---------|
| `/` | `website/dashboard.html` | Main system dashboard with SSE |
| `/lexicon.html` | `public/lexicon.html` | Entity/term mosaic browser |
| `/sigma-explorer/` | `public/sigma-explorer/index.html` | Graph visualization |
| `/docs/` | `public/docs/index.html` | Documentation browser |

### REFERENCE

| Path | File | Purpose |
|------|------|---------|
| `/reference/index-star.html` | `public/index-star.html` | DataStar SSE reference implementation |
| `/reference/alpine-dashboard.html` | `public/index.html` | Alpine.js legacy reference |

### DEVELOPMENT

| Path | File | Purpose |
|------|------|---------|
| `/experiments/tts.html` | `public/tts.html` | Web Speech API experiments |
| `/meta/about.html` | `public/about/index.html` | FAFCAS art demonstration |

### DEPRECATED

| Path | File | Reason |
|------|------|--------|
| `/index.html` | `public/index.html` | Superseded by dashboard.html |
| `/mainframe.html` | - | Never existed, only in nav links |

### ORPHAN / UNKNOWN

| Path | File | Notes |
|------|------|-------|
| `/terminal-test.html` | `website/terminal-test.html` | No clear purpose |

## Desired URL Structure

```
https://amalfa.local/
├── /                     → Dashboard (production)
├── /lexicon             → Entity browser
├── /graph               → Sigma Explorer
├── /docs                → Documentation
├── /meta/
│   └── about            → FAFCAS art
├── /experiments/
│   └── tts              → TTS experiments
└── /reference/
    ├── alpine-dashboard → Legacy reference
    └── datastar-sse     → DataStar reference
```

## Directory Structure

```
website/
├── components/
│   ├── nav.js           # Shared navigation
│   └── nav.css          # Nav styles
├── dashboard.html       # PRODUCTION
├── ssr-docs/
│   ├── server.ts        # SSR server
│   └── README.md
├── meta/
│   └── about.html      # DEVELOPMENT
├── experiments/
│   └── tts.html        # DEVELOPMENT
└── reference/
    └── datastar-sse.html # REFERENCE (copy of index-star.html)
```

## Page Status by Priority

1. **Must Fix**: None (all production pages work)
2. **Should Improve**: `website/dashboard.html` (merge nav component)
3. **Could Consolidate**: `public/index.html` → redirect to dashboard
4. **Should Delete**: None immediately
5. **Should Document**: All pages

## Opinion on Naming and Classification

**The problem with multiple index files:**
- `index.html` (Alpine) vs `dashboard.html` (DataStar) vs `index-star.html` (reference)
- Navigation links point to different variants
- No clear "canonical" page

**Recommendation:**
1. Keep `website/dashboard.html` as canonical `/`
2. Move legacy `public/index.html` to `/reference/alpine-dashboard.html`
3. Move `public/index-star.html` to `/reference/datastar-sse.html`
4. Update all navigation to point to canonical pages

**Benefits:**
- Clear production path (`/`)
- Reference material isolated (`/reference/`)
- Experiments isolated (`/experiments/`)
- No confusion about which page is "real"

## Navigation Integration

All pages should include the shared nav component:

```html
<link rel="stylesheet" href="/components/nav.css">
<script type="module" src="/components/nav.js"></script>
<div id="nav-component"></div>
```

Or for static pages without build step:
```html
<link rel="stylesheet" href="/components/nav.css">
<script src="/components/nav.js" defer></script>
```
