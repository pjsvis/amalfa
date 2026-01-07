---
date: 2026-01-07
tags: [mcp, fix, hollow-nodes, vector-search, documentation]
---

## Debrief: MCP Server Fix and Documentation

## Accomplishments

- **Fixed critical MCP search bug:** VectorEngine was attempting to access null content field on hollow nodes, causing `null is not an object (evaluating 'r.content.slice')` error
  - Root cause: Database uses hollow node pattern (content on filesystem), but VectorEngine still expected content in database
  - Solution: Added null-safety in `src/core/VectorEngine.ts` (lines 194-227) and `src/mcp/index.ts` (lines 140-148)
  - Now returns placeholder `[Hollow Node: /path/to/file.md]` for search results, with full content available via `read_node_content` tool

- **Created comprehensive MCP setup documentation:**
  - `docs/MCP_SETUP.md` - Full setup guide with troubleshooting
  - `docs/QUICK_START_MCP.md` - 5-minute quick start
  - Updated `README.md` with Quick Start section
  - All docs include Claude Desktop, Cursor, and Windsurf configuration

- **Improved MCP server configuration:**
  - Fixed `scripts/setup_mcp.ts` to use minimal PATH (was 800+ chars, now clean list)
  - Changed server name from "polyvis" to "amalfa" for consistency
  - Automatically detects bun path and includes only essential directories

- **Verified MCP server end-to-end:**
  - Created test scripts for both direct tool testing and JSON-RPC protocol testing
  - Confirmed all 5 tools work: search_documents, read_node_content, explore_links, list_directory_structure, inject_tags
  - Tested in Warp Preview MCP integration successfully

- **Documented configuration state:**
  - Created `docs/_current-config-status.md` documenting all three config systems (AMALFA, Resonance, Beads)
  - Identified action items for future config unification

## Problems

- **MCP server caching:** Initial fix didn't work via MCP because server process was still running with old code
  - Resolution: User toggled MCP server off/on in Warp Preview
  - Lesson: MCP servers need to be restarted to pick up code changes

- **Search results don't include actual content:** Vector search returns hollow node placeholders instead of content previews
  - Current behavior: Search returns `[Hollow Node: /path/to/file.md]`
  - Trade-off: This is intentional for hollow node architecture (content stays on disk), but reduces search result usefulness
  - Potential improvement: Could read first 200 chars from filesystem during search (would add I/O overhead)

- **Database points to polyvis sources:** Current `amalfa.config.json` indexes `../polyvis/docs` and `../polyvis/playbooks`
  - This works but is non-obvious for new users
  - Documentation now clarifies this and shows how to re-index local amalfa docs

## Lessons Learned

- **Hollow nodes require defensive programming:** Any code accessing node content must handle null/undefined gracefully
  - Pattern: Check for null, provide fallback, gracefully degrade
  - Applied to both VectorEngine (data layer) and MCP handlers (API layer)

- **PATH bloat is real:** Shell PATHs accumulate duplicates over time from multiple installers
  - Solution: Use minimal, explicit PATH for daemons/servers
  - Only include what's actually needed: bun path + system paths + homebrew

- **MCP testing requires protocol-level tests:** Direct function tests aren't enough
  - Need to test JSON-RPC messages over stdio to catch protocol issues
  - Created test pattern that spawns server as subprocess and sends messages

- **Documentation is critical for MCP:** Users need:
  - Machine-specific config generation (absolute paths)
  - Clear restart instructions
  - Troubleshooting guide with specific error messages
  - Multiple client examples (Claude Desktop, Cursor, etc.)

- **Configuration fragmentation:** AMALFA has 3 separate config systems which is confusing
  - Need to decide: unify or document boundaries clearly
  - Current approach: documented status quo, flagged for future decision

## Verification

**Code Changes:**
- `src/core/VectorEngine.ts` - Hollow node null safety ✅
- `src/mcp/index.ts` - Search preview null safety ✅
- `scripts/setup_mcp.ts` - Minimal PATH generation ✅

**Documentation Created:**
- `docs/MCP_SETUP.md` ✅
- `docs/QUICK_START_MCP.md` ✅
- `docs/_current-config-status.md` ✅
- `README.md` updated with Quick Start ✅

**Testing:**
- Direct tool testing (all 5 tools) ✅
- JSON-RPC protocol testing ✅
- Live MCP search via Warp Preview ✅
- Successfully searched for "tooling showcase" and retrieved full document ✅

## Next Steps

See README.md Implementation Status for roadmap:
- Phase 1: Basic Auto-Augmentation (entity extraction, auto-linking, tag extraction)
- Phase 2: Latent Space Tagging (clustering, label generation)
- Phase 3: Semantic Relationships (k-NN, suggested reading)
- Phase 4: Learning from Corrections (human edit tracking)
