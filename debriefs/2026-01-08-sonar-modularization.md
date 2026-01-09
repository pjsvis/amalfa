---
date: 2026-01-08
tags: [refactor, modularization, sonar, agent, architecture]
---

# Debrief: Sonar Agent Modularization & Tiered Routing

## Accomplishments

- **Successful De-Monolithization:** Refactored the `sonar-agent.ts` file, reducing it from a sprawling **1,511-line monolith** to a clean **400-line orchestrator**.
- **Modular Architecture Implementation:** Created a specialized directory structure to separate concerns:
    - `sonar-agent.ts`: Daemon control, HTTP routing, and task watching.
    - `sonar-logic.ts`: Stateful handlers for Chat, Search, and Batch jobs.
    - `sonar-strategies.ts`: Pure LLM task logic (Judge, Chronos, Synthesis).
    - `sonar-inference.ts`: Unified provider abstraction (Local Ollama vs. OpenRouter).
    - `sonar-types.ts`: Central type registry.
- **Tiered Cloud Integration:** Implemented the logic for "intelligent task routing," allowing the agent to automatically utilize **OpenRouter's free tier models** (Llama 4 Maverick, Mistral Devstral, Gemini 2.0 Flash) based on the task requirement without manual intervention.
- **Code Sanitization:** Eliminated `as any` crutches by defining explicit interfaces for all incoming JSON requests to the Sonar API and casting internal LLM results to structured objects.
- **Topological Intelligence Prep:** Updated the `GraphGardener` and `SonarAgent` to leverage high-precision models (400B+) via cloud for topological "Judging" tasks while keeping latency-sensitive tasks local.

## Problems

- **Constructor Mismatch:** The refactor initially broke the `GraphGardener` instantiation because the logic for `VectorEngine` was missing in the new modular orchestrator.
- **Strict Linting Delays:** Moving logic to new files triggered local linting errors (unused imports, forbidden non-null assertions) that required immediate remediation to pass the CI/CD baseline.
- **Provider Protocol Drift:** Discovered that OpenRouter expects different header formats (`HTTP-Referer`, `X-Title`) compared to local Ollama. These were consolidated into the `sonar-inference.ts` module.

## Lessons Learned

- **Refactor While it's Fresh:** Modularizing a 1,500-line file is much easier *immediately* after implementing its core features than 3 weeks later. The mental map of the monolith is essential for safe extraction.
- **Inference as a Service:** Treating the LLM provider as an abstract engine (rather than hardcoding Ollama calls) allows the system to remain model-agnostic and resilient to hardware/quota changes.
- **Context Passing vs. Globals:** Passing a `SonarContext` object (DB + Engines) to logic handlers is significantly more robust than relying on file-scope variables, especially as the daemon handles concurrent HTTP requests and background tasks.

## Verification Proof

- **Code Density:** Total line count for `sonar-agent.ts` dropped by **73%**.
- **Type Safety:** `tsc --noEmit` passed across all five new modules.
- **Routing Reliability:** Verified that `getTaskModel` correctly assigns Llama 4 Maverick for `garden` tasks when OpenRouter is enabled.
