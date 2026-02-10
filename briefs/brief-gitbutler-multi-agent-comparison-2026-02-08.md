# Multi-Agent Workflow Comparison: GitButler vs Vanilla Git

## Scenario: 3 Agents Working Concurrently on Same Codebase

- **Agent A:** Authentication refactor
- **Agent B:** Database migrations  
- **Agent C:** UI component updates

---

## Without GitButler (Vanilla Git)

### Workflow Pattern

```
Codebase State:
main (shared)
├── agent-A/feature-auth (branch)
├── agent-B/feature-db (branch)  
└── agent-C/feature-ui (branch)

Problem: Only ONE branch can be "active" in the workspace at a time
```

### Agent A's Workflow

```bash
# Agent A starts work
git checkout -b feature-auth
# ...makes changes...
git add .
git commit -m "Add auth refactor"

# Agent B wants to see A's progress
git stash                    # Save A's work
git checkout feature-auth    # Switch to A's branch
git log --oneline            # Review A's commits
git checkout main            # Switch back
git stash pop                # Restore A's work
# ...continues work...
```

**Friction Points:**
- Agent B must `stash` → `checkout` → `review` → `checkout` → `stash pop` just to see Agent A's work
- If Agent C needs changes from both A and B: merge hell
- Agents can't collaborate on in-progress work without constant branch switching

### Coordination Bottlenecks

| Action | Without GitButler | Pain Level |
|--------|------------------|------------|
| Review Agent B's work while working on A | Stash → checkout → review → restore | 🔴 High |
| See all 3 agents' progress at once | Check 3 separate branches sequentially | 🔴 High |
| Test integration of A + B work | Create temporary merge branch | 🔴 High |
| Agent C depends on Agent A's changes | Wait for A to push + merge, or rebase dance | 🔴 High |
| Quick fix on main while feature work | Stash everything → checkout main → fix → restore | 🔴 High |
| Merge 3 features into main | Sequential PRs, potential conflicts each time | 🟡 Medium |

### Conflict Handling

```bash
# Agent A and B both modified src/utils/helpers.ts
# Agent A commits and pushes first
# Agent B tries to push:
git push origin feature-db
# ERROR: rejected (non-fast-forward)

# Agent B must:
git fetch origin
git rebase origin/main  # or merge
# ...resolve conflicts...
git push origin feature-db

# Meanwhile Agent C is waiting, workspace is in conflict state
```

---

## With GitButler

### Workspace Model

```
Shared Workspace (all changes visible simultaneously):
├── main (anchor - always present)
├── feature-auth (Agent A's stack) ← visible
├── feature-db (Agent B's stack)   ← visible
└── feature-ui (Agent C's stack)  ← visible

All branches coexist. No checkout needed.
```

### Agent A's Workflow

```bash
# Agent A starts work (no checkout, workspace stays on main)
but branch new feature-auth
# ...makes changes...
but status --json  # See change IDs
but commit feature-auth -m "Add auth refactor" --changes <id>

# Agent B reviews A's progress (no stash/checkout dance)
but show feature-auth --json  # Review A's commits while B's changes stay in workspace

# Agent C needs both A and B for integration testing
but branch new integration -a feature-auth  # Stack on A's work
but stage <c-changes> integration
# Now C sees A's changes + can add own
```

### Coordination Advantages

| Action | With GitButler | Pain Level |
|--------|---------------|------------|
| Review Agent B's work while working on A | `but show feature-db --json` | 🟢 None |
| See all 3 agents' progress at once | `but status --json` shows all stacks | 🟢 None |
| Test integration of A + B work | Stack branch: `but branch new test -a feature-auth` | 🟢 Low |
| Agent C depends on Agent A's changes | Stack on A: `but branch new feature-ui -a feature-auth` | 🟢 Low |
| Quick fix on main while feature work | Changes stay assigned to stacks, work on main directly | 🟢 None |
| Merge 3 features into main | Independent virtual branches, merge in any order | 🟢 Low |

### Dependency Handling (Stacked Branches)

```bash
# Agent C needs changes from Agent A
but branch new feature-ui -a feature-auth  # Stack on A's work
# C now sees A's changes in workspace
# C makes changes, commits to feature-ui

# Later, Agent A updates their work
but commit feature-auth -m "More auth changes"
# GitButler automatically updates feature-ui to include A's new commits
# C doesn't need to rebase or merge
```

### Conflict Detection

```bash
but status --json
# Shows conflicts between stacks immediately
# No push/reject cycle

but resolve <commit>
# Enter resolution mode
# Fix conflicts
but resolve finish
```

