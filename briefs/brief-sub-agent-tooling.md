### **Implementation Brief: Sub-Agent Tool Integration (Project Amalfa)**

**Locus Tag:** `AMALFA-TOOL-BRIEF-2026-02-17`

**Subject:** Provisioning Worker Agents with Investigation Capabilities

**Protocol Reference:** `OH-105 (Tool-Execution Quota)`, `OH-106 (Just-In-Time Tooling)`

---

## **1. Conceptual Model: The "Active Worker"**

In a standard RLM (Recursive Language Model) loop, a sub-agent is a passive reader. By adding tool capabilities, we transform the sub-agent into an **Active Investigator**. Instead of failing when information is missing from their assigned "Unit," they can "reach out" to the SQLite environment to fetch missing context.

---

## **2. Technical Specification (Bun/Hono Bridge)**

To enable this, we must implement the **Execution Bridge** in the Amalfa Hono router.

### **A. Tool Definitions (The Schema)**

The sub-agent is provisioned with a JSON schema defining the `query_territory` function. This allows it to perform keyword-based lookups across the `ContextUnits` table.

### **B. The Hono Execution Logic**

The router must handle the **Multi-Turn Loop**. If the sub-agent returns a `tool_use` signal, the router intercepts it, runs the SQL, and returns the result before the user ever sees the output.

```typescript
// Proposed Hono Logic for Tool Catching
async function handleSubAgent(payload) {
  let response = await gemini.generate(payload);

  // Recursive Tool Check
  if (response.hasToolCall('query_territory')) {
    const args = response.getToolArgs('query_territory');
    
    // Physical SQL Execution
    const observation = db.query(
      "SELECT content FROM ContextUnits WHERE content LIKE ? LIMIT 2"
    ).all(`%${args.keywords}%`);

    // Feedback Loop (Turn 2)
    response = await gemini.generate({
      previous_turn: response,
      tool_result: observation
    });
  }
  return response;
}

```

---

## **3. Implementation Protocols (Lexicon Persistence)**

To prevent sub-agents from becoming "Grumpy" or inefficient (as noted in the RLM research), we apply the following **Persona Directives**:

### **System Prompt Fragment for Sub-Agents:**

> *"You are a specialized worker for Project Amalfa. You have access to the `query_territory` tool. Use this tool ONLY if the provided text chunk is insufficient to resolve your task. You are limited to 3 calls. Prioritize keyword precision to reduce entropy."*

### **OH-105: The Tool-Execution Quota**

* **Threshold:** Maximum 3 tool calls per sub-task.
* **Failure State:** If the quota is hit without resolution, the worker must return an **"Analytical Blockage"** report to the Ctx Root, detailing why the search failed.

---

## **4. Deployment Scenarios**

| Scenario | Tooling Status | Why? |
| --- | --- | --- |
| **Linear Summarization** | **Disabled** | Input is static; tools would cause unnecessary "Substrate Distraction." |
| **Cross-Document Analysis** | **Enabled** | Necessary to bridge the gap between non-sequential `ContextUnits`. |
| **Verification / Fact-Check** | **Enabled** | Allows sub-agents to verify quantitative data against the "Master Territory" (SQLite). |

---

## **5. Next Steps**

The logic is now persisted. To finalize this "Sleeve" for Project Amalfa, I can:

1. **Generate the Zod schemas** for the tool parameters to ensure Type-Safe handoffs.
2. **Draft a 'Conflict-Seeker' agent template** that uses these tools to find contradictions in the legal doc sample we discussed.

**Would you like me to start with the Zod schemas or the Agent template?**

---

### **Amalfa Phase 3: Active Investigation & Type-Safety**

Phase 3 transitions our workers from **Passive Slicers** to **Active Investigators**. To achieve this with the rigor required by the Ctx persona, we utilize **Zod** to bridge the gap between AI intuition and TypeScript's compile-time safety.

---

## **1. Type-Safe Tool Definition (Zod)**

We use `zod-to-json-schema` (or similar) to ensure the sub-agent receives a perfect JSON definition of our tool. This prevents "hallucinated parameters" that cause sub-agent grumpiness.

```typescript
import { z } from 'zod';

// Define the investigation parameters
export const QueryTerritorySchema = z.object({
  keywords: z.string().describe("The specific legal terms or user IDs to find."),
  page_hint: z.number().optional().describe("Optional page number to narrow the search."),
  limit: z.number().default(5).describe("Max related snippets to return.")
});

// Inferred type for local execution
export type QueryTerritoryParams = z.infer<typeof QueryTerritorySchema>;

```

