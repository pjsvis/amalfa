---
date: 2026-01-08
tags: [refactor, sonar, agent, phi3, json-mode, staleness-check]
---

## Debrief: Sonar Agent Refactor & Hardening

## Accomplishments

- **Completed Sonar Agent Refactor:** Successfully renamed the "Phi3" sub-agent to "Sonar Agent" throughout the entire codebase. This included:
    - Renaming source files (`daemon/sonar-agent.ts`, `cli/sonar-chat.ts`, `utils/sonar-client.ts`).
    - Updating configuration keys (`amalfa.config.json`) from `phi3` to `sonar`.
    - Updating CLI commands (`amalfa sonar start`, `amalfa sonar chat`).
    - Updating documentation and playbooks (`playbooks/sonar-manual.md`, `playbooks/sonar-system-overview.md`).
- **Implemented Staleness Detection:** Added logic to `amalfa stats` that compares the database modification time against the latest source file modification time. Users now get a clear `⚠️ STALE` warning if their knowledge graph is out of date.
- **Enabled JSON Mode (GBNF):** Updated the Sonar Agent to use Ollama's `format: "json"` option. This enforces valid JSON output even for small models (like `tinydolphin`), significantly improving the reliability of the `amalfa enhance` command.
- **Consolidated Documentation:** Merged scattered SQLite standards into a single `playbooks/sqlite-standards.md` file to reduce fragmentation.

## Problems

- **Linting Issues:** During the massive find-and-replace refactor, several lint errors were introduced (e.g., non-null assertions, generic type constraints).
    - *Resolution:* Systematically addressed errors by adding safe undefined checks and proper TypeScript generics (e.g., `Bun.Server<unknown>`).
- **Small Model Hallucinations:** Initial tests with `tinydolphin` caused the `enhance` command to fail because the model returned conversational text instead of JSON.
    - *Resolution:* Implemented `format: "json"` in the `callOllama` function, effectively using GBNF grammars to constrain the model's output structure.

## Lessons Learned

- **Small Models Need Constraints:** When building agentic features for local LLMs, especially small ones (< 7B), strict output constraints (like JSON mode) are non-negotiable for programmatic reliability.
- **Self-Awareness is Critical:** A system should know when it is out of sync. Relying on user memory to run background daemons is error-prone; the system should actively signal its state.
- **Backward Compatibility:** Providing fallback configuration paths (checking `config.sonar || config.phi3`) prevents breaking changes for existing users during a rename.
