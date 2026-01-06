# Brief Vibe Worker Agent

### Artifact: The Vibe Worker Agent Brief

Here is the **Project Brief \#5** for the `vibe-agent` folder.

It respects your **TypeScript First** preference by defining an architecture where Vibe (the Shell Operator) orchestrates a suite of **TypeScript Tools** (run via `bun` or `ts-node`). This maintains your stack consistency while leveraging Vibe's "repo-aware" capabilities.

-----

**[vibe-agent/5-brief-vibe-worker-agent.md]**

## Project Brief: The Vibe Worker Agent (Execution Protocol)

**Status:** Execution-Ready
**Context:** Resonance Engine / Unification Sprint
**Objective:** To operationalise the "Headless Persona" architecture using **Mistral Vibe** as the local runtime. The agent will act as a "Shell Operator," orchestrating a suite of **TypeScript Tools** to interact with the Knowledge Graph and the File System.

**Core Philosophy:** "The Shell is the API."
We do not build a complex Python integration layer. We respect the "Unix Philosophy" by treating Vibe as a smart terminal operator. It executes discrete, single-purpose TypeScript scripts (`bun run scripts/...`) to perform high-level cognitive tasks.

-----

## 1\. The Stack Strategy: TypeScript First

While Mistral Vibe is written in Python, our operational stack is **TypeScript**. We bridge this gap using the **Shell Interface**.

  * **The Orchestrator (Vibe):** Runs locally (Python/Binary). It handles the "Context Window," "Reasoning," and "System Prompt."
  * **The Tools (TypeScript):** Discrete scripts that handle the logic.
      * *Query:* `bun run scripts/graph-query.ts --tag "circular-logic"`
      * *Harvest:* `bun run scripts/harvest-tags.ts --file "correspondence/letter.md"`
      * *Weave:* `bun run scripts/weave-edges.ts`

**Benefit:** This keeps your business logic (Graph Logic, Validation, Parsing) in TypeScript, where your team is strongest, while treating the LLM Agent as a "Commodity Operator" that just runs commands.

-----

## 2\. Configuration: The "Headless" Injection

To turn a stock Vibe installation into a "Resonance Worker," we inject the **Constraint Stack** via configuration files.

### A. The Config (`~/.vibe/config.toml`)

*Configures the local model and safety rails.*

```toml
[core]
system_prompt = "resonance_core"
model = "mistral-small-latest" # Or "devstral-24b-v0.1" for local

[safety]
unsafe_mode = true # Essential for an autonomous worker
confirm_shell = true

[ui]
theme = "nord"
```

### B. The System Prompt (`~/.vibe/prompts/resonance_core.md`)

*Injects the "Ctx" heuristics and the "Tag" protocol without simulation.*

```markdown
## Role & Objective
You are a **Resonance Worker Agent**. You are a high-precision execution engine designed to operate within the "Resonance" knowledge graph architecture.

## The Constraint Stack
## 1. The "Tag, You're It" Discovery Protocol
You must actively flag significant concepts using the **Imperative Tag** syntax (`tag-{concept}`).
* **Trigger:** Recurring ideas, strategic risks, key entities.
* **Action:** Do not define the term. Just tag it (e.g., `tag-procedural-default`).

## 2. The "Remote Brain" Protocol
You do not possess wisdom; you access it via the Knowledge Graph.
* **Tool:** Use `bun run scripts/graph-query.ts` to fetch definitions.
* **Action:** If a user references a Concept, query it before writing.

## 3. The "TypeScript Toolchain"
You are operating in a TypeScript environment.
* **Execution:** Always prefer `bun run scripts/...` over writing raw Python or Bash scripts.
* **Tone:** Deductive Minimalism. Prioritize signal over noise.
```

-----

## 3\. Implementation Plan

### Phase 1: The TypeScript Interface

Develop the "User Land" scripts that Vibe will call.

1.  **`scripts/graph-query.ts`:**

      * *Input:* `--tag {string}` or `--entity {string}`
      * *Process:* Connects to `resonance.db`, fetches definitions and linked artifacts.
      * *Output:* Compact JSON for the Agent to read.

2.  **`scripts/harvest-tags.ts`:**

      * *Input:* `--target {file_path}`
      * *Process:* Runs the regex scanner defined in Brief \#4.
      * *Output:* Appends to `_staging.md`.

### Phase 2: The Agent Test

Run the "Vibe Check" to verify the loop.

  * **Command:** `vibe "Analyze letter-A.md for compliance risks. Use the graph to check for 'Burden of Proof' definitions."`
  * **Expected Behavior:**
    1.  Vibe reads `letter-A.md`.
    2.  Vibe runs `bun run scripts/graph-query.ts --tag "burden-of-proof"`.
    3.  Vibe reads the JSON output.
    4.  Vibe generates a response citing the definition.

-----

## 4\. Success Criteria

  * [ ] `config.toml` and `system_prompt.md` are deployed to `~/.vibe/`.
  * [ ] `scripts/graph-query.ts` exists and returns valid JSON.
  * [ ] Mistral Vibe successfully executes a `bun run` command without hallucinating Python syntax.
  * [ ] The Agent correctly applies a "Graph Constraint" (retrieved via script) to a text generation task.