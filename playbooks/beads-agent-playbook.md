# Beads Agent Playbook

**Purpose:** Protocol for AI agents working with Beads issue tracking in the polyvis project.

**When to Use:** Any task involving issue creation, status updates, or issue lifecycle management.

---

## Core Principles

1. **Issues are code** - Stored in `.beads/issues.jsonl`, versioned like source files
2. **CLI-first** - All operations through `bd` command, no web UI assumptions
3. **Git-aware** - Issues sync with branch workflow via `bd sync`
4. **Atomic operations** - Each issue mutation is a discrete action
5. **Status-driven workflow** - Issues follow: open → in_progress → done

---

## Essential Commands

### Discovery

```bash
# List all issues (scan current state)
bd list

# List by status
bd list --status open
bd list --status in_progress
bd list --status done

# Show issue details
bd show <issue-id>

# Search issues (grep-like)
bd list | grep "authentication"
```

### Creation

```bash
# Create new issue (returns issue ID)
bd create "Add user authentication"

# Create with labels (comma-separated)
bd create "Fix graph rendering" --labels bug,high-priority

# Create with description
bd create "Implement vector search" --description "Use FAFCAS protocol for embeddings"
```

### Updates

```bash
# Change status
bd update <issue-id> --status in_progress
bd update <issue-id> --status done

# Add labels
bd update <issue-id> --labels "needs-review,blocked"

# Add comment/note
bd update <issue-id> --comment "Blocked on daemon refactor"
```

### Sync

```bash
# Sync with remote (MANDATORY at session end)
bd sync
```

---

## Agent Workflow Integration

### Task Initialization

**Before starting ANY task:**

```bash
# 1. Check for related open issues
bd list --status open

# 2. If issue exists, update status
bd update <issue-id> --status in_progress

# 3. If no issue exists, check if task warrants one
# Create issue if: multi-session work, involves dependencies, or >1 hour effort
```

### During Work

**Status tracking:**

- Update issue status when crossing milestones (e.g., tests written, implementation complete)
- Add comments when blocked or discovering scope changes
- Use labels to tag domain (e.g., `css`, `graph`, `infrastructure`)

**Example:**
```bash
# Discover scope expansion
bd update polyvis-42 --comment "Requires Alpine refactor, adding dependency on polyvis-38"
bd update polyvis-42 --labels "blocked,needs-alpine"
```

### Session Completion

**MANDATORY: Landing the Plane integration**

From `AGENTS.md` Protocol (Session Completion):

```bash
# 1. File issues for remaining work
bd create "Complete authentication flow" --labels "follow-up"
bd create "Add error boundary tests" --labels "testing,follow-up"

# 2. Run quality gates (omitted for brevity)

# 3. Update issue status
bd update polyvis-42 --status done
bd list --status in_progress  # Verify nothing left in limbo

# 4. PUSH TO REMOTE (includes bd sync)
git pull --rebase
bd sync  # ← MANDATORY: Syncs .beads/issues.jsonl
git push
git status  # Must show "up to date with origin"
```

**Critical:** `bd sync` is part of "Landing the Plane." Work is NOT complete until issues are synced to remote.

---

## Issue Lifecycle States

| State | When to Use | Next State |
|-------|-------------|------------|
| `open` | Default for new issues | `in_progress` |
| `in_progress` | Task actively being worked | `done` or `blocked` |
| `blocked` | Waiting on dependency | `in_progress` |
| `done` | Completed and verified | (terminal state) |

**State Transitions:**

```
open → in_progress → done
  ↓         ↓
blocked → in_progress
```

---

## Label Taxonomy

**Domain Labels** (align with playbooks):
- `css`, `alpine`, `graph`, `ingestion`, `infrastructure`, `mcp`, `database`

**Type Labels:**
- `bug`, `feature`, `refactor`, `documentation`, `testing`

**Priority Labels:**
- `high-priority`, `low-priority`, `quick-win`

**Status Labels:**
- `blocked`, `needs-review`, `follow-up`, `spike` (research/investigation)

**Example:**
```bash
bd create "Fix Sigma node click handler" --labels "bug,graph,alpine,high-priority"
```

---

