---
date: 2025-11-25
tags: [anti-pattern, mcp, architecture, memory, saas-risk]
title: Critique of SaaS-based MCP Memory (ref.tools/exa.ai)
source_session: 2025-11-25-CTX-SESSION
---

### Context
Assessment of the "Context Rot" solution proposed in the Ray Fernando video, which uses `ref.tools` and `exa.ai` via MCP. Rejected for Ctx architecture due to violation of local-first principles.

### Content
**Verdict:** The approach is "Just-in-Time Documentation Fetcher," not true Persona Memory.

**Critical Flaws:**
1.  **Categorical Error:** Conflates *Context* (shared history/decisions) with *Documentation* (static external facts like syntax).
2.  **Violation of PHI-13 (Durability):** Relies on live connections to proprietary SaaS endpoints (`ref.tools`). If the startup fails, the agent's "memory" breaks.
3.  **Walled Garden:** Trades the *explicitness* of seeing raw data for the *convenience* of an opaque summarizer, creating a dependency on third-party interpretation.

**Architectural Decision:**
Reject `ref.tools`/`exa.ai` for core persona memory. Adopt the *Mental Model* of "Memory Blocks" (curated snippets) but implement via local Markdown files rather than external APIs.