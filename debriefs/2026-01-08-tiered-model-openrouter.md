---
date: 2026-01-08
tags: [sonar, cloud, openrouter, rag, tiered-models]
---

## Debrief: Model Selection and Tiered Strategy Implementation

## Accomplishments

- **Tiered Model Strategy:** Implemented a "Dev-Cloud/Prod-Local" strategy allowing AMALFA to use optimized local models (`qwen2.5:1.5b`) for fast search/metadata tasks and powerful cloud models (`qwen/qwen-2.5-72b-instruct` via OpenRouter) for deep research.
- **OpenRouter Integration:** Added support for OpenAI-compatible cloud providers. Verified that larger models (72B+) significantly improve the quality of knowledge graph synthesis.
- **RAG Implementation:** Integrated Vector Search directly into the Sonar Agent's chat pipeline. Document context is now automatically injected into LLM prompts based on semantic relevance.
- **Secure Credential Handling:** updated the daemon to read `OPENROUTER_API_KEY` from `.env`, preventing secrets from leaking into configuration files.
- **Ingestion Scope expansion:** Updated `amalfa.config.json` and defaults to include root markdown files (e.g., `_CURRENT_TASK.md`, `README.md`) which are critical for agent context.
- **Model Hygiene:** Identified and removed 7 unused Ollama models (20GB+ recovered), standardizing on Qwen 2.5 for local workloads.
- **Successful v1.0.28 Release:** Successfully published to npm and created a GitHub release after resolving version collision issues.

## Problems

- **Ollama Timeout/Performance:** Initially attempted to run `mistral-nemo` (12B) locally on an M4 Air. While it ran, inference timed out at 300s. Resolved by finalizing the cloud toggle to offload heavy reasoning.
- **VectorEngine Initialization:** Experienced `db.query is not a function` errors. Resolved by correctly passing the raw `bun:sqlite` database handle (`db.getRawDb()`) instead of the `ResonanceDB` wrapper.
- **OpenRouter Endpoint Bug:** Encountered "Bad Request" errors due to double-path construction in the URL. Fixed by standardizing the `endpoint` string construction for OpenRouter.
- **ENV Inheritance:** Discovered that Bun background processes (daemon) didn't inherit `.env` variables correctly when spawned from the CLI. Resolved by adding `env: process.env` to the `Bun.spawn` configuration in `ServiceLifecycle.ts`.

## Lessons Learned

- **Dev-Cloud/Prod-Local Efficiency:** Access to high-end models during development exposes "what is possible" before committing to specific local hardware specs. 
- **Minimum Viable Model:** Local `qwen2.5:1.5b` proved more than adequate for "search-to-intent" and "metadata-extraction" tasks, outperforming the previously used `tinydolphin`.
- **Infrastructure as Logic:** The ability to toggle providers (Ollama vs OpenRouter) at the config level, rather than the code level, makes the agent platform significantly more resilient to varying user environments.

## Verification Proof

- **Task Report `roadmap_final-report.md`:** Successfully generated a grounded analysis of the project using OpenRouter Qwen 72B, citing internal documents like `[the-bicameral-graph]` and `[eval-review]`.
- **Latency Verification:** Local Qwen 1.5B latency for search analysis verified at ~2-3s; Cloud Qwen 72B latency for research research verified at ~14s.
- **Test Suite:** `bun test` verified at 23/23 passing.
