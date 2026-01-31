# Package Manager Cleanup Brief

**Date:** 2026-01-31  
**Status:** ✅ Completed  
**Last Updated:** 2026-01-31

## Executive Summary

Review and cleanup of global package installations across Bun, npm, and Homebrew to establish a clean, Bun-first development stack.

## Current State Analysis

### ✅ Bun Globals (12 packages - Current)
```
├── @anthropic-ai/claude-code@2.1.27
├── @augmentcode/auggie@0.15.0
├── @github/copilot@0.0.400
├── @kilocode/cli@0.26.1
├── @mixedbread/mgrep@0.1.7
├── agent-browser@0.6.0
├── amalfa@1.4.3
├── opencode-ai@1.1.36
├── ts-unused-exports@11.0.1
├── typescript@5.9.2
└── wrangler@4.54.0
```

### ✅ npm Globals (1 package - Clean!)
```
└── npm@11.8.0
```

### Homebrew Packages
**Status:** ✅ Good - Proper system tools, language runtimes, and non-JS utilities

## Cleanup Results

### ✅ Issues Resolved
1. **Duplicate TypeScript** - Removed npm version, kept Bun@5.9.2
2. **Duplicate packages** - Removed all npm duplicates (agent-browser, opencode-ai, mgrep)
3. **npm Bun installation** - Removed, Bun managed via curl install
4. **AI assistant bloat** - All 20+ npm AI tools removed, consolidated to 4 in Bun
5. **Unnecessary globals** - npm reduced from 28 packages to 1

### Current Status
- **npm globals:** ✅ Perfect (only npm@11.8.0)
- **Bun globals:** 12 packages (4 AI assistants + 4 core tools + 3 utilities + 1 custom)
- **Duplicates:** ✅ None
- **PATH precedence:** ✅ Correct (~/.bun/bin → /opt/homebrew/bin → system)

## Recommended Strategy

### Golden Rules
1. **Bun-first for JavaScript CLIs** - Faster, better performance
2. **npm for exceptions only** - Document why npm is needed
3. **Homebrew for system tools** - Non-JS utilities, language runtimes
4. **Project-local over global** - When possible, avoid globals entirely
5. **bunx for occasional tools** - Don't install if used rarely

### Decision Framework

| Tool Type | Install Method | Examples |
|-----------|---------------|----------|
| JS/TS CLIs | Bun | typescript, prettier, eslint |
| Custom packages | Bun | alfama |
| System tools | Homebrew | git, gh, ripgrep, neovim |
| Package managers | Keep system version | npm itself |
| Occasional tools | Use `bunx` | npm-check, http-server |
| AI assistants | Pick 2-3, use Bun | TBD based on usage |

## Cleanup Actions

### Step 1: Remove Duplicates

```bash
# Remove npm TypeScript (keeping Bun version)
npm uninstall -g typescript

# Remove npm Bun (managed by Homebrew)
npm uninstall -g bun

# Remove duplicate packages (keeping Bun versions)
npm uninstall -g agent-browser opencode-ai @mixedbread/mgrep
```

### Step 2: Migrate Essential Tools to Bun

```bash
# Only if needed frequently; otherwise use bunx
bun install -g http-server live-server
```

### Step 3: Consolidate AI Tools

**Decision needed:** Which AI assistants do you actually use?

```bash
# Example cleanup (adjust based on actual usage)
npm uninstall -g \
  @anthropic-ai/claude-code \
  @augmentcode/auggie \
  @beads/bd \
  @byterover/cipher \
  @fission-ai/openspec \
  @github/copilot \
  @google/gemini-cli \
  @google/jules \
  @kilocode/cli \
  @letta-ai/letta-code \
  @musistudio/claude-code-router \
  @nanocollective/nanocoder \
  @openai/codex \
  @qodo/command \
  @tcsenpai/ollama-code \
  @vibe-kit/grok-cli \
  clawdhub \
  cline \
  codebuff \
  vectra
```

### Step 4: Remove Tools Better Used via bunx

```bash
# Remove from globals, use on-demand instead
npm uninstall -g npm-check

# Usage: bunx npm-check
# Usage: bunx http-server
```

## Proposed Final State

### Bun Globals (Minimal, Essential)
```
├── typescript
├── wrangler (Cloudflare Workers CLI)
├── ts-unused-exports (if actively used)
├── alfama (custom tool)
└── amalfa (custom tool)
```

### npm Globals (Absolute Minimum)
```
├── npm (package manager itself)
└── [1-2 AI assistants you actually use]
```

### Homebrew (Keep As-Is)
- System tools: git, gh, ripgrep, fd, fzf, jq
- Language runtimes: node, bun
- Development tools: neovim, docker-desktop
- System utilities: wget, tree, tmux

### On-Demand (via bunx)
- http-server
- live-server
- npm-check
- Any rarely-used CLI tools

## PATH Configuration

Current PATH order (good):
```
1. ~/.bun/bin (✅ Bun takes precedence)
2. /opt/homebrew/bin (✅ Homebrew second)
3. System paths
```

## Verification Commands

After cleanup, verify with:
```bash
# Check what's installed
bun pm ls -g
npm ls -g --depth=0

# Verify TypeScript uses Bun version
which tsc
# Expected: /Users/petersmith/.bun/bin/tsc

# Check no duplicates
npm ls -g typescript  # Should be empty
```

## Maintenance Going Forward

### Installing New Tools
1. **Default to Bun:** `bun install -g <package>`
2. **Use bunx for experiments:** `bunx <package>` (no install)
3. **Only use npm if:** Package explicitly requires it (document why)
4. **Homebrew for:** System utilities, non-JS tools

### Document Exceptions
Create `~/Dev/global-packages.md`:
```markdown
# Global Packages

## Bun Globals
- typescript - TypeScript compiler
- wrangler - Cloudflare Workers CLI
- alfama - Custom tool
- amalfa - Custom tool

## npm Globals (Exceptions)
- npm - Package manager
- [tool-name] - Reason why npm is needed

## Homebrew
- See `brew list` for system tools
```

### Regular Audits
```bash
# Quarterly review
bun pm ls -g
npm ls -g --depth=0

# Look for:
# - Duplicates across managers
# - Unused packages
# - Tools that could be project-local
```

## Benefits

1. **Consistency** - Single source of truth for JS tooling (Bun)
2. **Speed** - Bun is faster than npm for installs and execution
3. **Clarity** - Clear separation: Bun (JS), Homebrew (system), npm (fallback)
4. **Maintainability** - Easier to audit and update
5. **Reduced Conflicts** - No version clashes or PATH confusion

## Next Steps

1. **Review AI tools list** - Identify which ones you actually use
2. **Run cleanup script** - Execute removal commands
3. **Document final state** - Create `~/Dev/global-packages.md`
4. **Verify installation** - Run verification commands
5. **Test workflow** - Ensure all needed tools still work

## Notes

- ✅ Your custom tools (alfama, amalfa) are correctly installed via Bun
- ✅ Homebrew usage is appropriate for system tools
- ⚠️ Main issue is npm bloat and duplicates
- 📝 Decision needed: Which AI assistants to keep vs remove
