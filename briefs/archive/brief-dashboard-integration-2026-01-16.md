---
date: 2026-01-16
tags: [dashboard, ui, generative-ui, datastar, observability, hono]
agent: claude
environment: local
---

## Task: Amalfa Dashboard Integration (Control Center)

**Objective**: Graduate the `scripts/generative-ui` POC into a production-grade Dashboard (`src/dashboard`) to provide real-time observability and control over the Amalfa distributed service architecture.

**Philosophy**: "Server-Driven UI". No React build steps. No complex hydration. Just Hono streaming HTML fragments via Datastar.

- [ ] Scaffold `src/dashboard` structure based on `scripts/generative-ui`
- [ ] Implement `DashboardDaemon` (new service on Port 3013)
- [ ] Build "Service Matrix" (Health/Status of Vector, Reranker, Sonar, MCP)
- [ ] Build "Control Panel" (Start/Stop/Restart services)
- [ ] Build "Log Tap" (Live streaming of log files)

## Key Actions Checklist

- [ ] **Migration**: Move `scripts/generative-ui` core logic to `src/dashboard/`.
- [ ] **Server**: Create `src/dashboard/server.tsx` (Hono + JSX).
- [ ] **Daemon**: Create `src/resonance/services/dashboard-daemon.ts` (Port 3013).
- [ ] **CLI**: Register `amalfa dashboard start` command.
- [ ] **UI Component**: `<ServiceStatusBadge />` (pings localhost:30xx/health).
- [ ] **UI Component**: `<LogStream />` (SSE stream from `.amalfa/logs/*.log`).
- [ ] **UI Component**: `<ControlButtons />` (POST requests to daemon endpoints).

## Detailed Requirements

### 1. The Dashboard Daemon (Port 3013)
*   **Role**: The UI Host and Aggregator.
*   **Tech**: Hono (Server), Datastar (Client interactions).
*   **Endpoints**:
    *   `GET /` (The Shell)
    *   `GET /feed/status` (SSE stream of service health)
    *   `GET /feed/logs/:service` (SSE stream of logs)
    *   `POST /action/:service/:command` (Trigger CLI commands)

### 2. Service Matrix (Observability)
Visualize the state of the "Micro-Daemon Mesh":
*   **Vector (3010)**: 🟢 Ready | 🔴 Down | 🟡 Busy
*   **Reranker (3011)**: 🟢 Ready | 🔴 Down
*   **Sonar (3012)**: 🟢 Ready | 🔴 Down
*   **Database**: 📊 Node Count / Embedding Count

### 3. Control Panel (Action)
Turn CLI commands into buttons:
*   `[Restart Vector]` -> Executes `amalfa vector restart`
*   `[Rebuild Graph]` -> Executes `amalfa rebuild` (Level 2 Maintenance)
*   `[Fix Rot]` -> Executes `amalfa doctor --fix`

### 4. Log Tap (Insight)
*   Select a service (Vector, Reranker, main).
*   Stream the last N lines + new lines via SSE to a terminal-like window in the browser.

## References
*   `scripts/generative-ui/README.md` (POC documentation)
*   `playbooks/services-playbook.md` (Daemon standards)
