# AMALFA MCP Quick Start

**Get AMALFA running with Claude Desktop in 5 minutes.**

---

## Current Status

✅ **Database exists**: `.amalfa/resonance.db` (2.4 MB)  
✅ **Dependencies installed**: `node_modules/` present  
✅ **MCP server ready**: `src/mcp/index.ts`

---

## Quick Setup (Claude Desktop)

### 1. Generate your configuration

```bash
cd /Users/petersmith/Documents/GitHub/amalfa
bun run scripts/setup_mcp.ts
```

Copy the JSON output (will look like this):

```json
{
  "mcpServers": {
    "amalfa": {
      "command": "bun",
      "args": [
        "run",
        "/Users/petersmith/Documents/GitHub/amalfa/src/mcp/index.ts"
      ],
      "env": {
        "PATH": "..."
      }
    }
  }
}
```

### 2. Add to Claude Desktop

**Open config file:**
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Paste the JSON** from step 1. If the file already has content, merge the `amalfa` entry into the existing `mcpServers` object.

**Example final config:**
```json
{
  "mcpServers": {
    "amalfa": {
      "command": "bun",
      "args": [
        "run",
        "/Users/petersmith/Documents/GitHub/amalfa/src/mcp/index.ts"
      ],
      "env": {
        "PATH": "/usr/local/bin:/usr/bin:/bin"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

Quit and relaunch Claude Desktop completely (Cmd+Q, then reopen).

### 4. Test it

In Claude Desktop, ask:

```
Search my knowledge base for "embeddings"
```

Claude should invoke the `search_documents` tool and return results from your markdown files.

---

## What's in Your Database?

Check what's indexed:

```bash
sqlite3 .amalfa/resonance.db "SELECT COUNT(*) FROM nodes;"
sqlite3 .amalfa/resonance.db "SELECT COUNT(*) FROM node_embeddings;"
sqlite3 .amalfa/resonance.db "SELECT id, type FROM nodes LIMIT 10;"
```

---

## Troubleshooting

### "Server not connecting"

1. **Verify Bun path in Claude config** matches your system:
   ```bash
   which bun
   ```

2. **Check server logs**:
   ```bash
   tail -f .amalfa/.mcp.log
   ```

3. **Test manually**:
   ```bash
   bun run src/mcp/index.ts
   ```
   Press Ctrl+C to stop. Check for errors in the startup output.

### "No results from search"

**Option A: Re-ingest from current config**

Your `amalfa.config.json` currently points to:
```json
{
  "sources": ["../polyvis/docs", "../polyvis/playbooks"]
}
```

If you want to index **local** amalfa docs instead:

1. **Edit** `amalfa.config.json`:
   ```json
   {
     "sources": ["./docs", "./playbooks"],
     "database": ".amalfa/resonance.db"
   }
   ```

2. **Re-ingest**:
   ```bash
   bun run scripts/cli/ingest.ts
   ```

**Option B: Keep polyvis sources**

If you want to keep searching polyvis content, ensure `../polyvis` exists and contains the docs/playbooks folders.

---

## Next Steps

- **[Full MCP Setup Guide](./MCP_SETUP.md)** - Advanced configuration, troubleshooting
- **[User Guide](./user-guide.md)** - How to structure markdown for best results
- **[Configuration Status](./docs/_current-config-status.md)** - All config files explained

---

## Available Tools

Once connected, Claude can use:

- `search_documents` - Semantic search
- `read_node_content` - Read full markdown file
- `explore_links` - Graph traversal
- `list_directory_structure` - List all documents
- `inject_tags` - Add tags (experimental)

See [MCP_SETUP.md](./MCP_SETUP.md) for details.
