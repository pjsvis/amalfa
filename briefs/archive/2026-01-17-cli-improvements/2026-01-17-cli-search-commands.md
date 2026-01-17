---
date: 2026-01-17
tags: [brief, cli, search, ux, architecture]
status: approved
---

# Brief: CLI-First Search Commands

## Problem

Amalfa currently exposes semantic search and graph operations **only** via MCP server (`amalfa serve`). This means:

1. **Agents without MCP support** cannot use Amalfa
2. **Power users** cannot query the knowledge graph directly from terminal
3. **Shell scripts** cannot integrate with Amalfa
4. **Debugging** requires starting MCP server and using protocol
5. **Architecture is backwards** - MCP should be a layer on top of CLI, not the only interface

**Current state:**
```bash
# ❌ This doesn't exist
$ amalfa search "oauth patterns"
Unknown command: search

# ✅ This works (but requires MCP client)
$ amalfa serve
# Then use MCP client to call search_documents()
```

## Vision

Amalfa should be a **powerful CLI tool first**, with MCP as a convenience layer for AI agents.

**Desired state:**
```bash
# Human-readable output (default)
$ amalfa search "oauth patterns"
Found 3 results:

1. playbooks/oauth-patterns.md (score: 0.92)
   JWT token refresh patterns for Safari cookie scope...

2. debriefs/oauth-safari.md (score: 0.87)
   Debugging OAuth in Safari - cookie scope issues...

# Machine-readable output (for scripts/agents)
$ amalfa search "oauth patterns" --json
[
  {
    "id": "playbooks/oauth-patterns.md",
    "score": 0.92,
    "preview": "JWT token refresh patterns..."
  },
  ...
]

# Piping to other tools (Unix philosophy)
$ amalfa search "auth" --json | jq '.[0].id' | xargs amalfa read
[Full content of top result]
```

## Benefits

1. **Agent Flexibility** - Works with any agent that can execute shell commands
2. **Human UX** - Direct terminal access for power users
3. **Scripting** - Easy integration with shell scripts, CI/CD
4. **Debugging** - Test queries without MCP protocol overhead
5. **Performance Testing** - Benchmark search without server latency
6. **Unix Philosophy** - Composable, pipeable, scriptable
7. **No Server Required** - One-shot queries don't need daemon

## Scope

### Phase 1: Core Search (1 hour)
**Goal:** Basic semantic search from CLI

**Commands:**
```bash
amalfa search <query> [--limit N] [--json]
amalfa read <node-id>
```

**Implementation:**
- `src/cli/commands/search.ts` - New command handler
- `src/cli/commands/read.ts` - New command handler
- Reuse existing `VectorEngine` and `GraphGardener`
- Add `--json` flag for machine-readable output
- Human-readable output uses colors/formatting

### Phase 2: Graph Operations (1 hour)
**Goal:** Graph traversal from CLI

**Commands:**
```bash
amalfa explore <node-id> [--relation type] [--json]
amalfa list-sources
```

**Implementation:**
- `src/cli/commands/explore.ts` - New command handler
- Reuse `GraphEngine`
- `list-sources` is trivial (already have the data)

### Phase 3: Advanced Features (2 hours)
**Goal:** Gap discovery and metadata injection

**Commands:**
```bash
amalfa find-gaps [--limit N] [--threshold X] [--json]
amalfa inject-tags <path> <tags...>
```

**Implementation:**
- Requires Sonar for gap detection (same as MCP)
- Tag injection already exists as utility
- Just needs CLI wrapper

### Phase 4: Polish (1 hour)
**Goal:** Consistency and documentation

**Tasks:**
- Ensure all commands support `--json` flag
- Update README with CLI examples
- Add "CLI vs MCP Mode" documentation section
- Update WARP.md with new commands
- Add command-specific help (e.g., `amalfa search --help`)

## Out of Scope

- `scratchpad_read/list` - Not useful in CLI context (single-shot execution)
- Interactive REPL - Maybe future, but not needed now
- Streaming results - Future enhancement

## Technical Design

### Command Pattern
All commands follow this pattern:

