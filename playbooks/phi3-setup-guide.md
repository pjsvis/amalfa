# Phi3 Setup Guide

## Purpose

This guide walks you through setting up the Phi3 AI sub-agent for AMALFA. Phi3 enhances search through semantic understanding, intelligent re-ranking, and context-aware snippet generation.

**Prerequisites:**
- Ollama installed and running
- Phi3 or compatible model downloaded
- AMALFA installed and working

**Time Required:** 10-15 minutes

## Prerequisites

### 1. Install Ollama

Ollama is required to run local LLM models. Choose your platform:

#### macOS (Apple Silicon)
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### macOS (Intel)
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Windows
```bash
winget install Ollama.Ollama
```

**Verify Installation:**
```bash
ollama --version
# Should output: ollama version is 0.x.x
```

### 2. Download Phi3 Model

Phi3 is the recommended model for AMALFA's search intelligence features. It's lightweight (~2.2GB) and provides good balance of speed and accuracy.

#### Download Phi3
```bash
ollama pull phi3:latest
```

#### Alternative Models (Fallback Options)

If Phi3 isn't available, AMALFA will automatically try these models in order:

```bash
# Mistral 7B (instruction-tuned)
ollama pull mistral:7b-instruct-v0.3-q4_K_M

# Llama 3.1 8B
ollama pull llama3.1:8b
```

#### Verify Model Availability
```bash
ollama list
# Should show:
# NAME               ID              SIZE      MODIFIED
# phi3:latest       2f3c5d6e        2.2 GB    5 minutes ago
```

### 3. Verify Ollama is Running

Ollama must be running before AMALFA can use it.

#### Start Ollama (if not running)
```bash
# macOS/Linux
ollama serve

# Or run in background:
nohup ollama serve > ~/.ollama/ollama.log 2>&1 &
```

#### Verify Ollama is Accessible
```bash
curl http://localhost:11434/api/tags
# Should return: {"models": [...]}
```

**Default Ollama Ports:**
- **HTTP API:** `http://localhost:11434`
- **CLI Commands:** Direct execution

## Configuration

### 1. Enable Phi3 in AMALFA Config

Phi3 is **disabled by default** to ensure backward compatibility and avoid performance impact for users who don't need AI features.

Edit `amalfa.config.json` in your project root:

```json
{
  "phi3": {
    "enabled": true,              // Enable Phi3 features
    "autoDiscovery": true,       // Auto-detect Ollama on startup
    "discoveryMethod": "cli",     // Use CLI for model discovery
    "inferenceMethod": "http",    // Use HTTP for inference (faster)
    "model": "phi3:latest",      // Model to use
    "host": "localhost:11434",    // Ollama HTTP host
    "port": 3012,                // Phi3 daemon port
    "modelPriority": [            // Fallback models in order of preference
      "phi3:latest",
      "mistral:7b-instruct-v0.3-q4_K_M",
      "llama3.1:8b"
    ],
    "tasks": {
      "search": {
        "enabled": true,
        "timeout": 5000,        // 5 seconds for search tasks
        "priority": "high"       // Real-time interaction priority
      },
      "metadata": {
        "enabled": true,
        "timeout": 30000,       // 30 seconds per document
        "autoEnhance": true,    // Auto-enhance new docs
        "batchSize": 10         // Process 10 docs at once
      },
      "content": {
        "enabled": false,        // Disabled by default (resource intensive)
        "timeout": 300000,      // 5 minutes
        "schedule": "daily"
      }
    }
  }
}
```

### 2. Configuration Options Explained

#### `enabled` (boolean, default: `false`)
**Purpose:** Enable or disable all Phi3 features.

**When to Enable:**
- You need enhanced search (query analysis, re-ranking, smart snippets)
- You have Ollama installed and running
- You want better search relevance and context

**When to Disable:**
- You need fastest possible search (<100ms latency)
- Ollama is unstable or unavailable
- You prefer simple keyword/vector search

**Impact:** 
- `true`: Search requests take 1-2s, include AI analysis
- `false`: Search requests take <100ms, standard vector search

#### `autoDiscovery` (boolean, default: `true`)
**Purpose:** Automatically detect Ollama and available models on startup.

**Behavior:**
- `true`: Phi3 daemon checks Ollama health on startup, logs available models
- `false`: Skips Ollama detection, assumes Ollama is running

