# SSR Documentation Browser

Server-side rendered markdown documentation browser using Bun 1.38's native markdown API.

## Structure

```
website/ssr-docs/
├── server.ts         # SSR server using Bun.serve
├── lib/
│   └── markdown.ts   # Markdown parser using Bun.markdown.html()
└── README.md
```

## Bun 1.38 Native Markdown API

This implementation leverages Bun's native `Bun.markdown.html()` API for server-side rendering:

```typescript
// Bun 1.38 native markdown rendering
const html = Bun.markdown.html(markdown);
```

**Benefits:**

- No external markdown library dependencies
- Built-in syntax highlighting support
- Optimized for Bun runtime
- Automatic handling of CommonMark spec

## Architecture: Hybrid SSR + Client Navigation

1. **Initial Load (SSR)**: Full HTML page using `Bun.markdown.html()`
2. **Navigation (Client-side)**: Vanilla JS fetches JSON and updates content
3. **URL Sync**: Browser back/forward buttons work correctly

## Features

- **Bun native markdown**: `Bun.markdown.html()` for rendering
- **TOC generation**: Custom extraction from headings
- **Wiki-link support**: `[[Reference]]`, `BRIEF-001` patterns
- **3-panel layout**: Navigation sidebar, content, TOC
- **Terminal.shop styling**: ANSI color palette with monospace typography

## Running

### Using the CLI (Recommended)

```bash
# Start the server
amalfa ssr-docs start

# Stop the server
amalfa ssr-docs stop

# Check server status
amalfa ssr-docs status

# Restart the server
amalfa ssr-docs restart
```

### Direct Execution

```bash
cd website/ssr-docs
PORT=3001 bun run server.ts
```

## Endpoints

| Endpoint                           | Returns   | Use          |
| ---------------------------------- | --------- | ------------ |
| `GET /ssr-docs`                    | Full HTML | Index page   |
| `GET /ssr-docs/doc/:file`          | Full HTML | Direct links |
| `GET /ssr-docs/api/docs`           | JSON      | List docs    |
| `GET /ssr-docs/api/doc/:file`      | JSON      | Doc + TOC    |
| `GET /ssr-docs/terminal-style.css` | CSS       | Stylesheet   |

## Implementation Notes

**Markdown Rendering:**

- Uses `Bun.markdown.html(markdown)` for HTML generation
- Custom TOC extraction from H2/H3 headings
- Post-processing for wiki-links

**Client Navigation:**

- Vanilla JS intercepts nav clicks
- Fetches JSON from `/ssr-docs/api/doc/:file`
- Updates content and TOC areas
- History API for URL sync
