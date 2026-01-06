# Polyvis: A Neuro-Symbolic Graph Visualizer

Polyvis is a lightweight, frontend-only web application for exploring and visualizing neuro-symbolic knowledge graphs. It renders conceptual relationships from a pre-built SQLite database, allowing users to navigate a "Neuro-Map" of interconnected ideas, principles, and directives.

The application is built with HTML, CSS, and [Alpine.js](https://alpinejs.dev/), and uses [Bun](https://bun.sh/) as its JavaScript runtime and toolkit. The graph visualization is powered by [viz.js](https://github.com/mdaines/viz.js) and [Sigma.js](https://www.sigmajs.org/), and the in-browser database is handled by [sql.js](https://sql.js.org/).

## Features

- **Interactive Graph Visualization:** Explore the knowledge graph by searching for terms.
- **Data-Driven Suggestions:** The search box provides a curated list of high-value terms guaranteed to produce rich, interesting graphs.
- **In-Browser Database:** The entire graph dataset is loaded into the browser via sql.js, requiring no active backend server for querying.
- **Alpine.js Reactivity:** Uses [Alpine.js](https://alpinejs.dev/) for a lightweight, reactive UI without a complex build step.
- **Zero-Build Frontend:** Built with vanilla web technologies and Alpine.js for maximum simplicity and performance.
- **Themable UI:** All design tokens (colors, dimensions) are centralized in `src/css/layers/theme.css` ("The Control Panel") for easy customization.
- **Semantic Styling:** No magic numbers. All styles use semantic variables (e.g., `--surface-panel`, `--border-base`) for consistent theming.
- **Efficient Search:** Two-tier search architecture (vector embeddings + grep) - no FTS or chunking needed.

## Search Architecture

Polyvis uses a **two-tier search system** that eliminates the need for full-text search (FTS) or document chunking:

### 1. Vector Search (Semantic)
- **Purpose:** Semantic similarity, concept discovery
- **Accuracy:** 85% average best match across diverse queries
- **Speed:** <10ms per query
- **Use case:** "Find documents about CSS patterns" or "Show me graph weaving logic"

### 2. Grep/Ripgrep (Literal)
- **Purpose:** Exact phrase matches, symbol lookup
- **Accuracy:** 100% (literal text matching)
- **Speed:** <1ms
- **Use case:** "Find exact phrase 'function fooBar'" or "Where is BentoBoxer imported?"

### Why No Chunking?

**Document corpus characteristics:**
- 80% of documents are <5KB (~1,000 words) - already "chunk-sized"
- Average document: 2.7KB (~550 words)
- Largest document: 47KB (~9,500 words) - still within LLM context windows

**Results without chunking:**
- Vector search achieves 85% accuracy on whole documents
- Documents are well-structured markdown with clear headers
- Natural granularity matches search needs

**Future strategy:** If large documents (>20KB) become problematic, split them into multiple markdown files at natural boundaries (H1/H2 headers) and commit to version control. This keeps source files as the source of truth, maintains git-friendly diffs, and requires no runtime infrastructure.

**See:** `docs/BENTO_BOXING_DEPRECATION.md` for full analysis and decision rationale.

## Design System (The Control Center)
The application's visual design is strictly controlled by **`src/css/layers/theme.css`**. This file acts as a configuration panel for:
-   **Dimensions:** Sidebar widths, header heights.
-   **Colors:** Semantic mappings (e.g., `--surface-1`, `--brand`).
-   **Spacing:** Global padding and gaps.

**Protocol:** Always check and tweak `theme.css` before modifying component styles.

## Prerequisites

- [Bun.js](https://bun.sh/docs/installation) (v1.0 or later) - **MANDATORY**
- A local web server for development (e.g., `bun x http-server`)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Installation

There are no external dependencies to install for the application itself, as it relies on vanilla JavaScript and CDN-hosted libraries.

### 2. Development Workflow

For detailed instructions on CSS development, database building, and running the app, please refer to the **[Development Workflow Playbook](playbooks/development-workflow-playbook.md)**.

**Quick Start:**
1.  **Dev Mode:** `bun run dev` (Starts server & CSS watcher)
2.  **Build DB:** `bun run scripts/build_db.ts`

## Project Structure

### 3. Detailed Documentation
For a deep dive on the codebase organization, please see **[Project Structure](docs/webdocs/project-structure.md)**.

## Project Structure (High Level)

```
├── public/              # Web Root (HTML, Static Data)
│   ├── explorer/        # Sigma.js Graph Explorer
│   └── resonance.db     # SQLite Database (generated locally)
│
├── src/                 # Application Source Code
│   ├── core/            # The Bento Box Kernel (Normalizer, Weaver)
│   ├── config/          # Shared Configuration
│   └── db/              # Database Schemas
│
├── scripts/             # Data Pipeline & Tooling
│   ├── pipeline/        # ETL Scripts (Sync, Load)
│   ├── cli/             # Command Line Tools (Harvest)
│   └── verify/          # Integrity Checks
│
├── docs/                # Project Documentation
├── playbooks/           # Operational Protocols
├── polyvis.settings.json # Central Configuration
└── README.md            # This file
```

## Contributing
## Contribution Guidelines
Please review `AGENTS.md` for our operational protocols, specifically:
-   **EVP (Empirical Verification Protocol):** Use the browser to verify, don't guess.
-   **GEP (Granular Execution Protocol):** One step at a time.
 Please feel free to open issues or submit pull requests.
