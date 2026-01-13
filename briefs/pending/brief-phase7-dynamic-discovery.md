Here is the formal brief for the implementation of **Dynamic Context Discovery**, structured according to your project's standards.

This aligns with `OH-12` (Deductive Minimalism) by removing data from the context window until it is strictly necessary.

---

# Brief: Dynamic Context Discovery Implementation

**Date:** 2026-01-13
**Status:** Proposed
**Related Concepts:** `OH-12` (Deductive Minimalism), `PHI-13` (Workflow Durability)
**Target:** `src/mcp`, `src/daemon`

## 1. Context & Motivation

Current Large Language Model (LLM) architectures, including the ones powering AMALFA, suffer from "Context Window Anxiety." Stuffing the context window with massive tool outputs, entire file contents, and extensive tool definitions leads to:

1. **Token Inflation:** Higher costs and slower inference.
2. **Recall Degradation:** The "Lost in the Middle" phenomenon where models ignore instructions buried in massive prompts.
3. **Opaque Failure:** When an agent crashes, its "thought process" (the chain of thought) is lost in RAM, making diagnosis impossible.

The "Dynamic Context Discovery" pattern (as detailed by Cursor's engineering blog) inverts this model. Instead of pushing data *into* the prompt, we write data to the *filesystem* and give the agent a "pointer" (filename). The agent then "pulls" only what it needs.

This applies the AMALFA "Hollow Node" philosophy (Metadata > Content) to the Agent's runtime environment.

## 2. Strategic Objectives

* **Eliminate Context Overflows:** Never return >2KB of JSON directly to the LLM.
* **Persist "Thought":** Convert ephemeral memory (RAM arrays) into durable artifacts (Markdown files).
* **Lazy-Load Capabilities:** Remove hardcoded tool definitions from the System Prompt; let the agent "grep" for tools.
* **Self-Diagnosis:** Allow the agent to read its own error logs.

## 3. Implementation Phases

### Phase 1: The "Scratchpad" Protocol (Heavy Output)

**Goal:** Prevent search results and file reads from blowing out the context window.
**Priority:** Critical (Stability)

* **Mechanism:** Intercept tool outputs in the MCP server. If the payload size exceeds a heuristic limit (e.g., 2000 chars), write it to a temp file and return the path.
* **Implementation:**
* Modify `src/mcp/index.ts`.
* Create directory: `.amalfa/cache/scratchpad/`.
* Logic:
```typescript
if (output.length > threshold) {
   const path = `.amalfa/cache/scratchpad/${queryHash}.json`;
   await Bun.write(path, output);
   return `Output too large. Written to ${path}. Read this file to see results.`;
}

```




* **Deliverable:** `src/mcp/index.ts` updated with output interception logic.

### Phase 2: The "Historian" Protocol (Session Persistence)

**Goal:** Make agent reasoning durable and auditable.
**Priority:** High (Debuggability)

* **Mechanism:** Stop storing `finding[]` objects in memory variables in `sonar-logic.ts`. Instead, append every "thought" and "result" to a session-specific Markdown file.
* **Implementation:**
* Target: `src/daemon/sonar-logic.ts`.
* Create directory: `.amalfa/sessions/`.
* Workflow:
1. Start Task -> Create `sessions/task-{id}.md`.
2. Agent Step -> `Bun.write(sessionFile, "## Step X\n" + finding, { append: true })`.
3. Context Generation -> Read last N bytes of `sessionFile` to prompt the next step.




* **Deliverable:** A refactored `handleResearchTask` loop that relies on file I/O for state.

### Phase 3: The "Modular Toolbox" (Dynamic Discovery)

**Goal:** Reduce System Prompt size and allow multi-provider flexibility.
**Priority:** High (Capability Expansion)

* **Mechanism:** Move tool schemas from TypeScript code to JSON files, and abstract model providers into discoverable "substrates".
* **Implementation:**
  * **Tools:**
    * Create directory: `.amalfa/tools/`.
    * Create files: `search.tool.json`, `read.tool.json`, `graph.tool.json`.
    * **The Meta-Tool:** Implement a single hardcoded tool: `list_capabilities`.
  * **Substrates (Models):**
    * Refactor `sonar-inference.ts` to support dynamic provider loading.
    * Implement adapters for:
      * **Ollama Cloud** (Standard OpenAI interface)
      * **GLM** (Zhipu AI)
      * **MiniMax**
      * **ZenMux** (Gateway)
    * Allow the agent to query `list_models` to see what substrates are active based on API keys.

* **Workflow:**
  1. Agent starts with *no* specific tools/models in prompt.
  2. Agent calls `list_capabilities` -> gets list of tools and active substrates.
  3. Agent selects tool/model based on task complexity (e.g., use GLM-4 for logic, MiniMax for creative).

* **Deliverable:** 
  * Refactored MCP server for dynamic tools.
  * New `src/daemon/substrates/` directory with provider adapters.
  * Integration of new providers in `SonarAgent`.

### Phase 4: The "Mirror" Protocol (Introspection)

**Goal:** Enable self-healing and autonomous debugging.
**Priority:** Low (Enhancement)

* **Mechanism:** Grant the agent explicit read access to system logs.
* **Implementation:**
* Ensure `sonar.log` and `mcp-server.log` are in a path accessible by `read_node_content`.
* Update System Prompt: "If a tool fails, check `sonar.log` for details."


* **Deliverable:** Updated access control list in `src/mcp/index.ts`.

## 4. Technical Constraints & Standards

* **Bun Native:** Use `Bun.write` and `Bun.file` for maximum I/O performance.
* **JSON Serialization:** Ensure "Scratchpad" files are valid JSON for easy parsing by `jq` or subsequent tool usage.
* **Cleanup:** Implement a `post-flight` routine to clear `.amalfa/cache/scratchpad` older than 24 hours (prevent disk bloat).

## 5. Success Metrics

* **Zero** "Context Length Exceeded" errors during deep research tasks.
* **100%** of agent "thoughts" are recoverable from disk after a daemon crash.
* **Reduction** in average input tokens per request (due to lazy-loading tools).

---

**Proposed Next Step:** Execute **Phase 1 (Scratchpad)** immediately. It requires minimal refactoring but solves the most pressing risk.