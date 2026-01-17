---
date: 2026-01-17
tags: [audit, documentation, discrepancies, cleanup, technical-debt]
agent: claude
environment: local
---

# Debrief: Documentation vs Code Reality Audit

## Context

After overhauling README and creating new documentation (MCP-TOOLS.md, ARCHITECTURE.md), conducted comprehensive audit to identify discrepancies between what we document and what the code actually implements.

## Audit Methodology

1. **CLI Commands**: Cross-referenced README/WARP.md claims against `src/cli.ts` and `package.json`
2. **MCP Tools**: Verified all 8 tools in docs against `src/mcp/index.ts` implementation
3. **Daemon Services**: Checked existence and functionality of file watcher, vector, reranker, sonar
4. **Configuration**: Validated config structure against code expectations
5. **Scripts**: Verified existence of mentioned entry points
6. **Workflow Claims**: Checked if brief→debrief→playbook pattern is real or aspirational

## Major Findings

### 🔴 CRITICAL: Non-Existent Script Referenced

**Issue:**  Multiple documents reference `bun run scripts/cli/ingest.ts`

**Reality:** This script does not exist.
```bash
$ test -f scripts/cli/ingest.ts
MISSING
```

**Actual location:**
- Primary ingestion is via CLI: `amalfa init` (which calls `src/cli/commands/init.ts`)
- No direct `ingest.ts` script in `scripts/cli/` directory

**Affected Documentation:**
- `README.md` line 241
- `WARP.md` lines 27, 62, 68, 270, 316
- `docs/ARCHITECTURE.md` line 243
- Multiple playbooks and debriefs

**Impact:** Users trying to regenerate database get confusing/incorrect instructions.

**Correct Command:**
```bash
# ❌ WRONG (documented everywhere)
bun run scripts/cli/ingest.ts

# ✅ CORRECT (actual)
amalfa init
```

### 🔴 CRITICAL: Excessive Nuke-and-Pave Recommended

**Issue:** Documentation encourages `rm -rf .amalfa/` which unnecessarily deletes caches.

**Reality:** The `.amalfa/` directory contains:
- `resonance.db` (~77MB) - Runtime database (regenerate freely)
- `cache/fast-bge-small-en-v1.5/` (~128MB) - Downloaded embedding model (expensive)
- `cache/scratchpad/` - MCP tool output cache
- `logs/`, `runtime/` - Service management files

**Impact:** 
- Users waste time and bandwidth re-downloading 128MB embedding model
- Unnecessarily slow "regeneration" process (2-3 minutes vs 30 seconds)
- Goes against "disposable database" philosophy (only DB is disposable, not caches)

**Correct Approach - Staged Recovery:**
```bash
# Level 1: Soft reset (preserves caches) - MOST COMMON
rm .amalfa/resonance.db*
amalfa init
# Speed: ~30 seconds

# Level 2: Clear logs/runtime state
rm -rf .amalfa/logs .amalfa/runtime
amalfa init
# Speed: ~30 seconds

# Level 3: Full nuke (only when necessary)
rm -rf .amalfa/
amalfa init
# Speed: ~2-3 minutes (re-downloads models)
```

**When to use Level 3:**
- Changing embedding model versions
- Complete fresh start for testing
- Corrupted model cache

**When to use Level 1 (99% of cases):**
- Schema changes
- Data corruption
- Routine database refresh
- After git pull with schema updates

### 🟡 MODERATE: Confusing Command Patterns

**Issue:** Documentation mixes two command patterns inconsistently:

**Pattern 1: Global install** (recommended, works)
```bash
bun install -g amalfa
amalfa init
amalfa serve
```

**Pattern 2: Local development** (works but context-dependent)
```bash
bun run amalfa init
bun run amalfa serve
```

**Reality:** 
- Pattern 1 is what users should use (package.json bin entry)
- Pattern 2 is via npm script alias in package.json line 58: `"amalfa": "bun run src/cli.ts"`
- WARP.md extensively uses Pattern 2 ("for local development") but doesn't clarify when to use which

**Impact:** Confusion about installation vs development workflows.

### 🟢 VERIFIED: MCP Tools Match Reality

**All 8 tools documented in `docs/MCP-TOOLS.md` exist in `src/mcp/index.ts`:**
1. ✅ `search_documents` (lines 227-400)
2. ✅ `read_node_content` (lines 402-441)
3. ✅ `explore_links` (lines 443-465)
4. ✅ `list_directory_structure` (lines 467-473)
5. ✅ `find_gaps` (lines 475-488)
6. ✅ `inject_tags` (lines 490-527) - marked experimental correctly
7. ✅ `scratchpad_read` (lines 529-543)
8. ✅ `scratchpad_list` (lines 545-556)

**Status:** Documentation accurate.

### 🟢 VERIFIED: Daemon Services Exist

**All 4 documented services have implementations:**
1. ✅ **File Watcher:** `src/daemon/index.ts` (262 lines, full implementation)
2. ✅ **Vector Daemon:** `src/resonance/services/vector-daemon.ts`
3. ✅ **Reranker Daemon:** `src/resonance/services/reranker-daemon.ts`  
4. ✅ **Sonar Agent:** `src/daemon/sonar-*.ts` (multiple files, ~7 modules)

