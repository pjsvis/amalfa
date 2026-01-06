# Beads Human Playbook

**Purpose:** Practical guide for humans working with Beads issue tracking in polyvis.

**Audience:** Developers, contributors, and project leads using Beads CLI.

---

## Why Beads in Polyvis?

**Traditional issue trackers:** GitHub Issues, Jira, Linear → web UI, context switching, network dependency

**Beads advantages:**
- ✅ **CLI-first** - Stay in terminal, no browser tabs
- ✅ **Git-native** - Issues version with code, branch-aware
- ✅ **Offline-first** - Work anywhere, sync later
- ✅ **AI-friendly** - Agents can create/update issues programmatically
- ✅ **Zero lock-in** - Plain JSONL files, exportable anytime

**Core insight:** Issues ARE code artifacts, not external metadata.

---

## Installation & Setup

### Install Beads

```bash
# Install via curl
curl -sSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Verify installation
bd version
```

### First-Time Setup (Already Done)

Polyvis repo is already initialized with Beads. To verify:

```bash
# Check Beads configuration
ls -la .beads/
# Should see: config.yaml, issues.jsonl, metadata.json

# List existing issues
bd list
```

---

## Daily Workflows

### Starting Your Day

**1. Sync with remote (get latest issues):**

```bash
git pull --rebase
# Issues automatically hydrate from .beads/issues.jsonl
```

**2. Review open work:**

```bash
# See all open issues
bd list --status open

# See what you're working on
bd list --status in_progress

# Check for blockers
bd list | grep "blocked"
```

**3. Pick a task:**

```bash
# Show full details
bd show polyvis-42

# Update status to in_progress
bd update polyvis-42 --status in_progress
```

---

### During Work

**Adding context as you go:**

```bash
# Found the root cause?
bd update polyvis-42 --comment "Root cause: Alpine state not clearing on unmount"

# Discovered dependency?
bd update polyvis-42 --comment "Requires polyvis-38 (daemon refactor) to complete"

# Need to block?
bd update polyvis-42 --status blocked --labels "blocked,needs-review"
```

**Creating sub-tasks:**

```bash
# Complex feature? Break it down
bd create "Implement auth API endpoints" --labels "feature,api" --description "Part of polyvis-42"
bd create "Add auth UI components" --labels "feature,alpine" --description "Part of polyvis-42"
bd create "Write auth integration tests" --labels "testing" --description "Part of polyvis-42"
```

---

### Completing Work

**Before marking `done`:**

1. ✅ Tests pass
2. ✅ No console errors
3. ✅ Code review complete (if team workflow requires)
4. ✅ Changes committed

**Close the issue:**

```bash
# Mark as done
bd update polyvis-42 --status done

# Add completion note
bd update polyvis-42 --status done --comment "Implemented with Alpine.data pattern, all tests passing"
```

**Sync with team:**

```bash
# Commit your code
git add .
git commit -m "feat: add authentication system

Implements user auth with Alpine state management.
Tests cover happy path and error cases.

Closes polyvis-42

Co-Authored-By: Warp <agent@warp.dev>"

# Sync issues + push
git pull --rebase
bd sync
git push
```

---

## Creating Effective Issues

### Good Issue Anatomy

**Title:** Action verb + specific target

```bash
# ✅ GOOD
bd create "Fix Alpine state reset on graph zoom"
bd create "Add vector search to node filtering"
bd create "Refactor Sigma initialization to use Alpine lifecycle"

# ❌ BAD
bd create "Fix bug"
bd create "Improve performance"
bd create "Update stuff"
```

**Description:** Problem + context + acceptance criteria

```bash
bd create "Add dark mode toggle" \
  --labels "feature,css,alpine" \
  --description "
Problem: Users request dark mode for night coding.

Context:
- Theme system already uses CSS variables in theme.css
- Need Alpine toggle component + local storage persistence

Acceptance Criteria:
- [ ] Toggle button in header
- [ ] Persists across sessions
- [ ] Smooth transition between themes
- [ ] All components support both modes
"
```

---

## Label Strategy

### Domain Labels

Use these to align with playbook domains:

