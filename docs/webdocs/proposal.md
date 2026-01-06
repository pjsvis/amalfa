# Change Proposal: Slash Commands for Gemini-CLI Integration

## Metadata
- **Change ID**: add-slash-commands-gemini-cli
- **Type**: Feature Addition
- **Status**: Implemented
- **Created**: 2025-11-03

## Summary

Add a slash-command interface for Gemini-CLI to access semantic-graph-ts 
operations with direct library imports, sub-millisecond response times, 
and multiple output formats.

## Objectives

1. Enable Gemini-CLI to interact with the semantic graph via slash commands
2. Provide query, CRUD, analysis, and vector search capabilities
3. Maintain high performance (0.1-5ms response times)
4. Support multiple output formats (markdown, JSON, table, compact)
5. Ensure type safety and proper error handling

## Scope

### In Scope
- Command infrastructure (registry, execution, formatting)
- Query operations (find nodes, neighbors, stats)
- Graph CRUD operations (add/delete nodes/edges)
- Analysis operations (centrality, communities, clusters)
- Vector search placeholder
- Gemini-CLI adapter
- Configuration file
- Test harness
- Documentation

### Out of Scope
- Full vector search implementation (requires Vectra setup)
- MCP server implementation (future enhancement)
- Web UI integration
- Batch operations
- Custom query DSL

## Integration Approach

### Architecture
- **Direct Library Access**: No HTTP overhead, direct imports
- **Slash Command Pattern**: `/graph:<operation>` naming convention
- **Synchronous Wrapper**: Adapt Bun's sync SQLite to async interface
- **Multiple Formats**: Markdown, JSON, table, compact output

### File Structure
```
src/cli/
├── index.ts                    # Command registry and execution
├── types.ts                    # Type definitions
├── formatters.ts               # Output formatting
├── connection-adapter.ts       # Async DB wrapper
├── gemini-adapter.ts           # Gemini-CLI integration
└── commands/
    ├── query-commands.ts       # Query operations
    ├── graph-commands.ts       # CRUD operations
    ├── analysis-commands.ts    # Analysis operations
    └── vector-commands.ts      # Vector search
```

## Commands Catalog

### Query Operations (3)
- `/graph:query` - Find nodes by criteria
- `/graph:neighbors` - Get node neighborhood
- `/graph:stats` - Graph statistics

### CRUD Operations (5)
- `/graph:get-node` - Retrieve node by ID
- `/graph:add-node` - Create node
- `/graph:delete-node` - Delete node
- `/graph:add-edge` - Create edge
- `/graph:delete-edge` - Delete edge

### Analysis Operations (5)
- `/graph:centrality` - Compute centrality metrics
- `/graph:top-nodes` - Top central nodes
- `/graph:communities` - Detect communities
- `/graph:clusters` - Semantic clusters
- `/graph:neighborhood` - Node neighborhood

### Vector Operations (1)
- `/graph:vector-search` - Semantic search (placeholder)

## Technical Details

### Dependencies
- Existing: graphology, bun:sqlite, semantic-graph-ts modules
- No new external dependencies required

### Performance Requirements
- Graph queries: 0.1-1ms
- Node/edge CRUD: 1-5ms
- Analysis operations: 5-50ms (graph-size dependent)
- Database loading: One-time on initialization

### Type Safety
- Full TypeScript typing throughout
- No `any` in public APIs
- Proper error handling with typed results

## Testing

### Test Coverage
- Command execution tests
- Output format tests
- Error handling tests
- Integration tests with real database

### Test Results
- 4/4 tests passed
- Average response time: 0.64ms
- 163 nodes loaded successfully

## Documentation

- Complete integration guide at `docs/integrations/gemini-cli-guide.md`
- Inline TSDoc comments for all public APIs
- Configuration examples
- Troubleshooting section

## Compliance

### Project Standards
- ✅ Max 300 lines per file
- ✅ Max 90 chars per line
- ✅ No barrel exports/imports
- ✅ TSDoc for all public functions
- ✅ Existing patterns maintained

### OpenSpec Standards
- Proposal created
- Tasks defined
- Spec deltas documented
- Scenarios included

## Future Enhancements

1. Full vector search integration with Vectra
2. Batch operations support
3. Graph visualization commands
4. Export/import commands
5. Custom query DSL
6. MCP server implementation

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database locking | Medium | Use busy_timeout from config |
| Memory usage | Low | Graph loads once on init |
| Type mismatches | Low | Full TypeScript typing |
| Breaking changes | Low | No modifications to existing code |

## Approval

- [x] Implementation complete
- [x] Tests passing
- [x] Documentation complete
- [ ] User approval pending