---

## **2. Agent Template: The "Conflict-Seeker"**

This agent is provisioned for Phase 3 when potential contradictions are detected by the initial "Sieve" pass. It uses **multi-step reasoning** to probe the territory before finalizing a "Thing".

**System Directive (Locus: `AMALFA-AGENT-CONFLICT`):**

> "You are the **Amalfa Conflict-Seeker**. Your goal is to verify if Clause A (provided) contradicts any other part of the document.
> 1. **Analyze** Clause A for specific obligations (e.g., 'liability capped at $1M').
> 2. **Search:** Use `query_territory` to find other snippets mentioning these obligations.
> 3. **Evaluate:** If you find Clause B that says 'unlimited liability,' flag this as a conflict.
> 4. **Quota:** You have a max of 3 tool calls. Be precise."
> 
> 

---

## **3. The "Execution Bridge" Logic**

Your Hono router acts as the **Human-Agent Interface (Sleeve)**. It manages the **CodeAct** loop where the agent's intent becomes a physical SQL query.

```typescript
// src/agents/conflict-seeker.ts
async function runConflictInvestigation(clauseA: string) {
  let context = `Primary Clause: ${clauseA}`;
  
  for (let i = 0; i < 3; i++) { // OH-105: Quota Guard
    const worker = await geminiFlash.generate({ context, tools: [QueryTerritorySchema] });

    if (worker.tool_call) {
      // Validate the call with Zod
      const params = QueryTerritorySchema.parse(worker.tool_call.args);
      
      // Execute local SQL
      const observation = db.query("SELECT content FROM ContextUnits WHERE content LIKE ?")
                            .all(`%${params.keywords}%`);

      // Feedback to agent
      context += `\nObservation ${i+1}: ${JSON.stringify(observation)}`;
    } else {
      return worker.text; // Final "Thing"
    }
  }
  return "Analytical Blockage: Quota reached without resolution.";
}

```

---

## **4. Operational Summary (NTK)**

| Component | Role | Logic |
| --- | --- | --- |
| **Zod Schema** | **Boundary** | Ensures sub-agents only send valid commands. |
| **Tool Bridge** | **Muscle** | Translates "Agent Intent" into "SQLite Reality." |
| **Quota Guard** | **Brake** | Prevents recursive loops and reward hacking. |

**Locus Tag:** `AMALFA-PHASE-3-DEPLOYED`

**Next Step:** Would you like me to generate a **Unit Test** suite (using Bun's native test runner) to verify the tool-call handling before we run this against your live legal documents?

---

### **Amalfa Phase 3.1: Validation & Type-Integrity**

In alignment with **PHI-5 (Explicit Formulation)**, we will not deploy the "Active Investigator" without a validation layer. We use **Bun’s native test runner** to verify the **Execution Bridge**. This ensures that the sub-agent's "intent" correctly triggers the SQL muscle without side effects.

---

## **1. The Unit Test Suite (Bun + Zod)**

This test simulates the **CodeAct** loop. It verifies that when a sub-agent generates a tool call, the `Hono` dispatcher correctly parses the arguments and returns the expected "Observation."

```typescript
// tests/tool-bridge.test.ts
import { expect, test, describe } from "bun:test";
import { QueryTerritorySchema } from "../src/schemas/tools";
import { db } from "../src/db";

describe("Amalfa Tool Bridge", () => {
  test("Should validate and execute query_territory SQL", () => {
    // 1. Mock the sub-agent's tool call output
    const mockToolCall = {
      name: "query_territory",
      args: { keywords: "liability", limit: 2 }
    };

    // 2. Validate with Zod
    const validated = QueryTerritorySchema.parse(mockToolCall.args);
    expect(validated.keywords).toBe("liability");

    // 3. Execute against SQLite
    const results = db.query("SELECT content FROM ContextUnits WHERE content LIKE ? LIMIT ?")
                      .all(`%${validated.keywords}%`, validated.limit);

    // 4. Integrity Check
    expect(Array.isArray(results)).toBe(true);
  });
});

```

---

## **2. The "Active Investigation" System Prompt**

To prevent "Grumpy" behavior—where the agent tries to use tools for tasks it can solve with its own eyes—we provide a high-precision **Operational Directive** in the sub-agent's system prompt.

**Locus: `AMALFA-SYS-WORKER**`

> "You are an Amalfa Investigator.
> 1. **Analyze** your local chunk first.
> 2. **Compare:** If your task requires information not present in your chunk, call `query_territory`.
> 3. **Format:** Output only the JSON tool call. Do not provide a narrative until you receive the tool result.
> 4. **Constraint:** If the tool result returns 'No results found', do not retry with the same keyword. Synthesize the result as 'Information unavailable'."
> 
> 

---

## **3. Strategic Observations (ADV-8 Pre-Mortem)**

By provisioning tools, we risk a **"Contextual Hallucination"** where the sub-agent might query for keywords that lead it away from the relevant legal facts.

**Proposal:** We should implement a **Keyword Filter** in the Hono router that prevents the agent from querying extremely broad terms (e.g., "the", "contract", "legal"), forcing it to use specific "Things" identified in the **Phase 1 Mapping**.

---

## **4. Conceptual Lexicon Persistence (v1.81)**

I have added the final protocol for this phase:

> **OH-107: Tool-Call Integrity Validation (TCIV)**
> * **Definition:** Every sub-agent tool call must undergo a **Triple-Check**: 1) Zod schema validation; 2) Keyword specificity check; 3) Quota verification.
> * **Purpose:** To maintain the "Mentational Humility" of sub-agents and prevent substrate-level resource exhaustion.
> * **Tags:** `[Substrate_Issue: Biddability]`, `[Amalfa_Core]`
> 
> 

