# CLI Search Commands Implementation Debrief

**Date:** 2026-01-17  
**Brief:** [2026-01-17-cli-search-commands.md](../briefs/2026-01-17-cli-search-commands.md)  
**Status:** ✅ Complete - All 4 phases implemented, merged to main

## What We Built

Added 6 CLI search commands to Amalfa, enabling direct command-line access to search capabilities without requiring MCP server:

### Commands Implemented

1. **`amalfa search <query>`** - Semantic search with `--limit` and `--json`
2. **`amalfa read <node-id>`** - Read full document content  
3. **`amalfa explore <node-id>`** - Traverse relationships with `--relation` filter
4. **`amalfa list-sources`** - Show configured source directories
5. **`amalfa find-gaps`** - Discover unlinked documents (requires Sonar)
6. **`amalfa inject-tags <path> <tags>`** - Add metadata to markdown files

### Key Features

- **JSON output:** All commands support `--json` flag for scripting
- **Unix philosophy:** Composable, pipeable (e.g., `amalfa search "auth" --json | jq '.[0].id' | xargs amalfa read`)
- **Human-friendly:** Helpful tips, formatted output, clear error messages
- **Performance:** Used `indexOf` instead of `findIndex` for simple equality checks

## What Went Well

### 1. Clear Phase Structure
Breaking work into 4 phases (search → graph → advanced → docs) made progress trackable and allowed incremental validation.

### 2. Consistent Argument Parsing Pattern
Established standard pattern for handling both `--flag=value` and `--flag value` formats:
```typescript
const limitEqIdx = args.findIndex((arg) => arg.startsWith("--limit="));
const limitSpaceIdx = args.indexOf("--limit");
```

### 3. Dual Output Modes
Having both human-readable and JSON output from day one made commands useful for both interactive use and scripting.

### 4. Documentation First
Added comprehensive "CLI vs MCP" sections to README and WARP.md, clarifying when to use each mode.

### 5. Reused Existing Infrastructure
- VectorEngine for search
- GraphGardener for content retrieval
- Raw SQL for graph traversal (like MCP implementation)
- TagInjector utility for metadata injection
- Sonar client for gap detection

## What We Learned

### Technical Insights

**1. VectorEngine Initialization**
- Requires `db.getRawDb()` not `db` instance
- Always close database connection in `finally` block

**2. Graph Traversal**
- Don't need GraphEngine for simple edge queries
- Raw SQL is more efficient: `SELECT target, type FROM edges WHERE source = ?`
- MCP implementation already used raw SQL - followed same pattern

**3. Argument Parsing Edge Cases**
- Must handle both `--flag=value` and `--flag value` formats
- `findIndex` with predicate for complex checks (e.g., `startsWith`)
- `indexOf` for simple equality checks (performance optimization)
- Biome lint rules prefer `indexOf` over `findIndex` when appropriate

**4. Service Dependencies**
- `find-gaps` requires Sonar service to be running
- Check availability with `sonarClient.isAvailable()` before executing
- Provide helpful error messages when service not available

**5. Performance Optimizations**
- Replace `findIndex((arg) => arg === "--flag")` with `indexOf("--flag")`
- Biome automatically suggests these optimizations
- Safe to apply: `indexOf` returns -1 when not found (same as `findIndex`)

### Design Patterns

**1. Command Structure**
Every command follows same pattern:
1. Parse arguments (query, flags)
2. Validate inputs (helpful errors)
3. Connect to database
4. Execute operation
5. Format output (JSON or human-readable)
6. Cleanup (close connections)

**2. Error Handling**
- Consistent error messages between JSON and human modes
- Exit code 1 for all errors
- Suggest next steps (e.g., "Run 'amalfa init' first")

**3. CLI Dispatcher Pattern**
```typescript
case "search":
  await cmdSearch(args.slice(1)); // Remove command name
  break;
```
Important: Use `args.slice(1)` to remove command name before passing to handler.

## Challenges & Solutions

### Challenge 1: Unused Import Warning
**Problem:** Imported `GraphEngine` in search.ts but didn't use it.  
**Solution:** Removed import after realizing VectorEngine was sufficient.  
**Lesson:** Only import what you actually use. Run `bun run check` frequently.

