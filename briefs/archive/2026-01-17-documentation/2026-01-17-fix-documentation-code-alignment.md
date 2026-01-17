---
date: 2026-01-17
tags: [brief, documentation, cleanup, technical-debt, alignment]
agent: claude
environment: local
---

# Brief: Fix Documentation-Code Alignment Issues

## Context

Comprehensive audit (see `debriefs/2026-01-17-documentation-code-audit-findings.md`) revealed critical discrepancies between documentation and actual code implementation. Most serious: widespread references to non-existent `scripts/cli/ingest.ts` script.

## Problem Statement

Documentation and code have diverged, causing:
1. **User confusion**: Wrong commands documented lead to errors
2. **Development friction**: Unclear when to use which command pattern
3. **Incomplete guidance**: Missing config examples, undocumented features
4. **Trust erosion**: When documented commands don't work, users lose confidence

## Objectives

1. **Fix critical error**: Replace all `scripts/cli/ingest.ts` references with correct `amalfa init`
2. **Clarify command patterns**: Document when to use global vs local development commands
3. **Complete documentation**: Add missing config example, document hidden commands
4. **Prevent future drift**: Establish single source of truth for command docs

## Audit Findings Summary

### 🔴 Critical
- **Non-existent script**: `bun run scripts/cli/ingest.ts` → should be `amalfa init`
- Affects: README.md, WARP.md, ARCHITECTURE.md, multiple playbooks/debriefs
- **Excessive nuke-and-pave**: Documentation encourages `rm -rf .amalfa/` which deletes caches unnecessarily
- Reality: Only `resonance.db` needs regeneration. Embedding models (~128MB) don't need re-download.

### 🟡 Moderate
- Command pattern confusion (global vs local development)
- Missing `amalfa.config.example.json`
- Undocumented CLI commands (`kill` alias, `enhance`)
- Development scripts not in README
- **MCP tool descriptions lack strategic guidance** - Agents see tool names but no guidance on when/why to use them

### 🟢 Verified (No Action)
- All 8 MCP tools exist and match documentation ✅
- All 4 daemon services exist and work ✅
- Config structure matches code expectations ✅
- Brief-debrief-playbook pattern is real and active ✅

## Implementation Plan

### Phase 1: Fix Critical Issues (Immediate)

**1.1 Global Find/Replace: Ingest Command**

Files to update:
- `README.md` (1 occurrence)
- `WARP.md` (5 occurrences)
- `docs/ARCHITECTURE.md` (1 occurrence)

Replace:
```bash
# Find
bun run scripts/cli/ingest.ts

# Replace with
amalfa init
```

Also check variations:
- `scripts/cli/ingest.ts` (without `bun run`)
- References in markdown fenced code blocks
- References in comments or examples

**1.2 Add Staged Recovery Process**

Replace all `rm -rf .amalfa/` documentation with staged approach.

**WARP.md Database Operations Section** (lines 57-68):

Replace with:
```bash
### Database Operations

#### Staged Recovery (Recommended)
```bash
# Level 1: Soft regeneration (preserves caches)
rm .amalfa/resonance.db*
amalfa init

# Level 2: Clear logs and runtime state
rm -rf .amalfa/logs .amalfa/runtime
amalfa init

# Level 3: Full reset (loses cached embedding models ~128MB)
rm -rf .amalfa/
amalfa init  # Will re-download models
```

#### Database Validation
```bash
# Check database integrity
sqlite3 .amalfa/resonance.db "PRAGMA integrity_check;"

# View database stats
amalfa stats

# Health check
amalfa doctor
```

**What gets deleted:**
- Level 1: Only database file (fast, preserves ~128MB model cache)
- Level 2: + logs and runtime state (daemon PIDs, etc.)
- Level 3: Everything including downloaded embedding models (slow to restore)

**When to use which:**
- **Level 1**: Schema changes, data corruption, routine maintenance (most common)
- **Level 2**: Daemon issues, stuck processes, log cleanup
- **Level 3**: Complete fresh start, model version changes (rare)
```

### Phase 2: Clarify Command Patterns (High Priority)

**2.1 Add "Commands Reference" Section to README**

Insert after "Architecture" section, before "Quick Start":

