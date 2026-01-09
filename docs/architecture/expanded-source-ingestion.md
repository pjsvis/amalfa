---
title: "Architectural Significance: Expanded Source Ingestion"
date: 2026-01-09
type: discussion
tags: [architecture, ingestion, hollow-nodes, code-graph]
---

# Architectural Significance: Expanded Source Ingestion

This document explains the strategic importance of two recent configuration changes that fundamentally expand Amalfa's cognitive reach.

---

## 1. The Change: Expanded Source Patterns

### Before (Original)
```typescript
sources: ["./docs"]
```
The agent only knew about formal documentation.

### After (Current - `src/config/defaults.ts`)
```typescript
sources: [
    "./docs",
    "./*.md",           // Root documentation (README.md, _CURRENT_TASK.md)
    "./src/**/*.md",    // Documentation co-located with code
    "./scripts/**/*.md" // Documentation in scripts
]
```

Additionally, the `amalfa.config.json` in this project includes:
```json
"sources": [".", "src", "scripts"]
```
This ingests **all markdown** from the entire project tree, including code directories.

---

## 2. Why This Matters: The Context Problem

### The Old World: "Isolated Documentation"
When the agent only ingested `docs/`, it operated in a **sterile information bubble**:
- It knew what the *guides* said about the system.
- It had **no visibility** into:
  - The actual codebase structure
  - README files in each module (`src/core/README.md`)
  - Task files (`_CURRENT_TASK.md`)
  - Inline documentation within scripts

**Result:** When asked "How is VectorEngine used?", the agent could only guess based on abstract docs, not actual implementation context.

### The New World: "Ambient Knowledge"
By expanding sources to include root markdown and embedded READMEs:
- **Root files** like `_CURRENT_TASK.md` and `README.md` become searchable. The agent knows the *current state* of the project.
- **Module READMEs** (e.g., `src/resonance/README.md`) provide implementation context *alongside* the formal docs.
- **Script documentation** becomes discoverable, so the agent can recommend appropriate maintenance scripts.

**Result:** The agent's situational awareness increases dramatically. It now has **ambient context** without requiring explicit prompting.

---

## 3. The Code Ingestion Pivot: From Docs to Structure

### The Vision (RFC-001: Polyglot Code Ingestion)
The natural evolution is to ingest `.ts` and `.py` files themselves, not just their documentation. This is documented in `docs/adr/rfc-001-polyglot-code-ingestion.md`.

### The "Hollow Node" Principle
We do NOT dump 50,000 lines of code into the database. Instead:
1. **Metadata Only:** Store file path, type, and detected relationships.
2. **Structural Edges:** Parse `import` statements to create `DEPENDS_ON` edges.
3. **Selective Embedding:** Only embed JSDoc/Docstrings into the vector space.

```
┌─────────────────────────────────────────────────────────────┐
│  Current State: Docs Only                                    │
│                                                              │
│  [Doc: services.md] ──SEE_ALSO──> [Doc: user-guide.md]      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Future State: Code + Docs                                   │
│                                                              │
│  [Doc: services.md]                                          │
│        │                                                     │
│        └──DOCUMENTS──> [Code: src/cli.ts]                    │
│                               │                              │
│                               ├──DEPENDS_ON──> [sonar-agent] │
│                               ├──DEPENDS_ON──> [VectorEngine]│
│                               └──DEPENDS_ON──> [ResonanceDB] │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### The Significance
With code nodes in the graph:
- **"What uses VectorEngine?"** becomes answerable via graph traversal.
- **"Show me the authentication flow"** can trace from a concept doc to implementation files.
- **Documentation gaps** become detectable: "Code file X has no corresponding doc node."

---

## 4. The Bicameral Advantage

This expansion directly enables the "Bicameral Graph" architecture:

| Hemisphere | Role | Data Source |
| :--- | :--- | :--- |
| **Right (Semantic)** | "The Vibe" - Understands intent, concepts | Vector embeddings of docs + docstrings |
| **Left (Structural)** | "The Facts" - Precise relationships | Graph edges from imports, explicit tags |

By ingesting code along with documentation, we create a **complete cognitive model**:
- The Right Brain knows "authentication is related to tokens."
- The Left Brain knows "src/auth/validateToken.ts imports src/db/userStore.ts."

The **Orchestrator** (the query handler) cross-references both to answer: "The token validation logic is in validateToken.ts, which depends on userStore for credential lookups."

---

## 5. Practical Impact

### Before Expansion
```
User: "How do I configure the vector daemon?"
Agent: *Searches docs/*, finds partial match*
       "The user guide mentions running `bun run daemon`..."
       (WRONG - outdated command)
```

### After Expansion
```
User: "How do I configure the vector daemon?"
Agent: *Searches root .md, finds _CURRENT_TASK.md and src/config/defaults.ts reference*
       "Use `amalfa vector start`. Configuration is in amalfa.config.json under 'sonar.port'."
       (CORRECT - from actual current context)
```

---

## 6. Conclusion

The expansion from `["./docs"]` to `[".", "src", "scripts"]` represents a shift from **"Reading the Manual"** to **"Understanding the System."**

The code ingestion pivot (RFC-001) will complete this evolution, creating a true **Cognitive Overlay** where documentation and implementation exist as interconnected nodes in a single traversable graph.

This is the foundation for answering not just "What does the doc say?" but "How does the code actually work?"
