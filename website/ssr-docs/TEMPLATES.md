# AMALFA SSR Templates

**Fast As F*ck, Cool As Sh*t** - Server-side rendered pages with DataStar hydration.

## Architecture

```
website/ssr-docs/
├── server.ts              # Main Bun server (routes only)
├── templates/
│   ├── base.tsx          # Layout shell + shared components
│   ├── dashboard.tsx     # System dashboard page
│   ├── lexicon.tsx       # Entity browser page
│   ├── doc.tsx           # Documentation viewer
│   └── index.ts          # Template integration layer
└── public/
    └── css/
        └── terminal.css  # Shared terminal styles
```

## Database Access

Use `ResonanceDB` from `@src/resonance/db.ts` for all DB operations:

```typescript
import { ResonanceDB } from "@src/resonance/db.ts";

const db = ResonanceDB.init();
const stats = db.getStats(); // { nodes, edges, vectors, ... }
db.close();
```

**Rules:**
- Always use `DatabaseFactory.connect()` or `ResonanceDB.init()`
- WAL mode is enforced automatically
- Never use raw `new Database()` in templates

## Adding a New Page

1. Create `templates/newpage.tsx`:
```typescript
import { Layout, LeftPanel } from "./base.tsx";

export function NewPage(data: PageData): string {
  return Layout({
    title: "newpage",
    pageId: "newpage",
    children: `...`,
  });
}
```

2. Update `templates/index.ts` to add data loader and renderer

3. Add route to `server.ts`

## CSS

All pages share `public/css/terminal.css`. Add component-specific styles inline or in a page-specific block.

## Aria Landmarks

All templates include aria attributes for agent-browser E2E mapping:

```html
<header role="banner" aria-label="Site header">
  <nav role="navigation" aria-label="Main navigation">
<main role="main" id="main-content" aria-label="Page title">
<aside class="lhs-panel" role="complementary" aria-label="Sidebar">
<footer role="contentinfo" aria-label="Site footer">
```

## DataStar Integration

Pages use DataStar for client-side reactivity:

```html
<body data-on-load="/api/stream">
  <div aria-live="polite">Updates here</div>
</body>
```

## Running

```bash
# Start server
bun run website/ssr-docs/server.ts serve

# Access at http://localhost:3001/
```

## Pages

| Route | Template | Status |
|-------|----------|--------|
| `/` | dashboard.tsx | ✅ Implemented |
| `/lexicon` | lexicon.tsx | ✅ Implemented |
| `/doc` | doc.tsx | 🔲 Todo |

## Todo

- [ ] Extract CSS from server.ts inline styles
- [ ] Use ResonanceDB for data access
- [ ] Add `/doc` template
- [x] Deprecate port 3013 dashboard (SSR docs now on port 3001)
- [ ] Add E2E tests for all routes
