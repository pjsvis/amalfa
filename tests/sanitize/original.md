# Agent-Generated Knowledge: Beyond Spec-Driven Development

**Status:** Vision Document  
**Date:** 2026-01-06  
**Context:** Insights from Amalfa project experience

---

## Executive Summary

Traditional software development separates execution (agents/developers) from documentation (humans). This project discovered a more effective pattern: **Agent-Generated Institutional Knowledge**. When agents are constrained to a specific **Brief → Work → Debrief → Playbook** workflow, they spontaneously maintain documentation and update standards to reduce their own future friction.

Amalfa operationalizes this by treating documentation not as static text, but as a living **Semantic Knowledge Graph** where agents are both the primary authors and consumers.

---

## The Discovery: Emergent Documentation

In traditional workflows, documentation is a chore that lags behind reality. Humans write specs, agents/devs execute, and knowledge remains tacit or outdated.

**The Experiment** introduced a simple stricture:
1.  **Brief:** Every task starts with a clear goal.
2.  **Debrief:** Every task ends with a mandatory reflection on what worked/failed.
3.  **Playbooks:** Recurring patterns must be codified.

**Unexpected Outcome:** Agents began updating Playbooks *unprompted*. Why?
1.  **Immediate Context:** Debriefs are written while memory is fresh.
2.  **Self-Interest:** Updating a Playbook makes the *next* task easier for the agent.
3.  **Closed Loop:** The documentation directly informs the next execution, creating a positive feedback loop.

This shifts the human role from **Author** (writing everything) to **Curator** (reviewing agent-generated insights).

---

## The Flywheel: Brief, Debrief, Playbook

This pattern relies on three distinct artifacts flowing in a cycle:

### 1. Brief (Tactical)
*Input* for a single session.
*   **Purpose:** Define the immediate objective.
*   **Content:** Objective, Requirements, Context.
*   **Example:** "Implement Semantic Search in Explorer UI."

### 2. Debrief (Reflective)
*Output* from a single session.
*   **Purpose:** Capture ephemeral learnings and decision logic.
*   **Content:** What Worked, What Failed, Lessons Learned.
*   **Example:** "Debouncing is critical; direct DOM manipulation failed in Safari."

### 3. Playbook (Strategic)
*Accumulated Wisdom* across all sessions.
*   **Purpose:** Codify standards and patterns for future agents.
*   **Content:** Principles, Patterns, Anti-patterns.
*   **Example:** "Pattern: Always debounce search inputs by 300ms. Anti-pattern: Sync network calls."

### The Cycle
1.  **Brief** references existing **Playbooks**.
2.  **Agent** executes work.
3.  **Debrief** captures new edge cases/learnings.
4.  **Agent** promotes generic learnings into **Playbooks**.
5.  **Next Brief** starts with smarter Playbooks.

---

## Implications for Amalfa: The Semantic Graph

While the initial pattern worked with flat Markdown files, Amalfa scales this using a **Vector-Embedded Knowledge Graph**.

### 1. From Keyword to Semantic Discovery
*   **Traditional (Old):** Agent greps for "CSS". Misses "styling" or "layout".
*   **Amalfa (New):** Agent queries "Why is Safari broken?". Graph returns:
    *   `debrief-layout-debug` (similar problem)
    *   `playbook-browser-compat` (relevant standard)
    *   `brief-animation-fix` (related context)

### 2. Auto-Linking & Traversal
Documentation is no longer a pile of files. It is a graph:
```
[Brief A] ──result──► [Debrief A] ──update──► [Playbook Core]
                                                   ▲
                                                   │
[Brief B] ──informed_by────────────────────────────┘
```
Agents can traverse edges to understand *why* a standard exists (trace Playbook rule back to the Debrief that spawned it).

### 3. Human as Curator
The human role evolves to high-level direction:
*   **Reviewing Trends:** "Show me all 'What Failed' sections from last week."
*   **Resolving Conflicts:** "Agent A prefers Grid, Agent B prefers Flexbox. Decision: Flexbox."
*   **Setting Goals:** Writing the initial Briefs that start the chain.

---

## Evolution Levels

1.  **Manual:** Human writes specs & code. (Slow, bottlenecked)
2.  **Agent Execution:** Agent writes code, Human documents. (Code scales, docs lag)
3.  **Agent Reflection (The Pattern):** Agent writes code & docs. Human curates. (Scalable)
4.  **Semantic Infrastructure (Amalfa):** Knowledge is a graph. Agents actively query and link concepts. (Compounding Intelligence)
5.  **Emergent:** Agents self-organize knowledge and propose their own Briefs based on Playbook gaps. (Autonomous)

## Conclusion

Documentation is not an administrative task; it is the **Cognitive Long-Term Memory** of the agentic system. By structuring the workflow to incentivize reflection, we turn documentation from a burden into an asset that compounds in value automatically.