```markdown
## Commands Reference

Amalfa commands work in three contexts:

### 1. Global Usage (Recommended)
After `bun install -g amalfa`:
```bash
amalfa init              # Initialize database
amalfa serve             # Start MCP server
amalfa stats             # Show statistics
amalfa doctor            # Health check
amalfa daemon start      # Start file watcher
amalfa servers           # Show all services
```

### 2. Local Development
When working in the amalfa repository:
```bash
bun run amalfa init      # Test CLI locally
bun run servers          # Quick access via npm script
bun run stats            # Quick access via npm script
```

### 3. Development Tasks
Code quality and validation:
```bash
bun run check            # Biome linting
bun run format           # Auto-format code
bun run validate-config  # Validate amalfa.config.json
bun test                 # Run test suite
```

**When to use which:**
- **Global commands**: Normal usage after installation
- **Local development**: Testing changes before publishing
- **Development tasks**: Code maintenance and CI
```

**2.2 Update README Maintenance Section**

Replace existing maintenance text with staged recovery:

```markdown
### Maintenance

**Staged Recovery** (choose appropriate level):

**Level 1: Soft Reset** (preserves caches, most common)
```bash
rm .amalfa/resonance.db*
amalfa init
```
Use for: Schema changes, data corruption, routine refresh  
Speed: Fast (~30 seconds)

**Level 2: Clean State** (clears logs/runtime)
```bash
rm -rf .amalfa/logs .amalfa/runtime
amalfa init
```
Use for: Daemon issues, stuck processes  
Speed: Fast (~30 seconds)

**Level 3: Full Reset** (nukes everything)
```bash
rm -rf .amalfa/
amalfa init
```
Use for: Complete fresh start, model version changes  
Speed: Slow (~2-3 minutes, re-downloads 128MB embedding model)

**Health Check:**
```bash
amalfa doctor    # Diagnose issues
amalfa stats     # View database stats
```
```

**2.3 Update WARP.md Essential Commands**

Add clarification at top of commands section:

```markdown
## Essential Commands

**Note**: These commands assume you're working in the repository (local development).
For normal usage after `bun install -g amalfa`, use `amalfa <command>` directly.

### Development Workflow
...
```

### Phase 3: Create Configuration Example (High Priority)

**3.1 Create `amalfa.config.example.json`**

Location: Project root

Content:
```json
{
  // Sources: Directories to index for markdown files
  "sources": ["./docs", "./briefs", "./debriefs", "./playbooks"],
  
  // Database: SQLite database path (relative to project root)
  "database": ".amalfa/resonance.db",
  
  // Embeddings: Vector model configuration
  "embeddings": {
    "model": "BAAI/bge-small-en-v1.5",
    "dimensions": 384
  },
  
  // Watch: File watcher daemon configuration
  "watch": {
    "enabled": true,          // Auto-update on file changes
    "debounce": 1000,         // Delay before processing (ms)
    "notifications": true     // OS notifications on updates
  },
  
  // Exclude: Patterns to ignore during indexing
  "excludePatterns": ["node_modules", ".git", ".amalfa"],
  
  // Sonar: AI agent for enhanced search (optional)
  "sonar": {
    "enabled": false,         // Enable Sonar agent
    "autoDiscovery": true,    // Auto-detect available models
    "discoveryMethod": "cli", // "cli" or "http"
    "inferenceMethod": "http",// "http" or "cli"
    "model": "qwen2.5:1.5b",  // Default Ollama model
    "modelPriority": [        // Fallback models
      "qwen2.5:1.5b",
      "tinydolphin:latest",
      "tinyllama:latest"
    ],
    "host": "localhost:11434",// Ollama host
    "port": 3012,             // Sonar agent port
    "tasks": {
      "search": {
        "enabled": true,
        "timeout": 5000,
        "priority": "high"
      },
      "metadata": {
        "enabled": true,
        "timeout": 30000,
        "autoEnhance": true,
        "batchSize": 10
      }
    },
    "cloud": {                // Cloud LLM fallback
      "enabled": false,
      "provider": "openrouter",
      "host": "openrouter.ai/api/v1",
      "model": "qwen/qwen-2.5-72b-instruct"
    }
  }
}
```

**Note**: JSON doesn't support comments. Create two versions:
1. `amalfa.config.example.json` - Clean JSON for validation
2. `amalfa.config.example.jsonc` - With comments for documentation

Or use a TypeScript example as originally documented.

**3.2 Reference in README**

Add to "Quick Start" section:

```markdown
### Configuration

1. **Create config file** (optional - has defaults):
   ```bash
   cp amalfa.config.example.json amalfa.config.json
   ```

2. **Edit sources**:
   ```json
   {
     "sources": ["./docs", "./notes"],
     "database": ".amalfa/resonance.db"
   }
   ```

Full configuration options: see `amalfa.config.example.json`
```

