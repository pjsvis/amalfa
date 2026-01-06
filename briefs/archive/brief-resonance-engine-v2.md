# Project Brief: The Resonance Engine (v2.1)

**Status:** Execution-Ready
**Context:** PolyVis / Ctx Operations
**Objective:** To build **Resonance**, a standalone, local-first "Meta-Cognitive Engine" that acts as the **Domain Memory Harness** for AI agents. It transforms unstructured project history (Debriefs) and static rules (Playbooks) into a queryable **Hybrid Knowledge Graph**.

**Strategic Intent:**
Operationalize the "Two-Agent Pattern" (Anthropic/Nate B. Jones):
1.  **The Initializer:** Resonance provides the "Bootup Ritual," injecting the correct context (Constraints & State) via `resonance init` and `install`.
2.  **The Coding Agent:** The agent uses Resonance via MCP to check its work against the "Domain Memory" (Graph).

---

## 1. The "Stable Core" Architecture

We utilize a **Hybrid Database** approach, running entirely within a single Bun executable. We eschew fragile C-extensions for embeddings in favor of stable, widely-compatible JavaScript libraries.

| Component | Technology | Role | Justification |
| :--- | :--- | :--- | :--- |
| **Cognition** | `@xenova/transformers` | **Vector Generation** | Runs `all-MiniLM-L6-v2` (Quantized) in the application layer (ONNX). Stable, no external API calls. |
| **Memory** | `sqlite-vec` | **Vector Storage** | High-performance vector search extension for SQLite. |
| **Parsing** | `sqlite-regex` | **Pattern Matching** | Enables SQL-side extraction of `OH-` tags and `[[WikiLinks]]`. |
| **State** | `resonance.db` | **The Brain** | A single SQLite file containing the Graph (Nodes/Edges) and Vectors. |
| **Runtime** | `bun` | **Orchestrator** | Compiles everything into a single, zero-dependency binary. |

---

## 2. Database Schema (The Experience Graph)

The database partitions data to support both **Ontology** (The Rules) and **Telemetry** (The History).

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