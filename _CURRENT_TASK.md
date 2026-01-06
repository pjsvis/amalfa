# Current Task

**Status**: Session Complete ✅  
**Last Session**: 2026-01-05  
**Next Focus**: Service Infrastructure Review

## Task: Refactor Embedder for Dynamic Model Selection

**Objective**: Decouple the embedding model selection from the `Embedder` class logic to allow environment-driven configuration and upgrade the default model to `bge-small-en-v1.5` for improved semantic retrieval.

### Key Results Achieved

✅ **Configurability**: Model can now be set via `EMBEDDING_MODEL=allminilml6v2` environment variable  
✅ **Modernization**: Default upgraded from AllMiniLML6V2 to BGE_SMALL_EN_V1_5 (better semantic quality)  
✅ **Resilience**: "Daemon First → Local Fallback" reliability pattern maintained  
✅ **Backward Compatibility**: Existing API calls remain unchanged  

### Verification Results

- **Default Model**: BGE_SMALL_EN_V1_5 → 384 dimensions, 312ms generation
- **Legacy Override**: AllMiniLML6V2 → 384 dimensions, functional fallback  
- **Daemon**: Fully compatible, no changes required to daemon.ts

### Files Modified

1. `src/resonance/services/embedder.ts` - Core refactor with dynamic model selection
2. `verify-embedder.ts` - Verification script for testing configurations

### Configuration Logic

Priority order for model selection:
1. Runtime arguments (future enhancement)
2. `process.env.EMBEDDING_MODEL` 
3. Class default (`EmbeddingModel.BGESmallENV15`)

The system now supports environment-driven model configuration while maintaining full backward compatibility and improved semantic retrieval quality through the modern BGE model.

---

## Session 2026-01-05: WARP.md & Documentation

### Completed

✅ **WARP.md Created**: Comprehensive onboarding guide for Warp AI agents  
✅ **SQLite WAL Trap Documented**: Public-facing guide on readonly + WAL corruption issue  
✅ **FAFCAS Clarified**: Philosophy expanded (Fast As F*ck, Cool As Sh*t)  
✅ **MCP Validation**: End-to-end knowledge graph pipeline tested and working  
✅ **Debrief Written**: `debriefs/2026-01-05-warp-onboarding-and-wal-trap.md`  

### Next Session TODO

**Service Infrastructure Review** (HIGH PRIORITY)

1. **Review Running Services**
   - MCP server (PID 67300) - needs integration with Claude Desktop
   - Daemon (PID 46765) - verify long-term stability
   - Check for zombie processes (.pid file cleanup)

2. **Fix Reactor Lifecycle**
   - Implement proper ServiceLifecycle pattern for reactor.ts
   - Add start/stop/restart/status commands
   - Currently lacks lifecycle support (manual kill required)

3. **Use MCP for Real Work** (Dogfooding Paradox)
   - Stop building infrastructure
   - Pick ONE workflow to use MCP: code review OR debugging OR onboarding
   - Integrate with Claude Desktop (config in debrief)

4. **Cleanup**
   - Remove stale .pid files if not running
   - Check daemon logs for any issues
   - Verify no orphaned processes

**Key Insight**: System is operational. Time to USE it, not build more features.

**Files to Review**:
- `bun run servers` - Check service status
- `.daemon.log` - Review for issues
- `.mcp.log` - Verify MCP stability
- `experiments/data-star-dashboard/reactor.ts` - Needs ServiceLifecycle
