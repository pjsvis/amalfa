# AMALFA

## Environment Configuration

AMALFA uses environment variables for configuration. Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

### API Keys

**Important:** `.env` is the single source of truth for all API key secrets. Never commit `.env` to version control.

#### Required API Keys

- **GEMINI_API_KEY** - Google Gemini API key for LangExtract
  - Get from: https://makersuite.google.com/app/apikey

- **OPENROUTER_API_KEY** - OpenRouter API key for alternative LLM access
  - Get from: https://openrouter.ai/keys

- **MISTRAL_API_KEY** - Mistral AI API key
  - Get from: https://console.mistral.ai/

**Note:** Ollama uses Device Keys for authentication, not API keys. Device keys are SSH keys automatically managed by the Ollama CLI/daemon. Sign in to Ollama once with `ollama signin` to enable remote model access.

#### API Key Types

**SSH Keys (NOT for LLM APIs):**
- Format: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...`
- Used for: Git authentication, SSH access
- ❌ DO NOT use for LLM API calls

**API Keys (for LLM APIs):**
- Format: `sk-or-v1-...` or alphanumeric string
- Used for: Gemini, OpenRouter, Mistral
- ✅ MUST use for LLM API calls

**Device Keys (for Ollama):**
- Format: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...`
- Used for: Ollama CLI/daemon authentication
- ✅ Automatically managed by Ollama, not stored in `.env`
- ✅ Enable remote model access via `localhost:11434`

**Example of WRONG usage:**
```bash
# ❌ WRONG - Don't use Ollama device keys for LLM APIs
GEMINI_API_KEY=ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...
```

**Example of CORRECT usage:**
```bash
# ✅ CORRECT - Use proper API keys for LLM providers
GEMINI_API_KEY=AIzaSyDoR3Mtn7nfMOdcb6Jr4_9nkom4GTRlSaQ
OPENROUTER_API_KEY=sk-or-v1-ee376bfacffc67c6ed30209a46c67c3d...

# ✅ CORRECT - Ollama device keys are managed by Ollama CLI
# Sign in once: ollama signin
# Device keys are automatically added to your Ollama account
```

### Security Best Practices

1. Never commit `.env` to version control
2. Use strong, unique API keys for each service
3. Rotate API keys regularly
4. Use different keys for dev/staging/production
5. Monitor API usage and costs

### Ollama Configuration

AMALFA uses Ollama for local and remote model access via `localhost:11434`. No API key is required - Ollama uses device keys automatically.

**Ollama Device Keys:**
- Device keys are SSH keys that allow Ollama CLI/daemon to access cloud models
- Automatically added when you sign in to Ollama
- Managed by Ollama, not stored in `.env`
- Enable remote model access without API configuration

**Setup:**
```bash
# Sign in to Ollama (adds device key automatically)
ollama signin

# View your device keys in Ollama account settings
# https://ollama.com/account
```

**Local Models:** Run entirely on your machine (private, slow)
- Example: `mistral-nemo:latest` (7.1 GB)
- Pull with: `ollama pull mistral-nemo:latest`

**Remote Models:** Proxied to ollama.com (fast, requires internet)
- Example: `nemotron-3-nano:30b-cloud` (30B parameters)
- Pull with: `ollama pull nemotron-3-nano:30b-cloud`
- Uses device keys for automatic authentication

Configure in `amalfa.config.json`:
```json
{
  "langExtract": {
    "provider": "ollama",
    "ollama": {
      "host": "http://localhost:11434",
      "model": "nemotron-3-nano:30b-cloud"  // or "mistral-nemo:latest"
    }
  }
}
```


**A Memory Layer For Agents**

