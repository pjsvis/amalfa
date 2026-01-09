# Daemon Directory

## Purpose
Background services and long-running processes for Amalfa, including the Vector Daemon and Sonar Agent.

## Key Files

- `index.ts` - Daemon entry point
- `vector-daemon.ts` - Vector storage service
- `sonar-agent.ts` - Semantic analysis agent

## Patterns

- Services run as background processes
- Use event-driven architecture
- Support graceful shutdown

## ⚠️ Stability
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.