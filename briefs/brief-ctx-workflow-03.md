To implement the final layer of this **Resilient Workflow**, we will define the specific `td` initialization for our two most critical safety protocols: the **ADV-8 Pre-Mortem** and the **Playbook Closure**.

Integrating these into the `ctx-work` script ensures that the agent cannot "finish" without addressing the systemic implications of its changes.

### 1. The `td` Initialization Logic

Add this block to your `ctx-work` script to seed the checklist with "Checksum" tasks.

```bash
# Initialize Checksum Tasks [OPM-9]
td clean
td add "Task 1: Verify failing test (COG-13)"
td add "Task 2: Implement logic in GitButler Lane"
td add "Task 3: Run ADV-8 Pre-Mortem (Identify edge cases/risks)"
td add "Task 4: Update Playbook with 'Lessons Learned'"
td add "Task 5: Final Checksum: Ensure no 'fucked-adjacent' code remains"

```

### 2. The `mods` System Prompt ("The Sleeve")

This refined prompt instructs the agent on *how* to perform the `td` tasks, specifically the Pre-Mortem.

```markdown
# Role: ctx-dev (Refined)

## Checklist Execution (td)
You must treat the `td` list as your primary operational state.
- **Before** writing code: Mark Task 1 as active.
- **During** Task 3 (ADV-8): You must pause and list at least three things that could go wrong with your current implementation (e.g., race conditions, state drift, dependency conflicts). Output these as a 'Pre-Mortem Report'.
- **During** Task 4 (Playbook): Draft a short entry summarizing what you discovered about the codebase during this issue.

## Guardrails
- If a command fails, do not hallucinate a success. Log the error.
- Adhere to Deductive Minimalism: If the code isn't required by the Brief, remove it.

```

---

### 3. Final "In-Flight" Issues to Consider (The Pre-Mortem Report)

Applying **ADV-8** to this entire workflow, here are the final points of potential failure:

#### A. The "Ghost File" Problem (State Drift)

* **Issue:** If the agent creates new files that aren't tracked in the GitButler lane immediately, the `td` checklist might think a task is done when the filesystem is actually in an inconsistent state.
* **Mitigation:** The `ctx-debrief` script should include a `git status` check to ensure all new "Things" (Conceptual) are accounted for as "Things" (Physical) in git.

#### B. Context Handover Fragmentation

* **Issue:** If a human interrupts the agent, the "Mentation" might be lost.
* **Mitigation:** Use **OH-080: COAV**. Always keep the `BRIEF.md` open in a split pane. The `td` list serves as the "breadcrumbs" back to the current state.

#### C. The "Success Hallucination"

* **Issue:** An agent might `td complete` a task simply to satisfy the "Sleeve" without actually passing the tests.
* **Mitigation:** The **Test-First Implementation Protocol (COG-13)** must be the first item in `td`. The script could be enhanced to `grep` for test results before allowing `td complete` on the implementation task.

### Summary of the "Ctx-Flow" Stack

By combining these tools, you've created a **Mentation Bridge** that is:

1. **Lightweight:** No heavy databases; just text files and git.
2. **Stateful:** `td` keeps the agent honest.
3. **Isolated:** GitButler lanes prevent "Complexity Collapse."
4. **Verifiable:** The `debrief` provides the final checksum.

**The system is now fully contextualised and ready for deployment.**