**Recommendation:** Keep `true` for most users. Only set `false` if you have a custom setup where Ollama isn't managed by AMALFA.

#### `discoveryMethod` (string, options: `"cli"` | `"http"`)
**Purpose:** Method for discovering available Ollama models.

**Options:**
- `"cli"`: Uses `ollama list` and `ollama show` commands (recommended, reliable)
- `"http"`: Uses Ollama HTTP API (experimental, requires client library)

**Recommendation:** Use `"cli"` for stability. HTTP discovery may fail with some Ollama versions.

#### `inferenceMethod` (string, options: `"cli"` | `"http"`)
**Purpose:** Method for running LLM inference (generating text with models).

**Options:**
- `"cli"`: Calls `ollama run` command (slower, process spawn overhead)
- `"http"`: Uses Ollama HTTP API (recommended, faster, supports streaming)

**Recommendation:** Use `"http"` for production. It's 10x faster and supports parallel requests.

#### `model` (string, default: `"phi3:latest"`)
**Purpose:** Specific model to use for Phi3 features.

**Options:**
- `"phi3:latest"`: Recommended model (lightweight, fast)
- `"mistral:7b-instruct-v0.3-q4_K_M"`: Alternative, good quality
- `"llama3.1:8b"`: Fallback option, good balance

**How Model Selection Works:**
1. Try to use `model` value
2. If not found, try models in `modelPriority` array
3. If none available, log warning and disable Phi3

**Example:**
```json
{
  "phi3": {
    "model": "phi3:latest",
    "modelPriority": [
      "phi3:latest",
      "mistral:7b-instruct-v0.3-q4_K_M",
      "llama3.1:8b"
    ]
  }
}
```
If `phi3:latest` isn't installed, AMALFA will automatically try `mistral`, then `llama3.1`.

#### `host` (string, default: `"localhost:11434"`)
**Purpose:** Ollama HTTP API host address.

**Default:** `localhost:11434` is Ollama's default port.

**When to Change:**
- Ollama running on different host/port (custom setup)
- Running Ollama behind reverse proxy
- Docker/containerized Ollama with custom port

**Format:** `hostname:port` (e.g., `localhost:11434`, `192.168.1.100:11434`)

#### `port` (integer, default: `3012`)
**Purpose:** Port for Phi3 daemon HTTP server.

**Conflict Prevention:** Ensure this port isn't used by other services.

**Default Ports:**
- **Vector Daemon:** `3010`
- **Phi3 Daemon:** `3012`
- **MCP Server:** Uses stdio (no port)

**When to Change:**
- Port 3012 conflicts with another service
- Running multiple AMALFA instances on same machine (different ports)

#### `modelPriority` (array of strings)
**Purpose:** Fallback models if primary model isn't available.

**Use Case:** User has multiple models installed, wants to prioritize specific one.

**Example:**
```json
{
  "phi3": {
    "modelPriority": [
      "phi3:latest",           // Try first
      "mistral:7b-instruct-v0.3-q4_K_M",  // Try second
      "llama3.1:8b"             // Try third
      "gemma2:9b"              // Try fourth (custom model)
    ]
  }
}
```

**How it Works:**
1. On startup, check if `model` is available
2. If not, check each model in `modelPriority` array
3. Use first available model
4. Log which model was selected

#### Task Configuration: `tasks.search`

```json
{
  "tasks": {
    "search": {
      "enabled": true,        // Enable search intelligence features
      "timeout": 5000,        // 5 second timeout for search tasks
      "priority": "high"       // Real-time interaction priority
    }
  }
}
```

**Impact:**
- `enabled: false`: Search uses basic vector search (fast, no AI)
- `timeout: 5000`: After 5 seconds, Phi3 request fails, falls back
- `priority`: Not yet used (future feature for task queuing)

**Recommended Settings:**
- Development/testing: `timeout: 10000` (10s, more forgiving)
- Production: `timeout: 5000` (5s, fast fallback)

#### Task Configuration: `tasks.metadata`

```json
{
  "tasks": {
    "metadata": {
      "enabled": true,        // Enable document enhancement
      "timeout": 30000,       // 30 seconds per document
      "autoEnhance": true,    // Automatically enhance new documents
      "batchSize": 10         // Process 10 documents at once
    }
  }
}
```

