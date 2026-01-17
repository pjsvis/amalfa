---
date: 2026-01-17
tags: [playbook, consistency, quality, maintenance, audit, documentation]
---

# Consistency Audit Playbook

## Purpose

This playbook defines how to maintain consistency between code, documentation, and user-facing behavior in the Amalfa project. **No excuses for inconsistency** - we have the tools to prevent it.

## Core Principle

> **Code, documentation, and behavior must tell the same story.**

When they diverge:
- Users get confused (wrong commands documented)
- Developers waste time (chasing ghosts)
- Trust erodes (if docs lie, what else is wrong?)

## Lesson Learned

After 2026-01-17 audit, we discovered:
1. **Non-existent script** (`scripts/cli/ingest.ts`) documented everywhere
2. **Excessive nuke-and-pave** (deleting valuable caches)
3. **Naming confusion** (`daemon` vs `file-watcher` for same service)
4. **Missing guidance** (MCP tools listed but not explained)

**Root cause:** No regular consistency checks. Documentation rot accumulated unnoticed.

## Consistency Dimensions

### 1. Code ↔ Documentation
**What to check:**
- CLI commands in docs exist in `src/cli.ts`
- File paths referenced actually exist
- Configuration keys match `src/config/defaults.ts`
- API signatures match implementation

### 2. User-Facing ↔ Internal
**What to check:**
- Service names consistent (CLI output matches PID files)
- Command help text matches actual behavior
- Error messages are accurate
- Examples in docs actually work

### 3. Documentation ↔ Documentation
**What to check:**
- README matches WARP.md matches MCP-TOOLS.md
- Playbooks don't contradict each other
- No outdated patterns in archived debriefs
- Links between docs are valid

### 4. Naming ↔ Naming
**What to check:**
- Same concept has same name everywhere
- No orphaned legacy names
- Directory names match service names
- PID files match service names

## Regular Audit Checklist

### Monthly: Quick Consistency Check

**Time:** 15 minutes

```bash
# 1. Verify documented commands exist
grep -r "amalfa [a-z]" README.md WARP.md docs/ | \
  cut -d: -f2 | grep -o "amalfa [a-z-]*" | sort -u > /tmp/doc-commands.txt

# Compare with actual CLI commands in src/cli.ts
# Manual review: Do they match?

# 2. Check for non-existent file references
grep -r "scripts/.*\.ts" README.md WARP.md docs/ | \
  while read line; do
    file=$(echo "$line" | grep -o "scripts/[^\"'[:space:]]*")
    test -f "$file" || echo "MISSING: $file in $line"
  done

# 3. Verify config keys
grep -r "amalfa.config" docs/ README.md | \
  grep -o '"[a-zA-Z]*":' | sort -u > /tmp/doc-config-keys.txt
# Compare with src/config/defaults.ts schema

# 4. Check service names consistency
grep -r "daemon\|watcher\|file-watcher" src/cli src/utils | \
  grep -i "name:" 
# Should all agree on naming
```

**Red flags:**
- Commands in docs not in code
- Files referenced that don't exist
- Multiple names for same service
- Config keys not in schema

### Quarterly: Deep Audit

**Time:** 2-3 hours

**1. Command Verification (30 min)**
```bash
# Extract all documented commands
rg 'amalfa [a-z-]+' README.md WARP.md docs/ -o --no-filename | \
  sort -u > /tmp/documented-commands.txt

# Extract actual commands from CLI
rg 'case "([a-z-]+)":' src/cli.ts -o -r '$1' | \
  sort -u > /tmp/actual-commands.txt

# Find discrepancies
diff /tmp/documented-commands.txt /tmp/actual-commands.txt
```

**Action:** Fix or remove undocumented/non-existent commands.