**CLI commands verified:**
- `amalfa daemon start|stop|status|restart` ✅
- `amalfa vector start|stop|status|restart` ✅
- `amalfa reranker start|stop|status|restart` ✅
- `amalfa sonar start|stop|status|restart` ✅
- `amalfa servers` ✅
- `amalfa stop-all` ✅

**Status:** Documentation accurate.

### 🟢 VERIFIED: Configuration Structure

**`amalfa.config.json` exists and structure matches code expectations:**
- ✅ `sources` array
- ✅ `database` path
- ✅ `embeddings.model` and `embeddings.dimensions`
- ✅ `watch` config (enabled, debounce, notifications)
- ✅ `excludePatterns`
- ✅ `sonar` full config tree

**Missing documentation:** 
- ❌ No `amalfa.config.example.json` or `.ts` file (WARP.md line 195 references `amalfa.config.example.ts`)
- ❌ README doesn't show full config structure

**Status:** Code works, documentation incomplete.

### 🟢 VERIFIED: Brief-Debrief-Playbook Pattern is Real

**Not aspirational - actively used:**
- 14 briefs in `briefs/`
- 30 debriefs in `debriefs/`
- 33 playbooks in `playbooks/`

**Pattern is demonstrated:**
- This repo itself follows the pattern
- Ember service generates sidecars for enrichment
- Auto-ingestion via file watcher daemon updates knowledge graph

**Status:** Claim is accurate.

### 🟡 MODERATE: CLI Command Aliases

**Issue:** `src/cli.ts` line 144 has undocumented alias:
```typescript
case "kill":  // Alias for "stop-all"
```

**Also:** line 160-163 has `enhance` command not mentioned in help or README.

**Impact:** Minor - hidden features work but aren't discoverable.

### 🟡 MODERATE: Package.json Scripts

**Listed in package.json but not documented:**
- `bun run precommit` (line 54)
- `bun run check` (line 55)
- `bun run format` (line 56)
- `bun run validate-config` (line 57)

**Only mentioned in WARP.md, not README.**

**Impact:** Development workflow not clear to new contributors.

## Summary of Issues

### Critical (Fix Immediately)
1. **Wrong ingest command** - `scripts/cli/ingest.ts` doesn't exist, should be `amalfa init`
2. **Excessive nuke-and-pave** - `rm -rf .amalfa/` wastes time/bandwidth, should use staged recovery

### Moderate (Should Fix)
2. **Command pattern confusion** - Clarify global vs local development usage
3. **Missing config example** - No `amalfa.config.example.*` file
4. **Undocumented CLI commands** - `kill` alias, `enhance` command
5. **Development scripts** - precommit, check, format not in README

### Minor (Nice to Have)
6. **Hidden features** - Document all CLI commands comprehensively

## Recommendations

### Immediate Actions
1. **Global find/replace**: `bun run scripts/cli/ingest.ts` → `amalfa init`
2. **Replace nuke-and-pave**: Document 3-level staged recovery process
   - Level 1: `rm .amalfa/resonance.db*` (preserves 128MB cache, most common)
   - Level 2: + clear logs/runtime
   - Level 3: `rm -rf .amalfa/` (only when model changes needed)
3. **Add config example**: Create `amalfa.config.example.json` with comments
4. **Clarify command patterns**: Add section to README explaining:
   - When to use `amalfa <cmd>` (normal usage)
   - When to use `bun run amalfa <cmd>` (local development)
   - When to use `bun run <script>` (development tasks)

### Documentation Structure Proposal
```markdown
## Commands

### User Commands (after `bun install -g amalfa`)
amalfa init
amalfa serve
amalfa stats
...

### Development Commands (in repo)
bun run check          # Biome linting
bun run format         # Auto-format
bun run validate-config # Config validation

### Local Testing (before install)
bun run amalfa init    # Test CLI locally
```

## Files to Update

**High Priority:**
- `README.md` - Fix ingest command, clarify command patterns
- `WARP.md` - Fix ingest command (multiple locations)
- `docs/ARCHITECTURE.md` - Fix ingest command
- Create `amalfa.config.example.json`

**Medium Priority:**
- All playbooks mentioning `scripts/cli/ingest.ts`
- All debriefs mentioning old command
- Update `src/cli.ts` help text to document `kill` and `enhance`

## Lessons Learned

1. **Documentation rot is real**: Even after major overhaul, legacy commands persist
2. **Multiple sources of truth**: README vs WARP.md vs code creates inconsistencies
3. **Command evolution**: `scripts/cli/ingest.ts` was likely refactored into `amalfa init` but docs lagged
4. **Need automation**: Could add CI check to verify documented commands actually exist

## Next Steps

1. Create brief to fix all identified issues
2. Implement fixes systematically
3. Add tests/validation to prevent future drift
4. Consider single-source-of-truth approach for command documentation

## Verification Checklist

- [x] All CLI commands audited against `src/cli.ts`
- [x] All MCP tools verified in `src/mcp/index.ts`
- [x] All daemons confirmed to exist
- [x] Config structure validated
- [x] Script locations checked
- [x] Workflow pattern confirmed as real

## Confidence Level

**High** - Audit covered all major claims in documentation and verified against actual code. Found one critical discrepancy (ingest command) that impacts user experience.
