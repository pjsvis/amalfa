# Developer Onboarding: PolyVis "Resonance"

**Welcome to the PolyVis Codebase.**
This project is an **Automated Investigating Engine**. It treats code as a rigorous discipline aimed at extracting truth from chaos.

## 1. The Core Philosophy
We do not write "features"; we write **Protocols**.
*   **Zero Magic:** If you can't explain how it works (e.g., using a regex instead of an LLM), use the simple version.
*   **Harden and Flense:** Standard Output (`stdout`) is for data. Standard Error (`stderr`) is for logs. If your code pollutes `stdout`, it breaks the machine.
    *   *Read this first:* [Harden and Flense Protocol](../playbooks/harden-and-flense-protocol.md)

## 2. The Architecture (The "Resonance" Engine)
The system is clear pipeline:
1.  **Ingestion:** Raw Markdown -> `src/resonance/ingest.ts` -> SQLite (`resonance.db`).
2.  **Intelligence:** The `VectorEngine` adds semantic meaning (embeddings) to the Graph.
3.  **Interface:**
    -   **Web:** A Sigma.js Graph explorer.
    -   **MCP:** An agentic API that lets AI "talk" to the database.

## 3. The Toolchain (Bun)
We use `bun` for everything.
*   `bun run dev`: Starts the Web UI (Port 3000).
*   `bun run mcp`: Starts the Agent Server (JSON-RPC over Stdio).
*   `bun run build:data`: Rebuilds the database from source files.

## 4. Coding Standards (How to not break things)
*   **Database Access:** NEVER connect to the DB manually. Use `DatabaseFactory.connectToResonance()` or `ResonanceDB.init()`. This prevents "Database Locked" errors.
*   **Scripts:** All scripts live in `scripts/`. They must use the standard `ServiceLifecycle` pattern if they run as daemons.
    *   *Reference:* [Scripts Playbook](../playbooks/scripts-playbook.md)

## 5. First Task
1.  Run `bun run build:data` to seed your local database.
2.  Run `bun run verify` to test your vector search.
3.  Start the UI with `bun run dev` and explore the graph.

*Welcome to the team.*
