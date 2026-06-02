# DECISION: CLI-First Architecture Preferred Over MCP

**Date:** 2026-06-02  
**Status:** `adopted`  
**Rationale:** MCP servers introduce complexity, state management overhead, and protocol debugging costs that outweigh benefits for our workflows.

---

## Context

MCP (Model Context Protocol) was evaluated as a mechanism for providing AI agents with tool access. After auditing our MCP server inventory and observing daily usage patterns, we concluded:

1. **MCP overhead is high** — stdio/HTTP with JSON-RPC framing adds latency and complexity
2. **CLI tools are more composable** — Unix pipes work well, RTK can filter output
3. **RTK provides equivalent output management** — 60-90% token reduction without protocol overhead

## Decision

**Prefer CLI tools over MCP servers** for new integrations.

| Aspect | MCP Servers | CLI Tools |
|--------|-------------|-----------|
| Protocol overhead | stdio/HTTP + JSON-RPC | Direct stdin/stdout |
| Auth complexity | Often complex (OAuth, tokens) | Env vars or flags |
| State management | Server runs continuously | Stateless per invocation |
| Composition | MCP→MCP awkward | Unix pipes work well |
| Debugging | Protocol traces, serialization issues | Direct output, pipe/grep |
| Trust model | "Here's my server, trust the runtime" | "Here's a binary, audit the source" |

## Implications for Amalfa

1. **Amalfa MCP server**: Functionally equivalent to CLI mode. MCP wrapper is optional — CLI interface is primary.
2. **RTK integration**: Use `rtk read`, `rtk search` for output filtering rather than protocol-based filtering.
3. **Documentation**: Update README to emphasize CLI-first usage.

## Related Decisions

- `2026-03-gitbutler-rejected.md` — GitButler (worktrees preferred)
- RTK usage playbook — `~/.pi/agent/playbooks/rtk-usage-playbook.md`

## Status

**Active.** MCP server remains functional for backward compatibility, but new features prefer CLI interface.

---

*This decision aligns with the Edinburgh Protocol principle: prefer empirical, testable systems over high-context abstraction.*