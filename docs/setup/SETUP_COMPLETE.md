
<!-- tags: [SEE_ALSO: quick-start-mcp] -->
# AMALFA Complete Setup Guide

**From zero to running MCP server in 5 minutes.**

---

## Prerequisites

- **Bun installed** (v1.0+): `curl -fsSL https://bun.sh/install | bash`
- **Git** for cloning the repository
- **Claude Desktop** (or another MCP client)

---

## Step 1: Install AMALFA

### Option A: Install from npm (Recommended)

```bash
npm install -g amalfa
# or
bun install -g amalfa
```

**Package**: https://www.npmjs.com/package/amalfa

### Option B: Clone from GitHub (Development)

```bash
git clone https://github.com/pjsvis/amalfa.git
cd amalfa
bun install
```

**Note**: Option A is recommended for users. Option B is for contributors and development.

---

## Step 2: Configure Sources

Create or edit `amalfa.config.json` in your project root:

```json
{
  "sources": ["./docs", "./playbooks"],
  "database": ".amalfa/resonance.db",
  "embeddings": {
    "model": "BAAI/bge-small-en-v1.5",
    "dimensions": 384
  },
  "watch": {
    "enabled": true,
    "debounce": 1000
  },
  "excludePatterns": ["node_modules", ".git", ".amalfa"]
}
```

