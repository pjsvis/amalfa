# PolyVis Backend Services

This document outlines the architecture and management standards for the PolyVis backend services, including the "Triad" of AI models.

## The Triad (AI Model Servers)

PolyVis relies on a trio of specialized local LLMs, each running as an independent service via `llama.cpp`.

### 1. The Auditor (Olmo-3)
*   **Port**: `8084`
*   **Role**: Verification and deep thinking.
*   **Configuration**: 7B Parameter model, Q4_K_M quantization.
*   **Special Features**: Uses "DeepSeek" reasoning format to expose its thought process.

### 2. The Scout (Phi-3.5)
*   **Port**: `8082`
*   **Role**: Rapid queries, summarization, and initial data fetch.
*   **Configuration**: Mini-Instruct model. Fast and lightweight.

### 3. The Architect (Llama-3)
*   **Port**: `8083` (Vectored) / `8085` (Unvectored)
*   **Role**: Synthesis, structure, and professional output.
*   **Configuration**: 8B Instruct model.
*   **Steering**:
    *   **Vectored (`llama`)**: Uses a Control Vector at scale **-0.11** ("The Accountant"). This suppresses "chatty" behaviors and enforces structured, professional responses.
    *   **Unvectored (`llamauv`)**: The raw base model for comparison.

## Management Standard: "ServiceLifecycle"

To ensure reliability, all backend services MUST strictly adhere to the `ServiceLifecycle` pattern (`src/utils/ServiceLifecycle.ts`). This provides:

*   **Unified CLI Interface**: Every service supports `start`, `stop`, `restart`, and `status`.
*   **Zombie Defense**: Automatic detection and cleanup of rogue processes on startup.
*   **PID Management**: Reliable tracking of running services via PID files.

### Global Status Dashboard

A singular command exists to view the health of the entire backend:
`bun run servers`

Example Output:
```
SERVICE        PORT      COMMAND        STATUS         PID       
----------------------------------------------------------------------
Dev Server     3000      dev            ⚪️ STOPPED     -         
Daemon         3010      daemon         ⚪️ STOPPED     -         
MCP            Stdio     mcp            ⚪️ STOPPED     -         
Olmo-3         8084      olmo3          🟢 RUNNING     6526      
Phi-3.5        8082      phi            ⚪️ STOPPED     -         
Llama-3        8083      llama          🟢 RUNNING     15561     
Llama-3-UV     8085      llamauv        🟢 RUNNING     10641     
----------------------------------------------------------------------
```

## Adding New Services

When introducing a new long-running process to PolyVis:
1.  **Do not** write ad-hoc scripts.
2.  **Create a wrapper** in `src/services/` that implements `ServiceLifecycle`.
3.  **Register** the service in `package.json`, `ZombieDefense.ts`, and `scripts/cli/servers.ts`.
