# DECISION: GitButler Not Adopted

**Archived:** 2026-06-02  
**Status:** `rejected`  
**Reason:** GitButler's "Virtual Branch" architecture introduces High Cohesion / High Risk for AI agent workflows. A catastrophic failure in its state engine could affect the entire working directory.

---

The "Venture Research" task is now conceptualized. I have structured it below to align with our new **Rev 2.0 Brief Protocol**, integrating the JSON Structural Contract to ensure the investigation is targeted and "thing-oriented."

Regarding your point on redundancy: **Your intuition is a high-fidelity assessment of "Systemic Robustness."** ### Ctx Opinion: The "Blast Radius" Principle
Worktrees offer **Low Coupling / High Redundancy**. If a worktree becomes "fucked-adjacent" (corrupted build, missing dependencies, or logic loops), the solution is a simple `rm -rf`. The "Blast Radius" is contained to a single folder.

**GitButler**, by contrast, offers **High Cohesion / High Risk**. Because it manages "Virtual Branches" within the *same* physical `.git` directory, a catastrophic failure in the GitButler state engine could potentially affect the entire working directory. For an AI agent—which may not have the "Mentational Humility" to realize it is destroying a shared state—GitButler is a "sharper tool" that requires a more disciplined "Sleeve".

---

## Brief: Venture Research - GitButler CLI for Agent Orchestration

**Status:** `weaponized`  
**TD Link:** `td-task-research-gitbutler-001`

### 1. Objective
Evaluate the GitButler CLI and "Virtual Branch" architecture to determine if it can replace or augment Git Worktrees for automated agent task isolation.

### 2. Structural Contract (JSON)
```json
{
  "contract_version": "2.0",
  "task_slug": "research-gitbutler-automation",
  "implementation_priority": "medium",
  "data_contracts": {
    "input_states": ["current_worktree_workflow", "gitbutler_docs"],
    "output_shapes": ["compatibility_matrix", "cli_feasibility_report"]
  },
  "constraints": {
    "strict_typing": true,
    "focus_areas": ["CLI_automation", "concurrency_safety", "state_recovery"],
    "required_libs": ["gitbutler-cli"]
  },
  "verification_method": "Prototype-Audit"
}
```

### 3. Implementation Chain-of-Thought (CoT)
1.  **Discovery:** Map the GitButler CLI commands to our existing **Task Director (td)** lifecycle (Create, Switch, Commit, Push, Delete).
2.  **Concurrency Stress Test:** Simulate two agents attempting to work on separate Virtual Branches in the same directory. Observe file-lock behavior and "stale diff" errors.
3.  **Recovery Analysis (The "Redundancy" Check):** Document the process for recovering a "lost" virtual branch compared to simply deleting a worktree.
4.  **Integration Mapping:** Determine if the **Sleeve** (System Prompt) needs new instructions to handle "Virtual Branch" awareness.

### 4. Detailed Requirements
- [ ] Install and initialize GitButler CLI in a sandbox repo.
- [ ] Test "Fearless Rebasing" with simultaneous edits to non-overlapping files.
- [ ] Evaluate the `gb` command-line tool for parity with `git worktree add/remove`.
- [ ] Compare "Cleanup Overhead": How many steps to prune a finished task in GB vs Worktrees?

### 5. Definition of Done (DoD)
- [ ] A definitive "Go/No-Go" recommendation for replacing Worktrees.
- [ ] A "Disaster Recovery" guide for GitButler state failures.
- [ ] Update to the **Conceptual Lexicon** if new terms (e.g., "Virtual Context") are adopted.

---

### Final Opinion
Worktrees are **Inductive** (we build a new world for every task), whereas GitButler is **Deductive** (it subtracts the noise from a single world). 

For **human** speed, GitButler is superior. For **agent** safety, Worktrees remain the "Steel-Toed Boots" of the workflow. This research will determine if we can give the agents "GitButler Sneakers" without them tripping over the shared filesystem.

**I have the brief ready for your research queue. Shall we proceed to the next 'Stuff' to 'Thing' transformation?**