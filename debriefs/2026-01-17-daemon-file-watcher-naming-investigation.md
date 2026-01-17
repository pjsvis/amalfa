---
date: 2026-01-17
tags: [investigation, naming, architecture, services, clarity]
agent: claude
environment: local
---

# Investigation: Daemon vs File-Watcher Naming Overlap

## Context

User noted overlap/confusion between "daemon" and "file-watcher" service references. Investigation to clarify what exists, what's duplicated, and what should be renamed.

## Current State

### The Reality

**There is ONE service with TWO names:**

1. **Implementation**: `src/daemon/index.ts`
   - Named "AMALFA Daemon" in code comments
   - Purpose: File watcher for incremental database updates
   - Entry point: `src/daemon/index.ts`
   - PID file: `.amalfa/runtime/daemon.pid`
   - Log file: `.amalfa/logs/daemon.log`

2. **CLI Interface**: `amalfa daemon <action>`
   - Manages the above service
   - Commands: `start|stop|status|restart`
   - Output says: "File Watcher: Running"

3. **Internal Reference**: `DaemonManager.watcherLifecycle`
   - Name: "File-Watcher"
   - PID: `daemon.pid` (not `file-watcher.pid`!)
   - Entry: `src/daemon/index.ts`

### The Confusion

**Naming inconsistency:**
- Directory: `src/daemon/`
- CLI command: `amalfa daemon`
- Service name in code: "AMALFA-Daemon" (line 28 of index.ts)
- DaemonManager calls it: "File-Watcher"
- User-facing output: "File Watcher: Running"
- PID file: `daemon.pid` (not what you'd expect!)

**What users see:**
```bash
$ amalfa daemon status
✅ File Watcher: Running (PID: 12345)
```

**What the code says:**
```typescript
// src/daemon/index.ts
const lifecycle = new ServiceLifecycle({
  name: "AMALFA-Daemon",  // ← Called "Daemon" here
  pidFile: join(AMALFA_DIRS.runtime, "daemon.pid"),
  ...
});

// src/utils/DaemonManager.ts
this.watcherLifecycle = new ServiceLifecycle({
  name: "File-Watcher",  // ← Called "File-Watcher" here
  pidFile: join(AMALFA_DIRS.runtime, "daemon.pid"),  // ← But uses daemon.pid!
  ...
});
```

## Analysis

### It's the SAME Service

**Evidence:**
1. Same PID file: `.amalfa/runtime/daemon.pid`
2. Same entry point: `src/daemon/index.ts`
3. Same log file: `.amalfa/logs/daemon.log`
4. CLI command `amalfa daemon` manages what it calls "File Watcher"

### Not a Functional Problem

**The service works correctly:**
- Watches markdown files for changes ✅
- Triggers incremental ingestion ✅
- Integrates with Ember for enrichment ✅
- Handles debouncing and retry logic ✅

### It's a NAMING Problem

**Three names for one thing:**
1. **"Daemon"** - CLI command, directory, PID file
2. **"File-Watcher"** / **"File Watcher"** - User-facing output, DaemonManager internal name
3. **"AMALFA-Daemon"** - Service lifecycle name in implementation

## Source of Confusion

Looking at history, likely evolution:

1. **Original**: Called "daemon" (generic background process)
2. **Clarification attempt**: Renamed user-facing to "File Watcher" (more descriptive)
3. **Incomplete migration**: PID files, directories, CLI commands kept "daemon" name

**Result**: Hybrid naming that confuses users and developers.

## Impact Assessment

### User Impact: **Moderate**

**Confusing commands:**
```bash
amalfa daemon start     # Sounds generic - daemon of what?
amalfa daemon status    
✅ File Watcher: Running  # Wait, I started "daemon" but got "file watcher"?
```

**Documentation inconsistency:**
- Some docs say "file watcher daemon"
- Some say "daemon"
- Some say "file-watcher"
- CLI help just says "daemon"

### Developer Impact: **Low-Moderate**

**Code clarity:**
- `src/daemon/` contains file watcher implementation
- But also contains sonar-* files (unrelated to file watching)
- New developers don't know if "daemon" means file watcher specifically

**PID file confusion:**
- Why is file watcher PID in `daemon.pid`?
- Makes you think there's a separate "daemon" process

## Recommendation

### Option 1: Rename Everything to "File Watcher" (Preferred)

**Rationale:**
- More descriptive
- Users understand what it does
- Aligns with user-facing messaging

**Changes:**
```bash
# CLI
amalfa file-watcher start|stop|status|restart
# Or
amalfa watcher start|stop|status|restart

# PID file
.amalfa/runtime/file-watcher.pid  # or watcher.pid

# Directory
src/file-watcher/index.ts  # or src/watcher/

# Service name
name: "File-Watcher"  # consistent everywhere
```

**Migration:**
- Symlink old PID locations for backwards compat
- Alias `amalfa daemon` → `amalfa watcher` with deprecation warning
- Update all documentation

**Pros:**
- Clear, descriptive name
- Matches what users see
- Eliminates confusion

**Cons:**
- Breaking change for existing users
- PID file location changes
- More files to update

### Option 2: Rename Everything to "Daemon" (Alternative)

**Rationale:**
- Minimal code changes
- Keeps existing CLI command
- "Daemon" is accurate (it IS a daemon)

**Changes:**
```typescript
// DaemonManager.ts
name: "AMALFA-Daemon",  // Not "File-Watcher"

// Output
console.log("✅ AMALFA Daemon: Running")  // Not "File Watcher"
```

**Pros:**
- Fewer breaking changes
- Existing PID files work
- Simpler migration

**Cons:**
- Less descriptive
- Users don't know what "daemon" does
- Generic name in specific context

### Option 3: Hybrid with Clarity (Compromise)

**Keep the command, clarify the output:**
```bash
amalfa daemon start|stop|status|restart

# Output
✅ File Watcher Daemon: Running (PID: 12345)
```

**Changes:**
- Update all user-facing text: "File Watcher Daemon" (full name)
- Keep PID file as `daemon.pid`
- Keep CLI as `amalfa daemon`
- Update docs to always say "File Watcher Daemon" (never just one)

**Pros:**
- Zero breaking changes
- Clarifies without renaming
- Simple documentation fix

**Cons:**
- Still have naming inconsistency internally
- "File Watcher Daemon" is verbose
- Doesn't fix developer confusion

## Opinion & Recommendation

**Go with Option 1: Rename to "watcher"**

### Reasoning

1. **Descriptive beats generic**: "watcher" tells you what it does, "daemon" doesn't

2. **Aligns with existing patterns**: 
   - `amalfa vector` - Vector daemon
   - `amalfa reranker` - Reranker daemon
   - `amalfa sonar` - Sonar agent
   - `amalfa watcher` - File watcher ← Fits the pattern

3. **Low actual breakage**: 
   - Most users use `amalfa servers` to see status
   - Direct `amalfa daemon` usage is rare
   - Can add deprecation warning for smooth transition

4. **Fixes directory confusion**:
   - `src/watcher/` for file watching
   - `src/daemon/` could be renamed `src/sonar/` or kept as service parent dir

### Implementation Plan

**Phase 1: Add `watcher` command (alias)**
```bash
amalfa watcher start|stop|status|restart  # New
amalfa daemon start|stop|status|restart   # Still works, shows deprecation
```

**Phase 2: Update internals**
- DaemonManager: `watcherLifecycle` ✅ (already correct)
- PID file: Create `watcher.pid`, symlink `daemon.pid` → `watcher.pid`
- Service name: "File-Watcher" ✅ (already done in DaemonManager)
- Actual service: Rename "AMALFA-Daemon" → "File-Watcher" in index.ts

**Phase 3: Update documentation**
- README: "file watcher" or "watcher"
- WARP.md: `amalfa watcher`
- MCP-TOOLS.md: "file watcher daemon"
- All playbooks/debriefs

**Phase 4: Deprecation (v1.5.0)**
```bash
$ amalfa daemon start
⚠️  Warning: 'amalfa daemon' is deprecated. Use 'amalfa watcher' instead.
🚀 Starting File Watcher...
```

**Phase 5: Removal (v2.0.0)**
- Remove `daemon` command alias
- Remove `daemon.pid` symlink
- Clean up old references

### Alternative: Directory Structure

If renaming everything, consider cleaner structure:

**Current:**
```
src/daemon/
  index.ts          # File watcher
  sonar-agent.ts    # Sonar (unrelated to file watching)
  sonar-*.ts        # More sonar stuff
```

**Proposed:**
```
src/services/
  watcher/
    index.ts        # File watcher
  sonar/
    agent.ts        # Sonar agent
    logic.ts
    ...
  vector/           # If we move from resonance/services
  reranker/         # If we move from resonance/services
```

**Or simpler:**
```
src/watcher/
  index.ts          # File watcher

src/sonar/
  agent.ts          # Sonar
  ...

src/resonance/services/
  vector-daemon.ts  # Keep here
  reranker-daemon.ts
```

## Files Affected

### High Priority (User-Facing)
- `src/cli/commands/services.ts` - Add watcher command
- `src/cli.ts` - Help text
- `README.md` - All daemon references
- `WARP.md` - Essential Commands section

### Medium Priority (Internal)
- `src/daemon/index.ts` - Service name
- `src/utils/DaemonManager.ts` - Already says "File-Watcher" ✅
- `.amalfa/runtime/daemon.pid` - Symlink or rename

### Low Priority (Docs)
- Playbooks mentioning "daemon"
- Debriefs mentioning "daemon"
- Architecture docs

## Success Criteria

- [ ] User runs `amalfa watcher start` and it works
- [ ] Old `amalfa daemon` shows deprecation warning but works
- [ ] Output always says "File Watcher" consistently
- [ ] PID file named logically (`watcher.pid`)
- [ ] Documentation uses consistent terminology
- [ ] New developers understand what "watcher" does without asking

## Risks

1. **Breaking changes**: Users with scripts using `amalfa daemon`
   - **Mitigation**: Deprecation period, clear docs

2. **PID file confusion**: Old PIDs might conflict
   - **Mitigation**: Symlink approach, or force restart on upgrade

3. **Documentation lag**: Some docs will reference old names
   - **Mitigation**: Comprehensive grep and replace

## Timeline

- **v1.4.x**: Add `watcher` alias, start deprecation messaging
- **v1.5.0**: Make `watcher` primary, `daemon` deprecated
- **v2.0.0**: Remove `daemon` alias completely

## Conclusion

**The "daemon" and "file-watcher" are the SAME service with inconsistent naming.**

**Recommended fix:** Rename to `watcher` for clarity and consistency with other service commands.

**Priority:** Medium (not breaking anything, but causes confusion)

**Effort:** Low-Medium (mostly find/replace + deprecation path)
