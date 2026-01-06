# Polyvis Technology Stack

## Core Runtime & Tooling
- **Runtime:** Bun (v1.0+) - Used for development server, script execution, and as the JavaScript toolkit.
- **Package Management:** Bun - `bun install` is the standard for dependency management.
- **Linting & Formatting:** [Biome](https://biomejs.dev/) - Project-wide code quality and formatting.

## Frontend Architecture
- **Reactivity:** [Alpine.js](https://alpinejs.dev/) - Lightweight, declarative UI state management and interactions.
- **Graph Visualization:**
    - [Sigma.js](https://www.sigmajs.org/) - High-performance WebGL graph rendering.
    - [Graphology](https://graphology.github.io/) - Graph data structures and algorithms (e.g., Louvain community detection).
    - [viz.js](https://github.com/mdaines/viz.js) - Graphviz (DOT) rendering in the browser.
- **Styling:**
    - [Tailwind CSS (v4)](https://tailwindcss.com/) - Utility-first styling with modern CSS features.
    - [Open Props](https://open-props.style/) - Modern CSS custom properties for design tokens.
    - **Architecture:** Semantic theming centered in `src/css/layers/theme.css`.

## Data & Persistence
- **Client-Side Database:** [sql.js](https://sql.js.org/) - SQLite compiled to WebAssembly for in-browser SQL querying.
- **Server/Pipeline Database:** [Bun SQLite](https://bun.sh/docs/api/sqlite) (`bun:sqlite`) - High-speed SQLite driver for data ingestion and processing.
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) - Type-safe interactions with the SQLite database.
- **Ingestion Philosophy:** Pipelines are designed to be **repeatable, idempotent, and highly performant**.
- **Source of Truth:** The **source documents (Markdown files)** are the definitive single source of truth.
    - **Annotations:** Edges and metadata are derived from annotations added directly to these source documents.
    - **Diffing:** Changes are managed by diffing against the original source documents to maintain integrity.

## AI & Semantic Analysis
- **LLM Providers:** [Mistral AI](https://mistral.ai/) and [OpenAI](https://openai.com/).
- **Protocols:** [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) - Standardized communication between AI agents and the knowledge graph.
- **Content Processing:** [Unified](https://unifiedjs.com/) / [Remark](https://remark.js.org/) ecosystem - Markdown parsing and AST-based semantic analysis.
