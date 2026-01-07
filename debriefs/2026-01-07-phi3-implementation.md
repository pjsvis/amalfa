---
date: 2026-01-07
tags: [phi3, ollama, agent, tinydolphin, performance]
---

## Debrief: Phi3 Sub-Agent Implementation

## Accomplishments

- **Phi3 Agent Daemon:** Successfully implemented a robust daemon (`src/daemon/phi3-agent.ts`) that manages the lifecycle of local LLM interactions. It includes health checks, dynamic port assignment (3012), and graceful shutdown handling.
- **Search Intelligence & Metadata:** Built and exposed endpoints for `/search/analyze` (intent), `/search/rerank` (relevance), `/search/context` (snippets), and `/metadata/enhance` (ResonanceDB enrichment).
- **CLI Tooling:** Implemented a comprehensive CLI suite:
    - `amalfa phi3 status`: Rich diagnostics including active model, size, and daemon health.
    - `amalfa phi3 chat`: Interactive chat interface with a real-time "Thinking..." timer for UX feedback.
    - `amalfa enhance`: Commands for single-doc and batch metadata enhancement.
- **Performance Optimization (FAFCAS):** Recognized that `phi3:latest` (3.8B) was too slow for CPU inference (>30s latency). pivoted to `tinydolphin:latest` (1.1B), resulting in sub-5s response times while maintaining sufficient conversational awareness for the CLI agent.
- **Dynamic Discovery:** Enhanced `ollama-discovery.ts` to automatically detect and prioritize lightweight models (`tinydolphin` > `tinyllama` > `phi3`), ensuring the system runs optimally on available hardware without manual reconfiguration.

## Problems

- **Inference Latency:** Initial testing with `phi3:latest` on local CPU showed unacceptable latency (30-60s per query), making the "interactive" chat feel broken.
    - *Resolution:* Implemented a "Thinking..." timer to manage user expectations, then ultimately switched the default model to the much smaller and faster `tinydolphin`.
- **Timer UX:** The initial chat interface lacked feedback during long inference blocking.
    - *Resolution:* Added a second-by-second elapsed time indicator (`Thinking... (12s)`) to the CLI chat loop.
- **Config Complexity:** Hardcoded model names initially prevented easy switching.
    - *Resolution:* Refactored `defaults.ts` and `amalfa.config.json` to use a `modelPriority` array, allowing the system to gracefully degrade to the best available model.

## Lessons Learned

- **Latency is Feature #1:** For interactive agents, speed often trumps raw intelligence. A "dumber" but instant agent (TinyDolphin) feels smarter than a genius that takes a minute to reply.
- **UX for AI:** Always provide visual feedback (like a timer) when blocking on non-deterministic/long-running AI tasks. Users assume "hang" otherwise.
- **System 1 vs System 2:** The architecture should support both "Fast/Cheap" (TinyDolphin for chat/routing) and "Slow/Deep" (Phi3/Llama3 for background batch analysis) models simultaneously. This is now enabled by our config structure.