```bash
--labels "css"           # Styling work
--labels "alpine"        # UI state/interactivity
--labels "graph"         # Graphology/Sigma
--labels "ingestion"     # Data pipeline
--labels "infrastructure" # Servers/deployment
--labels "mcp"           # Model Context Protocol
--labels "database"      # SQLite schema/queries
```

### Type Labels

```bash
--labels "bug"           # Something broken
--labels "feature"       # New capability
--labels "refactor"      # Code improvement, no behavior change
--labels "documentation" # Docs/comments
--labels "testing"       # Test additions/fixes
```

### Priority Labels

```bash
--labels "high-priority" # Urgent, blocking other work
--labels "low-priority"  # Nice-to-have
--labels "quick-win"     # <1 hour, high impact
```

### Status Labels

```bash
--labels "blocked"       # Waiting on dependency
--labels "needs-review"  # Ready for code review
--labels "follow-up"     # Deferred from another task
--labels "spike"         # Investigation/research
```

### Combining Labels

```bash
# Bug in graph rendering, high priority
bd create "Fix node overlap in force layout" --labels "bug,graph,high-priority"

# Feature spanning multiple domains
bd create "Add search autocomplete" --labels "feature,alpine,database"

# Research task
bd create "Investigate WebGPU for graph rendering" --labels "spike,graph,infrastructure"
```

---

## Team Collaboration

### Claiming Work

```bash
# See available work
bd list --status open

# Claim an issue
bd update polyvis-55 --status in_progress --comment "Pete starting work on this"
```

### Handoffs

```bash
# Blocked on someone else?
bd update polyvis-60 --status blocked \
  --comment "Blocked: Waiting on @alice to finish polyvis-58 (API refactor)"

# Ready for review?
bd update polyvis-61 --status done --labels "needs-review" \
  --comment "PR #42 ready for review"
```

### Dependency Tracking

```bash
# Create dependent issues
bd create "Migrate to new API endpoints" \
  --labels "refactor,api" \
  --description "Depends on: polyvis-58"

# Link in comments
bd update polyvis-62 --comment "See polyvis-58 for API design decisions"
```

---

## Searching & Filtering

### By Status

```bash
bd list --status open        # Active work
bd list --status in_progress # Currently being worked
bd list --status done        # Completed
bd list --status blocked     # Waiting on dependencies
```

### By Keyword (grep)

```bash
# Find auth-related issues
bd list | grep -i "auth"

# Find bugs
bd list | grep "bug"

# Find high-priority items
bd list | grep "high-priority"
```

### JSON Mode (Advanced)

```bash
# Get JSON output
bd list --json

# Use jq for complex queries
bd list --json | jq '.[] | select(.labels | contains(["bug"]))'

# Count issues by status
bd list --json | jq 'group_by(.status) | map({status: .[0].status, count: length})'

# Find blocked issues
bd list --json | jq '.[] | select(.status == "blocked")'
```

---

## Visualization & Reporting

### Quick Status Dashboard

```bash
# Create a simple status report
echo "=== Polyvis Issue Status ==="
echo ""
echo "Open:        $(bd list --status open | wc -l)"
echo "In Progress: $(bd list --status in_progress | wc -l)"
echo "Blocked:     $(bd list --status blocked | wc -l)"
echo "Done:        $(bd list --status done | wc -l)"
echo ""
echo "High Priority:"
bd list | grep "high-priority"
```

### Weekly Report

```bash
# Issues completed this week
bd list --json | jq '.[] | select(.status == "done") | select(.updated_at > "2025-01-01")' 

# Issues created this week
bd list --json | jq '.[] | select(.created_at > "2025-01-01")'
```

---

## Git Workflow Integration

### Branch Workflow

**Option 1: Issue per branch**

```bash
# Create issue
bd create "Add user profiles" --labels "feature"
# Returns: polyvis-75

# Create branch
git checkout -b feat/polyvis-75-user-profiles

# Work on it
bd update polyvis-75 --status in_progress

# Complete
bd update polyvis-75 --status done
git commit -m "feat: add user profiles (closes polyvis-75)"
```

**Option 2: Multiple issues per branch**

```bash
# Refactor branch with multiple issues
git checkout -b refactor/alpine-state

bd create "Refactor graph controls to Alpine" --labels "refactor,alpine"
bd create "Refactor filter panel to Alpine" --labels "refactor,alpine"
bd create "Remove jQuery dependencies" --labels "refactor"

# Work through them
bd update polyvis-80 --status in_progress
# ... work ...
bd update polyvis-80 --status done

bd update polyvis-81 --status in_progress
# ... work ...
bd update polyvis-81 --status done
```

