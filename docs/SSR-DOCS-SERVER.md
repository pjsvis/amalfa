# SSR Documentation Server

The SSR (Server-Side Rendered) Documentation Server provides a terminal.shop-inspired interface for browsing project documentation. It uses Bun's native markdown rendering capabilities to serve documentation with a distinctive terminal aesthetic.

## Features

- Terminal.shop-inspired styling with ANSI color palette
- Server-side rendering for fast initial page loads
- Client-side navigation for smooth browsing experience
- 3-panel layout (navigation sidebar, content, table of contents)
- Responsive design that works on desktop and mobile
- Wiki-link support for internal documentation references

## Running the Server

### Using the CLI (Recommended)

The SSR docs server can be managed through the amalfa CLI:

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

You can also run the server directly:

```bash
cd website/ssr-docs
PORT=3001 bun run server.ts
```

## Accessing the Documentation

Once the server is running, you can access the documentation browser at:

```
http://localhost:3001/ssr-docs
```

## Architecture

The SSR docs server implements a hybrid approach:

1. **Initial Load (SSR)**: Full HTML page using `Bun.markdown.html()`
2. **Navigation (Client-side)**: Vanilla JS fetches JSON and updates content
3. **URL Sync**: Browser back/forward buttons work correctly

### Endpoints

| Endpoint                           | Returns   | Use          |
| ---------------------------------- | --------- | ------------ |
| `GET /ssr-docs`                    | Full HTML | Index page   |
| `GET /ssr-docs/doc/:file`          | Full HTML | Direct links |
| `GET /ssr-docs/api/docs`           | JSON      | List docs    |
| `GET /ssr-docs/api/doc/:file`      | JSON      | Doc + TOC    |
| `GET /ssr-docs/terminal-style.css` | CSS       | Stylesheet   |

## Styling

The server uses a terminal.shop-inspired stylesheet with:

- ANSI color palette (black, red, green, yellow, blue, magenta, cyan, white)
- Monospace typography only
- Grid layout using `ch` units
- No images, animations, or rounded corners
- Every character earns its place

## Development

To modify the server:

1. Edit `website/ssr-docs/server.ts` for server logic
2. Modify `website/ssr-docs/public/terminal-style.css` for styling
3. Update `website/ssr-docs/lib/markdown.ts` for markdown processing

After making changes, restart the server with:

```bash
amalfa ssr-docs restart
```
