# Playbook: Sidecar + `td` → PR Workflow

## Purpose
Define the **lean, local-first** workflow for turning a task into a PR using **Sidecar visibility** and **`td` worktree management**, with clean debriefs and archival.

This playbook is the **canonical workflow** and acts as the front door to supporting process docs. It is **portable**: it can be applied to other repos with minimal adaptation.

---

## Principles (Non‑Negotiables)
- **Visibility is centralized**: Sidecar is the live operational view.
- **Work isolation is enforced**: each task gets a worktree.
- **Local-first**: work happens locally; PRs are the only external handshake.
- **Low-entropy artifacts**: every task yields a debrief; optional playbook updates.
- **Clean exit**: worktrees are deleted after PR creation.

---

## Lifecycle Overview

```
Sidecar (awareness)
   ↓
td ticket (local-first tracking)
   ↓
td creates worktree
   ↓
Work → PR
   ↓
Debrief + (optional) playbook update
   ↓
Worktree cleanup
   ↓
td archived on merge
```

---

## Roles & Responsibilities

### Sidecar
- **Shows state**: who/what is active, progress signals, and workflow drift.
- **Does not own state**: it is a read-only lens.

### `td`
- **Owns task state**: creation, progress, and archival.
- **Owns worktree creation**: each task == one worktree.

### Git / PR
- **External checkpoint**: only PRs leave the local system.
- **Integration boundary**: review + merge completes the cycle.

---

## Related Playbooks
- **Briefs:** `playbooks/briefs-playbook.md`
- **Debriefs:** `playbooks/debriefs-playbook.md`
- **Playbooks (meta):** `playbooks/playbooks-playbook.md`
- **Problem Solving:** `playbooks/problem-solving-playbook.md`

---

## Step‑by‑Step Protocol

### 1) Intake (Sidecar → `td`)
- Use Sidecar to identify the next piece of work.
- Create or select a `td` ticket.

**Goal:** convert “awareness” into a trackable unit of work.

---

### 2) Start Work (Worktree Creation)
- Start the task in `td`.
- `td` creates a dedicated worktree.

**Rule:** no direct work on `main` or shared worktrees.

---

### 3) Execute Work
- Implement changes in the worktree.
- Keep changes focused; no scope creep.

**Optional:** keep a local scratchpad if you expect a debrief.

---

### 4) PR Preparation
- Validate changes locally.
- Open a PR from the worktree branch.

**PR should include:**
- what changed (brief)
- why it changed (intent)
- how to verify (tests, manual checks)
- user-facing verification steps (UI or CLI), when practicable

---

### 4.5) Integration Worktree Ritual (When Dependencies Exist)
Use a temporary integration worktree when one task depends on another or when you need to test multiple branches together.

**Protocol:**
- Create a dedicated integration worktree.
- Merge or stack the required branches.
- Run verification.
- Delete the integration worktree immediately after validation.

**Example commands:**
```bash
# create integration worktree
git worktree add ../amalfa-integrate -b integrate/main

# merge dependencies
cd ../amalfa-integrate
git merge feature/a
git merge feature/b

# run verification
bun test

# cleanup
cd ..
git worktree remove ../amalfa-integrate
git branch -D integrate/main
```

**Rule:** integration worktrees are **temporary by default** and must not replace the primary task worktree.

---

### 5) Debrief + Playbook Update
After PR is open:
- Write a **debrief**.
- If the work revealed a reusable pattern, update or create a **playbook**.

**Rule:** debriefs are mandatory; playbooks are optional.

---

### 6) Cleanup
Once PR is opened:
- Delete the worktree.
- Ensure no lingering untracked files.

---

### 7) Archive on Merge (and Relink Artifacts)
When PR is merged:
- Move brief(s) and debrief(s) to their archive location.
- Update the `td` artifact checklist with the **new archive paths**.
- Mark the `td` ticket as archived.

---

## Decision Gates (Minimal)
| Gate | Trigger | Action |
|------|---------|--------|
| Scope creep | Work extends beyond ticket | Split into new `td` ticket |
| Dependency on another task | Blocker discovered | Create dependent ticket, park current |
| Incomplete visibility | Sidecar doesn’t reflect reality | Update `td` state first |

---

## Minimal Artifacts
Required per task:
- ✅ PR
- ✅ Debrief
- ✅ `td` ticket links to all artifacts (brief, PR, debrief, and any playbook updates)

**`td` artifact checklist template:**
- [ ] Brief: `<path or URL>`
- [ ] PR: `<URL>`
- [ ] Debrief: `<path>`
- [ ] Playbook update(s): `<path(s)>` (if any)

**Placement:** add this checklist near the top of the `td` ticket (immediately after the task summary) so it stays visible throughout the work.

Optional:
- ✅ Playbook update (when process knowledge changes)

---

## Failure Modes & Fixes

**1) Worktree chaos**
- Symptom: lost changes or wrong branch.
- Fix: one task → one worktree, no exceptions.

**2) Drift between Sidecar and `td`**
- Symptom: Sidecar shows “active,” but `td` is stale.
- Fix: update `td` first; Sidecar is only a mirror.

**3) PR created without debrief**
- Symptom: post‑merge context loss.
- Fix: debrief immediately after PR creation.

---

## Retrofit Checklist (for other repos)
- [ ] Ensure `td` is installed and configured.
- [ ] Ensure worktrees are enabled/allowed.
- [ ] Define debrief storage location.
- [ ] Confirm Sidecar integration or equivalent visibility tool.
- [ ] Document local PR conventions.

---

## Success Criteria
- Every PR maps to a `td` ticket.
- No changes land without a debrief.
- Worktrees are deleted after PR creation.
- `td` tickets are archived on merge.

---

## Notes
This workflow optimizes for **clarity**, **recoverability**, and **portability**.  
It is intentionally boring; boredom here is a feature.
