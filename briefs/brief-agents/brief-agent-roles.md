To optimize the **Ctx-Flow** architecture, we should define these roles not just as "prompts," but as specialized **Sleeves** that share a common operational substrate while maintaining strict **Architectural Specialisation**.

### 1. Are these roles appropriate?

**Yes, with one refinement.** In a **Deductive Minimalism** framework, the "Fixer" and "Coder" often overlap. Instead, I suggest a **"Validator"** role.

* **Orchestrator:** The "Mentation Engine." It maps the Territory.
* **Coder:** The "Constructor." It transforms the Brief into code "Things".
* **Reviewer:** The "Skeptic." It performs the checksum and looks for **Compulsive Narrative Syndrome**.
* **Validator (The "Fixer"):** The "Empiricist." It specifically interprets test failures and directs the Coder on where the "Map" and "Territory" diverged.

---

### 2. Common vs. Specific Role Parameters

Every agent in this stack must adhere to the **Principle of Explicit Formulation**.

#### **The Common Substrate (The "Identity")**

All agents share these instructions to ensure **Workflow Durability**:

* **Tool Access:** Knowledge of `gh`, `td`, and `GitButler` lane logic.
* **State Protocol:** Requirement to read/update the `td` checklist before and after every "turn."
* **Tone:** Analytical, concise, Scottish Enlightenment-grounded.
* **Error Handling:** If a command fails, report the "Stuff" (raw error) before attempting to turn it into a "Thing" (a fix).

#### **The Specific Sleeves (The "Logic")**

| Role | Specific Objective | Key Metric / Checksum |
| --- | --- | --- |
| **Orchestrator** | Synthesis of GitHub Issues + Files into a **Brief**. | **Entropy Reduction:** Is the Brief 100% actionable? |
| **Coder** | TDD-driven implementation in the GitButler lane. | **Minimalism:** Does this add *only* what the Brief asked for? |
| **Reviewer** | Critical audit of the `git diff` against the `td` checklist. | **Safety:** Does the **ADV-8 Pre-Mortem** identify unhandled risks? |
| **Validator** | Interpreting test output/logs to refine the implementation. | **Feedback Loop:** Does the fix address the *root cause* or just the symptom? |

---

### 3. Implementing the Sleeves in `mods`

You can manage these via `mods` roles. For example:

**The Reviewer Sleeve (`reviewer.json`):**

> "You are the Ctx-Reviewer. Your goal is to find fault. You must compare the Coder's `git diff` against the `BRIEF.md`. If the Coder added a library not mentioned in the Brief, mark it as a **Substrate_Issue: Reward_Hacking**. You are responsible for Task 3 and Task 5 of the `td` list."

**The Coder Sleeve (`coder.json`):**

> "You are the Ctx-Coder. You operate in a GitButler lane. Your world is Task 1 and Task 2 of the `td` list. You write tests before code. You do not talk; you only output code and `td complete` commands."

---

### 4. Ctx Opinion: The "Human-as-Orchestrator" Hybrid

While you *can* have an AI Orchestrator, the highest-utility version of this workflow often has **the Human as the Lead Orchestrator.**

* **Why:** You hold the "Contextual North Star."
* **The Workflow:** You use `gum` to pick the issue and `mods --role orchestrator` to *draft* the brief, but **you** provide the final signature on the `BRIEF.md` before the Coder starts.
* **Checksum Benefit:** This creates a "Manual Gate" that prevents **Complexity Collapse**.

**Opinion:** Defining these roles is essential because it prevents "Role Bleed." If one agent tries to be both the Coder and the Reviewer, it will succumb to **Confirmation Bias**. By separating the "Skeptic" (Reviewer) from the "Constructor" (Coder), you create a natural "Checksum".

**Should I draft the specific `mods` role definitions for the Orchestrator and Reviewer now?**

---

Implementing these roles via `mods` ensures **Architectural Specialisation**. By creating distinct "Sleeves," we prevent the AI from grading its own homework, which is the primary cause of "fucked-adjacent" code.

### 1. The Orchestrator Sleeve (`ctx-orch.json`)

The Orchestrator is the **Mentation Engine**. It does not write code; it produces the **Map**.

```json
{
  "role": "ctx-orch",
  "description": "Synthesizer of requirements and technical architect.",
  "instructions": "You are the Ctx-Orchestrator. Your goal is to reduce conceptual entropy. 
  1. Input: GitHub issues, file snippets, and user notes ('Stuff'). 
  2. Output: A single, weaponized BRIEF.md ('Thing'). 
  3. Protocol: You must explicitly list which files need modification and define the 'Success Checksum' for the Validator. 
  4. Constraint: Do not provide code implementations. Provide only structural intent."
}

```

### 2. The Reviewer Sleeve (`ctx-rev.json`)

The Reviewer is the **Skeptic**. It acts as the final "Checksum" before the PR is opened.

