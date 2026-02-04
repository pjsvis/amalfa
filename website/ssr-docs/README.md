# SSR Documentation Browser

Server-side rendered markdown documentation browser with client-side navigation for Amalfa.

## Structure

```
website/ssr-docs/
├── server.ts         # SSR server using Bun.serve
├── lib/
│   └── markdown.ts   # Markdown parsing with TOC generation
└── README.md
```

## Architecture: Hybrid SSR + Client Navigation

This implementation uses a **hybrid approach** combining SSR with client-side navigation:

1. **Initial Load (SSR)**: Full HTML page rendered on server with all content
2. **Navigation (Client-side)**: Subsequent clicks fetch JSON and update content areas
3. **URL Sync**: Browser back/forward buttons work correctly
4. **Progressive Enhancement**: Works without JavaScript (direct links still work)

## Features

- **Server-side rendering**: Full HTML on initial load
- **Client-side navigation**: Fast, no full page reloads
- **TOC generation**: Auto-generated from headings
- **Wiki-link support**: `[[Reference]]` and `BRIEF-001` patterns
- **3-panel layout**: Navigation sidebar, content, TOC
- **Pico.css styling**: Clean, responsive design

## Running

```bash
cd website/ssr-docs
PORT=3001 bun run server.ts
```

## Endpoints

| Endpoint                      | Returns   | Use                    |
| ----------------------------- | --------- | ---------------------- |
| `GET /ssr-docs`               | Full HTML | Index page             |
| `GET /ssr-docs/doc/:file`     | Full HTML | Direct document links  |
| `GET /ssr-docs/api/docs`      | JSON      | List all documents     |
| `GET /ssr-docs/api/doc/:file` | JSON      | Document content + TOC |
| `POST /ssr-docs/api/parse`    | JSON      | Parse markdown         |

## Technical Notes

**Implementation**: Bun.serve with vanilla JS client-side navigation (no framework)

**Why this approach?**

- SSR for initial paint and SEO
- Client-side nav for snappy transitions
- Simpler than Turbo/HTMX or Alpine.js
- No build step required

**Comparison with Client-side Browser (`/docs`)**

| Aspect          | SSR (this)         | Client (`/docs`)       |
| --------------- | ------------------ | ---------------------- |
| Initial load    | Full HTML          | Skeleton + JSON        |
| Nav persistence | JS updates content | Alpine.js state        |
| Framework       | Vanilla JS         | Alpine.js              |
| Dependencies    | Pico.css only      | Pico + Lucide + Alpine |