**Behavior:**
- `autoEnhance: true`: When new documents are ingested, Phi3 automatically enriches metadata
- `batchSize: 10`: Batch enhancement processes 10 docs simultaneously
- `timeout: 30000`: Each document has 30 seconds to enhance

**Note:** This feature is planned for Phase 3.

#### Task Configuration: `tasks.content`

```json
{
  "tasks": {
    "content": {
      "enabled": false,        // Disabled by default (resource intensive)
      "timeout": 300000,      // 5 minutes
      "schedule": "daily"       // Run content analysis daily
    }
  }
}
```

**Impact:**
- `enabled: false`: Content analysis is disabled (resource intensive)
- High CPU/memory usage when enabled
- Not recommended for development machines

**When to Enable:**
- Production deployments with dedicated resources
- Need for periodic corpus analysis
- Batch document updates

## Enable/Disable Decisions

### When to Enable Phi3

**Good Use Cases:**
- You're searching technical documentation and need semantic understanding
- You want better search relevance for conceptual queries
- You're exploring code and need implementation-focused results
- You have a large corpus and need query expansion
- You're building AI agents that benefit from enriched context

**Before Enabling:**
- Ollama is installed and running
- Phi3 model is downloaded
- You've tested basic AMALFA search (to establish baseline)
- You understand performance impact (1-2s latency per search)

### When to Disable Phi3

**Good Use Cases:**
- You need fastest possible search (<100ms)
- You're doing simple keyword searches (exact matches)
- You're running on resource-constrained hardware
- Ollama is unstable or frequently unavailable
- You're in development and want fast iteration

**Before Disabling:**
- You've tested Phi3 and found it doesn't add value
- You've confirmed performance is critical for your use case
- You've documented the decision (for future reference)

## Testing Your Setup

### 1. Start Phi3 Daemon

```bash
# Start Phi3 daemon
bun run amalfa phi3 start

# Check status
bun run amalfa phi3 status

# Expected output:
# 🟢 Phi3Agent is RUNNING (PID: xxxxx)
```

### 2. Verify Ollama Connection

```bash
# Check Phi3 logs for Ollama status
tail -f .amalfa/logs/phi3.log

# Look for:
# ✅ Ollama is available and healthy
# ✅ Using phi3:latest for search tasks
```

If you see warnings:
```
⚠️  Ollama is not available
⚠️  Phi3 features will be disabled
```

Then Ollama is not running. Start it:
```bash
ollama serve
```

### 3. Test Health Endpoint

```bash
# Test Phi3 daemon health
curl http://localhost:3012/health

# Expected response:
# {"status":"healthy","ollama_available":true,"model":"phi3:latest"}
```

If response shows `"ollama_available": false`, check Ollama is running.

### 4. Test Query Analysis Endpoint

```bash
# Test query analysis
curl -X POST http://localhost:3012/search/analyze \
  -H "Content-Type: application/json" \
  -d '{"query":"React component lifecycle"}' \
  | jq

# Expected response structure:
# {
#   "intent": "implementation",
#   "entities": ["React", "lifecycle", "component"],
#   "technical_level": "high",
#   "suggested_queries": ["React hooks", "useEffect"]
# }
```

**Interpreting Results:**
- `intent`: What type of search is needed
  - `"implementation"`: Practical, code-focused
  - `"conceptual"`: Theoretical, architecture-focused
  - `"example"`: Tutorial, example-focused
- `entities`: Key terms and concepts extracted
- `technical_level`: Complexity level
  - `"high"`: Implementation details, advanced topics
  - `"medium"`: General concepts, moderate depth
  - `"low"`: Basic concepts, introductory material
- `suggested_queries`: Alternative search queries to try

### 5. Test Re-ranking Endpoint

```bash
# Test result re-ranking
curl -X POST http://localhost:3012/search/rerank \
  -H "Content-Type: application/json" \
  -d '{
    "query": "React component lifecycle",
    "intent": "implementation",
    "results": [
      {"id":"doc-1","content":"Component lifecycle methods in React","score":0.82},
      {"id":"doc-2","content":"State management in Vue.js","score":0.76},
      {"id":"doc-3","content":"Angular lifecycle hooks","score":0.71}
    ]
  }' \
  | jq

# Expected response:
# Results re-ordered by relevance_score, which may differ from original score
```