### Commit Messages

**Reference issues in commits:**

```bash
git commit -m "fix: correct node positioning algorithm

Fixes calculation bug when zoomed > 2x.

Closes polyvis-42"
```

**Always include co-author line (for AI agent work):**

```bash
git commit -m "feat: add dark mode toggle

Implements theme switcher with Alpine + CSS variables.

Related: polyvis-65

Co-Authored-By: Warp <agent@warp.dev>"
```

---

## Syncing & Conflict Resolution

### Normal Sync

```bash
# Before pushing
git pull --rebase
bd sync
git push
```

### Handling Conflicts

**Scenario:** Two people create issues simultaneously

```bash
# Pull fails with conflict in .beads/issues.jsonl
git pull --rebase
# Auto-merging .beads/issues.jsonl
# CONFLICT (content): Merge conflict in .beads/issues.jsonl

# Check the conflict
git status
# both modified: .beads/issues.jsonl
```

**Resolution strategy:**

JSONL conflicts are usually clean because each issue is one line. Git shows conflicts as:

```
<<<<<<< HEAD
{"id":"polyvis-42","title":"Your issue",...}
=======
{"id":"polyvis-43","title":"Their issue",...}
>>>>>>> origin/main
```

**Since these are different issues, keep BOTH:**

```bash
# Edit .beads/issues.jsonl to keep both lines (remove conflict markers)
# Then:
git add .beads/issues.jsonl
git rebase --continue
bd sync
git push
```

---

## Archiving & Cleanup

### Viewing Old Issues

```bash
# All done issues
bd list --status done

# Done issues from specific timeframe
bd list --json | jq '.[] | select(.status == "done" and .updated_at > "2025-01-01")'
```

### Issue Lifecycle

**Beads doesn't delete issues.** They stay in `issues.jsonl` forever (like git history).

**To "archive":** Just leave them as `done`. Filter them out when listing:

```bash
# Show only active work (not done)
bd list | grep -v "done"
```

---

## Advanced Patterns

### Epic Tracking

**Create parent "epic" issue:**

```bash
bd create "Authentication System" --labels "epic,feature"
# Returns: polyvis-100
```

**Create child issues:**

```bash
bd create "Auth API endpoints" --labels "feature,api" --description "Epic: polyvis-100"
bd create "Login UI" --labels "feature,alpine" --description "Epic: polyvis-100"
bd create "Session management" --labels "feature,infrastructure" --description "Epic: polyvis-100"
bd create "Auth tests" --labels "testing" --description "Epic: polyvis-100"
```

**Track progress:**

```bash
# Show all issues in epic
bd list | grep "polyvis-100"

# Count completed
bd list --json | jq '[.[] | select(.description | contains("polyvis-100"))] | map(select(.status == "done")) | length'
```

### Spike/Investigation Issues

```bash
# Create research task
bd create "Investigate WebGPU for graph rendering" --labels "spike,graph"

# Document findings in comments
bd update polyvis-110 --comment "
Findings:
- WebGPU support limited (Chrome 113+, Safari 18+)
- Performance gain: 3-5x for >10k nodes
- Migration effort: ~40 hours
- Recommendation: Defer until browser support >80%
"

# Close spike
bd update polyvis-110 --status done --comment "Decision: Defer WebGPU migration to Q3"
```

### Bug Triage Workflow

```bash
# 1. User reports bug (create issue immediately)
bd create "Graph crashes on mobile Safari" --labels "bug,needs-investigation"

# 2. Investigate (add findings)
bd update polyvis-120 --comment "
Repro steps:
1. Open graph on iPhone 15 Safari
2. Zoom to 3x
3. Pan rapidly
Result: WebGL context lost

Root cause: Sigma doesn't handle context loss on mobile
"

# 3. Update labels with findings
bd update polyvis-120 --labels "bug,graph,sigma,mobile,high-priority"

# 4. Fix
bd update polyvis-120 --status in_progress
# ... implement fix ...
bd update polyvis-120 --status done --comment "
Fix: Added WebGL context restoration handler
Tested on iOS 17 Safari, Android Chrome
"
```

