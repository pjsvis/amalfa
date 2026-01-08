# PolyVis: Architectural Overview & Executive Summary

**Version:** 1.0 (Hollow Node / Logging Verified)  
**Date:** 2025-12-29

## 1. Executive Summary

PolyVis is a high-performance, local-first **Knowledge Graph & Agentic Substrate**. Unlike traditional web applications that prioritize cosmetic UI rendering, PolyVis prioritizes **data sovereignty, raw speed, and machine interpretability**.

It replaces the "glue code" of modern stacks (React, Redux, REST) with a direct-to-metal approach using **Bun**, **SQLite**, and **Canvas-based visualization**. This architecture, dubbed **"Hollow Node"**, allows it to visualize and reason about knowledge graphs orders of magnitude larger than typical DOM-based tools, while interacting seamlessly with AI Agents via the **Model Context Protocol (MCP)**.

---

## 2. Technology Stack

PolyVis utilizes a bi-modal stack designed for zero-latency interaction.

### Client (The Visor)
- **Runtime:** Vanilla JavaScript (ES Modules).
- **Rendering:** `sigma.js` (Canvas/WebGL) for graph rendering; direct DOM for simple UI panels.
- **Interactivity:** `alpine.js` for lightweight reactivity (no Virtual DOM overhead).
- **Styling:** `basecoat-css` + Vanilla CSS Layers; **No Tailwind** (except for utility generation), preserving pure CSS maintainability.
- **Transport:** Standard `fetch` / `WebSocket` (if needed) - no complex client-side routers.

### Server (The Substrate)
- **Runtime:** **Bun** (Zig-based JS runtime) – providing 3x-10x startup speeds vs Node.js.
- **Database:** `bun:sqlite` (FFI) – Direct in-process database access.
    - **Performance:** Reads at C-speed, bypassing network serialization.
- **ORM:** Drizzle ORM (for schema definitions and migrations only; raw SQL used for hot loops).
- **Vector Engine:** `fastembed` (running locally via ONNX) for semantic search.
- **Agent Interface:** `@modelcontextprotocol/sdk` (MCP) – Exposes the graph as tools (`search_documents`, `read_node`) to LLMs.

---

## 3. Products & Services

PolyVis is composed of four distinct, interoperable subsystems:

### A. Resonance (The Backend)
The beating heart of the system.
- **ResonanceDB:** A wrapper around SQLite that handles graph topology (Nodes/Edges) and Vector embeddings in a single file (`resonance.db`).
- **Hollow Node Pattern:** Nodes store light metadata; heavy content is read JIT from the filesystem (`read_node_content`). Result: ~60% db size reduction.

### B. The Pipeline (Ingestion)
Automatically converts raw files into the Knowledge Graph.
- **Ingestor:** Watches filesystem (`watch`), parses Markdown/Frontmatter, embeds chunks, and upserts to DB.
- **Semantic Harvester:** A Python bridge (`src/pipeline/SemanticHarvester.ts`) that runs complex NLP (Sieve+Net) to extract semantic triples (`Entity -> Relation -> Entity`).
- **Gardeners:** Autonomous background agents (e.g., `AutoTagger`) that refine the graph (maintenance).

### C. The Visor (The UI)
A minimal, heavy-duty visualization tool.
- **Sigma Explorer:** Interactive graph exploration.
- **Quick Look:** Markdown rendering of selected nodes.

### E. Sonar (The Discovery Engine)
The autonomous reasoning layer of AMALFA.
- **FAFCAS Engine:** A multi-step discovery loop that uses "Internal Monologue" to research leads across the graph.
- **Topological Discovery:** Leverages Structural Hubs and PageRank to navigate "blind spots" autonomously.
- **Recursive Chain Verification:** A built-in Auditor that double-checks research findings to ensure truthfulness and query completion.
- **Cloud-Hybrid Inference:** Dynamically routes between local Ollama and OpenRouter (Free Tier) to provide high-quality reasoning at zero cost.

---