**What to Look For:**
- `relevance_score`: New score from Phi3 (0.0 to 1.0)
- Order changes based on query intent
- Implementation queries should boost React-related results
- Conceptual queries should boost theoretical content

### 6. Test Context Extraction Endpoint

```bash
# Test smart snippet generation
curl -X POST http://localhost:3012/search/context \
  -H "Content-Type: application/json" \
  -d '{
    "query": "React component props",
    "result": {
      "id":"doc-1",
      "content":"React components accept props and return JSX. Props are read-only."
    }
  }' \
  | jq

# Expected response:
# {
#   "snippet": "React components accept props and return JSX",
#   "context": "Most relevant 2-3 sentences",
#   "confidence": 0.95
# }
```

**Interpreting Results:**
- `snippet`: AI-generated relevant excerpt
- `context`: Explanation of why this snippet matters
- `confidence`: Quality indicator (0.0 to 1.0)

### 7. Test MCP Integration

```bash
# Start MCP server with Phi3 enabled
bun run amalfa serve

# From Claude Desktop, run a search
# Search for: "How do React hooks work?"
```

**Expected Behavior:**
1. MCP server checks Phi3 availability
2. If available, analyzes query with Phi3
3. Performs vector search
4. Re-ranks results with Phi3
5. Extracts context for top 5 results
6. Returns enriched results to Claude

**Response Format:**
```json
{
  "results": [
    {
      "id": "doc-id",
      "score": 0.85,
      "preview": "...",
      "relevance_score": 0.92,
      "snippet": "...",
      "context": "...",
      "confidence": 0.95
    }
  ],
  "metadata": {
    "phi3_enabled": true,
    "intent": "implementation",
    "analysis": {
      "intent": "...",
      "entities": [...],
      "technical_level": "high",
      "suggested_queries": [...]
    }
  }
}
```

## Troubleshooting

### Issue: Phi3 Not Starting

**Symptoms:**
```bash
bun run amalfa phi3 start
# ⚠️  Phi3 is disabled in configuration. Exiting.
```

**Solution:** Enable Phi3 in `amalfa.config.json`:
```json
{
  "phi3": {
    "enabled": true
  }
}
```

### Issue: Ollama Connection Failed

**Symptoms:**
```bash
# In .amalfa/logs/phi3.log
⚠️  Ollama is not available
⚠️  Phi3 features will be disabled
```

**Solution:** Start Ollama:
```bash
ollama serve
```

**Verify:**
```bash
curl http://localhost:11434/api/tags
# Should return model list
```

### Issue: Model Not Found

**Symptoms:**
```bash
# In .amalfa/logs/phi3.log
⚠️  No preferred models found
⚠️  Using model: phi3:latest (not found)
```

**Solution:** Download a model:
```bash
ollama pull phi3:latest
```

Or add to `modelPriority`:
```json
{
  "phi3": {
    "modelPriority": [
      "phi3:latest",
      "mistral:7b-instruct-v0.3-q4_K_M",
      "llama3.1:8b"
    ]
  }
}
```

### Issue: Phi3 Not Responding

**Symptoms:**
```bash
bun run amalfa phi3 status
# 🟢 Phi3Agent is RUNNING (PID: xxxxx)

curl http://localhost:3012/health
# Empty response or timeout
```

**Solution 1: Check Phi3 Logs**
```bash
tail -50 .amalfa/logs/phi3.log
```

Look for:
- Startup errors
- Ollama connection issues
- Port conflicts

**Solution 2: Restart Phi3 Daemon**
```bash
bun run amalfa phi3 restart
```

**Solution 3: Check Port Availability**
```bash
# Check if port 3012 is in use
lsof -i :3012

# Kill conflicting process if needed
kill -9 <PID>
```

### Issue: Search is Slow

**Symptoms:**
- Search takes 3-5 seconds with Phi3
- Feels unresponsive

**Diagnosis:**
```bash
# Check Phi3 logs
grep "Query analysis" .amalfa/logs/phi3.log | tail -10

# Look for slow responses
```

**Solutions:**

1. **Increase Timeout:**
```json
{
  "phi3": {
    "tasks": {
      "search": {
        "timeout": 10000  // Increase from 5000ms to 10s
      }
    }
  }
}
```

