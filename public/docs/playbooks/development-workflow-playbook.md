# Development Workflow Playbook

## Purpose
To document the standard procedures for developing, building, and maintaining the Polyvis application.

## 1. Development (Recommended)
The easiest way to work on the project is to use the unified development script. This starts both the CSS watcher and the local web server.

```bash
bun run dev
```
-   **Server:** http://localhost:3000
-   **CSS:** Auto-compiles on save.

> [!TIP]
> **Port 3000 Busy?**
> If the server fails to start because the port is in use, kill the existing process:
> `lsof -ti:3000 | xargs kill -9`

## 2. Manual Workflow (Advanced)
If you prefer to run processes separately:

### CSS Development
```bash
bun run watch:css
```

## 3. CSS Architecture & The Control Panel
We enforce a strict "No Magic Numbers" policy. All design tokens are centralized.

### The Control Panel (`src/css/layers/theme.css`)
This file is the single source of truth for the application's look and feel.
-   **Semantic Variables**: Use these for all component styling.
    -   `--surface-panel`: Backgrounds for cards, sidebars, code blocks.
    -   `--surface-hover`: Interactive hover states.
    -   `--border-base`: Standard border width (usually 1px).
    -   `--radius-component`: Standard border radius.
-   **Typography**: Use aliases like `--font-size-sm` instead of raw values.

### Adding New Styles
1.  **Check `theme.css` first**: Does a variable already exist for your need?
2.  **Define if missing**: If you need a new specific value (e.g., a specific width), add it to `theme.css` first.
3.  **Use the variable**: In your component CSS, reference the variable.
    -   **Bad**: `border: 1px solid #ccc;`
    -   **Good**: `border: var(--border-base) solid var(--surface-panel);`

### Database Build
The core data for the application must be generated from the source JSON files located in the `/scripts` directory.

### A. Build the SQLite Database
This command reads the source JSON files and creates the `ctx.db` database file.
```bash
bun run scripts/build_db.ts
```

### B. Extract High-Value Search Terms
This command analyzes the newly created database and generates a `terms.json` file.
```bash
bun run scripts/extract_terms.ts
```

### C. Copy Database to Public Folder
## 5. Debugging & QA Strategy
### The "Browser Truth" Rule
When diagnosing visual issues, **always** inspect the computed styles in the browser. Do not rely on reading the CSS code alone.
-   **Wrong Color?** Inspect the element. Is a variable missing? Is a browser default overriding it?
-   **Wrong Alignment?** Inspect the parent. Is it `flex`? Is it `block`? What is the computed width?

### Step-by-Step Fixes
When fixing multiple regressions:
1.  Isolate **one** specific visual bug.
2.  Fix it.
3.  Verify it in the browser.
4.  Move to the next.
**Do not apply batch fixes for visual regressions.**
The application loads the database from the `/public/data` directory. You must copy the generated file there.
```bash
cp scripts/ctx.db public/data/ctx.db
```

## 3. Python Utilities
Helper scripts located in `scripts/`.

### Generate Context Index
Scans the `context/` directory for markdown memory blocks and generates a JSON index.
```bash
python3 scripts/generate_context_index.py
```

## 4. Running the Application
Since this is a frontend-only project, you can serve the files using any simple static web server.

1.  Navigate to the project root directory.
2.  Start your server, pointing it to the `public` directory as the root.

**Example using `live-server`:**
```bash
live-server public
```