### Phase 4: Document Hidden Features (Medium Priority)

**4.1 Update CLI Help Text**

In `src/cli.ts` showHelp() function:

Add to commands list:
```
  stop-all (kill)    Stop all running AMALFA services
  enhance <command>  Database enhancement operations
```

Clarify that `kill` is an alias.

**4.2 Document in README "Development" Section**

Add new section before "Contributing":

```markdown
## Development

### Code Quality
```bash
bun run check      # Biome linting (auto-fixes safe issues)
bun run format     # Format code (tabs, double quotes)
bun test           # Run test suite
```

### Pre-commit Hooks
```bash
bun run precommit  # Runs before each commit
# - Validates config
# - Checks code style
# - Runs quick tests
```

### Configuration Validation
```bash
bun run validate-config  # Check amalfa.config.json
```

### Advanced Commands
```bash
amalfa kill        # Alias for stop-all
amalfa enhance     # Database enhancement utilities
amalfa scripts list # Show available dev scripts
```
```

### Phase 5: Update Playbooks/Debriefs (Lower Priority)

**5.1 Identify Affected Files**

Run grep to find all references:
```bash
grep -r "scripts/cli/ingest" playbooks/ debriefs/ briefs/
```

**5.2 Batch Update**

For each file:
- Replace `bun run scripts/cli/ingest.ts` with `amalfa init`
- Add note if local development context: `bun run amalfa init`

**5.3 Consider**

Many of these are historical debriefs. Options:
- Update all for consistency
- Leave historical ones (with note that command changed)
- Archive old debriefs that reference legacy commands

**Recommendation**: Update all for searchability. Future developers searching for "how to reingest" should find correct command.

### Phase 6: Improve MCP Tool Guidance (Medium Priority)

**Problem:** Agents see tool descriptions like "Search the Knowledge Graph" but don't know:
- **When** to use Amalfa vs native file search
- **Why** they should query past work
- **How** to encourage users to build knowledge over time

**Current tool descriptions** (in `src/mcp/index.ts`):
```typescript
description: "Search the Knowledge Graph using Vector (semantic) search."
```

**What agents actually need:**
- Strategic guidance: "Use when looking for past learnings, patterns, or solutions"
- Trigger scenarios: "Query this when user asks 'what did we learn' or 'how did we solve'"
- Value proposition: "Provides institutional memory across sessions"

**6.1 Enhance MCP Tool Descriptions**

Update `src/mcp/index.ts` line 151-152 (search_documents):

```typescript
// Current
description: "Search the Knowledge Graph using Vector (semantic) search.",

// Proposed
description: `Search your knowledge graph for past learnings, solutions, and patterns. 
Use when:
- User asks "what did we learn about X"
- Looking for previous solutions to similar problems
- Need context from past work
- Want to avoid repeating past mistakes
Returns semantically relevant documents ranked by relevance.`,
```

Similarly update all 8 tool descriptions with:
1. **Purpose**: What problem does this solve?
2. **When to use**: Specific triggers/scenarios
3. **Value**: Why use this vs alternatives?

**6.2 Add User Prompting Guide to README**

New section after "What Agents Can Do":

```markdown
## Prompting Your Agent to Use Amalfa

**Amalfa works best when you establish a knowledge-building habit with your agent.**

### Effective Prompts

**During work:**
- "What have we learned about [topic]?" → Triggers search_documents
- "Check if we've solved this before" → Searches past solutions
- "What patterns did we discover?" → Queries playbooks

**After work:**
- "Write a debrief of what we learned" → Encourages documentation
- "Update the playbook with this pattern" → Codifies knowledge
- "What related work should be linked?" → Triggers find_gaps

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
You: "Now ingest it so we remember next time"
```

### When NOT to Prompt

**Let agents decide when:**
- They're working on completely novel problems
- Quick one-off tasks that won't recur
- You explicitly want fresh thinking without past bias

**The goal:** Build compounding knowledge, not create busywork.
```

**6.3 Add "For Agent Developers" Section to MCP-TOOLS.md**

Add before "Integration Examples":

```markdown
## For Agent Developers

### Strategic Tool Usage

**search_documents should be the default for:** 
- Historical questions ("what did we learn")
- Pattern discovery ("how have we solved")
- Context building ("find related work")

**explore_links for:**
- Following chains of thought
- Tracing decision evolution
- Finding implementation from spec