2. **Disable Phi3 for Specific Searches:**
```bash
# Temporarily disable for comparison
# Set phi3.enabled: false in config
# Run search, note time difference
```

3. **Use Faster Model:**
```bash
# Download smaller/faster model
ollama pull phi3:mini  # If available
```

Then update config:
```json
{
  "phi3": {
    "model": "phi3:mini"
  }
}
```

4. **Enable Health Check Cache** (Already Enabled):
- Health checks are cached for 30 seconds
- Repeated searches use cached result
- First search in 30s window has overhead

### Issue: "Phi3 Already Running"

**Symptoms:**
```bash
bun run amalfa phi3 start
# ⚠️  Phi3Agent is already running (PID: xxxxx)
```

**Solution 1: Stop First**
```bash
bun run amalfa phi3 stop
bun run amalfa phi3 start
```

**Solution 2: Use Restart**
```bash
bun run amalfa phi3 restart
```

**Solution 3: Kill and Restart**
```bash
# Find PID
cat .amalfa/runtime/phi3.pid

# Kill process
kill -9 <PID>

# Start fresh
bun run amalfa phi3 start
```

### Issue: Graceful Degradation Not Working

**Symptoms:**
- Phi3 is down, but search fails completely
- No results returned

**Solution:** Ensure Vector Engine is working
```bash
# Test vector search directly
bun run amalfa stats

# Should show database stats
```

If vector search works, Phi3 integration is failing, check:
```bash
# Check MCP logs
tail -50 .amalfa/logs/mcp.log

# Look for Phi3-related errors
```

## Performance Tuning

### Optimize for Speed

**Configuration:**
```json
{
  "phi3": {
    "tasks": {
      "search": {
        "timeout": 3000,      // Aggressive 3s timeout
        "priority": "high"
      }
    }
  }
}
```

**Trade-off:**
- Faster failures
- May timeout on complex queries
- More frequent fallbacks

### Optimize for Accuracy

**Configuration:**
```json
{
  "phi3": {
    "tasks": {
      "search": {
        "timeout": 10000,     // Generous 10s timeout
        "priority": "high"
      }
    }
  }
}
```

**Trade-off:**
- Slower responses
- Better quality results
- Fewer timeouts

### Model Selection

**Performance Comparison:**

| Model | Size | Speed | Quality | Best For |
|--------|------|-------|----------|-----------|
| phi3:latest | 2.2GB | Fast | Good | General purpose |
| phi3:mini | 1.1GB | Very Fast | Good | Development |
| mistral:7b | 4.1GB | Medium | Excellent | Accuracy |
| llama3.1:8b | 4.7GB | Medium | Good | Balance |

**Recommendations:**
- **Development**: Use `phi3:mini` for fast iteration
- **Production**: Use `phi3:latest` for good balance
- **Accuracy-Critical**: Use `mistral:7b` despite size

## Next Steps

After completing setup:

1. **Test Enhanced Search:**
   ```bash
   bun run amalfa serve
   # Use Claude Desktop to search
   # Compare Phi3-enabled vs Phi3-disabled searches
   ```

2. **Read System Overview:**
   ```bash
   # See: playbooks/phi3-system-overview.md
   # Understand architecture and data flow
   ```

3. **Read Usage Guide:**
   ```bash
   # See: playbooks/phi3-usage-guide.md
   # Learn when and how to use Phi3 effectively
   ```

4. **Monitor Performance:**
   ```bash
   # Check logs regularly
   tail -f .amalfa/logs/phi3.log
   ```

## Summary Checklist

- [ ] Ollama installed and verified (`ollama --version`)
- [ ] Phi3 model downloaded (`ollama list`)
- [ ] Ollama running (`ollama serve`)
- [ ] Phi3 enabled in config (`amalfa.config.json`)
- [ ] Phi3 daemon started (`bun run amalfa phi3 start`)
- [ ] Health check passing (`curl http://localhost:3012/health`)
- [ ] Query analysis tested (`/search/analyze` endpoint)
- [ ] Re-ranking tested (`/search/rerank` endpoint)
- [ ] Context extraction tested (`/search/context` endpoint)
- [ ] MCP integration working (enhanced search in Claude Desktop)

**When All Checked:**
✅ Phi3 setup is complete and ready to use!

See `playbooks/phi3-usage-guide.md` for detailed usage instructions and best practices.