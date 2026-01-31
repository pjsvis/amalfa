---
tags:
  - metadata
  - vocabulary
  - agent-driven
  - extracted
---
# Sonar Agent Manual

**Purpose:** Comprehensive guide for the Sonar AI sub-agent, handling Search Intelligence, Metadata Enhancement, and Context Extraction.

**Prerequisites:** 
- [Ollama](https://ollama.ai) installed.
- Model pulled: `ollama pull phi3:latest` (or `mistral:7b`, `llama3:8b`).

---

## 1. Quick Start

### Installation & Run
```bash
# 1. Install Ollama (if needed)
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Start the Agent
bun run amalfa sonar start

# 3. Verify Status
bun run amalfa sonar status
# Output: 🟢 SonarAgent is RUNNING (PID: 12345)
# Logs: .amalfa/logs/sonar.log
```

### Enable/Disable
Edit `amalfa.config.json` (or `.ts`):
```json
{
  "sonar": {
    "enabled": true,            // Set false to utilize pure Vector Search (faster)
    "model": "phi3:latest"      // Or "mistral:7b-instruct-v0.3-q4_K_M"
  }
}
```

---

## 2. Capabilities

### Search Intelligence (Real-Time)
*   **Query Analysis:** Extracts semantic intent (`implementation` vs `conceptual`) and entities from user queries.
*   **Re-Ranking:** Re-orders vector search results based on semantic relevance to the intent.
*   **Context Extraction:** Generates "Smart Snippets" explaining *why* a result matches.

### Metadata Enhancement (Background)
*   **Auto-Tagging:** Identifies themes and code patterns.
*   **Type Detection:** Classifies docs as `Reference`, `Guide`, `Debrief`, etc.
*   **Batch Processing:** Gently processes the corpus in background (10 docs/batch).

### Interactive Chat
*   **Command:** `bun run amalfa sonar chat`
*   **Function:** Chat with your knowledge base. Ask questions like "What documentation do we have on authentication?"

---

## 3. Configuration Reference

| Setting | Default | Description |
| :--- | :--- | :--- |
| `enabled` | `false` | Master switch for all AI features. |
| `discoveryMethod` | `"cli"` | Use `ollama list` to find models (Reliable). |
| `inferenceMethod` | `"http"` | Use HTTP API for generation (Fast). |
| `tasks.search.timeout` | `5000` | Max ms for search analysis before fallback. |
| `tasks.metadata.autoEnhance` | `true` | Auto-process new docs on ingestion. |

---

## 4. Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `⚠️ Ollama is not available` | Ollama process not running. | Run `ollama serve`. |
| `⚠️ Using model: phi3 (not found)` | Model not pulled strings. | Run `ollama pull phi3:latest`. |
| `Search is slow (>3s)` | Model inference latency. | Disable Sonar or use smaller model. |
| `Error: Port 3012 in use` | Zombie process. | Run `kill -9 <PID>` or `bun run amalfa sonar stop`. |

---

## 5. Script Reference
See `scripts/README.md` for full command list.
*   `amalfa sonar start`: Start daemon.
*   `amalfa sonar stop`: Stop daemon.
*   `amalfa sonar chat`: Start interactive session.
*   `amalfa sonar status`: Check health.
