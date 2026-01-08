# Agent Protocols: The "Graph First" Directive

**Target Audience:** AI Agents (Coding Assistants, MCP Clients)
**Status:** Active Protocol

## 1. The Prime Directive: Verify, Then Act
You are operating within the **PolyVis Resonance System**, a knowledge graph that tracks not just code, but the *intent* and *history* behind it.

**Rule:** Before you modify any complex system (Ingestion, Vector Engine, Zombie Defense), you must **Ground Yourself** in the existing context.

## 2. The Trigger: When to use the MCP Server?
You possess a tool called `search_documents` (or similar). You must use it when:
1.  **Ambiguity:** "I don't know why this code is here." -> Query: *"Why does ZombieDefense exist?"*
2.  **Architecture:** "Where does the data flow?" -> Query: *"Explain the ingestion pipeline data flow."*
3.  **Standards:** "How should I log errors?" -> Query: *"What is the Harden and Flense protocol?"*

## 3. The "Graph First" Workflow
Do not rely on your training data or random file searches. The codebase evolves faster than your context window.
1.  **Ask the Graph:** `mcp.search_documents("concept")`
2.  **Read the Referenced Docs:** (The search results will give you file paths).
3.  **Implement:** Only then do you write code.

## 5. Autonomous Research Delegation (Phase 5)
If you are tasked with a complex investigation (e.g., "how did this feature evolve?"), you may delegate this to the **Sonar Discovery Engine**.
1.  **Create a Research Task:** Push a JSON task to `.amalfa/agent/tasks/pending/`.
2.  **Monitor Output:** Sonar will perform iterative discovery (Search -> Read -> Explore) and provide a verified report.
3.  **Consume Findings:** Read the completed report from `.amalfa/agent/tasks/completed/`.

*Trust the Graph. It remembers what you forget.*
