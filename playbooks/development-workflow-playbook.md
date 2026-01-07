# Development Workflow Playbook

## Purpose
To document the standard procedures for developing, building, and maintaining the Polyvis application.

## 1. Code Organization & Standards

### A. Directory Structure
To maintain a clean and navigable codebase, we enforce a strict folder hierarchy for all source code and scripts.
- **Micro-Architecture:** Do not dump all files into a single folder (e.g., `scripts/`). Instead, group them by domain or function:
    -   `core/`: Shared layouts, classes, and types.
    -   `pipeline/`: Data processing and ETL scripts.
    -   `cli/`: User-facing command-line tools.
    -   `verify/`: Integrity checks and debugging tools.
- **Self-Documentation:** Every sub-directory **must** contain a `README.md` explaining:
    -   The purpose of the folder.
    -   Key files within it.
    -   How to run or use the contents.

### B. Import Policy (Strict)
**Rule:** NO RELATIVE IMPORTS for files outside the current directory depth.
Relative imports (e.g., `../../src/db`) are fragile and break during refactoring.

**Standard:** Use Path Aliases defined in `tsconfig.json` and `package.json`.
-   `@/*` -> Project Root (e.g., `@/polyvis.settings.json`)
-   `@src/*` -> `src/` directory (e.g., `@src/types/artifact.js`)
-   `@scripts/*` -> `scripts/` directory (e.g., `@scripts/core/EdgeWeaver.ts`)
-   `@resonance/*` -> `resonance/` directory

**Why?** This allows you to move files between folders without rewriting imports.

## 2. Development (Recommended)
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

## 2.1. Server Management

Polyvis uses a unified `ServiceLifecycle` API for all background services. This provides consistent commands for starting, stopping, and monitoring services.

### Status Dashboard

Check all services at once:

```bash
bun run servers
```

Output example:
```
📡 PolyVis Service Status
----------------------------------------------------------------------
SERVICE         PORT       COMMAND         STATUS           PID
----------------------------------------------------------------------
Dev Server      3000       dev             🟢 RUNNING       12345
Daemon          3010       daemon          ⚪️ STOPPED       -
MCP             Stdio      mcp             🟢 RUNNING       12346
Reactor         3050       reactor         🔴 STALE          12340 (?)
...
```

### Individual Service Commands

Each service supports four lifecycle commands:

| Command | Action |
|---------|--------|
| `start` | Launch service in background (detached) |
| `stop` | Graceful shutdown (SIGTERM → SIGKILL if needed) |
| `restart` | Stop + 500ms delay + Start |
| `status` | Show current state and PID |

### Available Services

| Service | Command Base | Port | Purpose |
|---------|--------------|------|---------|
| Dev Server | `bun run dev` | 3000 | Web server + CSS/JS watchers |
| Daemon | `bun run daemon` | 3010 | Vector embedding service |
| MCP | `bun run mcp` | Stdio | Model Context Protocol server |
| Reactor | `bun run reactor` | 3050 | Datastar SSE experiment |
| Olmo-3 | `bun run olmo3` | 8084 | LLM service |
| Phi-3.5 | `bun run phi` | 8082 | LLM service |
| Llama-3 | `bun run llama` | 8083 | LLM service |
| Llama-UV | `bun run llamauv` | 8085 | LLM service |

### Common Workflows

**Start development environment:**
```bash
bun run dev start
bun run servers  # Verify it's running
```

**Start all backend services:**
```bash
bun run daemon start
bun run mcp start
bun run servers  # Check all services
```

**Restart a stuck service:**
```bash
bun run daemon restart
```

**Stop all services:**
```bash
bun run dev stop
bun run daemon stop
bun run mcp stop
# ... etc for each service
```

### Service Artifacts

Each service creates two files in the `.amalfa/` directory:

- `.amalfa/runtime/<service>.pid` - Process ID file (used for status tracking)
- `.amalfa/logs/<service>.log` - Combined stdout + stderr logs

**Example:** `.amalfa/runtime/daemon.pid` contains `12345` and `.amalfa/logs/daemon.log` contains server output.

**Directory Structure:**
```
.amalfa/
├── logs/           # Service log files
│   ├── daemon.log
│   ├── vector-daemon.log
│   └── mcp.log
└── runtime/        # Service PID files
    ├── daemon.pid
    ├── vector-daemon.pid
    └── mcp.pid
```

### Viewing Logs

To view a service's logs:

```bash
# Tail the log file
tail -f .amalfa/logs/daemon.log

# View entire log
cat .amalfa/logs/daemon.log

# Search for errors
grep "error" .amalfa/logs/daemon.log
```

### Protocol Reference

See **AGENTS.md Protocol 25 (SLP)** for the full Server Lifecycle Protocol specification, including the `ServiceLifecycle` class API and guidance on creating new services.

---

## 2.2. Manual Workflow (Advanced)
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

**Example using `http-server`:**
```bash
bun x http-server public
```