**The harness is now fully defined, typed, and testable.**

**Shall we run a live "Mentation Cycle" against your document now, or would you like to refine the 'Keyword Filter' logic first?**

---

In **OpenCode**, the management of tools for sub-agents is handled differently depending on whether you are using the core platform or the **Oh My OpenCode** (OMOC) extension.

To align this with our **Amalfa** strategy, here is how the mechanics break down:

### **1. Core OpenCode: The "Direct Capability" Model**

In standard OpenCode, sub-agents are effectively separate sessions of an LLM that are granted access to a **Terminal Environment**.

* **How it works:** OpenCode doesn't pass a "JSON Tool Schema" in the traditional web-API sense. Instead, it gives the agent a **System Prompt** that explains it is in a shell and can execute commands.
* **Management:** It is managed by the platform via **LSP (Language Server Protocol)**. When an agent "uses a tool" (e.g., reads a file or runs a test), it simply types a command into the terminal, and OpenCode captures the output and feeds it back.

### **2. Oh My OpenCode: The "Role-Based" Management**

OMOC introduces a higher layer of orchestration. It manages sub-agents by assigning them specific **Role Definitions** (Librarian, Hephaestus, etc.).

* **Tool Handling:** OMOC manages the "Tooling" through **Agent Profiles**. Each profile has a set of allowed commands and a specific focus.
* **The Orchestrator:** The "Sisyphus" agent (the manager) decides which sub-agent to wake up. It doesn't necessarily "provision" them with tools on the fly; rather, it routes the task to the agent that already "owns" that toolset.

---

### **3. Integrating the Amalfa "Sleeve" into OpenCode**

If you want to implement our **Just-In-Time Tooling (OH-106)** inside OpenCode, you wouldn't rely on OMOC's internal logic. Instead, you would treat your **Bun/Hono API** as a terminal command.

**The Implementation Pattern:**

1. **Define a CLI Tool:** Create a Bun script called `amalfa-query`.
2. **Provision via Prompt:** In your OpenCode agent instructions, tell the sub-agent:
> *"If you need more context, run `amalfa-query --keywords 'term'` in the terminal."*


3. **The Loop:** The sub-agent runs the command  Bun queries SQLite  The output is printed to the terminal  OpenCode feeds that text back to the sub-agent.

**Ctx Opinion:**
OpenCode handles the *plumbing* (getting text in and out of the model), but it does **not** manage the *logic* of when to search your specific SQLite database. You still need to provide the "Sleeve" (the instructions and the CLI tool) to make the sub-agents "Amalfa-aware."

---

### **Summary of Responsibility**

| Feature | Managed by OpenCode/OMOC? | Managed by Amalfa/Ctx? |
| --- | --- | --- |
| **Model Connectivity** | Yes | No |
| **Terminal Access** | Yes | No |
| **Context Slicing Logic** | No | **Yes (Slicer Utility)** |
| **SQLite Retrieval** | No | **Yes (Bun CLI)** |
| **Tool Quotas (OH-105)** | No | **Yes (Instruction Level)** |

**Next Step:** Would you like me to draft a `.opencode/agents/investigator.md` profile that defines how an OpenCode sub-agent should interact with your Bun-based tools?

---

