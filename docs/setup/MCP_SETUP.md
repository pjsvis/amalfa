# AMALFA MCP Server Setup

**Guide to configuring AMALFA as an MCP server for Claude Desktop, Cursor, Windsurf, and other MCP clients.**

---

## Prerequisites

1. **Bun installed** (`v1.0+`)
2. **AMALFA repository cloned** and dependencies installed:
   ```bash
   git clone https://github.com/pjsvis/amalfa.git
   cd amalfa
   bun install
   ```
3. **Database initialized** (see Data Preparation below)

---

## Step 1: Prepare Your Data

Before starting the MCP server, you need to:

1. **Configure sources** in `amalfa.config.json`:
   ```json
   {
     "sources": ["./docs", "./playbooks"],
     "database": ".amalfa/resonance.db",
     "embeddings": {
       "model": "BAAI/bge-small-en-v1.5",
       "dimensions": 384
     }
   }
   ```

2. **Ingest your markdown documents**:
   ```bash
   bun run scripts/cli/ingest.ts
   ```
   
   This will:
   - Parse all markdown files from your source directories
   - Generate embeddings (first run downloads the model to `.amalfa/cache/`)
   - Create the SQLite database at `.amalfa/resonance.db`

---

## Step 2: Generate MCP Configuration

Run the built-in setup command to generate your machine-specific config:

```bash
amalfa setup-mcp
```

This will output configuration JSON like:

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
        "PATH": "..."
      }
    }
  }
}
```

**Important:** The path is absolute and machine-specific. If you move the amalfa folder, run this script again.

---

## Step 3: Configure Your MCP Client

### Claude Desktop (macOS)

1. **Open Claude Desktop config**:
   ```bash
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```
   
   Or create it if it doesn't exist:
   ```bash
   mkdir -p ~/Library/Application\ Support/Claude
   touch ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Add the AMALFA server** to the `mcpServers` section:
   ```json
   {
     "mcpServers": {
       "amalfa": {
         "command": "bun",
         "args": [
           "run",
           "/Users/yourusername/path/to/amalfa/src/mcp/index.ts"
         ],
         "env": {
           "PATH": "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
         }
       }
     }
   }
   ```
   
   **Note:** Use the exact JSON output from Step 2.

3. **Restart Claude Desktop**

4. **Verify connection**: In Claude Desktop, check the MCP icon/status—you should see "amalfa" listed as a connected server.

### Cursor / Windsurf

Check your IDE's MCP configuration documentation. The setup is similar—add the JSON block to the appropriate config file.

---

## Step 4: Test the Connection

### From Claude Desktop

Ask Claude:

```
Search my knowledge base for "embeddings"
```

Claude should use the `search_documents` tool and return results from your markdown files.

### From Command Line (Debug Mode)

You can test the MCP server directly:

```bash
bun run src/mcp/index.ts
```

This starts the server in stdio mode. It will log to `.mcp.log`.

Check the logs:
```bash
tail -f .amalfa/.mcp.log
```

---

## Available MCP Tools

Once connected, your AI agent can use these tools:

### 1. `search_documents`
**Description:** Semantic search over your knowledge base  
**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Max results (default: 20)

**Example:**
```
Search for documents about "vector embeddings"
```

### 2. `read_node_content`
**Description:** Read full markdown content of a specific document  
**Parameters:**
- `id` (string, required): Document ID from search results

**Example:**
```
Read the full content of document "docs/embeddings.md"
```

### 3. `explore_links`
**Description:** Find related documents (graph traversal)  
**Parameters:**
- `id` (string, required): Starting document ID
- `relation` (string, optional): Relationship type

**Example:**
```
Show me documents related to "playbooks/vector-search.md"
```

### 4. `list_directory_structure`
**Description:** List all documents in the knowledge base  
**Parameters:** None

**Example:**
```
List all documents in my knowledge base
```

### 5. `inject_tags` (Experimental)
**Description:** Add semantic tags to a document  
**Parameters:**
- `file_path` (string, required): Path to markdown file
- `tags` (array, required): List of tags to add

---

## Troubleshooting

### "Server not connecting"

1. **Check Bun is in PATH**:
   ```bash
   which bun
   ```
   
2. **Verify database exists**:
   ```bash
   ls -la .amalfa/resonance.db
   ```
   
   If missing, run ingestion again:
   ```bash
   bun run scripts/cli/ingest.ts
   ```

3. **Check server logs**:
   ```bash
   tail -n 50 .amalfa/.mcp.log
   ```

### "No results from search"

1. **Verify database has data**:
   ```bash
   sqlite3 .amalfa/resonance.db "SELECT COUNT(*) FROM nodes;"
   ```
   
   Should return a number > 0.

2. **Check embeddings**:
   ```bash
   sqlite3 .amalfa/resonance.db "SELECT COUNT(*) FROM node_embeddings;"
   ```

3. **Re-run ingestion** if counts are 0:
   ```bash
   bun run scripts/cli/ingest.ts
   ```

### "Error: ENOENT: no such file or directory"

The absolute path in your config is incorrect. Re-run:
```bash
bun run scripts/setup_mcp.ts
```

And update your MCP client config with the new path.

---

## Advanced Configuration

### Custom Database Path

Edit `amalfa.config.json`:
```json
{
  "database": ".amalfa/my-custom.db"
}
```

Then re-ingest and restart the MCP server.

### Multiple Source Directories

```json
{
  "sources": [
    "./docs",
    "./playbooks",
    "../other-project/docs"
  ]
}
```

### Environment Variables

You can override config with environment variables in your MCP client config:

```json
{
  "mcpServers": {
    "amalfa": {
      "command": "bun",
      "args": ["run", "/path/to/amalfa/src/mcp/index.ts"],
      "env": {
        "AMALFA_DB": ".amalfa/custom.db",
        "PATH": "..."
      }
    }
  }
}
```

---

## Next Steps

- **[User Guide](./user-guide.md)** - Learn how to structure your markdown for best results
- **[VISION-AGENT-LEARNING.md](./VISION-AGENT-LEARNING.md)** - Understand the brief-debrief-playbook pattern
- **[Configuration Status](./docs/_current-config-status.md)** - Configuration reference

---

## Support

- **Issues:** https://github.com/pjsvis/amalfa/issues
- **Discussions:** https://github.com/pjsvis/amalfa/discussions
