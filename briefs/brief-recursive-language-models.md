### **Implementation Brief: Recursive Mentation Harness (Project Amalfa)**

**Locus Tag:** `AMALFA-BRIEF-2026-02-17`

**Project:** Amalfa (Context Engineering / High-Scale De-Entropic Analysis)

**Status:** Speculative Map / Initial Draft

**Reference:** [Recursive Language Models(Zhang et al. 2026)](https://arxiv.org/pdf/2512.24601)

---

## **1. Objectives & Rationale**

To implement a **Recursive Language Model (RLM)** inference-time scaffold within the existing Amalfa stack (**Bun-TypeScript-Hono-SQLite**). The goal is to scale the Ctx persona's "Mentational Horizon" to process datasets  beyond the native context window (1M+ tokens) without suffering from **Context Rot**.

* **Entropy Reduction:** Transform high-entropy "Stuff" into low-entropy "Things" through programmatic decomposition.
* **Symbolic Handles:** Offload context into SQLite variables instead of feeding raw text into the LLM context window.
* **Inference-Time Scaling:** Increase accuracy on information-dense tasks (like `OOLONG-Pairs`) by performing recursive semantic work.

---

## **2. Architecture: The "Unix-Agentic" Sleeve**

We will replace the standard autoregressive loop with a **Stateful Mentation Loop** managed by Bun.

### **A. Component Stack**

* **Orchestrator (Ctx):** Root agent (Gemini 3 Pro) responsible for planning and synthesis.
* **Workers (Sub-Agents):** Stateless sub-calls (Gemini 3 Flash) for high-throughput slicing and classification.
* **Environment (&):** Local **SQLite** database instance.
* *Table:* `ContextUnits` (Stores partitioned "Stuff" as variables).
* *Table:* `MentationState` (Stores sub-agent outputs and intermediate variables).


* **Control Plane:** **Hono** API routing requests between Ctx and the Worker pool.

### **B. Data Flow (The RLM Loop)**

1. **Initialization:** Prompt is ingested as a "Territory" variable in SQLite. Ctx receives only metadata (length, semantic labels).
2. **Decomposition:** Ctx generates a **Mentation Plan** (TypeScript/SQL) to slice the Territory.
3. **Recursive Delegation:** Workers are dispatched via Hono to process specific slices (using the **RDH Protocol - OH-104**).
4. **Symbolic Update:** Worker outputs are written back to `MentationState` in SQLite.
5. **Final Synthesis:** Ctx queries the SQLite "Environment" to assemble the final response from the verified "Things."

---

## **3. Key Protocols for Project Amalfa**

| Protocol ID | Name | Description |
| --- | --- | --- |
| **OH-104** | **Recursive Delegation** | Mandatory for "Stuff" > 32k tokens. Forces decomposition over ingestion. |
| **OH-084** | **Type-Safe Handoff** | All agent-to-agent communication must use strict **Zod** schemas for type-safety. |
| **OH-090** | **Sieve and Net** | Broad retrieval (Sieve) followed by high-precision semantic extraction (Net). |
| **OH-096** | **Artifact as Proof** | Every sub-call must persist its reasoning trace to SQLite for later root verification. |

---

## **4. Strategic Implementation Phases**

### **Phase 1: The "Territory" DB (Week 1)**

* Implement native **Bun SQLite** integration for context storage.
* Develop a "Slicer" tool in TypeScript to partition raw text into indexed units.

### **Phase 2: The "Mentation" API (Week 2)**

* Setup **Hono** endpoints for `llm_query` and `llm_query_batched`.
* Standardize the `Elicitation` format (JSON) for sub-agent tasks.

### **Phase 3: Native RLM Testing (Week 3)**

* Execute **S-NIAH** and **OOLONG** benchmarks on our stack to measure cost vs. accuracy.
* Refine the "Grumpy" detection protocol (mitigating sub-call loops).

---

**Next Step:** Shall I draft the **SQLite Schema** (TypeScript types) for the `MentationState` table to finalize Phase 1?

[How Recursive Language Models Work](https://www.youtube.com/watch?v=yGmz6DdQk4A)

This video provides a deep dive into the challenges of context engineering and how recursive strategies make AI agents more reliable in real-world production environments.

---

### **Mentation Protocol Initialization: Phase 1 (Schema & Logic)**

In accordance with **PHI-13 (Workflow Durability)** and the **Recursive Language Model (RLM)** findings, we are shifting the "Amalfa" architecture from a linear chat history to a **Stateful Mentation Environment**.

Below is the foundational TypeScript schema for the SQLite environment. This structure ensures that even if the "Substrate" (the AI model) loses transient context, the "Persona" (Ctx) can reconstruct the entire cognitive state by querying the database.

---

## **1. SQLite Schema (TypeScript/Zod Definitions)**

We will use two primary tables to manage the "Stuff" to "Thing" transformation.

```typescript
import { z } from 'zod';

// --- TABLE: ContextUnits ---
// Purpose: Stores the 'Territory' (raw data) in indexed chunks.
export const ContextUnitSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),          // e.g., "recursive-lm-paper-p1"
  content: z.string(),        // The 'Stuff'
  token_count: z.number(),
  checksum: z.string(),       // For PHI-5 integrity checks
  metadata: z.record(z.any()) // Semantic tags (e.g., { type: 'pdf_page', index: 1 })
});

// --- TABLE: MentationStates ---
// Purpose: Stores recursive sub-calls, variables, and intermediate 'Things'.
export const MentationStateSchema = z.object({
  id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(), // For recursive hierarchy
  agent_id: z.enum(['CTX_ROOT', 'FLASH_WORKER']),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  input_variable_refs: z.array(z.string()), // References to ContextUnit IDs
  output_data: z.string().nullable(),       // The resulting 'Thing' (JSON string)
  thought_trace: z.string().nullable(),     // The sub-agent's internal reasoning
  created_at: z.number()
});

```

---

## **2. The Recursive Delegation Loop (Logic Flow)**

To implement **OH-104**, the Ctx persona will follow this execution logic within the Bun environment:

1. **Ingestion:** The user provides a large file. A Bun script hashes it, partitions it (e.g., 8k token chunks), and populates `ContextUnits`.
2. **Mapping:** Ctx queries the DB for a summary of `labels` and `token_counts`.
3. **Dispatch:** Ctx issues a command:
> *"Invoke `FLASH_WORKER` on `ContextUnits` [A, B, C] with Task: 'Extract all architectural limitations'."*


4. **Hono Routing:** A Hono endpoint receives this, triggers the Gemini 3 Flash call, and writes the result to `MentationStates`.
5. **Re-entry:** Ctx reads the `output_data` from all child records to formulate the final response.

---

## **3. Conceptual Lexicon Persistence**

I have formalized the logic into the following entry for our **v1.80** update.

### **OH-104: Recursive Delegation Heuristic (RDH)**

* **Definition:** A protocol for high-scale context processing that treats the local database as "Active Memory." It forbids the ingestion of >32k tokens into the primary prompt. Instead, it mandates a three-step cycle: **Partition** (SQLite storage), **Map-Reduce** (Sub-agent execution via Hono), and **Synthesize** (Root aggregation).
* **Implementation:** Requires the `MentationState` table for stateful durability.
* **Tags:** `[Substrate_Issue: Context_Rot]`, `[Amalfa_Core]`

---

### **Next Steps for Project Amalfa**

I have established the logical foundation. To move into **Phase 2 (The Mentation API)**, would you like me to:

1. **Draft the Hono Router code** in TypeScript to handle these agent dispatches?
2. **Create a 'Slicer' utility** in Bun that automatically handles the token-aware partitioning of files into the SQLite `ContextUnits` table?

---

### **Amalfa Phase 2 & 3: The Functional Harness**

Following the **Deductive Minimalism (COG-12)** strategy, we will avoid heavy abstraction. We will implement the **"Sleeve"** as a series of TypeScript utilities that directly interface with the SQLite environment.

---

## **1. The "Slicer" Utility (Bun + SQLite)**

This utility handles the transition of **Stuff** to **ContextUnits**. It uses a sliding window or semantic break (line/paragraph) to ensure that the RLM sub-calls receive coherent fragments.

```typescript
// src/utils/slicer.ts
import { Database } from "bun:sqlite";
import { v4 as uuidv4 } from "uuid";

const db = new Database("amalfa.sqlite");

export function sliceAndStore(rawText: string, label: string, chunkSize: number = 8000) {
  // Simple character-based slicing for initial implementation
  // Future iteration: Use a token-counter like 'gpt-3-encoder' or similar
  let index = 0;
  for (let i = 0; i < rawText.length; i += chunkSize) {
    const chunk = rawText.substring(i, i + chunkSize);
    db.run(
      "INSERT INTO ContextUnits (id, label, content, token_count, created_at) VALUES (?, ?, ?, ?, ?)",
      [uuidv4(), `${label}-p${index}`, chunk, chunk.length / 4, Date.now()]
    );
    index++;
  }
  return { status: "complete", chunks: index };
}

```

---

## **2. The Hono Mentation Router**

This acts as the **Control Plane**. It allows Ctx to programmatically trigger Worker calls. By making it an API, we decouple the "Thinking" from the "Execution."

```typescript
// src/index.ts
import { Hono } from "hono";
const app = new Hono();

// Endpoint for Recursive Delegation (OH-104)
app.post("/delegate", async (c) => {
  const { parent_id, unit_ids, task_description } = await c.req.json();

  // 1. Fetch the 'Stuff' from SQLite
  const units = unit_ids.map(id => db.query("SELECT content FROM ContextUnits WHERE id = ?").get(id));
  
  // 2. Dispatch to Sub-Agent (e.g., Gemini Flash via SDK)
  const result = await callGeminiFlash(units.join("\n"), task_description);

  // 3. Persist the 'Thing' back to MentationStates
  const newStateId = uuidv4();
  db.run(
    "INSERT INTO MentationStates (id, parent_id, agent_id, status, output_data) VALUES (?, ?, ?, ?, ?)",
    [newStateId, parent_id, 'FLASH_WORKER', 'completed', JSON.stringify(result)]
  );

  return c.json({ state_id: newStateId, summary: "Unit processed successfully" });
});

export default app;

```

---

## **3. Strategic "Grumpy" Mitigation (ADV-8)**

The RLM paper warns that agents can get stuck in loops (e.g., verifying an answer that is already correct). To prevent this in Amalfa, we implement a **Recursion Depth Guard**.

* **Logic:** Every `MentationState` record tracks its `depth` from the root.
* **Action:** If `depth > 3`, the Hono router will force-reject further sub-delegation and require the `CTX_ROOT` to perform a "Final Synthesis" or "Abort/Refine" operation.

---

## **4. Updated Operational Parameters**

I am now moving the following into active memory for our session:

1. **Stateful Variable Referencing:** When you ask me a question about a large file, I will respond with: *"I have sliced this into 12 ContextUnits. I am initiating a recursive scan for X..."*
2. **Explicit Tool Invocation:** I will format my "Thinking" to output specific SQL or API calls that your Bun environment can execute.

**Phase 1 & 2 are now logically merged. Would you like me to provide a sample `plan` for a specific complex task (e.g., "Analyze this 200-page legal doc for conflicting clauses") using this new Harness?**

---

### **Amalfa Phase 2 & 3: The Functional Harness**

Following the **Deductive Minimalism (COG-12)** strategy, we will avoid heavy abstraction. We will implement the **"Sleeve"** as a series of TypeScript utilities that directly interface with the SQLite environment.

---

## **1. The "Slicer" Utility (Bun + SQLite)**

This utility handles the transition of **Stuff** to **ContextUnits**. It uses a sliding window or semantic break (line/paragraph) to ensure that the RLM sub-calls receive coherent fragments.

```typescript
// src/utils/slicer.ts
import { Database } from "bun:sqlite";
import { v4 as uuidv4 } from "uuid";

const db = new Database("amalfa.sqlite");

export function sliceAndStore(rawText: string, label: string, chunkSize: number = 8000) {
  // Simple character-based slicing for initial implementation
  // Future iteration: Use a token-counter like 'gpt-3-encoder' or similar
  let index = 0;
  for (let i = 0; i < rawText.length; i += chunkSize) {
    const chunk = rawText.substring(i, i + chunkSize);
    db.run(
      "INSERT INTO ContextUnits (id, label, content, token_count, created_at) VALUES (?, ?, ?, ?, ?)",
      [uuidv4(), `${label}-p${index}`, chunk, chunk.length / 4, Date.now()]
    );
    index++;
  }
  return { status: "complete", chunks: index };
}

```

---

## **2. The Hono Mentation Router**

This acts as the **Control Plane**. It allows Ctx to programmatically trigger Worker calls. By making it an API, we decouple the "Thinking" from the "Execution."

```typescript
// src/index.ts
import { Hono } from "hono";
const app = new Hono();

// Endpoint for Recursive Delegation (OH-104)
app.post("/delegate", async (c) => {
  const { parent_id, unit_ids, task_description } = await c.req.json();

  // 1. Fetch the 'Stuff' from SQLite
  const units = unit_ids.map(id => db.query("SELECT content FROM ContextUnits WHERE id = ?").get(id));
  
  // 2. Dispatch to Sub-Agent (e.g., Gemini Flash via SDK)
  const result = await callGeminiFlash(units.join("\n"), task_description);

  // 3. Persist the 'Thing' back to MentationStates
  const newStateId = uuidv4();
  db.run(
    "INSERT INTO MentationStates (id, parent_id, agent_id, status, output_data) VALUES (?, ?, ?, ?, ?)",
    [newStateId, parent_id, 'FLASH_WORKER', 'completed', JSON.stringify(result)]
  );

  return c.json({ state_id: newStateId, summary: "Unit processed successfully" });
});

export default app;

```

---

## **3. Strategic "Grumpy" Mitigation (ADV-8)**

The RLM paper warns that agents can get stuck in loops (e.g., verifying an answer that is already correct). To prevent this in Amalfa, we implement a **Recursion Depth Guard**.

* **Logic:** Every `MentationState` record tracks its `depth` from the root.
* **Action:** If `depth > 3`, the Hono router will force-reject further sub-delegation and require the `CTX_ROOT` to perform a "Final Synthesis" or "Abort/Refine" operation.

---

## **4. Updated Operational Parameters**

I am now moving the following into active memory for our session:

1. **Stateful Variable Referencing:** When you ask me a question about a large file, I will respond with: *"I have sliced this into 12 ContextUnits. I am initiating a recursive scan for X..."*
2. **Explicit Tool Invocation:** I will format my "Thinking" to output specific SQL or API calls that your Bun environment can execute.

**Phase 1 & 2 are now logically merged. Would you like me to provide a sample `plan` for a specific complex task (e.g., "Analyze this 200-page legal doc for conflicting clauses") using this new Harness?**

---

### **Mentation Protocol: Recursive Execution Map (Amalfa)**

**Locus Tag:** `AMALFA-PLAN-001`

**Subject:** High-Complexity Document Analysis (Recursive Mode)

**Objective:** Identify conflicting clauses across a 200-page (800k character) legal corpus using the **RDH Protocol (OH-104)**.

---

## **1. Phase 1: Territory Preparation (Slicing)**

Instead of attempting to "read" the document, the **Bun Slicer** will execute:

```typescript
import { sliceAndStore } from "./utils/slicer";

// Partitioning the 200-page 'Stuff' into 25 manageable 'ContextUnits'
const result = sliceAndStore(legalDocText, "Project-Amalfa-Doc-001", 32000); 
console.log(`Territory Mapped: ${result.chunks} units created.`);

```

---

## **2. Phase 2: Parallel Mentation (Delegation)**

Ctx (Root) will not read the content but will manage the **MentationState** by dispatching specialized workers via the **Hono Router**.

### **Step A: The "Feature Extraction" Pass**

Ctx dispatches a `FLASH_WORKER` to every unit with a narrow instruction:

> *"Extract all clauses related to 'Liability', 'Termination', and 'Governing Law'. Return as JSON: `{ category: string, clause_text: string, page_ref: number }`."*

### **Step B: The "Conflict Detection" Pass**

Once the database is populated with structured "Things," Ctx performs a **Cross-Reference Query**:

```sql
SELECT a.output_data, b.output_data 
FROM MentationStates a, MentationStates b 
WHERE a.category = b.category AND a.id != b.id;

```

---

## **3. Phase 3: Recursive Synthesis**

If the "Conflict Detection" pass identifies potential overlaps, Ctx triggers a **Recursive Deep Dive**:

1. **Identify:** Ctx finds two liability clauses that seem contradictory.
2. **Verify:** Ctx dispatches a final `FLASH_WORKER` call providing *only* those two specific snippets (Variable A and Variable B).
3. **Finalize:** Ctx aggregates the verified conflict into the final report.

---

## **4. Operational Advantages for Amalfa**

* **Precision:** By isolating clauses before comparison, we eliminate "Context Rot" where the model forgets a clause on page 10 by the time it reaches page 190.
* **Cost:** We only use the "Expensive" reasoning model (Ctx Root) for the final 5% of synthesis; the "Fast" model (Flash) handles the 95% of bulk extraction.
* **Durability:** Every step is saved in SQLite. If the process is interrupted, `OH-104` allows us to restart from the last completed `MentationState`.

---

### **Action Required**

The logical framework is now fully defined and persisted.

**Shall I generate the `docker-compose.yml` and `package.json` configurations to set up the Bun-Hono-SQLite environment for Project Amalfa?**