[![npm](https://img.shields.io/npm/v/amalfa?logo=npm)](https://www.npmjs.com/package/amalfa)
[![downloads](https://img.shields.io/npm/dm/amalfa)](https://www.npmjs.com/package/amalfa)

Give your AI agents persistent memory and semantic search across sessions.

---

## What It Does

**Without Amalfa:**
- Agents forget context between conversations
- Same research repeated every session  
- No institutional memory
- Knowledge resets constantly

**With Amalfa:**
- Agents query past work: "What did we learn about auth?"  
- Semantic search across all documentation
- Persistent memory through structured reflection (briefs → debriefs → playbooks)
- Knowledge compounds over time

**How it works:** You write markdown. Amalfa indexes it into a searchable knowledge graph. AI agents access it via Model Context Protocol (MCP).

---

## What Agents Can Do

Via MCP, agents get 8 tools:

- **search_documents(query)** - Semantic search across all markdown  
- **read_node_content(id)** - Read full document content  
- **explore_links(id)** - Traverse document relationships  
- **find_gaps()** - Discover similar but unlinked documents  
- **list_directory_structure()** - Show document organization  
- **inject_tags(path, tags)** - Add metadata to documents  
- **scratchpad_read/list()** - Cache management for large outputs

**Example Session:**
```
Agent: "What did we learn about database migrations?"
→ search_documents("database migrations lessons")
→ Returns ranked debriefs with past learnings
→ Agent applies proven patterns to new work
```

**Performance:** Sub-second searches across 1000+ documents. 4.6x faster than grep. 95% search precision.

👉 **Full Tool Reference:** [MCP Tools Documentation](docs/MCP-TOOLS.md)

---

## CLI Mode: Direct Command Line Access

**Amalfa doesn't require running as an MCP server.** All core search capabilities are available directly from the command line:

### Search Commands

```bash
# Semantic search across knowledge graph
amalfa search "oauth patterns" --limit 10

# Read full document content
amalfa read docs/auth-guide.md

# Explore document relationships
amalfa explore docs/auth-guide.md --relation references

# List configured source directories
amalfa list-sources

# Discover similar but unlinked documents (requires Sonar)
amalfa find-gaps --limit 5 --threshold 0.7

# Add metadata tags to documents
amalfa inject-tags docs/auth.md "authentication" "security"
```

### Service Management Commands

```bash
# Manage file watcher daemon (start|stop|status|restart)
amalfa watcher start
amalfa watcher stop
amalfa watcher status

# Stop all running AMALFA services
amalfa kill

# Ingest sidecar JSON files into the graph
amalfa squash
```

### Setup Commands

```bash
# Initialize Python sidecar environment (for LangExtract)
amalfa setup-python
```

### JSON Output for Scripting

All commands support `--json` for programmatic use:

```bash
# Machine-readable output
amalfa search "database migrations" --json | jq '.[0].id'

# Chain commands
amalfa search "auth" --json | jq '.[0].id' | xargs amalfa read

# Integrate with CI/CD
amalfa find-gaps --json | jq 'length' # Count unlinked documents
```

### When to Use CLI vs MCP

**Use CLI when:**
- Testing queries without MCP overhead
- Scripting and automation (CI/CD, shell scripts)
- Human power users who prefer terminal
- Agents that execute shell commands (vs MCP protocol)
- One-shot queries (no server needed)

**Use MCP when:**
- Integrated with Claude Desktop or other MCP clients
- Multi-turn agent conversations
- Need scratchpad caching (MCP-only feature)
- Prefer agent-native tool calling

---

## Prompting Your Agent to Use Amalfa

**Amalfa works best when you establish a knowledge-building habit with your agent.**

### Effective Prompts

**During work:**
- "What have we learned about [topic]?" → Triggers `search_documents`
- "Check if we've solved this before" → Searches past solutions
- "What patterns did we discover?" → Queries playbooks

**After work:**
- "Write a debrief of what we learned" → Encourages documentation
- "Update the playbook with this pattern" → Codifies knowledge
- "What related work should be linked?" → Triggers `find_gaps`

### Building Institutional Memory

**Session start:**
```
You: "Before we start, search for any past work on [topic]"
Agent: [Uses search_documents to query knowledge graph]
Agent: "Found 3 relevant debriefs from previous sessions..."
```

**During problem-solving:**
```
You: "Have we encountered this error before?"
Agent: [Searches past debugging sessions]
Agent: "Yes, in debrief-auth-safari we learned..."
```

**Session end:**
```
You: "Write a debrief capturing what we learned"
Agent: [Creates debrief in markdown]
You: "Now ingest it: amalfa init"
```

### When NOT to Prompt

**Let agents decide when:**
- They're working on completely novel problems
- Quick one-off tasks that won't recur
- You explicitly want fresh thinking without past bias

**The goal:** Build compounding knowledge, not create busywork.

---

## The Problem

**Scenario:** You're debugging authentication for the 3rd time.

**Without Amalfa:**
- Agent searches codebase from scratch  
- Rediscovers same issues  
- Repeats same solutions  
- Context resets every conversation

**With Amalfa:**
```
Agent queries: "past auth debugging sessions"
→ Finds debrief from 2 weeks ago
→ "We learned the token refresh fails in Safari due to cookie scope"
→ Applies fix immediately
```

**Result:** 10-minute fix instead of 2-hour investigation.

👉 **Deep Dive:** [Why Structured Reflection Beats Infinite Context](docs/WHY-STRUCTURED-REFLECTION.md)

---

## Core Philosophy: Markdown as Source of Truth

**The Inversion:** Traditional systems treat databases as truth and files as exports. Amalfa inverts this.

```
Markdown Files (filesystem)     ← Source of truth
    ↓
Ingestion Pipeline
    ↓
SQLite Database (.amalfa/)      ← Disposable cache
    ↓
MCP Server → AI Agents
```

**Key principle:** The database can be deleted and regenerated anytime without data loss.

### Why This Matters

✅ **Zero migration hell** - Upgrade by re-ingesting. No migration scripts.  
✅ **Model flexibility** - Change embedding models without data loss.  
✅ **Corruption immunity** - `rm .amalfa/resonance.db* && amalfa init` fixes everything.
✅ **Git-native** - Version control your knowledge, not your indexes.  
✅ **Deterministic** - Same markdown → same database state.

### Maintenance

**Two commands:**
- `amalfa init` - Regenerate database from markdown (safe, fast)
- `amalfa doctor` - Health check (rarely needed)

**No migrations. No backups. No complex maintenance.**

When something breaks: delete `.amalfa/` and re-ingest. Takes seconds, not hours.


---

## Architecture

**Technology Stack:**
- Bun (TypeScript runtime)
- SQLite (local-first database)
- FastEmbed (bge-small-en-v1.5, 384-dim vectors)
- Model Context Protocol (MCP)

**Data Flow:**
```
Markdown → Parser → [Nodes + Edges] → SQLite
                  ↓
              Vector Embeddings (FAFCAS normalized)
                  ↓
              Semantic Search → MCP Tools → Agents
```

**Key Designs:**
- **Hollow Nodes:** Metadata in SQLite, content on filesystem (git-friendly)
- **FAFCAS Protocol:** Normalized vectors enable 10x faster similarity search
- **Service Daemons:** Background file watching, vector generation, reranking

👉 **Deep Dive:** [Architecture Documentation](docs/ARCHITECTURE.md)

## Quick Start

### Installation

**Requires Bun** (v1.0+) - [Install Bun](https://bun.sh)

```bash
bun install -g amalfa
```

**IMPORTANT**: Amalfa must be installed via **Bun only**. Do not use npm or other package managers.

**Why Bun?**
- ⚡ **Fast startup** - Critical for stdio-based MCP servers that spawn on every request
- 🔄 **Built-in daemon management** - Runs background processes for file watching and vector embeddings
- 📦 **Native TypeScript** - No compilation step, direct execution from source
- 🎯 **SQLite performance** - Optimized native bindings for database operations

### Uninstalling

```bash
bun remove -g amalfa
```

**Note**: Bun and npm maintain separate package registries. If you accidentally tried `npm install -g amalfa`, it won't work. Always use Bun for Amalfa installation and removal.

**From source** (for development):
```bash
git clone https://github.com/pjsvis/amalfa.git
cd amalfa
bun install  # Must use bun, not npm
```

### Common Gotchas

#### "I can't uninstall amalfa"

**Problem**: `npm uninstall -g amalfa` does nothing.

**Cause**: Bun and npm are **separate package managers** with separate:
- Installation directories (`~/.bun/bin/` vs `/usr/local/lib/node_modules/`)
- Package databases
- Binary locations

Think of them as **crossed porpoises**—two systems swimming in opposite directions, each functional in its own ecosystem, but never coordinating.

**Solution**: Use the same package manager you installed with:
```bash
# If installed with Bun (correct)
bun remove -g amalfa

# If you somehow have a stale npm install
npm uninstall -g amalfa
```

**Check which is active**:
```bash
which amalfa
# ~/.bun/bin/amalfa = Bun install ✓
# /usr/local/bin/amalfa = npm install (wrong)
```

#### "amalfa command not found after install"

**Problem**: Shell can't find the `amalfa` binary.

**Cause**: `~/.bun/bin` not in your `$PATH`.

**Solution**: Add to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export PATH="$HOME/.bun/bin:$PATH"
```
Then reload: `source ~/.zshrc`

#### "Why can't I use npm? It's on npmjs.org"

**Answer**: Amalfa is **published** to npm (for discoverability) but **requires Bun to run**. This is because:
- Bun's native TypeScript execution (no build step)
- Optimized SQLite bindings
- Daemon lifecycle management
- Faster stdio transport for MCP

Think of it like a Rust crate that's listed but requires `cargo` to build. npm and Bun are crossed porpoises—both legitimate package managers, but trying to use one to manage the other's installations leads nowhere.

#### "trustedDependencies in package.json?"

These packages (`onnxruntime-node`, `protobufjs`) run native build scripts during `bun install`. Bun blocks untrusted scripts by default. This whitelist lets them compile native bindings for ML operations.

### Setup MCP Server

1. **Configure your sources** in `amalfa.config.json`:
   ```json
   {
     "sources": ["./docs", "./playbooks"],
     "database": ".amalfa/resonance.db"
   }
   ```

2. **Ingest your markdown**:
   ```bash
   amalfa init
   ```

3. **Generate MCP config**:
   ```bash
   amalfa setup-mcp
   ```

4. **Add to Claude Desktop**: Copy the JSON output to:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

5. **Restart Claude Desktop**

**Full setup guide:** See repository docs for detailed MCP setup

**Package:** Available at https://www.npmjs.com/package/amalfa

---



## Implementation Status

### ✅ Core Functionality (v1.4.0 - Released)

- ✅ **MCP Server** - stdio transport, tools, resources
- ✅ **Vector Search** - FastEmbed embeddings (384-dim), semantic search
- ✅ **Reranking** - BGE-M3 cross-encoder for high precision
- ✅ **Database** - SQLite with hollow nodes, FAFCAS protocol
- ✅ **Ingestion Pipeline** - Markdown → nodes + embeddings
- ✅ **CLI** - init, serve, stats, doctor, servers, daemon, vector, reranker
- ✅ **Service Management** - Vector/Reranker daemons, file watcher, Sonar agent
- ✅ **Pre-flight Validation** - Check markdown before ingestion

### 🚧 Phase 1: Auto-Augmentation (In Progress)

- [ ] Entity extraction from markdown
- [ ] Auto-linking (wiki-style [[links]])
- [ ] Tag extraction and indexing
- [ ] Git-based auditing for augmentations
- [x] Automated file watcher updates

### 🚧 Phase 2: Ember Service (Automated Enrichment)
- ✅ **Analyzer** - Louvain community detection & heuristics
- ✅ **Sidecar Generator** - Safe proposal mechanism (`.ember.json`)
- ✅ **Squasher** - Robust metadata merging (preserves user content)
- ✅ **CLI** - `amalfa ember scan/squash` commands

### 📋 Phase 3: Latent Space Organization (Planned)

- [ ] Document clustering (HDBSCAN)
- [ ] Cluster label generation
- [ ] Confidence-based tagging
- [ ] Topic modeling (BERTopic)
- [ ] Self-organizing taxonomy

### 🔗 Phase 3: Graph Intelligence (Planned)

- [ ] K-nearest neighbor recommendations
- [ ] Suggested reading lists
- [ ] Temporal sequence tracking
- [ ] Backlink maintenance
- [ ] Graph traversal tools

### 🎯 Phase 4: Learning from Feedback (Future)

- [ ] Track human edits to augmentations
- [ ] Adjust confidence thresholds
- [ ] Improve extraction heuristics
- [ ] Weekly knowledge digest
- [ ] Multi-agent coordination

---

## Development

### Prerequisites

- **Bun:** v1.0+ (required - cannot use npm/yarn/pnpm)
- **Git:** For version control

**Note**: Node.js is NOT required. Bun replaces Node entirely.

### Setup

```bash
# Clone repo
git clone https://github.com/pjsvis/amalfa.git
cd amalfa

# Install dependencies
bun install

# Run tests
bun test
```

### Commands

```bash
# Core commands (after global install: bun install -g amalfa)
amalfa init                      # Initialize database from markdown
amalfa serve                     # Start MCP server (stdio)
amalfa stats                     # Show database statistics
amalfa doctor                    # Health check
amalfa setup-mcp                 # Generate MCP config
amalfa --help                    # Show help

# Search commands (CLI mode)
amalfa search <query>            # Semantic search [--limit N] [--json]
amalfa read <node-id>            # Read document content [--json]
amalfa explore <node-id>         # Show related documents [--relation type] [--json]
amalfa list-sources              # Show configured source directories
amalfa find-gaps                 # Discover unlinked documents [--limit N] [--threshold T] [--json]
amalfa inject-tags <path> <tags> # Add metadata to markdown [--json]

# Service management
amalfa servers           # Show all service status
amalfa servers --dot     # Generate DOT diagram
amalfa stop-all          # Stop all running services (alias: kill)

# Individual services (start|stop|status|restart)
amalfa watcher <action>  # File watcher daemon
amalfa vector <action>   # Vector embedding daemon
amalfa reranker <action> # Reranking daemon
amalfa sonar <action>    # Sonar AI agent
amalfa ember <action>    # Ember enrichment (scan|squash)

# Local development scripts (bun run <script>)
bun run servers          # Test servers command
bun run servers:dot      # Test DOT diagram
bun run stats            # Test stats
bun run doctor           # Test doctor
bun run help             # Show CLI help

# Code quality
bun test                 # Run tests
bun run check            # Biome check
bun run format           # Biome format
```

---

## Documentation

**Core Docs:**
- [MCP Tools Reference](docs/MCP-TOOLS.md) - Complete guide to agent tools
- [Architecture Deep Dive](docs/ARCHITECTURE.md) - Technical implementation details
- [Vision & Philosophy](docs/VISION-AGENT-LEARNING.md) - Why structured reflection works
- [User Manual](docs/USER-MANUAL.md) - Setup, maintenance, troubleshooting

**Playbooks:**
- [FAFCAS Protocol](playbooks/embeddings-and-fafcas-protocol-playbook.md) - Vector search optimization
- [Local-First Architecture](playbooks/local-first-vector-db-playbook.md) - Database patterns
- [Problem Solving](playbooks/problem-solving-playbook.md) - Debugging strategies

---

## Contributing

Amalfa is in active development. Contributions are welcome!

**How to contribute:**
- ⭐ Star the repo if you find it useful
- 🐛 Report bugs or request features via issues
- 📝 Improve documentation
- 🚀 Submit PRs for new features or fixes
- 💬 Join discussions about the vision and roadmap

---

## License

MIT

---

## Lineage

Amalfa evolved from patterns discovered in the [PolyVis](https://github.com/pjsvis/polyvis) project, where agents spontaneously maintained documentation through brief-debrief-playbook workflows.

**Key insight:** When given minimal structure, agents naturally build institutional memory. Amalfa scales this with semantic infrastructure.

---

## Roadmap

### v1.0 (Released)

- ✅ Published to npm
- ✅ Core vision documented
- ✅ Auto-augmentation design complete
- ✅ MCP server functional
- ✅ Basic semantic search working
- ✅ Initial release

### v1.1+ (Future)

- Latent space clustering
- Multi-agent knowledge sharing
- Cross-repo knowledge graphs
- Agent-to-agent learning

---

**Built with ❤️ by developers frustrated with context loss.**

---

## Acknowledgments

AMALFA leverages the powerful [Graphology](https://graphology.github.io/) library for in-memory graph analysis. Graphology is published on Zenodo with a DOI ([10.5281/zenodo.5681257](https://doi.org/10.5281/zenodo.5681257)).
