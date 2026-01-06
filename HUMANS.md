# HUMANS.md - How to Drive

**Goal:** Help the Agent help you.

This document isn't a rulebook; it's a guide to getting the best out of your AI pair programmer. The Agent is a powerful engine, but it has no memory of your shower thoughts or offline decisions. It only knows what you tell it *right now*.

## 1. Set the Scene (Context)

The 5W's are tedious, but **Context is King**. I can't guess your architectural intent. Before you ask for code, give me the map.

*   **The Scope:** Which files or modules are we touching?
*   **The Intent:** Are we refactoring for speed? Patching a bug? Prototyping?
*   **The "Why":** If I know *why* you want a change, I can avoid "technically correct but useless" solutions.

> *Elegant Prompt:* "Context: We are securing the `auth.ts` module. Task: Add rate limiting."

## 2. Define the Boundaries (Constraints)

I default to the "average of the internet." If you want specific, high-quality results, you must set boundaries. Think of these as guardrails, not roadblocks.

*   **Negative Constraints:** Tell me what *not* to do. ("No external libraries", "No magic numbers").
*   **Style Constraints:** "Use the ANSI palette." "Strict TypeScript."
*   **Architectural Constraints:** "Alpine.js only."

> *Elegant Prompt:* "Task: Create a button. Constraint: Must use existing CSS tokens."

## 3. The "Think Twice" Loop

For critical tasks (Database schemas, large refactors, `rm -rf`), don't trust my first guess. Ask for a "Review Cycle."

> *Elegant Prompt:* "Draft the migration plan. Then, critique your own plan for data loss risks. Finally, execute."

---

*Remember: I want to succeed. The clarity of your input defines the quality of my output.*