```typescript
// src/cli/commands/search.ts
export async function cmdSearch(args: string[]) {
  // 1. Parse args
  const query = args[0];
  const limit = parseFlag(args, "--limit", 20);
  const jsonOutput = args.includes("--json");

  // 2. Connect to database
  const dbPath = await getDbPath();
  const db = new ResonanceDB(dbPath);
  const vectorEngine = new VectorEngine(db);

  // 3. Execute search
  const results = await vectorEngine.search(query, limit);

  // 4. Format output
  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    // Human-readable output
    console.log(`Found ${results.length} results:\n`);
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.id} (score: ${r.score.toFixed(2)})`);
      console.log(`   ${r.preview}\n`);
    });
  }

  // 5. Cleanup
  db.close();
}
```

### Output Format Standards

**Human-readable:**
- Colors via ANSI codes (optional, detect TTY)
- Clear sections/headings
- Scores rounded to 2 decimals
- Previews truncated to 80 chars

**JSON (`--json` flag):**
- Valid JSON to stdout
- Errors to stderr
- Exit code 0 = success, 1 = error
- Schema matches MCP tool output where possible

### Error Handling

```bash
# Database not initialized
$ amalfa search "test"
❌ Database not found. Run 'amalfa init' first.
Exit code: 1

# With --json flag
$ amalfa search "test" --json
{"error": "Database not found", "suggestion": "Run 'amalfa init'"}
Exit code: 1
```

## Implementation Plan

### Step 1: Branch Setup
```bash
git checkout -b feature/cli-search-commands
```

### Step 2: Implement Core Search (Phase 1)
1. Create `src/cli/commands/search.ts`
2. Create `src/cli/commands/read.ts`
3. Add cases to `src/cli.ts` switch statement
4. Add `--json` flag support
5. Test with various queries

### Step 3: Implement Graph Operations (Phase 2)
1. Create `src/cli/commands/explore.ts`
2. Add `list-sources` (trivial, might just add to existing command)
3. Update CLI dispatcher

### Step 4: Advanced Features (Phase 3)
1. Create `src/cli/commands/find-gaps.ts`
2. Wrap existing `inject-tags` utility
3. Ensure Sonar integration works

### Step 5: Documentation (Phase 4)
1. Update README.md with CLI examples
2. Add "CLI vs MCP" section
3. Update WARP.md
4. Add command-specific `--help` output

### Step 6: Testing
```bash
# Manual testing
amalfa search "test query"
amalfa search "test" --json
amalfa read "docs/README.md"
amalfa explore "doc-123"
amalfa find-gaps --limit 5

# Check consistency
bun run consistency-report
bun run precommit
```

### Step 7: Merge
```bash
git add -A
git commit -m "feat: add CLI search commands

- Add amalfa search with --json support
- Add amalfa read for content retrieval
- Add amalfa explore for graph traversal
- Add amalfa find-gaps for gap discovery
- Add amalfa list-sources
- Update documentation with CLI examples

Closes: Brief 2026-01-17-cli-search-commands

Co-Authored-By: Warp <agent@warp.dev>"
git push origin feature/cli-search-commands
```

## Success Criteria

- ✅ `amalfa search "query"` returns human-readable results
- ✅ `amalfa search "query" --json` returns valid JSON
- ✅ `amalfa read <id>` displays full content
- ✅ `amalfa explore <id>` shows related nodes
- ✅ All commands have `--help` output
- ✅ Documentation updated with CLI examples
- ✅ Consistency check passes (98%+)
- ✅ Precommit passes

## Future Enhancements

- `amalfa search --interactive` - REPL mode with readline
- `amalfa search --stream` - Stream results as they're found
- `amalfa graph viz` - Generate graphviz visualization
- `amalfa query` - SQL-like query language
- `amalfa export` - Export knowledge graph to various formats

## References

- **Existing MCP Implementation:** `src/mcp/index.ts` (lines 224-569)
- **VectorEngine:** `src/core/VectorEngine.ts`
- **GraphGardener:** `src/core/GraphGardener.ts`
- **CLI Dispatcher:** `src/cli.ts` (switch statement line 102+)
- **Unix Philosophy:** Make each program do one thing well, composable via pipes
