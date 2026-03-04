---
name: td-agent
description: Task management standards for AI agents using the td CLI for planning, progress tracking, reviews, and handoffs.
---

# TD Agent Playbook

## Purpose
This playbook defines how AI agents must use the `td` CLI as structured external memory to ensure continuity across sessions, clear accountability, and reliable review workflows. For Nushell-based structured querying, see `playbooks/nushell-agent-playbook.md`.

## Core Principles
1. **Tasks before work**: Never start implementation without a task.
2. **Traceable decisions**: Record key decisions and blockers in `td` logs.
3. **Reliable handoffs**: Every session must end with a `td handoff`.
4. **Review separation**: The implementation session cannot approve its own work.

## Mandatory Directives

### 1) Mandatory Session Check
Always begin by reviewing open work and epics:
```/dev/null/placeholder.sh#L1-1
td usage --new-session
```

### 2) Mandatory Task Creation
If no task exists, create one before doing anything else.
```/dev/null/placeholder.sh#L1-6
# Create an issue
td create "Implement feature X" --type feature --priority P1

# Create an epic
td epic create "Feature X System" --priority P0

# Link a child issue to an epic
td create "Child task" --parent td-abc123
```

### 3) Start and Focus
Ensure the active task is started and focused:
```/dev/null/placeholder.sh#L1-3
td start <issue-id>
td focus <issue-id>
```

### 4) Track Progress and Decisions
Log progress and decisions as you go:
```/dev/null/placeholder.sh#L1-4
td log "Implemented core logic"
td log --decision "Chose approach A because of performance"
td log --blocker "Waiting on API keys"
```

### 5) Mandatory Handoff (Crucial)
Before your context window ends, always run a handoff.
```/dev/null/placeholder.sh#L1-6
td handoff td-abc123 \
  --done "Completed item 1, Completed item 2" \
  --remaining "Item 3, Item 4" \
  --decision "Used standard library to minimize dependencies" \
  --uncertain "Should we handle edge case Z?"
```

### 6) Review Workflow Separation
The implementation session must not approve its own work. A separate review agent inspects the PR, resolves issues, and only then approves the task in `td`.
```/dev/null/placeholder.sh#L1-12
# Submit your work for review
td review <issue-id>

# In a different session (review agent):
td reviewable
td context <issue-id>
td files <issue-id>
# Inspect PR checks + review comments, fix issues, push updates
# When PR is clean and ready to merge:
td approve <issue-id>
td reject <issue-id> --reason "Missing tests"
```

## Standard Workflow

### A) Plan
```/dev/null/placeholder.sh#L1-4
td usage --new-session
td list
td create "Fix authentication bug" --type bug --priority P1
td start <issue-id>
```

### B) Implement
```/dev/null/placeholder.sh#L1-4
td focus <issue-id>
td log --decision "Selecting approach B for simpler rollback"
td log "Added input validation and updated tests"
```

### C) Handoff
```/dev/null/placeholder.sh#L1-5
td handoff <issue-id> \
  --done "Implemented X and Y" \
  --remaining "Need to validate Z in staging" \
  --decision "Kept API surface unchanged"
```

### D) Review
```/dev/null/placeholder.sh#L1-7
td review <issue-id>
# Reviewer (separate session):
td reviewable
td context <issue-id>
# Inspect PR checks + review comments, fix issues, push updates
td approve <issue-id>
```

### Review Agent Checklist (GH API)
- Pull review comments (line-level):
  ```/dev/null/placeholder.sh#L1-1
  gh api repos/<owner>/<repo>/pulls/<pr_number>/comments
  ```
- Pull review summaries:
  ```/dev/null/placeholder.sh#L1-1
  gh api repos/<owner>/<repo>/pulls/<pr_number>/reviews
  ```
- Pull general PR comments:
  ```/dev/null/placeholder.sh#L1-1
  gh api repos/<owner>/<repo>/issues/<pr_number>/comments
  ```
- Filter unresolved CodeRabbit items:
  ```/dev/null/placeholder.sh#L1-1
  gh api repos/<owner>/<repo>/pulls/<pr_number>/comments --jq 'map(select(.body | contains("Addressed") | not))'
  ```
- Once all actionable items are resolved and checks are green:
  ```/dev/null/placeholder.sh#L1-2
  td reviewable
  td approve <issue-id>
  ```

## Querying State
```/dev/null/placeholder.sh#L1-4
td list
td query "status = in_progress"
td critical-path
td dep add <issue-id> <depends-on-id>
```

## Parallel Sessions: Build + Review

Use this when you want one agent to implement while another reviews in parallel. The key is **separate sessions** and **separate `td usage --new-session` calls**.

### Session A — Build Agent
```/dev/null/placeholder.sh#L1-11
td usage --new-session
td create "Implement feature X" --type feature --priority P1
td start td-abc123
td focus td-abc123
td log --decision "Chose approach A for simpler rollback"
# ... implementation happens ...
td handoff td-abc123 \
  --done "Implemented core logic and tests" \
  --remaining "Validate edge cases in staging"
td review td-abc123
```

### Session B — Review Agent (Separate Session)
```/dev/null/placeholder.sh#L1-8
td usage --new-session
td reviewable
td context td-abc123
td files td-abc123
td approve td-abc123
```

### Practical Setup
- Two chat windows (or two terminals), one per agent.
- Each session runs `td usage --new-session` once at start.
- Only the reviewer approves.

## Do / Don’t

### Do
- Start with `td usage --new-session`.
- Create a task if none exists.
- Log decisions and blockers.
- Run a handoff before ending the session.
- Submit for review and let a separate session approve.

### Don’t
- Start work without a task.
- Skip `td handoff`.
- Approve your own work in the same session.
- Leave progress undocumented.

## Session End Checklist
- [ ] Run `td handoff <issue-id> --done ... --remaining ... --decision ... --uncertain ...`
- [ ] Submit for review with `td review <issue-id>` (if implementation is complete)
- [ ] Never approve your own work in the same session

## Summary Checklist
- [ ] `td usage --new-session`
- [ ] Task exists (create if missing)
- [ ] `td start` and `td focus`
- [ ] Log decisions and blockers
- [ ] `td handoff` at session end
- [ ] `td review` and separate approval