Here is the implementation brief for the **Polyvis MCP Server**. This specification bridges your existing "Hybrid Graph" architecture with the Model Context Protocol, enabling tools like Claude Desktop to natively "think" with your document set.

# Project Brief: Polyvis MCP Server

**Status:** Draft / Active
**Target Runtime:** Bun (Single File Executable)
**Protocol:** [Model Context Protocol (MCP)](https://modelcontextprotocol.io)
**Core Logic:** FAFCAS Embeddings + SQLite FTS5 + Graph Links

-----

## 1\. The Objective

To expose the Polyvis local knowledge engine as an agentic tool. This allows an LLM to query, navigate, and analyze a private document set without requiring the user to manually search or copy-paste text.

**User Story:**

> "As a Project Lead, I want to ask my AI assistant: *'Check the Tender Requirements folder for any contradictions with our Draft Contract.'* The AI should autonomously search the Polyvis database, retrieve relevant clauses, comparing them, and generate a report."

-----

## 2\. Server Architecture

The MCP Server will run as a sub-command of the main Polyvis binary.

  * **Command:** `polyvis mcp --db ./data/negotiation.sqlite --root ./documents`
  * **Transport:** `stdio` (Standard Input/Output). This is the most secure and robust method for local desktop integration.
  * **Dependencies:**
      * `@modelcontextprotocol/sdk`
      * `bun:sqlite` (Native, fast)
      * `zod` (Schema validation)

-----

## 3\. The Tool Definitions

The server will expose **4 Core Tools** to the LLM. These map directly to the "Pincer Movement" logic defined in your playbook.

### A. `search_documents` (The Entry Point)

Performs a hybrid retrieval (Semantic + Lexical) to find relevant nodes.

  * **Input Schema:**
    ```json
    {
      "query": "string (The natural language question or keywords)",
      "limit": "number (optional, default: 5)"
    }
    ```
  * **Internal Logic:**
    1.  Vectorize `query` using the embedding model (ONNX).
    2.  Run **FAFCAS** Dot Product scan (RAM).
    3.  Run **FTS** Keyword Match (SQLite).
    4.  Merge and Rank results.
  * **Returns:** A JSON list of "Thin Nodes" (ID, Score, Summary, File Path). *Does NOT return full content to save context window.*

### B. `read_node_content` (The Deep Dive)

Retrieves the full, raw content of a specific node from the disk (or FTS cache if disk is unavailable).

  * **Input Schema:**
    ```json
    {
      "id": "string (The Node ID returned from search)"
    }
    ```
  * **Internal Logic:**
    1.  Look up `filePath` in `nodes` table.
    2.  Read file from disk.
    3.  Return the raw Markdown text.

### C. `explore_links` (The Graph Traversal)

Uses the pre-computed "Link Discovery" connections to find context that search might miss.

  * **Input Schema:**
    ```json
    {
      "id": "string (The source Node ID)",
      "relation_type": "string (optional: 'contradicts', 'supports', 'related')"
    }
    ```
  * **Returns:** A list of related nodes with their relationship strength/type.

### D. `list_directory_structure` (The Map)

Gives the LLM high-level awareness of the "Territory" (Folders).

  * **Input Schema:** `{}` (No args)
  * **Returns:** A tree structure of the document folders (e.g., " /Tenders", " /Contracts", " /Emails").
  * **Why:** Allows the LLM to understand *where* to look (e.g., "I should search in the 'Tenders' folder first").

-----

## 4\. The Resource Definitions

MCP "Resources" are passive data reading endpoints. We will use these for "System State" rather than querying.

  * **URI:** `polyvis://stats/summary`
  * **Content:**
    ```text
    Total Nodes: 1,402
    Last Ingest: 2025-12-15 14:00
    Folders: 5
    DB Size: 45MB
    ```
  * **Usage:** Allows the LLM to verify it is looking at the correct dataset before starting work.

-----

## 5\. Implementation Roadmap (Bun)

### Step 1: Scaffold the Server

Use the official SDK to set up the connection.

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "polyvis-mcp", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);
```

### Step 2: Wire the "HybridGraph" Class

Import your existing logic. Ensure the `sqlite` connection is shared.

```typescript
// Reuse the class we designed in the previous turn
const graph = new HybridGraph(dbPath);
await graph.loadVectorsIntoRam(); // The FAFCAS preload
```

### Step 3: Define Tool Handlers

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search_documents") {
    const { query } = request.params.arguments;
    const results = await graph.search(query);
    return {
      content: [{ type: "text", text: JSON.stringify(results) }]
    };
  }
  // ... handle other tools
});
```

### Step 4: Build & Distribute

Run `bun build --compile --outfile polyvis ./src/index.ts`.
Distribute the resulting binary.

-----

## 6\. Verification Steps

To sign off on this brief, we will run the **"Indemnity Test"**:

1.  Load a contract into Polyvis.
2.  Connect Claude Desktop to the `polyvis` binary.
3.  Prompt: *"Find the indemnity clause. Does it cover third-party IP claims?"*
4.  **Success Criteria:**
      * Claude calls `search_documents("indemnity clause")`.
      * Claude receives a Node ID.
      * Claude calls `read_node_content(ID)`.
      * Claude answers correctly based *only* on the retrieved text.

Does this brief cover the functionality you are ready to expose?