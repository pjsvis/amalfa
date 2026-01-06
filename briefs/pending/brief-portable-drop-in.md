# Project Brief: Portable Drop-In Architecture (Lift & Shift)

**Status:** Execution-Ready
**Context:** Deployment Strategy
**Objective:** Enable the PolyVis toolchain to be "dropped" into any target repository and function immediately as a local development tool.

## 1. The Problem
Users rarely want to install a complex global toolchain. They want to:
1.  Copy the `polyvis/` folder into their project.
2.  Run a setup script.
3.  Have their Agent (Claude/Cursor) immediately capable of "thinking" about their code.

Current blockers:
*   MCP Client configuration requires absolute paths, which break when folders move.
*   The system assumes it is in its original repo (paths relative to root).

## 2. The Solution: "Self-Aware" Tooling
We will implement a **Portable Architecture** based on two pillars:

### A. The Environment Verifier (`src/utils/EnvironmentVerifier.ts`)
*   **Role:** The "Immune System".
*   **Function:** At startup (Daemon or MCP), it reads `polyvis.settings.json` and verifies that all configured source directories (Playbooks, Debriefs, etc.) actually exist relative to the current working directory.
*   **Failure Mode:** If folders are missing, it fails fast with a "Repair Instructions" message (e.g., *"Missing directory 'playbooks/'. Please create it."*).

### B. The Handshake Script (`scripts/setup_mcp.ts`)
*   **Role:** The "Bridge".
*   **Function:**
    1.  Calculates the **Absolute Path** of the current installation.
    2.  Generates the JSON configuration block required for `claude_desktop_config.json` and `cursor.json`.
    3.  Prints it to `stdout` for the user to copy-paste.

## 3. Implementation Plan
1.  **Create Verifier:** `src/utils/EnvironmentVerifier.ts`
2.  **Integrate:** Add verify calls to `src/mcp/index.ts` and `src/resonance/daemon.ts`.
3.  **Create Handshake:** `scripts/setup_mcp.ts`.
4.  **Verify:** Test "Drop-In" behavior by running setup in the current location.

## 4. Success Criteria
*   Running `bun run setup:mcp` outputs valid JSON with the correct *absolute* path.
*   The MCP server refuses to start if `polyvis.settings.json` points to non-existent folders.
