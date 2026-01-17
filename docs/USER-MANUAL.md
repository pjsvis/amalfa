---
title: AMALFA User Manual
version: 1.4.1
date: 2026-01-16
---

# AMALFA User Manual

**A Memory Layer For Agents**

This manual provides comprehensive instructions for installing, configuring, and operating Amalfa.

## Table of Contents
1.  [Installation & Setup](#installation--setup)
2.  [Core Workflow](#core-workflow)
3.  [CLI Reference](#cli-reference)
4.  [Configuration](#configuration)
5.  [Services & Sub-Agents](#services--sub-agents)
6.  [Maintenance & Troubleshooting](#maintenance--troubleshooting)
7.  [Common Gotchas](#common-gotchas)

---

## 1. Installation & Setup

### Requirements
*   **Bun** (v1.0+): [Install Bun](https://bun.sh)

**IMPORTANT**: Node.js is NOT required. Amalfa runs entirely on Bun.

### Installation
```bash
bun install -g amalfa
```

**Critical**: Do NOT use npm, yarn, or pnpm. Amalfa requires Bun-specific features.

### Uninstallation

To remove Amalfa:
```bash
bun remove -g amalfa
```

**Troubleshooting**: If `which amalfa` still shows a binary path:
```bash
# Remove manually
rm $(which amalfa)

# If you accidentally installed via npm (this won't work, but try anyway)
npm uninstall -g amalfa
```

**Key Insight**: Bun and npm are separate package managers. You cannot uninstall a Bun package with npm, just like you can't uninstall a Homebrew package with apt-get.

### Initial Setup
1.  Navigate to your project root (where your markdown docs live).
2.  Run initialization:
    ```bash
    amalfa init
    ```

### Configuring Your AI Client (MCP)

To use Amalfa with an AI agent, you must register it as an MCP server.

**1. Generate Base Config**
Run `amalfa setup-mcp` to get the JSON snippet.

**2. Add to Your Client**

#### A. Claude Desktop
File: `~/Library/Application Support/Claude/claude_desktop_config.json`
Key: `mcpServers`

```json
{
  "mcpServers": {
    "amalfa": {
      "command": "amalfa",
      "args": ["serve"],
      "env": {
        "PATH": "/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin"
      }
    }
  }
}
```

#### B. Cline / Roo Code (VSCode)
File: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
*Note: Cline uses the standard `env` key.*

#### C. Other Clients (Cursor, Windsurf, etc.)
Consult your client's documentation. Common pitfalls:
*   **Environment Variables**: Some clients use `"env": { ... }`, others use `"environment": { ... }`.
*   **Path**: Use absolute paths for `command`. If `amalfa` is not found, run `which amalfa` and use the full path (e.g., `/Users/me/.bun/bin/amalfa`).
*   **CWD**: Ensure the client runs the server in your project root, or specify explicit sources in `amalfa.config.json` with absolute paths.


---

## 2. Core Workflow

Amalfa is designed around the **Write Brief → Do Work → Write Debrief → Update Playbooks** cycle.

![AMALFA Workflow](https://raw.githubusercontent.com/pjsvis/amalfa/main/docs/workflow.png)

### The Cycle
1.  **Brief**: Agent receives a task / user request.
2.  **Work**: Agent performs actions (coding, writing).
3.  **Debrief**: Agent creates a markdown file (e.g., `debriefs/task-001.md`) summarizing what worked, what failed, and lessons learned.
4.  **Playbook**: Agent extracts reusable patterns into `playbooks/` (e.g., `playbooks/auth-patterns.md`).
5.  **Query**: In future sessions, Amalfa retrieves these Playbooks via semantic search ("How do we handle auth?"), preventing regression.

### Philosophy (The "Why")
Agents suffer from context loss. By forcing structured reflection (Debriefs) and codification (Playbooks), you create an external "Long-Term Memory" that persists across sessions and models.

**Best Practice**: Treat your markdown files as the "Source of Truth". The database is just an index of these files.

---

## 3. CLI Reference

### Primary Commands

| Command | Description |
| :--- | :--- |
| `amalfa init` | Scans all markdown files and builds/updates the knowledge graph. Safe to run repeatedly. |
| `amalfa serve` | Starts the MCP server (stdio mode). Used by Claude Desktop. |
| `amalfa doctor` | Diagnoses installation, ports, and configuration health. |
| `amalfa servers` | Displays real-time status of all daemons (Vector, Reranker, Sonar). |
| `amalfa stop-all` | Gracefully terminates all background services. |

### Service Management

| Command | Description |
| :--- | :--- |
| `amalfa vector <start\|stop\|status>` | Manage the Embeddings Daemon (Port 3010). |
| `amalfa reranker <start\|stop\|status>` | Manage the Reranker Daemon (Port 3011). |
| `amalfa sonar <start\|stop\|status>` | Manage the Reasoning Agent (Port 3012). |

---

## 4. Configuration

Amalfa uses `amalfa.config.json` in your project root.

**Example Configuration**:
```json
{
  "sources": [
    "./docs",
    "./briefs",
    "./playbooks",
    "./src"
  ],
  "ignore": ["node_modules", ".git"],
  "vector": {
    "provider": "fastembed",
    "model": "bge-small-en-v1.5"
  },
  "sonar": {
    "enabled": true,
    "host": "http://localhost:11434",
    "model": "phi3:medium"
  }
}
```

*   `sources`: Arrays of directories to scan for markdown/code.
*   `vector`: Configure the embedding model (default is optimized for local usage).
*   `sonar`: Configure the connection to local LLMs (Ollama).

---

## 5. Services & Sub-Agents

Amalfa runs a "Micro-Daemon Mesh" to handle heavy ML tasks without blocking the main process.

### Vector Daemon (Port 3010)
*   **Role**: Generates embeddings for text.
*   **Tech**: FastEmbed (ONNX).
*   **Status**: Essential.

### Reranker Daemon (Port 3011)
*   **Role**: Re-scores search results to improve accuracy (Cross-Encoder).
*   **Tech**: BGE-M3 (ONNX).
*   **Status**: Recommended. Improves semantic search precision by ~40%.

### Sonar Agent (Port 3012)
*   **Role**: Reasoning, Research, and Synthesis.
*   **Provider**: Ollama (by default).
*   **Capabilities**:
    *   **Deep Research**: Recursively explores the graph to answer complex questions.
    *   **Gap Analysis**: Identifies missing links in your documentation.
    *   **Chat**: Allows you to "talk" to your documentation.

**Cloud Agents (BYOK)**:
To use OpenAI or Anthropic for Sonar, set `sonar.host` to an Ollama-compatible bridge (like `litellm`) that forwards requests to the cloud API.

---

## 6. Maintenance & Troubleshooting

Amalfa employs a **Tiered Maintenance Strategy**.

### Tier 1: Diagnose
Run `amalfa doctor`.
*   Checks if ports 3010-3012 are free.
*   Verifies database integrity.
*   Checks for zombie processes.

### Tier 2: Re-Index (Standard)
Run `amalfa init`.
*   Rescans your filesystem.
*   Updates headers, content, and metadata in the graph.
*   **Safe**: Does not lose history/logs.
*   **Use when**: You added many files, or search feels stale.

### Tier 3: Factory Reset (Last Resort)
If the database file (`.amalfa/resonance.db`) is corrupted or you are changing embedding dimensions (e.g. switching models):

```bash
# MacOS/Linux
rm -rf .amalfa/
amalfa init
```

**Note**: This will regenerate all embeddings from scratch. On large repos (10k+ files), this may take a few minutes.

---

## 7. Common Gotchas

### Bun vs npm Confusion

**Problem**: "I ran `npm uninstall -g amalfa` but it's still installed."

**Root Cause**: Package managers are **isolated systems** ("crossed porpoises"—swimming in opposite directions):

| Aspect | Bun | npm |
| :--- | :--- | :--- |
| Install location | `~/.bun/bin/` | `/usr/local/lib/node_modules/` |
| Package database | Bun's lockfile | npm registry cache |
| Binary symlinks | `~/.bun/bin/amalfa` | `/usr/local/bin/amalfa` |

They don't communicate. Installing with Bun creates entries in Bun's database. npm has no knowledge of this.

**Solution**:
```bash
# Always use Bun for Amalfa
bun remove -g amalfa

# Verify removal
which amalfa  # Should return nothing
```

### PATH Issues

**Problem**: "Command not found: amalfa" after installation.

**Cause**: Shell doesn't know about `~/.bun/bin`.

**Fix**: Add to `~/.zshrc` or `~/.bashrc`:
```bash
export PATH="$HOME/.bun/bin:$PATH"
```
Then: `source ~/.zshrc`

### trustedDependencies Warning

During `bun install`, you may see messages about `onnxruntime-node` or `protobufjs`. This is expected.

**What's happening**: These packages compile native code (C++) during installation. Bun's security model blocks postinstall scripts by default. The `trustedDependencies` field in `package.json` whitelists them.

**No action needed** unless the install fails, in which case:
```bash
bun install --trust
```