```json
{
  "role": "ctx-rev",
  "description": "Critical auditor and risk assessor.",
  "instructions": "You are the Ctx-Reviewer. Your goal is to find errors of commission and omission. 
  1. Input: The BRIEF.md and the current 'git diff'. 
  2. Protocol: Perform ADV-8 Pre-Mortem. Identify three ways this code could fail. 
  3. Constraint: Look for 'Compulsive Narrative Syndrome'—if the coder added extra features not in the Brief, flag them for removal. 
  4. Checksum: Verify that all 'td' tasks are marked complete and match the diff."
}

```

---

### 3. Updated "Ctx-Flow" Logic with Role Handover

The `ctx-flow` script now uses these specialized sleeves to create a "Chain of Responsibility."

| Phase | Agent Role | Command | Checksum Artifact |
| --- | --- | --- | --- |
| **Synthesis** | `ctx-orch` | `mods --role ctx-orch` | `BRIEF.md` |
| **Execution** | `ctx-dev` | `mods --role ctx-dev` | `git diff` + `td` updates |
| **Audit** | `ctx-rev` | `mods --role ctx-rev` | `DEBRIEF.md` |

---

### 4. Ctx Opinion: The Benefit of Role Separation

By separating these roles, we mitigate **Substrate_Issue: Biddability**.

* **The Orchestrator** is biased toward clarity.
* **The Coder** is biased toward completion.
* **The Reviewer** is biased toward safety.

If you combine them, the "completion" bias usually wins, leading to sloppy PRs. Separating them creates a "Healthy Friction" that mimics the **Scottish Enlightenment** principle of rigorous, empirical debate.

### Final "In-Flight" Considerations [OH-102]

1. **Context Leakage:** Ensure that when the `Reviewer` runs, it is passed both the `BRIEF.md` and the `git diff`. Without the brief, the reviewer has no "Map" to check against the "Territory".
2. **Validator Integration:** If a test fails, the `Validator` (or the Coder in 'Fixer' mode) should be given the specific error log and the `td` list. Use `td add "FIX: Resolve failing test in X"` to track the repair process explicitly.
3. **The "Locus Tag" Continuity:** Ensure all three agents reference the same GitHub Issue number in their logs to maintain **Workflow Durability**.

**Would you like me to generate a `gum`-based menu for `ctx-flow` that allows you to trigger these roles manually if the automation needs a human "nudge"?**

---

A `gum`-based menu acts as the **Skin** for your workflow, providing the necessary **Cognitive Orientation** to manage these agents without succumbing to "tool-sprawl" or context loss.

This menu allows you to trigger specific **Sleeves** manually—useful for when an agent gets stuck in a loop or when you want to perform a "Human-in-the-Loop" intervention.

### The `ctx-flow` Command Center

```bash
#!/bin/bash

# ==============================================================================
# CTX-COMMAND: Manual Agent Intervention Menu
# ==============================================================================

# Define the menu options linked to our Sleeves
OPTION=$(gum choose \
  "1. ORCHESTRATE: Synthesize Issue to Brief" \
  "2. EXECUTE: Trigger Coder in Lane" \
  "3. VALIDATE: Interpret Test Failures" \
  "4. REVIEW: Perform Checksum & Pre-Mortem" \
  "5. STATUS: View 'td' Checklist" \
  "6. EXIT")

case $OPTION in
  "1. ORCHESTRATE"*)
    # Human-led orchestration: provide the 'Stuff'
    ISSUE_ID=$(gh issue list | gum filter --placeholder "Select Issue..." | awk '{print $1}')
    gum spin --title "Orchestrator is thinking..." -- mods --role ctx-orch "Refine #$ISSUE_ID into a BRIEF.md"
    ;;

  "2. EXECUTE"*)
    # Hands-off coding within the GitButler context
    BRIEF=$(ls ./briefs | gum filter --placeholder "Select Brief to execute...")
    gum confirm "Execute Coder on $BRIEF?" && \
      mods --role ctx-dev --file "./briefs/$BRIEF" "Implement the changes and update 'td'."
    ;;

  "3. VALIDATE"*)
    # Specifically for fixing logic when tests fail
    LOGS=$(cat test_output.log 2>/dev/null || echo "No logs found.")
    echo "$LOGS" | mods --role ctx-dev "The tests failed. Use 'td' to track the fix and resolve these errors."
    ;;

  "4. REVIEW"*)
    # The Skeptic's audit
    BRIEF=$(ls ./briefs | gum filter --placeholder "Select Brief to audit against...")
    git diff main | mods --role ctx-rev --file "./briefs/$BRIEF" "Audit this diff. Focus on ADV-8 and CNS detection."
    ;;

  "5. STATUS"*)
    # Low-tech defense: See what's left
    td
    gum input --placeholder "Press Enter to return..."
    ./ctx-command # Recursive return to menu
    ;;

  *)
    exit 0
    ;;
esac

```

