# PolyVis User Guide

Welcome to **PolyVis**, a local-first Knowledge Graph engine and MCP Server.

## 1. Quick Start

### Installation
**Requirement:** [Bun](https://bun.sh) is **mandatory** for this project.
Ensure you have Bun installed.
```bash
bun install
```

### Initial Data Ingestion
Before running the server, you must ingest your Markdown documents and generate vectors.
```bash
bun run build:data
```
*Note: This process uses local embeddings (AllMiniLML6V2) and may take a moment on the first run.*

### Running the MCP Server
To expose the knowledge graph to your AI agent (like Claude Desktop or other MCP clients):
```bash
bun run mcp
```
This starts the server on `stdio`.

## 2. Core Features

### Knowledge Graph
Your data is stored in `public/resonance.db`. This includes:
-   **Nodes:** Parsed from your Markdown files (Experience, Playbooks, Debriefs).
-   **Edges:** Automatically woven based on semantic similarity and explicit tags.
-   **Vectors:** Local embeddings for semantic search.

### Hybrid Search
The system uses a **Hybrid Search** mechanism combining:
1.  **Vector Search:** Semantic understanding (e.g., "how to fix timeout").
2.  **FTS (Full-Text Search):** Keyword matching (e.g., "timeout error 500").

### Visualization
To explore the graph visually in your browser:
```bash
bun run dev
```
Visit `http://localhost:3000`.

## 3. Advanced Usage

### Vector Daemon (Optional)
For heavy ingestion workloads, you can run the Vector Daemon in the background to keep the embedding model loaded in memory:
```bash
bun run resonance/src/daemon.ts
```
The ingestion scripts will automatically detect and use the daemon if it's running on port 3010.

### Re-Indexing
If you add or modify files, simply run:
```bash
bun run build:data
```

## 4. Troubleshooting

**"Search returns empty results"**
-   Ensure you ran `bun run build:data`.
-   Check `public/resonance.db` exists.

**"VectorEngine Error"**
-   Ensure no other process is blocking the database.