**2. File Path Audit (30 min)**
```bash
# Find all file paths mentioned in markdown
rg '`[^`]*\.(ts|js|json|md)`' README.md WARP.md docs/ -o | \
  sed 's/`//g' | sort -u | \
  while read file; do
    # Try relative to root
    if [ ! -f "$file" ] && [ ! -f "src/$file" ]; then
      echo "BROKEN: $file"
    fi
  done
```

**Action:** Update paths or remove references.

**3. Naming Consistency (45 min)**

Check each service:
- CLI command name
- Directory name
- Service name in code
- PID file name
- User-facing output
- Documentation terminology

Create matrix:
```
Service | CLI | Directory | Code Name | PID File | Output | Docs
--------|-----|-----------|-----------|----------|--------|-----
Watcher | daemon | daemon/ | AMALFA-Daemon | daemon.pid | File Watcher | mixed
```

**Action:** Align all names or document why they differ.

**4. Cross-Doc Validation (45 min)**

- Does README claim match MCP-TOOLS.md?
- Does WARP.md Essential Commands match README Commands?
- Do playbooks contradict each other?
- Are debriefs referencing outdated patterns?

**Action:** Update or add notes about evolution.

### Annually: Comprehensive Review

**Time:** Full day

**Includes quarterly checks PLUS:**

**5. Behavior Verification**
- Actually run every documented command
- Test every documented workflow
- Verify examples produce claimed output
- Check error messages match docs

**6. Semantic Drift**
- Has terminology evolved?
- Are metaphors still accurate?
- Do examples reflect current best practices?
- Is architecture section current?

**7. User Journey Audit**
- Fresh install following README
- Configure using documented steps
- Run MCP server following guide
- Does everything work as documented?

## Automated Checks

### Add to CI/CD

Create `scripts/maintenance/consistency-check.ts`:

```typescript
#!/usr/bin/env bun

/**
 * Automated consistency checks
 * Run in CI to prevent drift
 */

import { existsSync } from "fs";
import { join } from "path";

const errors: string[] = [];

// 1. Verify documented files exist
const docFiles = [
  "README.md",
  "WARP.md", 
  "docs/MCP-TOOLS.md",
  "docs/ARCHITECTURE.md"
];

for (const doc of docFiles) {
  if (!existsSync(doc)) {
    errors.push(`Missing documented file: ${doc}`);
  }
}

// 2. Check CLI commands match help text
// Parse src/cli.ts for commands
// Parse README for amalfa commands
// Report mismatches

// 3. Verify config example matches schema
// Load amalfa.config.example.json
// Load src/config/defaults.ts schema
// Check all keys exist

// 4. Check service name consistency
// Parse DaemonManager
// Parse service implementations
// Report naming conflicts

if (errors.length > 0) {
  console.error("❌ Consistency check failed:");
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

console.log("✅ Consistency check passed");
```

**Run in CI:**
```yaml
# .github/workflows/consistency.yml
name: Consistency Check
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: bun install
      - run: bun run scripts/maintenance/consistency-check.ts
```

## Prevention Strategies

### 1. Single Source of Truth

**For commands:**
- `src/cli.ts` is the source
- Generate docs from code (consider doc generation)
- Never manually list commands in docs

**For configuration:**
- `src/config/defaults.ts` is the source
- Generate example config from schema
- Validate examples against schema

### 2. Naming Conventions

**Establish once, enforce always:**

**Services:**
- CLI command: `amalfa <service>`
- Directory: `src/<service>/`
- PID file: `.amalfa/runtime/<service>.pid`
- Output: `<Service>: Running`
- Docs: Always `<service>`

**No exceptions unless documented in this playbook.**

### 3. Review Checklist

**Before merging any PR:**
- [ ] If code changed, docs updated?
- [ ] If command added/removed, all docs updated?
- [ ] If service renamed, all references updated?
- [ ] If config changed, example updated?
- [ ] Examples tested and work?

### 4. Deprecation Protocol

**When changing user-facing behavior:**

1. **Add new** (keep old working)
2. **Deprecation warning** (log/output)
3. **Update docs** (show new way)
4. **Wait one minor version**
5. **Remove old** (major version only)

**Never:**
- Remove without warning
- Change behavior silently
- Update docs before code
- Leave orphaned references

## Anti-Patterns to Avoid

### ❌ "Document future state"
```markdown
<!-- Don't do this -->
To regenerate database, run:
`amalfa reingest`  # ← Doesn't exist yet!
```

**Why wrong:** Users try it, it fails, trust broken.

**Do instead:** Document what exists NOW. Add "Coming soon" section for future.

### ❌ "One true location"
```markdown
<!-- Don't do this -->
For database operations, see DATABASE-OPS.md
# Then have different instructions in README, WARP.md, etc.
```

**Why wrong:** Multiple sources of truth diverge.

**Do instead:** Link to authoritative location. Don't duplicate.

### ❌ "Lazy renaming"
```typescript
// Don't do this
const daemon = new FileWatcher(); // ← Names don't match!
```

**Why wrong:** Confuses readers of code.

**Do instead:** Align all names or document the reason.

### ❌ "Legacy for compatibility"
```bash
# Don't do this
amalfa daemon start  # Old name, keep for compatibility
# But never document or explain the new name
```

**Why wrong:** New users learn wrong name, old pattern persists.

**Do instead:** Deprecation warnings, docs show new way.

## Tools

### Consistency Checker Script

Location: `scripts/maintenance/consistency-check.ts` (to be created)

### Doc Validation

```bash
# Check all markdown links
bun run scripts/maintenance/check-links.ts

# Verify code examples
bun run scripts/maintenance/test-examples.ts

# Validate config schemas
bun run scripts/maintenance/validate-configs.ts
```

### Grep Patterns

```bash
# Find all CLI commands mentioned
rg 'amalfa [a-z-]+' docs/ README.md WARP.md

# Find file path references
rg '`[^`]*/[^`]*\.(ts|js|json|md)`'

# Find service names
rg -i 'daemon|watcher|file-watcher' src/

# Find config keys
rg '"[a-zA-Z]+":' amalfa.config.*
```

## Responsibility

### Who Checks

**Everyone:** Notice inconsistencies, report them.

**PR Reviewers:** Check consistency before approving.

**Monthly:** Maintainer runs quick check.

**Quarterly:** Team runs deep audit.

**CI:** Runs automated checks on every commit.

### Who Fixes

**Author of change:** Update related docs in same PR.

**Finder of issue:** Create issue or fix directly.

**Scheduled audit:** Address all findings before next release.

## Metrics

Track over time:

- **Consistency score:** % of checks passing
- **Time to fix:** Days between finding and fixing
- **Drift rate:** Issues found per month
- **Coverage:** % of code with accurate docs

**Goal:** 100% consistency score, <7 day fix time.

## Integration with Workflows

### Development

```bash
# Before committing
bun run check            # Code quality
bun run consistency      # Consistency check
git commit -m "..."
```

### Release

```bash
# Before releasing
bun run consistency-full  # Deep audit
bun run test-docs         # Verify examples
# Fix any issues before release
```

### Documentation

```bash
# After updating docs
bun run verify-docs      # Check paths, commands
bun run test-examples    # Run code examples
```

## Examples

### Good: Consistent Service

```typescript
// src/watcher/index.ts
const lifecycle = new ServiceLifecycle({
  name: "Watcher",
  pidFile: ".amalfa/runtime/watcher.pid",
  ...
});
```

```bash
# CLI
amalfa watcher start
✅ Watcher: Running (PID: 12345)
```

```markdown
<!-- README.md -->
## File Watcher

Start the file watcher:
\`\`\`bash
amalfa watcher start
\`\`\`
```

**All aligned:** service name, PID file, CLI, output, docs.

### Bad: Inconsistent Service

```typescript
// src/daemon/index.ts
const lifecycle = new ServiceLifecycle({
  name: "AMALFA-Daemon",  // ← One name
  pidFile: ".amalfa/runtime/daemon.pid",  // ← Different name
  ...
});
```

```bash
# CLI
amalfa daemon start  // ← Yet another name
✅ File Watcher: Running  // ← And another!
```

```markdown
<!-- README.md -->
## File Watcher Daemon  ← Combined?

Start the daemon:
\`\`\`bash
rm -rf .amalfa/ && bun run scripts/cli/ingest.ts  ← Wrong file!
\`\`\`
```

**Nothing aligns.**

## Maintenance Schedule

- **Weekly:** Watch for user confusion (signals drift)
- **Monthly:** Run quick consistency check
- **Quarterly:** Deep audit
- **Annually:** Comprehensive review
- **Every PR:** Reviewer checks consistency
- **Every commit:** CI runs automated checks

## Success Criteria

✅ **Zero tolerance for drift:**
- No commands in docs that don't exist
- No file paths that don't resolve
- No naming inconsistencies
- No outdated examples

✅ **Fast feedback:**
- CI catches issues before merge
- Monthly checks catch early drift
- Users rarely report doc bugs

✅ **Cultural:**
- Team values consistency
- PRs include doc updates
- Inconsistencies are bugs, not nice-to-haves

## Related Playbooks

- `playbooks/debriefs-playbook.md` - How to write consistent debriefs
- `playbooks/problem-solving-playbook.md` - Debugging doc issues
- `playbooks/change-management-protocol.md` - Plan → Execute → Verify → Debrief

## Conclusion

**Consistency is not optional.** We have the code, we have the docs, we have no excuse for drift.

**This playbook defines how we maintain alignment between what we claim and what we deliver.**

Regular audits + automated checks + cultural commitment = consistent, trustworthy codebase.
