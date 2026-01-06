---
id: stakpak-analysis-v1
type: decision
tags: [memory, architecture, local-first, stakpak, decision]
status: active
summary: "Adoption of StakPak's 'Memory Block' mental model (curated snippets) while rejecting their SaaS implementation in favor of local Markdown."
---

### Context
Evaluated the "Memory Blocks" feature from StakPak documentation. The feature uses an agent to extract reusable knowledge (commands, configs) into discrete blocks. This was compared against standard Vector/RAG approaches.

### Content
**Decision: Adopt Mental Model, Reject Substrate.**

1.  **The Concept (Adopt):** We validate the "Memory Block" concept—transforming unstructured chat "stuff" into structured, titled, and tagged "things" (Crystallized Intelligence). This is superior to probabilistic search for technical facts.
2.  **The Trigger (Adopt):** We adopt the explicit user command `/memorize` (OH-104) to lower the input activation threshold and ensure human-validated curation.
3.  **The Implementation (Modify):** We reject the StakPak SaaS dependency. Instead, we implement "Memory Blocks" as atomic local Markdown files in a `/context` folder (Factored Design).
    * *Reasoning:* Ensures compliance with **PHI-13 (Workflow Durability)**. We own the data; it survives the tool.