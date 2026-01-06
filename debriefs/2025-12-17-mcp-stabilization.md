# Debrief: MCP Stabilization & OPM-15 Discovery
**Date:** 2025-12-17
**Topic:** MCP Server Stability & Zombie Defense Protocol

## 1. Context
The session began with a request to fetch information about "OPM-15" using the MCP Server. This triggered a discovery of a critical instability in the MCP infrastructure where the server would silently crash (EOF) upon connection.

## 2. The Root Cause: Friendly Fire
The "Zombie Defense" system, designed to protect the database lock from rogue processes, was too aggressive.
- **Mechanism:** It scans for `bun` processes.
- **Failure Mode:** When `bun run mcp` (wrapper) spawned `bun run src/mcp/index.ts` (server), the server's startup check saw the wrapper as a "duplicate" of itself and triggered a self-termination to avoid corruption.
- **Result:** Immediate `EOF` on the stdio pipe.

## 3. The Fix: Identity-Aware Defense
We implemented a multi-layered fix to make the system robust ("Bullet Proof"):

1.  **Self-Awareness:** Updated `ZombieDefense.ts` to strictly exclude `process.pid` and `process.ppid` from duplicate detection.
2.  **Configurable Lifecycle:** Modified `ServiceLifecycle.ts` to accept a `checkZombies=false` flag, used strictly by the `serve` command (MCP mode).
3.  **Crash Logging:** Added file-based logging (`.mcp.crash.log`) to catch uncaught exceptions that are otherwise swallowed by the JSON-RPC stdio transport.

## 4. OPM-15 Retrieved
Once stable, we successfully retrieved the OPM-15 definition:
- **"The Switzerland Strategy"**: Neutrality regarding inference source.
- **Dual-Provider**: `Sovereign` (Ollama/Local) vs `Hybrid` (OpenRouter/Cloud).
- **Invariant**: Embeddings (`nomic-embed-text`) MUST always run locally for privacy/speed.

## 5. New Capabilities
- **Verification Script:** `scripts/verify/test_mcp_lifecycle.ts` now exists to validate the MCP server's ability to handshake without crashing.
- **Debug Logs:** The MCP server now leaves a trace if it crashes.

## 6. Lessons Learned
- **Stdio Obscurity:** Processes running over stdio are black boxes. Always have a side-channel (file log) for panic/crash reporting.
- **Defensive Coding:** "Zombie Killers" must be extremely precise to avoid killing their own parents or children.
