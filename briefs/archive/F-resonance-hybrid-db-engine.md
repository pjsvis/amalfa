# F Resonance Hybrid Db Engine

### Project Brief: The Resonance Engine (v2.0)

**Status:** Definitive / Execution-Ready
**Objective:** To build **Resonance**: a standalone, local-first "Meta-Cognitive Engine" for software projects. It ingests operational artifacts (Debriefs/Playbooks) into a **Hybrid Knowledge Graph** (Vector + Relational) to enable context-aware AI coding assistance.

**Core Philosophy:**

  * **Zero Magic:** No external vector DBs. No cloud APIs for embeddings.
  * **Local First:** Embeddings generated locally via `transformers.js` (ONNX).
  * **Single Binary:** Packaged as a standalone executable via `bun build --compile`.
  * **Agent-Native:** Accessibility (A11y) is treated as the primary API for automation.

-----

## 1\. The "Hybrid Engine" Architecture

We pivot from experimental C-extensions to a **"Stable Core"** architecture using high-performance JavaScript libraries running on Bun.

| Component | Technology | Role | Justification |
| :--- | :--- | :--- | :--- |
| **Cognition** | `@xenova/transformers` | **Vector Generation** | Runs `all-MiniLM-L6-v2` (Quantized) in the application layer. Stable, widely distributed, no binary risks. |
| **Memory** | `sqlite-vec` | **Vector Storage** | High-performance vector search extension for SQLite. |
| **Parsing** | `sqlite-regex` | **Pattern Matching** | Enables SQL-side extraction of `OH-` tags and `[[WikiLinks]]`. |
| **State** | `resonance.db` | **The Brain** | A single SQLite file containing the Graph (Nodes/Edges) and Vectors. |
| **Runtime** | `bun` | **Orchestrator** | Compiles everything into a single binary. |

-----

## 2\. Database Schema

The database (`.resonance/resonance.db`) partitions data to support both **Ontology** (Static Rules) and **Telemetry** (Dynamic Experience).

```sql
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  label TEXT,
  content TEXT,       -- Raw text for RAG retrieval
  domain TEXT,        -- 'persona' | 'resonance' | 'system'
  type TEXT,          -- 'heuristic', 'debrief', 'playbook'
  embedding BLOB      -- Float32 Vector (via sqlite-vec)
);

CREATE TABLE edges (
  source TEXT,
  target TEXT,
  relation TEXT       -- 'CITES', 'UPDATES', 'GENERATED_BY'
);
```

**The Genesis Node:**

  * **ID:** `000-GENESIS`
  * **Function:** Root anchor connecting the `persona` and `resonance` sub-graphs.

-----

## 3\. Configuration & Registry

**File:** `./resonance.settings.json` (Zod Validated)

```json
{
  "project_name": "my-project",
  "version": "1.0",
  "sources": {
    "playbooks": "./playbooks",
    "debriefs": "./debriefs"
  },
  "registry": {
    "url": "https://github.com/my-org/playbooks" // Optional upstream
  }
}
```

-----

## 4\. The `resonance` CLI (Verbs)

### **A. `init` (Bootstrap & Discovery)**

  * **Action:** Scaffolds `.resonance/`, creates config, and performs **Heuristic Auto-Discovery**.
  * **Magic:** Scans for `bun.lockb` -\> Installs `bun-playbook.md`. Scans for `tailwind.config.js` -\> Installs `css-zero-magic.md`.
  * **Payload:** Downloads/Caches the Embedding Model (`.onnx`) if missing.

### **B. `install` (Knowledge Package Manager)**

  * **Action:** Fetches Playbooks from the Registry.
  * **Logic:** Acts like `npm install` for wisdom. Updates `resonance.lock.json` to track upstream versions.

### **C. `sync` (Ingestion Pipeline)**

  * **Action:** The ETL Loop.
    1.  **Read:** Scans local Markdown files.
    2.  **Parse:** Extracts metadata and Regex links.
    3.  **Embed:** Generates vectors via `transformers.js`.
    4.  **Write:** Upserts to `resonance.db`.

### **D. `serve` (Interface)**

  * **Action:** Starts the Bun web server.
      * **Port 3000:** Serves the **Sigma Visualizer** (Embedded Assets).
      * **Stdio/SSE:** Exposes the **MCP Server**.

### **E. `audit` (Meta-Cognition)**

  * **Action:** Reports on Graph Health.
      * *Check:* "Open Loops" (Debriefs with no Playbook updates).
      * *Check:* "Drift" (Local playbooks vs. Registry upstream).

-----

## 5\. The MCP Interface ("The Voice")

Exposes **Cognitive Tools** to external agents (Cursor/Claude).

| Tool | Logic | Purpose |
| :--- | :--- | :--- |
| **`search_hybrid(query)`** | Vector Dot Product + Graph Traversal | Finds semantically relevant *and* structurally linked concepts. |
| **`get_context_stack(task)`** | Registry Lookup | Returns the standard "Stack" of playbooks for a domain (e.g., CSS). |
| **`consult_memory(topic)`** | Vector Search on Debriefs | "Have we solved this before?" |

-----

## 6\. Accessibility Standard (SAB)

**Constraint:** The Visualizer UI must adhere to **OH-132 (Semantic Accessibility Bridge)**.

  * **Rule:** Every interactive element must have `aria-label` or visible text.
  * **Rule:** State changes (sidebars) must use `aria-expanded`.
  * **Reasoning:** The UI must be navigable by "Blind Agents" (headless browsers).

-----

## 7\. Implementation Plan

1.  **[ ] Core & Config:** Setup `src/config.ts` and `src/commands/init.ts` (with Auto-Discovery).
2.  **[ ] Database Engine:** Implement `src/db.ts` with `sqlite-vec` and `sqlite-regex`.
3.  **[ ] Cognitive Layer:** Implement `src/services/embedder.ts` using `@xenova/transformers`.
4.  **[ ] Ingestion:** Implement `src/commands/sync.ts` (ETL pipeline).
5.  **[ ] Interface:** Implement `src/mcp/server.ts` and embed the Visualizer assets.
6.  **[ ] Compilation:** Verify `bun build --compile` produces a working binary.