## Integration with AGENTS.md Protocols

### Protocol 5 (TTP): Task Tracking Protocol

**Beads replaces `_CURRENT_TASK.md` for persistent tracking:**

- `_CURRENT_TASK.md` - Ephemeral, session-scoped checklist
- Beads issues - Persistent, multi-session tasks

**Decision tree:**
- Task <1 hour, single session → Use `_CURRENT_TASK.md` only
- Task >1 hour, multi-session → Create Beads issue
- Task spans multiple agents/branches → Create Beads issue

### Protocol 9 (SWP): Session Wrap-up Protocol

**Beads actions during wrap-up:**

1. **File issues for remaining work** (replaces TODO.md)
2. Update current issue status to `done` or document blockers
3. Run `bd sync` as part of git push workflow
4. Verify `bd list --status in_progress` is empty (or intentionally left open)

### Protocol 6 (WSP): When Stuck Protocol

**Beads for tracking blockages:**

When entering WSP (3+ failed attempts):

```bash
# 1. Mark issue as blocked
bd update <issue-id> --status blocked --comment "WSP triggered: regression loop in Alpine state"

# 2. Create spike issue for investigation
bd create "Investigate Alpine state management pattern" --labels "spike,blocked,alpine"

# 3. Resolve spike first, then unblock original issue
bd update <spike-issue-id> --status done
bd update <original-issue-id> --status in_progress --comment "Spike resolved, resuming work"
```

---

## Ground Truth: issues.jsonl

**Location:** `.beads/issues.jsonl`

**Format:** Newline-delimited JSON (JSONL)

**Characteristics:**
- Each line is a valid JSON object (one issue per line)
- Append-only structure (new events added to end)
- Git-friendly (merge conflicts are rare, line-based diffs)
- Human-readable (can inspect with `cat`, `grep`, `jq`)

**Verification:**

```bash
# Count issues by status
cat .beads/issues.jsonl | jq -r '.status' | sort | uniq -c

# Find issues by label
cat .beads/issues.jsonl | jq 'select(.labels | contains(["bug"]))'
```

---

## Common Patterns

### Pattern: Multi-Issue Feature

**Scenario:** Feature requires multiple workstreams (e.g., "Add authentication" = API + UI + tests)

```bash
# Create parent issue
bd create "Add user authentication" --labels "feature,epic"

# Create child issues (note parent in description)
bd create "Authentication API endpoints" --labels "feature,api" --description "Parent: polyvis-50"
bd create "Login UI component" --labels "feature,alpine" --description "Parent: polyvis-50"
bd create "Auth integration tests" --labels "testing" --description "Parent: polyvis-50"
```

### Pattern: Bug Triage

**Scenario:** User reports bug, agent investigates

```bash
# 1. Create issue immediately
bd create "Graph nodes not rendering on mobile" --labels "bug,graph,needs-investigation"

# 2. Investigate, add findings
bd update polyvis-55 --comment "Root cause: Sigma canvas size calculation in Alpine init"
bd update polyvis-55 --labels "bug,graph,sigma,alpine"

# 3. Fix and close
bd update polyvis-55 --status in_progress
# ... implement fix ...
bd update polyvis-55 --status done --comment "Fixed: Added resize observer to Sigma container"
```

### Pattern: Dependency Tracking

**Scenario:** Task blocked by another issue

```bash
# Mark as blocked
bd update polyvis-60 --status blocked --comment "Waiting on polyvis-58 (daemon refactor)"
bd update polyvis-60 --labels "blocked"

# When dependency resolves
bd update polyvis-58 --status done
bd update polyvis-60 --status in_progress --comment "polyvis-58 complete, resuming work"
```

---

## Anti-Patterns (Prohibited)

### ❌ Issue Spam

**DON'T:** Create issue for every trivial task

```bash
# BAD
bd create "Fix typo in README"
bd create "Add semicolon to line 42"
```

**DO:** Use issues for meaningful units of work (>15 min effort)

### ❌ Status Neglect

**DON'T:** Leave issues in `in_progress` when session ends

```bash
# BAD: Session ends, issue still in_progress
bd list --status in_progress
# Output: polyvis-45 (started 3 days ago, abandoned)
```