**Key fields**:
- `sources`: Directories containing your markdown files
- `database`: Where to store the SQLite database
- `embeddings.model`: Which embedding model to use (see [supported models](https://github.com/Anush008/fastembed-js))

**Example configs**:

<details>
<summary>Local Documentation</summary>

```json
{
  "sources": ["./docs", "./playbooks", "./briefs", "./debriefs"],
  "database": ".amalfa/my-project.db"
}
```
</details>

<details>
<summary>Cross-Project Knowledge</summary>

```json
{
  "sources": ["../project-a/docs", "../project-b/playbooks"],
  "database": ".amalfa/shared-knowledge.db"
}
```
</details>

---

## Step 3: Initialize Database

Run the init command to ingest your markdown files:

```bash
amalfa init
```

**What happens**:
1. **Pre-flight analysis**: Validates all markdown files
2. **Creates `.amalfa/` directory**
3. **Generates embeddings**: Downloads model on first run (~90MB cache)
4. **Creates SQLite database**: Stores graph structure and vectors
5. **Reports stats**: Files processed, nodes created, embeddings generated

**Output example**:
```
🚀 AMALFA Initialization

📁 Sources: ./docs, ./playbooks
💾 Database: .amalfa/resonance.db
🧠 Model: BAAI/bge-small-en-v1.5

🔍 Running pre-flight analysis...

📊 Pre-Flight Summary:
  Total files: 96
  Valid files: 96
  Skipped files: 0
  Total size: 0.54 MB
  Estimated nodes: 96

🗄️  Initializing database: /path/to/amalfa/.amalfa/resonance.db

  100% (96/96)

✅ Initialization complete!

📊 Summary:
  Files processed: 96
  Nodes created: 95
  Edges created: 0
  Embeddings: 95
  Duration: 0.26s
```

**Troubleshooting**:

<details>
<summary>⚠️ Pre-flight check failed with warnings</summary>

Fix issues or use:
```bash
amalfa init --force
```

Check `.amalfa-pre-flight.log` for details.
</details>

<details>
<summary>❌ No valid markdown files found</summary>

Verify your `sources` paths in `amalfa.config.json` exist and contain `.md` files.
</details>

---

## Step 4: Verify Installation

Run the doctor command to check everything is working:

```bash
amalfa doctor
```

**Expected output**:
```
🩺 AMALFA Health Check

✓ Bun runtime: OK
✓ Database found: /path/to/.amalfa/resonance.db (0.79 MB)
✓ AMALFA directory: /path/to/.amalfa
✓ Source directory: /path/to/docs
✓ Source directory: /path/to/playbooks
✓ FastEmbed: OK
✓ MCP SDK: OK

✅ All checks passed! AMALFA is ready to use.

Next steps:
  amalfa serve    # Start MCP server
  amalfa stats    # View database statistics
```

**If issues are found**, the doctor will tell you what's missing and how to fix it.

---

## Step 5: Generate MCP Configuration

Generate the JSON configuration for your MCP client:

**If installed globally (npm/bun)**:
```bash
amalfa setup-mcp
```

**If cloned from GitHub**:
```bash
bun run scripts/setup_mcp.ts
```

**Output** (copy this JSON):
```json
{
  "mcpServers": {
    "amalfa": {
      "command": "bun",
      "args": [
        "run",
        "/absolute/path/to/amalfa/src/mcp/index.ts"
      ],
      "env": {
        "PATH": "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
      }
    }
  }
}
```

**Note**: The path is absolute and machine-specific. If you move the `amalfa` folder, regenerate this config.

---

## Step 6: Configure MCP Client

### Claude Desktop (macOS)

1. **Open config file**:
   ```bash
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```
   
   If it doesn't exist:
   ```bash
   mkdir -p ~/Library/Application\ Support/Claude
   touch ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Paste the JSON** from Step 5. If the file already has content, merge the `amalfa` entry into the existing `mcpServers` object.

3. **Save and close**

### Warp Preview

1. Open Warp Preview MCP settings
2. Toggle off any existing AMALFA server
3. Toggle on (will reload config automatically)
4. Check status - should show "Connected"

### Other MCP Clients

Consult your client's documentation for MCP server configuration. The setup is similar - add the JSON block to the appropriate config file.

---

## Step 7: Restart Your MCP Client

**Claude Desktop**: Quit completely (Cmd+Q) and relaunch

**Warp Preview**: Toggle server off/on in MCP settings

---

## Step 8: Test the Connection

### Quick Test

In your MCP client (e.g., Claude), ask:

```
Search my knowledge base for "configuration"
```

Claude should invoke the `search_documents` tool and return relevant results from your markdown files.

### Detailed Test

Run the automated validation script:

```bash
bun run scripts/test-config-search.ts
```

This will:
- Load config
- Open database
- Run test queries
- Verify search accuracy
- Report results

**Expected**: All tests pass, 80%+ semantic accuracy

---

## Maintenance

### View Statistics

```bash
amalfa stats
```

Shows database size, node count, embeddings, etc.

### Re-ingest After Changes

After adding/modifying markdown files:

```bash
amalfa init
```

Or enable automatic watching:

```bash
amalfa daemon start
```

The daemon watches your source directories and auto-ingests changes.

### Validate Configuration

```bash
bun run validate-config
```

Checks for config conflicts and issues.

---

## Available MCP Tools

Once connected, AI agents can use:

### 1. `search_documents`
Semantic search over your knowledge base

**Parameters**:
- `query` (string): Search query
- `limit` (number, optional): Max results (default: 20)

**Example**: "Search for documents about TypeScript compilation"

### 2. `read_node_content`
Read full markdown content of a specific document

**Parameters**:
- `id` (string): Document ID from search results

**Example**: "Read the full content of config-unification-test.md"

### 3. `explore_links`
Find related documents (graph traversal)

**Parameters**:
- `id` (string): Starting document ID
- `relation` (string, optional): Relationship type

**Example**: "Show me documents related to embeddings-playbook.md"

### 4. `list_directory_structure`
List all documents in the knowledge base

**Parameters**: None

**Example**: "List all documents in my knowledge base"

### 5. `inject_tags` (Experimental)
Add semantic tags to a document

**Parameters**:
- `file_path` (string): Path to markdown file
- `tags` (array): Tags to add

**Example**: "Add #config #migration tags to the test document"

---

## Troubleshooting

### Server Not Connecting

1. **Check Bun path** matches your system:
   ```bash
   which bun
   ```
   
2. **Verify absolute path** in MCP config is correct

3. **Check server logs**:
   ```bash
   tail -f .mcp.log
   ```

4. **Test manually**:
   ```bash
   bun run src/mcp/index.ts
   ```
   Press Ctrl+C to stop.

### No Search Results

1. **Verify database exists**:
   ```bash
   ls -lh .amalfa/*.db
   ```

2. **Check what's indexed**:
   ```bash
   amalfa stats
   ```

3. **Re-run ingestion**:
   ```bash
   amalfa init
   ```

### Pre-flight Errors

Check `.amalfa-pre-flight.log` for detailed analysis of markdown files:
```bash
cat .amalfa-pre-flight.log
```

Common issues:
- Invalid frontmatter
- Files too large (>1MB)
- Binary files in source directories

---

## File Structure After Setup

```
your-project/
├── amalfa.config.json          # Your config
├── .amalfa/
│   ├── resonance.db            # SQLite database
│   ├── resonance.db-shm        # WAL shared memory
│   ├── resonance.db-wal        # Write-ahead log
│   └── cache/                  # Embedding model cache (~90MB)
├── .amalfa-daemon.pid          # Daemon process ID (if running)
├── .amalfa-daemon.log          # Daemon logs
├── .amalfa-pre-flight.log      # Pre-flight analysis results
├── .mcp.log                    # MCP server logs
└── [your markdown files]
```

---

## Next Steps

- ✅ **Setup complete!**
- ⏭️ [User Guide](./user-guide.md) - Best practices for structuring markdown
- ⏭️ [MCP Tools Reference](./MCP_SETUP.md) - Detailed tool documentation
- ⏭️ [Configuration Guide](./CONFIG_UNIFICATION.md) - Advanced config options

---

## Getting Help

- **Issues**: https://github.com/pjsvis/amalfa/issues
- **Discussions**: https://github.com/pjsvis/amalfa/discussions
- **Documentation**: https://github.com/pjsvis/amalfa/tree/main/docs
