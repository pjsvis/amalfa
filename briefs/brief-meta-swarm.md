### Brief: The Meta-Swarm Integration (Project "General Contractor")

**Date:** 2026-01-10
**Status:** Draft
**Context:** [OH-109: Model Arbitrage]

#### 1. The Core Concept

We are transitioning `amalfa` from a passive Knowledge Graph into an **Active Compute Broker**. Instead of relying on a single, expensive "General Intelligence" model (e.g., Claude 3.5 Sonnet) for all tasks, we will implement a **Meta-Swarm Architecture**.

The Main Agent acts as the **Foreman**, decomposing complex workflows and farming out specific sub-tasks to free, specialized models via the MCP layer.

**The Economic Thesis:**

* **Reasoning (High Value):** Keep the Main Agent focused on strategy and integration.
* **Labor (Commodity):** Outsource syntax generation, unit tests, and summarization to cost-efficient specialists.

#### 2. The "Personnel" (Model Roster)

We will utilize the following specialized agents via OpenRouter (or local equivalents):

| Role | Model ID | Strength | Use Case |
| --- | --- | --- | --- |
| **The Maverick** | `meta-llama/llama-4-maverick:free` | Tough Logic / Critique | Planning, debugging logic errors, reviewing architecture. |
| **The Coder** | `mistralai/devstral-2-2512:free` | Syntax / Boilerplate | Writing isolated functions, generating unit tests, converting JSON to Typescript interfaces. |
| **The Librarian** | `google/gemini-2.0-flash-exp:free` | Massive Context | Ingesting large docs, summarizing "The Weaver's Handbook," finding needles in haystacks. |

#### 3. Architecture: The `delegate_task` Tool

We will introduce a new tool to the `amalfa` MCP server: `delegate_task`.

**Schema:**

```typescript
{
  name: "delegate_task",
  description: "Delegates a specific, isolated sub-task to a specialized sub-agent.",
  inputSchema: {
    type: "object",
    properties: {
      role: {
        type: "string",
        enum: ["coder", "reasoner", "librarian"],
        description: "The specialist to hire for this job."
      },
      task: {
        type: "string",
        description: "Clear, isolated instruction (e.g., 'Write a regex to parse Markdown links')."
      },
      context: {
        type: "string",
        description: "Compressed, relevant context (e.g., Interface definitions, error logs). DO NOT dump the whole state."
      }
    },
    required: ["role", "task"]
  }
}

```

**Flow:**

1. **Main Agent** identifies a sub-task (e.g., "I need a Regex for this specific parsing logic").
2. **Main Agent** calls `delegate_task(role="coder", task="...", context="...")`.
3. **MCP Server** routes the request to the specified OpenRouter model.
4. **Sub-Agent** generates the artifact (Code/Text).
5. **MCP Server** returns the artifact as a tool result.
6. **Main Agent** integrates the result into the project.

#### 4. The "Context Fracture" Risk & Mitigation

* **Risk:** The Sub-Agent lacks the global context of the project (e.g., `tsconfig` settings, variable names).
* **Mitigation:** The **"Compressed Context" Protocol**. The Main Agent must be prompted to explicitly extract and pass *only* the necessary interfaces or constraints in the `context` field. We do not rely on the Sub-Agent "knowing" the repo.

#### 5. Implementation Plan

1. **Configuration:** Update `amalfa.config.ts` to include an `openRouterApiKey` and the `modelMap`.
2. **MCP Update:** Modify `src/mcp/index.ts` to register the `delegate_task` tool.
3. **Transport Layer:** Implement the `fetch` call to OpenRouter within the MCP handler (using native Bun `fetch`).
4. **Testing:** Create `scripts/test-delegation.ts` to verify each role returns valid outputs.

#### 6. Next Actions

* Approve this brief.
* Begin implementation of `delegate_task` in `src/mcp/index.ts`.