## 4. Potential Uses

| Use Case | Description |
| :--- | :--- |
| **Agentic RAG** | Providing LLMs with a structured, navigable map of a codebase or knowledge base, reducing hallucination via graph traversal. |
| **Codebase Cartography** | Visualizing complex dependencies in legacy software projects to aid refactoring. |
| **Personal Knowledge Graph** | A local-first "Second Brain" that connects obsidian-style markdown files semantically. |
| **Forensic Analysis** | Ingesting logs or timeline data to visualize causal chains in incident responses. |

---

## 5. Stats & Benchmarks

### "Hollow Node" Efficiency
By completely removing the Full-Text Search (FTS) engine and huge content blobs from the DB, PolyVis achieves extreme efficiency:
- **Database Size:** Reduced from **5.9MB** to **~2.3MB** (61% reduction).
- **Search Speed:** < 20ms for Vector Similarity search.
- **Ingestion Speed:** ~450+ files processed and woven in seconds.

### Ingestion Throughput
- **Bun:** Zero-startup time allows the Daemon to restart instantly.
- **Vectorization:** Local `fastembed` avoids API latency (OpenAI/Azure), enabling offline ingestion of thousands of chunks.

---

## 6. Strategic Radar Analysis

Comparing **PolyVis** against a standard **"Modern Enterprise Stack"** (Next.js / Python Backend / Neo4j / Cloud Vector DB).

![architectural_overview](architectural_overview.png)

### Key Factors for Success (Axes)
1.  **Velocity:** Speed of runtime execution and development iteration.
2.  **Scalability (Local):** Ability to handle node count on a single machine without lag.
3.  **Simplicity:** Absence of "black box" frameworks; ease of audit.
4.  **Local-First:** functionality without internet/cloud dependencies.
5.  **Agentic Readiness:** Native support for tool-calling/MCP.
6.  **Payload Efficiency:** Small memory/disk footprint.
7.  **Visual Density:** Ability to render thousands of data points at once.

### The Radar Data

| Metric (0-10) | **PolyVis** (Bun/SQLite/Sigma) | **React / Next.js Stack** | **Enterprise Graph (Neo4j)** |
| :--- | :---: | :---: | :---: |
| **Velocity** | **10** (Zig/C++) | 6 (Node/V8) | 5 (Java JVM) |
| **Scalability (Local)** | **9** (Canvas/WebGL) | 3 (DOM limits) | 8 (Backend-only) |
| **Simplicity** | **9** (Raw SQL/JS) | 4 (Hydration/SSR complexities) | 3 (Admin overhead) |
| **Local-First** | **10** (Bun:sqlite) | 5 (API dependent) | 6 (Server dependent) |
| **Agentic Readiness** | **10** (Native MCP) | 6 (Requires integration) | 5 (JDBC/Bolt drivers) |
| **Payload Efficiency** | **9** (Hollow Node) | 4 (Large bundles) | 4 (JVM Overhead) |
| **Visual Density** | **9** (WebGL) | 2 (HTML Elements) | N/A (Backend) |

### Interpretation
*   **The "DOM Wall":** React/Next.js stacks fail at *Visual Density* and *Local Scalability* because the DOM cannot handle >3,000 nodes efficiently. PolyVis (Canvas) handles 50,000+.
*   **The "Cloud Tax":** Enterprise stacks score low on *Velocity* and *Simplicity* due to setup overhead and cloud latency. PolyVis scores high by keeping everything in-process or IPC.
*   **The "Agent Gap":** Most apps are built for Humans (HTML). PolyVis is built for Agents (MCP) first, Humans second, ensuring high *Agentic Readiness*.

---

## 7. Conclusion

PolyVis is not just a graph visualizer; it is a **reference architecture for the Agentic Age**. By rejecting the bloat of the Browser Wars (React/Virtual DOM) and embracing the speed of modern runtimes (Bun) and established protocols (MCP), it delivers a tool that is simultaneously lighter, faster, and smarter than its enterprise counterparts.