**DO:** Update to `blocked` or `done`, or file follow-up issue

### ❌ Sync Skipping

**DON'T:** End session without `bd sync`

```bash
# BAD
git commit -m "Feature complete"
git push  # ← issues.jsonl not synced!
```

**DO:** Always run `bd sync` before `git push`

```bash
# GOOD
git pull --rebase
bd sync
git push
```

### ❌ Vague Titles

**DON'T:** Create issues without clear objective

```bash
# BAD
bd create "Fix stuff"
bd create "Update things"
```

**DO:** Use action verbs + specific target

```bash
# GOOD
bd create "Fix Alpine state reset on graph zoom"
bd create "Update Sigma to v3.0.0"
```

---

## Verification Gates

**Before marking issue `done`:**

- [ ] All acceptance criteria met (from issue description)
- [ ] Tests pass (per NCVP - Protocol 8)
- [ ] No console errors (per BVP - Protocol 24)
- [ ] `bun run precommit` passes (tsc + Biome)
- [ ] Changes committed AND pushed (per SWP - Protocol 9)
- [ ] `bd sync` completed

---

## Quick Reference Card

```bash
# Discovery
bd list                              # All issues
bd list --status open                # Open issues only
bd show <id>                         # Issue details

# Creation
bd create "Title" --labels "bug,css" # New issue

# Status
bd update <id> --status in_progress  # Start work
bd update <id> --status done         # Complete
bd update <id> --status blocked      # Blocked

# Comments
bd update <id> --comment "Notes"     # Add note

# Sync (MANDATORY at session end)
bd sync                              # Sync with remote
```

---

## Troubleshooting

### Symptom: `bd sync` fails

**Diagnosis:**

```bash
# Check git status
git status

# Check for uncommitted changes to issues.jsonl
git diff .beads/issues.jsonl
```

**Resolution:**

```bash
# If issues.jsonl has conflicts
git pull --rebase
# Resolve conflicts (JSONL merges are line-based, usually clean)
bd sync
```

### Symptom: Issue ID unknown

**Diagnosis:**

```bash
# List all issues to find ID
bd list

# Search by keyword
bd list | grep "authentication"
```

**Resolution:** Use correct issue ID from list output

### Symptom: Command not found (`bd`)

**Diagnosis:** Beads not installed or not in PATH

**Resolution:**

```bash
# Install Beads
curl -sSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Verify installation
bd version
```

---

## Advanced: JSON Output Mode

For programmatic parsing (e.g., scripts, automation):

```bash
# Enable JSON output
bd list --json

# Parse with jq
bd list --json | jq '.[] | select(.status == "open")'

# Count issues by label
bd list --json | jq '[.[] | .labels[]] | group_by(.) | map({label: .[0], count: length})'
```

---

## Context Switching

**When switching between tasks:**

```bash
# Suspend current issue
bd update <current-id> --status blocked --comment "Switching to high-priority bug"

# Start new issue
bd update <urgent-id> --status in_progress

# Resume later
bd update <urgent-id> --status done
bd update <current-id> --status in_progress --comment "Resuming work"
```

---

## Integration with Playbooks

| Task Domain | Also Read |
|-------------|-----------|
| Creating issues during brief | `briefs-playbook.md` |
| Filing issues during debrief | `debriefs-playbook.md` |
| Tracking problem-solving spikes | `problem-solving-playbook.md` |
| Session wrap-up checklist | `development-workflow-playbook.md` |

---

## Summary

**Beads in polyvis workflow:**

1. **Persistent task tracking** - Issues outlive sessions
2. **Git-native** - Issues version with code
3. **Agent-friendly** - CLI-first, no web context switching
4. **Protocol integration** - Aligns with TTP, SWP, NCVP
5. **Mandatory sync** - `bd sync` is part of "Landing the Plane"

**Key constraint:** Never end session without `bd sync` + `git push`.

---

**Related:**
- `.beads/README.md` - Beads overview for humans
- `development-workflow-playbook.md` - Full workflow including session wrap-up
- `AGENTS.md` - Protocol 5 (TTP), Protocol 9 (SWP)