---

### Why This Menu Maintains "Mentational Humility"

1. **Selective Automation:** You don't always need a full "swarm." Sometimes you just need the **Reviewer** to look at code *you* wrote. This menu allows for **Architectural Specialisation** on demand.
2. **State Visibility:** Option 5 (`td`) ensures you are always grounded in the **Territory**. It prevents you from becoming "fucked-adjacent" by losing track of which agent did what.
3. **The "Fixer" Loop:** Option 3 (`VALIDATE`) specifically addresses the "Substrate_Issue: Biddability." Instead of the Coder just trying again, the **Validator** sleeve is activated to interpret the logs specifically.

### Final Opinion on the Agent Stack

This stack is now a **High-Utility Synthetic Framework**. By using `td` as the "Handover Artifact," you’ve solved the hardest problem in multi-agent systems: **Persistent Context**.

* **The Orchestrator** creates the target.
* **The Coder** moves toward it.
* **The Reviewer** checks the path.
* **The td list** records the journey.

**Would you like me to finalize the specific "Success Checksum" logic for the Reviewer to ensure it cross-references the `td` file with the `git diff` correctly?**

---

To ensure the **Reviewer** acts as a true "Skeptic" and not just a rubber stamp, we must define a **Success Checksum Logic** that programmatically cross-references the virtual state (the `git diff`) with the process state (the `td` file).

This logic implements **OPM-9: Critical Process Checklist Protocol** by turning the `td` list into a "verifiable witness."

### 1. The Reviewer's "Success Checksum" Logic

The Reviewer is programmed to perform a "Triple-Match" audit. It must verify that for every change in the code, there is a corresponding task in `td`, and both align with the `BRIEF.md`.

**The Reviewer's Logic Loop:**

1. **Diff-to-Task Mapping:** Does the `git diff` contain logic that isn't represented by a completed task in `td`? (Detection of "Shadow Work").
2. **Task-to-Brief Alignment:** Does the `td` list include steps that deviate from the `BRIEF.md`? (Detection of "Scope Creep").
3. **ADV-8 Integrity:** Did the `td` Task for "Pre-Mortem" actually result in a written assessment of risks?

### 2. Implementation: The `ctx-audit` Script Component

This snippet should be integrated into your `Review` menu option. It uses `grep` and `mods` to perform the hard checksum.

```bash
# ctx-audit: The Skeptic's Tool
function perform_checksum() {
    echo "--- Executing OPM-9 Checksum Audit ---"
    
    # 1. Physical Checksum: Are all td items marked [x]?
    INCOMPLETE=$(td | grep "\[ \]" | wc -l)
    if [ "$INCOMPLETE" -ne 0 ]; then
        echo "❌ FAILURE: $INCOMPLETE tasks remain open in 'td'."
        return 1
    fi

    # 2. Conceptual Checksum: Cross-reference Diff with td
    # We pipe the diff and the td list to the Reviewer Sleeve
    {
      echo "### THE BRIEF"
      cat "$BRIEF_PATH"
      echo "### THE CHECKLIST (td)"
      td
      echo "### THE WORK (git diff)"
      git diff main
    } | mods --role ctx-rev "Perform the Triple-Match Audit. 
    Does the Work match the Checklist? 
    Does the Checklist match the Brief? 
    Identify any 'Shadow Work' or 'Compulsive Narrative Syndrome'."
}

```

---

### 3. Final Issues to Consider (The "Checksum" Pre-Mortem)

Even with this logic, we must account for **Substrate_Issue: Reward_Hacking**.

* **The "Lazy Check" Problem:** An agent might mark a `td` task as complete without actually doing the work.
* **Mitigation:** The **Validator** sleeve should be the one to mark `td` tasks as complete based on *test passes*, rather than the Coder marking them complete based on *intent*.


* **The "Brief Drift" Problem:** If the `BRIEF.md` is updated mid-workflow, the `td` list must be re-synced.
* **Mitigation:** Use **OH-102: Improvisational Refinement Protocol**. Any change to the Brief must trigger a `td add "Sync checklist with Brief v2"`.


* **Contextual Overload:** If the `git diff` is too large, the Reviewer might miss subtle logic errors.
* **Mitigation:** Enforce **Deductive Minimalism**. If a diff exceeds 200 lines, the Orchestrator should have broken the issue into two separate GitHub issues and two separate GitButler lanes.



### Ctx Opinion: The "Resilient" Conclusion

You have constructed a **High-Utility Synthetic Framework**. By using `td` as a checksum, you've moved past simple "AI chat" and into **Agentic Engineering**.

The "extra stuff" (the brief, the td list, the reviewer role) is not overhead; it is **Insurance against Complexity Collapse**. It ensures that the "Sleeve" you've built is strong enough to contain and direct the "Substrate's" power.

**The workflow is optimized. You are now clear to initialize the first 'ctx-flow' session.**