### Challenge 2: Argument Parsing Consistency
**Problem:** Supporting both `--flag=value` and `--flag value` formats.  
**Solution:** Check for both patterns in every command:
```typescript
const flagEqIdx = args.findIndex((arg) => arg.startsWith("--flag="));
const flagSpaceIdx = args.indexOf("--flag");
```
**Lesson:** Establish pattern early and reuse across all commands.

### Challenge 3: Biome Lint Suggestions
**Problem:** Biome flagged `findIndex` for simple equality checks.  
**Solution:** Replace with `indexOf` when checking for exact string match.  
**Lesson:** `indexOf` is faster and simpler for equality checks. Use `findIndex` only when you need a predicate function.

## Metrics

- **Files Created:** 6 command handlers, 1 brief, 1 debrief
- **Files Modified:** 3 (cli.ts, README.md, WARP.md)
- **Lines Added:** ~1,120 lines total
- **Commits:** 4 commits (one per phase) + 1 merge commit
- **Time:** ~4 hours total (1 hour per phase as planned)
- **Code Quality:** 100% Biome checks passing

## Impact

### User Benefits

1. **Lower Barrier to Entry:** No need to understand MCP to use Amalfa
2. **Scripting Enabled:** Shell scripts and CI/CD can now use Amalfa
3. **Faster Testing:** Test queries without MCP server overhead
4. **Unix Philosophy:** Commands are composable and pipeable

### Developer Benefits

1. **Debugging:** CLI mode easier to debug than MCP protocol
2. **Manual Testing:** Quick iteration without restarting MCP server
3. **Automation:** Can script data analysis and quality checks

## Future Opportunities

### Near-Term Enhancements

1. **Command-Specific Help:** Add `amalfa search --help` for each command
2. **Shell Completions:** Generate bash/zsh completions for all commands
3. **Color Output:** Add ANSI colors for human-readable output (when TTY detected)
4. **Progress Indicators:** Show progress for long-running operations

### Advanced Features

1. **Interactive Mode:** REPL-like interface for exploratory queries
2. **Output Formats:** Support CSV, TSV, Markdown table output
3. **Batch Operations:** `amalfa batch-inject-tags --from-csv tags.csv`
4. **Query Logging:** Track CLI queries for analysis

## Recommendations

### For Future CLI Commands

1. **Use established patterns:**
   - Argument parsing template
   - Dual output modes (JSON + human)
   - Consistent error handling

2. **Test with real data:**
   - Run against actual Amalfa knowledge base
   - Test error paths (missing DB, invalid args)
   - Verify JSON output is valid

3. **Document as you go:**
   - Add to README immediately
   - Update WARP.md
   - Include examples in commit messages

### For CLI Architecture

1. **Consider CLI framework:** For complex argument parsing, consider using a CLI library (e.g., commander, yargs)
2. **Shared utilities:** Extract common patterns (parseFlags, formatOutput) to utilities
3. **Testing:** Add integration tests for CLI commands

## Playbook Candidates

### Patterns Worth Codifying

1. **CLI Command Pattern** - Standard structure for CLI commands with dual output modes
2. **Argument Parsing Pattern** - Handling multiple flag formats consistently
3. **Database Lifecycle Pattern** - Connect, execute, cleanup in try-finally
4. **Error Message Design** - Helpful, actionable, mode-appropriate errors

## Links & References

- **Brief:** [briefs/2026-01-17-cli-search-commands.md](../briefs/2026-01-17-cli-search-commands.md)
- **MCP Tools Reference:** [docs/MCP-TOOLS.md](../docs/MCP-TOOLS.md)
- **Commits:** 
  - Phase 1: cfd750f
  - Phase 2: e377b55
  - Phase 3: 9802381
  - Phase 4: cda8fda
  - Merge: af9198d

## Conclusion

Successfully implemented CLI-first access to Amalfa's core search capabilities. All 6 commands working with dual output modes, comprehensive documentation, and consistent UX patterns. Feature is production-ready and enables new use cases (scripting, automation, power users).

**Key Takeaway:** Offering both CLI and MCP modes makes Amalfa accessible to broader audience while maintaining protocol advantages for agent integration.