---

## Integrations (Future)

Beads supports integrations with external systems:

```bash
# GitHub sync (experimental)
bd config set github.org "myorg"
bd config set github.repo "polyvis"

# Linear sync (experimental)
bd config set linear.api-key "your-key"
```

**Current status:** Polyvis uses Beads as primary tracker (no external sync).

---

## Troubleshooting

### Command Not Found

```bash
# Problem: bd: command not found
# Solution: Install Beads
curl -sSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Add to PATH (if needed)
export PATH="$HOME/.beads/bin:$PATH"
```

### Sync Failures

```bash
# Problem: bd sync fails with "uncommitted changes"
# Solution: Commit or stash first
git status
git add .
git commit -m "WIP"
bd sync

# Problem: bd sync fails with "JSONL conflict"
# Solution: Resolve conflict in .beads/issues.jsonl
git status
# Edit .beads/issues.jsonl manually
git add .beads/issues.jsonl
git rebase --continue
bd sync
```

### Lost Issue ID

```bash
# Problem: Forgot issue ID for "authentication" task
# Solution: Search with grep
bd list | grep -i "auth"
```

### Can't Find Recent Issue

```bash
# Problem: Created issue yesterday, can't find it
# Solution: List all issues (including done)
bd list

# Or search by date
bd list --json | jq '.[] | select(.created_at > "2025-01-04")'
```

---

## Best Practices

### ✅ DO

- **Create issues for >15 min work** - Track meaningful units
- **Update status frequently** - Keep team informed
- **Use descriptive titles** - Action verb + specific target
- **Label consistently** - Use domain + type + priority
- **Comment with context** - Explain "why", not just "what"
- **Sync before pushing** - `bd sync` + `git push` together
- **Close issues explicitly** - Mark `done` when verified

### ❌ DON'T

- **Micro-manage** - Don't create issues for trivial edits
- **Abandon in-progress** - Update to `blocked` or `done`
- **Skip sync** - Always run `bd sync` before `git push`
- **Use vague titles** - "Fix bug" tells nobody anything
- **Forget to close** - Mark done when work is complete
- **Create duplicates** - Search first with `bd list | grep`

---

## Quick Reference

```bash
# Most Common Commands
bd list                              # All issues
bd list --status open                # Open only
bd show <id>                         # Details
bd create "Title" --labels "bug,css" # New issue
bd update <id> --status in_progress  # Start work
bd update <id> --status done         # Complete
bd update <id> --comment "Note"      # Add context
bd sync                              # Sync with remote

# Daily Workflow
bd list --status open                # What's available?
bd update <id> --status in_progress  # Claim it
# ... work ...
bd update <id> --status done         # Finish it
git commit && bd sync && git push    # Ship it
```

---

## Getting Help

**Beads Documentation:**
- GitHub: [github.com/steveyegge/beads](https://github.com/steveyegge/beads)
- Quick start: `bd quickstart`
- Examples: [github.com/steveyegge/beads/tree/main/examples](https://github.com/steveyegge/beads/tree/main/examples)

**Polyvis-Specific:**
- Agent workflow: `playbooks/beads-agent-playbook.md`
- Development workflow: `playbooks/development-workflow-playbook.md`
- Protocol integration: `AGENTS.md` (Protocol 5, 9)

---

## Philosophy

**Why track issues in the repo?**

Traditional issue trackers treat issues as *metadata about code*. Beads treats issues as *part of the codebase*.

**Benefits:**
1. **Single source of truth** - Issues version with code
2. **Works offline** - No network dependency
3. **Git-native** - Branch-aware, mergeable
4. **AI-friendly** - CLI-first, programmatic access
5. **Zero vendor lock-in** - Plain JSONL, exportable

**Trade-offs:**
- No web UI (feature, not bug)
- No fancy charts (use jq + scripts)
- No notifications (use git hooks if needed)

**Philosophy alignment:** Polyvis values **simplicity, locality, and developer control**. Beads embodies these values for issue tracking.

---

**Next steps:**
1. Try `bd list` to see existing issues
2. Create your first issue with `bd create`
3. Work through the daily workflow above
4. Read `beads-agent-playbook.md` to understand AI agent integration

**Happy tracking!** 🎯