---

## Detailed Comparison

### 1. Context Switching

**Without GitButler:**
```bash
# To review Agent B's work while working on A:
git stash save "Agent A WIP"
git checkout feature-db
git log --oneline -10
# Review...
git checkout feature-auth  # Or was it main? Where was I?
git stash pop
# Hope the stash applies cleanly
```

**With GitButler:**
```bash
# To review Agent B's work while working on A:
but show feature-db --json
# Done. A's changes still in workspace. No checkout.
```

**Time saved:** ~30 seconds per context switch × 20 switches/day = **10 minutes/day**

### 2. Integration Testing

**Without GitButler:**
```bash
# Test if A + B work together
git checkout -b integration-temp
 git merge feature-auth
 git merge feature-db
 # Resolve conflicts...
 # Run tests...
 git checkout feature-auth
git branch -D integration-temp
```

**With GitButler:**
```bash
# Test if A + B work together
but branch new integration -a feature-auth
but stage <test-files> integration
# Tests run with A's changes visible
# No merge commits, no branch cleanup
```

### 3. Dependency Management

**Without GitButler:**
```
Agent C waits for Agent A to merge
OR
Agent C rebases on Agent A's branch (complex coordination)
```

**With GitButler:**
```bash
but branch new feature-ui -a feature-auth
# C develops against A's current state
# When A updates, C's stack auto-updates
# When A merges, C's stack rebases onto main
```

### 4. Visibility

**Without GitButler:**
```bash
# What's everyone working on?
git branch -a | grep feature
# Shows branches, not what's IN them
git log feature-auth --oneline -5
git log feature-db --oneline -5  
git log feature-ui --oneline -5
# Sequential checking
```

**With GitButler:**
```bash
but status --json
# Shows all stacks, their commits, uncommitted changes, conflicts
# Single command, complete visibility
```

### 5. Atomic Commits Across Agents

**Without GitButler:**
```bash
# Agent A wants to split a change into 2 commits
git reset HEAD~1
git add -p  # Interactive hunk staging
# ...carefully select hunks...
git commit -m "First part"
git add .
git commit -m "Second part"
# Agent B and C waiting during this operation
```

**With GitButler:**
```bash
# Agent A wants to split a change into 2 commits
but diff --json  # Get hunk IDs
but commit feature-auth -m "First part" --changes <hunk-1-id>
but commit feature-auth -m "Second part" --changes <hunk-2-id>
# Other agents unaffected, no reset/checkout
```

---

## When Each Model Wins

### Use Vanilla Git When:
- **Single agent** or **sequential work** (one task at a time)
- **Simple features** that don't interact
- **Team < 3 people** with good communication
- **CI/CD pipelines** that expect standard git workflows
- **You value simplicity** over optimization

### Use GitButler When:
- **2+ agents working concurrently** on same codebase
- **Features have dependencies** (B builds on A, C builds on B)
- **Frequent context switching** needed (review while developing)
- **Rapid iteration** with small atomic commits
- **Parallel experimentation** (try 3 approaches simultaneously)

---

## Multi-Agent Pain Points Summary

| Pain Point | Vanilla Git | GitButler |
|------------|-------------|-----------|
| **Context Switching** | Stash/checkout/checkout/restore | None - all visible |
| **Cross-Agent Visibility** | Check branches sequentially | Single status command |
| **Integration Testing** | Create temp merge branches | Stack branches naturally |
| **Dependencies** | Rebase dance or wait for merge | Stack on dependency branch |
| **Conflict Detection** | Push failure, then resolve | Immediate visibility |
| **Atomic Commits** | Reset/interactive staging | Hunk-level commits by ID |
| **Tooling Complexity** | Standard git | GitButler CLI dependency |
| **Learning Curve** | Standard | New mental model |
| **Team Adoption** | Universal | Everyone must use it |

---

## Verdict for Multi-Agent Projects

**Vanilla Git:** Coordination overhead scales linearly with agent count. 3 agents = 3x the branch management pain.

**GitButler:** Coordination overhead stays flat. 3 agents = same visibility model as 1 agent, just with more stacks.

**Threshold:** 
- **1-2 agents:** GitButler adds complexity without sufficient payoff
- **3+ agents:** GitButler's workspace model becomes net positive
- **Agents with dependencies:** GitButler's stacked branches are transformative

For the HTML generation service project: **If you plan to have multiple agents working on different aspects simultaneously** (one on MCP tool, one on layout engine, one on component integration), GitButler pays for itself immediately.
