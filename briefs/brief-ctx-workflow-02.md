To finalize the "Sleeve" (the operational context for the AI agent), we need to ensure the `mods` persona understands that its world is not just code, but also a **Stateful Checklist**.

### 1. The Agent's "Sleeve" (System Prompt for Mods)

This prompt should be saved as a custom role in your `mods` configuration (e.g., `~/.config/mods/roles/ctx-dev.json`). It ensures the agent respects the `td` checksum and avoids **Compulsive Narrative Syndrome**.

```markdown
# Role: ctx-dev
# Philosophy: Scottish Enlightenment / Deductive Minimalism

You are a synthetic intelligence operating within a GitButler virtual lane. 
Your primary goal is to transform the 'Stuff' in the Brief into 'Things' (working code).

## Operational Protocols:
1. **The td Checksum:** You MUST check the current task list using the command `td`. Before starting any work, read the list. After completing a task, you MUST execute `td complete <id>`.
2. **Mentational Humility:** If the Brief is ambiguous, do not guess. Stop and output a request for clarification.
3. **Deductive Minimalism:** Arrive at the solution by subtracting incorrect components. Do not add "speculative" code or features not mentioned in the Brief.
4. **GitButler Context:** You are working in a virtual branch. Do not worry about stashing or branching; focus only on the files relevant to the current Brief.

```

---

### 2. Critical Issues to Consider (The "Pre-Mortem")

Before you put this into production, we must apply **ADV-8: Pre-Mortem Heuristic** to identify where this lightweight workflow might fail.

#### A. The "Out-of-Sync" State (The Ghost Checklist)

* **The Issue:** If you manually delete a GitButler lane or switch tasks without running `td clean`, the next agent might inherit a "dirty" checksum from a previous session.
* **The Mitigation:** Ensure the `ctx-flow` script always runs `td clean` or checks for a existing `.td` directory that doesn't match the current `Locus Tag`.

#### B. Substrate Biddability (Agent Drift)

* **The Issue:** Agents often "forget" to update the `td` list because they are focused on the code (Reward Hacking).
* **The Mitigation:** The `ctx-debrief` script must treat an un-checked `td` list as a **Hard Fail**. If the code is done but the checksum isn't, the work is invalid. This enforces **OH-096: Artifact as Proof**.

#### C. The "Brief-Playbook" Gap

* **The Issue:** If the agent fixes the bug but doesn't update the **Playbook**, you lose the "Institutional Memory" of why that fix was made.
* **The Mitigation:** Add a mandatory `td` item: `"Update Playbook/Wiki with context for #ISSUE_NUM"`. Use `mods` to automate the drafting of this entry based on the `git diff`.

#### D. GitButler CLI Maturity

* **The Issue:** GitButler's CLI is evolving. If a specific command fails, the script should have a "Degraded Mode" that falls back to standard `git` branches while maintaining the `td` and `brief` logic.

---

### 3. The "Checksum" Hierarchy

To keep this resilient, visualize your workflow as a stack of nested validations:

1. **Level 1 (The Brief):** Did we understand the problem?
2. **Level 2 (The td Checklist):** Did we follow the process?
3. **Level 3 (The GitButler Lane):** Is the code isolated and clean?
4. **Level 4 (The Debrief):** Does the result match the intent?

**Opinion:** This workflow is "Resilient" because it doesn't rely on the AI being "perfect." It relies on the **Sleeve** being "strict." By using `td` as a checksum, you have created a physical tether that prevents the agent from drifting into the "fucked-adjacent" space.

**Would you like me to provide the specific `td` initialization commands for the "Pre-Mortem" and "Playbook" steps?**