**find_gaps for:**
- Periodic knowledge graph cleanup
- Discovering missing connections
- Identifying documentation gaps

### Encouraging Knowledge Building

**Suggest debriefs when:**
- User solved a non-trivial problem
- Encountered surprising behavior
- Discovered a useful pattern
- Hit a dead-end worth documenting

**Suggest playbooks when:**
- Same pattern appears 3+ times
- Team decision made (record rationale)
- Anti-pattern discovered
- Best practice crystallizes

### Proactive vs Reactive

**Proactive search** (recommended):
```
User: "Let's implement OAuth"
Agent: [Searches automatically] "I found 2 past OAuth implementations..."
```

**Reactive search** (user-prompted):
```
User: "Search for past OAuth work"
Agent: [Searches]
```

**Balance:** Be helpful, not annoying. Search when context is valuable, skip when it's noise.
```

**6.4 Update Tool Descriptions in Code**

File: `src/mcp/index.ts`

Update all 8 tool descriptions following this pattern:

```typescript
{
  name: "search_documents",
  description: "[What] Search knowledge graph for past learnings and solutions. [When] Use when user asks about past work, patterns, or solutions. [Why] Provides institutional memory across sessions to avoid repeating research.",
  inputSchema: {...}
}
```

Keep under 280 characters for MCP protocol compatibility.

## Success Criteria

- [ ] Zero references to `scripts/cli/ingest.ts` in any documentation
- [ ] Zero references to `rm -rf .amalfa/` without staged recovery context
- [ ] README has clear "Commands Reference" section
- [ ] README and WARP.md document 3-level staged recovery process
- [ ] `amalfa.config.example.json` exists and is documented
- [ ] CLI help text documents all commands including aliases
- [ ] Development workflow clear in both README and WARP.md
- [ ] All commands documented match actual implementation
- [ ] Config example matches actual config structure
- [ ] Documentation explains what's cached and why preservation matters

## Testing Plan

### Manual Tests
1. Follow README from scratch (fresh install)
2. Verify every documented command works
3. Test all three command patterns (global, local dev, dev tasks)
4. Validate config example produces working setup

### Validation Script
Create `scripts/verify-docs.ts`:
```typescript
// Check:
// - All documented commands exist in src/cli.ts
// - All documented config keys exist in config/defaults.ts
// - All referenced files exist
// - No legacy command references remain
```

Run in CI to prevent future drift.

## Files to Modify

### Critical Path
1. `README.md` - Fix ingest, add commands reference
2. `WARP.md` - Fix ingest (5 places), clarify dev vs prod
3. `docs/ARCHITECTURE.md` - Fix ingest reference
4. Create `amalfa.config.example.json`

### High Priority
5. `src/cli.ts` - Update help text for hidden commands
6. Playbooks with ingest references (TBD count)
7. Debriefs with ingest references (TBD count)

### Medium Priority
8. Add development section to README
9. Update documentation index if exists

## Implementation Order

1. **Global find/replace** - Fast, high impact, low risk
2. **Add commands reference** - Prevents confusion going forward
3. **Create config example** - Referenced but missing
4. **Update CLI help** - Quick win, improves discoverability
5. **Add development section** - Improves contributor experience
6. **Batch update playbooks/debriefs** - Cleanup, can be done incrementally

## Risks & Mitigation

**Risk**: Breaking existing user workflows
- **Mitigation**: `amalfa init` is the actual working command. We're fixing docs to match reality.

**Risk**: Missing some references in find/replace
- **Mitigation**: Use multiple grep patterns, check git history for variations

**Risk**: Config example gets out of sync
- **Mitigation**: Generate from code or add validation test

## Post-Implementation

1. **Create validation script**: Prevent future drift
2. **Update CHANGELOG**: Document command changes for users
3. **Consider blog post**: "How we keep docs and code aligned"
4. **Add to CI**: Run doc validation on every PR

## Estimated Effort

- Phase 1 (Critical): 30 minutes
- Phase 2 (Command clarification): 1 hour
- Phase 3 (Config example): 30 minutes
- Phase 4 (Hidden features): 30 minutes
- Phase 5 (Playbooks/debriefs): 1-2 hours (depends on count)

**Total**: 3.5-4.5 hours

## References

- Audit findings: `debriefs/2026-01-17-documentation-code-audit-findings.md`
- CLI implementation: `src/cli.ts`
- Config loading: `src/config/defaults.ts`
- Example config (current): `amalfa.config.json` (in repo root)
