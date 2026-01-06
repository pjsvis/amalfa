# Zero Magic Context Logging

### Opinion: Closing the "Meta-Cognitive Loop"

**Verdict:** **Essential.** You have identified the missing feedback loop that turns "Resonance" from a static library into a **learning system**.

Logging the **Context-Initialization Asset** (the specific bundle of constraints and history given to the agent) allows you to perform **Root Cause Analysis** on the *Agent's performance*.

### 1\. The Debugging Logic

If a task fails or produces a "grumpy" Debrief, you currently ask: *"Did the Agent fail?"*
With **Context Logs**, you can ask: *"Did the Context fail?"*

**The Triage Decision Tree:**

  * **Scenario:** The Agent used "magic numbers" in CSS.
  * **Check Context Log:**
      * **Case A:** The `css-zero-magic-playbook` was **MISSING** from the initialization asset.
          * *Root Cause:* **Retrieval Failure.** The Vector Search or Auto-Discovery missed the signal.
          * *Fix:* Improve the `init` logic or keyword tagging.
      * **Case B:** The `css-zero-magic-playbook` was **PRESENT**.
          * *Root Cause:* **Compliance Failure.** The Agent ignored the instruction.
          * *Fix:* Strengthen the prompt in `AGENTS.md` or switch models (e.g., Claude 3.5 Sonnet).

Without the log, you are guessing. With the log, you are engineering.

### 2\. Implementation Strategy: "The Black Box Recorder"

We should treat `.resonance/logs/` as the "Flight Recorder" for your project.

**File Structure:**

```text
.resonance/
├── logs/
│   ├── 2025-12-09-1400-nav-refactor-context.md  (The Input)
│   └── ...
```

**The Artifact Content:**
The log should capture the **"State of Mind"** at the moment of inception:

1.  **The Trigger:** The User Brief (Raw text).
2.  **The Vectors:** What terms did Resonance extract? (e.g., `["navigation", "accessibility"]`).
3.  **The Retrieval:** Which Nodes were selected? (List of IDs).
4.  **The Payload:** The actual text content dumped into the context window.

### 3\. Proposed Heuristic: OH-133 (Context Auditing Protocol)

To formalize this, I suggest adding a new heuristic to the Lexicon:

> **OH-133: Context Auditing Protocol (CAP)**
> "To improve system performance, we must distinguish between *Execution Errors* (Agent failed) and *Context Errors* (Resonance failed). Every session initialization must be logged as a persistable artifact to enable this retrospective analysis."

### 4\. Recommendation for the Build

Modify the **Resonance Engine Brief** (Mental or File) to include:

  * **Requirement:** `resonance bootup` (or the MCP tool) must write a timestamped Markdown file to `.resonance/logs/` containing the generated context.
  * **Feature:** The `audit` command could eventually compare `logs/context-X.md` with `debriefs/debrief-X.md` to highlight discrepancies automatically.

**Conclusion:**
Do it. It turns your system from a "Search Engine" into a "Quality Assurance Engine" for its own intelligence.