# Task: Resonance MCP Server (The "Voice")

**Objective:**
To embed a **Model Context Protocol (MCP) Server** within the `resonance` binary. This enables external AI agents (e.g., Cursor, Claude Desktop, Windsurf) to proactively query the project's Knowledge Graph (`resonance.db`) for context, heuristics, and past lessons, rather than relying on context-window stuffing.

**Constraints:**

  * **Transport:** Must support `stdio` (Standard Input/Output) for local editor integration.
  * **Zero Config:** Must work out-of-the-box when running `resonance serve --mcp`.
  * **Read-Only:** The MCP interface is for *retrieval* (answering questions), not *mutation* (writing to the DB).

-----

## Key Actions Checklist

  - [ ] **Dependency:** Add `@modelcontextprotocol/sdk` to the project.
  - [ ] **Server Module:** Create `src/mcp/server.ts` to initialize the MCP server instance.
  - [ ] **Tool Registration:** Implement the 5 core Cognitive Tools (see below).
  - [ ] **CLI Integration:** Wire the server to the `resonance serve` command (or a dedicated `resonance mcp` command).
  - [ ] **Verification:** Test connection via an MCP Inspector or local Claude instance.

-----

## Detailed Requirements

### 1\. The "Cognitive Tool" Suite

We will expose the internal **Graphology** and **SQLite** logic as semantic tools for the agent.

| Tool Name | Arguments | Description | Logic (Pseudocode) |
| :--- | :--- | :--- | :--- |
| **`search_concepts`** | `query: string` | Finds relevant nodes (Terms, Protocols, Debriefs) based on fuzzy text match. | `SELECT * FROM nodes WHERE label LIKE %query%` |
| **`get_neighbors`** | `nodeId: string` | Retrieves immediate connections (1-hop) to understand what a concept is related to. | `graph.neighbors(nodeId)` |
| **`get_community`** | `nodeId: string` | Returns the "Cluster" of related concepts (via Louvain) to provide broad context. | `louvain.detailed(nodeId)` |
| **`find_path`** | `fromId, toId` | Explains *how* two concepts are connected (the narrative arc). | `shortestPath(from, to)` |
| **`read_context`** | `nodeIds: string[]` | Fetches the full content (Definition/Markdown) of specific nodes. | `SELECT definition FROM nodes WHERE id IN (...)` |

### 2\. The Operational Workflow (The "Senior Engineer" Loop)

This architecture changes *how* the agent works:

1.  **User:** "Fix the CSS overflow."
2.  **Agent (Internal Monologue):** *"I need to know the CSS standards for this project."*
3.  **Agent Call:** `search_concepts("CSS")` $\to$ Returns `['playbook-css', 'OH-040', 'OH-102']`.
4.  **Agent Call:** `read_context(['playbook-css'])` $\to$ Reads the "Zero Magic" rules.
5.  **Agent Action:** Writes code that complies with your specific constraints (no magic numbers).

### 3\. Integration Logic

The MCP server needs access to the initialized `graph` object.

```typescript
// src/mcp/server.ts (Draft)
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export async function startMcpServer(graph: Graph) {
  const server = new Server({
    name: "resonance-engine",
    version: "1.0.0",
  }, {
    capabilities: {
      tools: {},
    },
  });

  // Register Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [ ... ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    // Dispatch to Graphology logic
  });

  // Connect via Stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

