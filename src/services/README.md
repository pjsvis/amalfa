# PolyVis Services

This directory contains the service wrappers for the PolyVis backend infrastructure, including the AI model servers.

## Service Lifecycle Management

All services in this directory must implement the `ServiceLifecycle` pattern (`src/utils/ServiceLifecycle.ts`). This ensures consistent behavior for:
- **Startup**: checking for zombie processes, stale PID files, and creating log files.
- **Process Management**: standard `start`, `stop`, `restart`, `status` commands.
- **Zombie Defense**: Integration with the `ZombieDefense` system to prevent rogue processes.

## Available Services

| Service | Script | Port | Description |
| :--- | :--- | :--- | :--- |
| **Olmo-3** | `olmo3.ts` | `8084` | The "Auditor" model. Runs with DeepSeek reasoning format for heavy verification tasks. |
| **Phi-3.5** | `phi.ts` | `8082` | The "Scout" model. Fast, lightweight model for initial queries. |
| **Llama-3** | `llama.ts` | `8083` | The "Architect" / "Accountant". Steered via Control Vector (Scale: -0.11) for professional, structured output. |
| **Llama-3-UV** | `llamauv.ts` | `8085` | Unvectored Llama-3. Runs the raw base model for comparison/baseline purposes. |

## Usage

All services can be managed via `bun run`.

```bash
# Start a service
bun run <service_name> start

# Stop a service
bun run <service_name> stop

# Check status
bun run <service_name> status

# Restart
bun run <service_name> restart
```

### Master Status CLI

To view the status of ALL running services:

```bash
bun run servers
```

## Adding a New Service

1.  **Duplicate** an existing wrapper (e.g., `src/services/llamauv.ts`).
2.  **Configure**:
    *   Update `PORT`, `name`, `pidFile`, and `logFile`.
    *   Set the correct binary path and arguments in `runServer()`.
3.  **Register**:
    *   Add a script to `package.json`.
    *   Add to the whitelist in `src/utils/ZombieDefense.ts`.
    *   Add to the status list in `scripts/cli/servers.ts`.
