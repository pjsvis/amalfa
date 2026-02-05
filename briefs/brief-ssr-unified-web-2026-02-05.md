---
date: 2026-02-05
tags: [feature, ssr, web, architecture, refactoring, data-star, fafcas]
agent: claude
environment: local
---

## Task: SSR-JSX-Markdown Unified Web Architecture

**Objective:** Consolidate AMALFA web properties into single-port (3001) Bun-Hono-SSR-JSX-Markdown server with DataStar-HTML-CSS frontend, applying FAFCAS principles for fast development and cool aesthetics.

---

## Why This Matters

- **Current State**: Fragmented - dashboard on 3013 (DataStar), docs on 3001 (Hono), legacy Alpine on `/index.html`, standalone HTML pages scattered
- **Desired State**: Single port 3001 serving all pages via SSR with consistent navigation, aria landmarks for agent-browser mapping, and DataStar reactivity
- **FAFCAS Alignment**: Fast (SSR + SSE edge), Cool (terminal-brutalist + aria mapping)

---

## Key Actions Checklist

### Phase 1: Architecture Foundation
- [ ] Create `website/ssr-docs/templates/base.tsx` with aria landmarks
- [ ] Create `website/ssr-docs/templates/components/` with reusable UI components
- [ ] Update `website/ssr-docs/server.ts` with unified routing for all pages

### Phase 2: Page Templates
- [ ] Create `dashboard.tsx` - System monitoring with SSE live updates
- [ ] Create `lexicon.tsx` - Entity browser with DataStar search
- [ ] Create `doc.tsx` - Documentation viewer with SSR markdown

### Phase 3: Integration & Testing
- [ ] Integrate shared navigation component
- [ ] Add aria labels for agent-browser E2E mapping
- [ ] Verify all pages render via SSR + hydrate via DataStar
  - [x] Deprecate port 3013 dashboard, migrate to port 3001

---

## Detailed Requirements

### Directory Structure

```
website/ssr-docs/
├── server.ts              # Main Hono server (port 3001)
├── templates/
│   ├── base.tsx          # Base HTML shell with aria landmarks
│   ├── dashboard.tsx      # Dashboard page template
│   ├── lexicon.tsx        # Lexicon page template
│   ├── doc.tsx            # Documentation page template
│   └── components/
│       ├── header.tsx     # Header with nav integration
│       ├── nav.tsx        # Shared navigation component
│       ├── lhs-panel.tsx  # Left panel layout
│       ├── widget.tsx     # Reusable stat widget
│       └── status.tsx     # Service status component
├── lib/
│   ├── config.ts          # Loadamalfa.settings.json
│   └── db.ts              # Database queries for SSR
└── public/
    └── css/
        └── terminal.css   # Shared terminal styles
```

### Base Template Requirements

```typescript
// base.tsx - HTML shell with aria landmarks
interface LayoutProps {
  title: string;
  pageId: string;        // for nav active state
  children: Children;    // main content
  sseUrl?: string;       // optional DataStar SSE
}

// Aria landmarks required:
role="banner"       // header
role="navigation"   // nav with aria-label
role="main"         // primary content
role="complementary" // sidebar/widgets
aria-live="polite"  // status updates
aria-label          // on all nav links
```

### Page Routes

| Path | Page | SSR Data | SSE Stream |
|------|------|----------|------------|
| `/` | Dashboard | stats, services | live updates |
| `/lexicon` | Lexicon | entities list | search results |
| `/doc` | Docs | doc index | nav updates |
| `/api/*` | JSON | config, stats | - |
| `/api/stream` | SSE | - | all live data |

### Navigation Component

```typescript
// nav.tsx - Shared navigation with aria
const NAV_ITEMS = [
  { id: 'dashboard', label: 'DASHBOARD', href: '/', icon: '◉' },
  { id: 'lexicon', label: 'LEXICON', href: '/lexicon', icon: '◈' },
  { id: 'doc', label: 'DOCS', href: '/doc', icon: '◫' },
];
```

### SSOT Configuration

Server reads `amalfa.settings.json` on startup, passes to templates:

```typescript
interface PageData {
  config: SafeConfig;      // fromamalfa.settings.json
  stats: SystemStats;      // from database
  services: Service[];    // from PID files
}
```

---

## Aria Landmarks for Agent-Browser Mapping

All pages MUST include for E2E testing:

```html
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    <a href="/" aria-label="Dashboard">DASHBOARD</a>
    <a href="/lexicon" aria-label="Lexicon">LEXICON</a>
    <a href="/doc" aria-label="Documentation">DOCS</a>
  </nav>
</header>

<main role="main" id="main-content">
  <aside class="lhs-panel" role="complementary" aria-label="Sidebar widgets">
    <!-- widgets with aria-label -->
  </aside>
</main>

<footer role="contentinfo">
  <span aria-label="Version">v1.5.1</span>
</footer>
```

---

## Deprecation Plan

| Current | Status → | Target |
|---------|----------|--------|
| `website/dashboard.html` | DEPRECATE | `/` (SSR) |
| `public/index.html` | → REFERENCE | `/reference/alpine-legacy` |
| `public/index-star.html` | → REFERENCE | `/reference/datastar-sse` |
| `public/lexicon.html` | → PRODUCTION | `/lexicon` (SSR) |
| Port 3013 | SHUTDOWN | Use port 3001 |

---

## Verification

1. **SSR Render**: View source shows server-rendered HTML
2. **DataStar Hydration**: Page becomes reactive after load
3. **E2E Tests**: Agent-browser can map all elements via aria
4. **Single Port**: All pages accessible via port 3001
5. **SSOT**: Configuration from `amalfa.settings.json`

```bash
# Verification commands
curl -s http://localhost:3001/ | head -20  # Check SSR
bun run test:e2e                           # Run E2E suite
```

---

## FAFCAS Principles Applied

- **Fast**: SSR initial render + DataStar SSE hydration
- **Cool**: Terminal-brutalist aesthetic, aria landmarks for agents
- **Single Port**: 3001 as SSOT for all web properties
- **Componentized**: JSX templates + DataStar reactivity
- **Observable**: E2E test coverage via agent-browser mapping

---

## Related Briefs

- `briefs/brief-website-server-consolidation.md` (archived - port 8888 removal)
- `briefs/brief-website-ssot-integration.md` (SSOT config integration)

---

## Dependencies

- Bun 1.3.8+ runtime
- Hono.js for SSR
- DataStar for client reactivity
- SQLite (existing) for stats queries
-amalfa.settings.json (existing) for config
