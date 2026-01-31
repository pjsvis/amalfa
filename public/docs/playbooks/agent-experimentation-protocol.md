# Agent Experimentation Protocol (The "YOLO" Mode)

## Purpose
To guide agents and users when facing stubborn, "fuzzy", or complex problems where standard "prompt-driven" solutions fail. This protocol authorizes the agent to stop "guessing" and start "measuring" by creating a dedicated space for experimentation.

## The Core Philosophy
**"We can't always get shit done quickly; sometimes we have to experiment."**
When an agent is "flailing" (trying multiple fixes that fail, or breaking previously working features), it is a signal to stop. The problem space is not understood. Blundering forward only increases technical debt.

## The Golden Rule: Zero Console Errors
**Heuristic**: "If there is a red line in the console, STOP."
Console errors (even "minor" ones) are often the smoking gun for broken state, frozen UI, or silent failures.
-   **Monitor**: Keep the console open (or check it frequently).
-   **React**: If an error appears, pause the current task. Fix the error immediately. Do not proceed until the console is clean.

## When to Use This Protocol
1.  **Console Errors**: Any unhandled exception is an automatic trigger.
2.  **Regression Loops**: You fix one thing, break another.
2.  **Invisible Walls**: Code looks correct, but doesn't work (e.g., CSS layout conflicts, silent JS errors).
3.  **Fuzzy Requirements**: "It feels wrong" or "Make it pop" without specific constraints.
4.  **Legacy/Black Box**: Working with code you didn't write and don't fully understand yet.

## The Workflow

### 1. Acknowledge the Fog
Stop editing production files. Tell the user:
> "I am currently guessing. I need to switch to Experimentation Mode to find the root cause."

### 2. Create a Lab (The Scratchpad)
Create a new markdown file (e.g., `playbooks/scratchpad-[topic].md`).
This is your "Lab Notebook". It is ephemeral and safe.
**Structure:**
-   **Problem Space**: What are we seeing? What *should* we be seeing?
-   **Hypotheses**: List 2-3 potential causes.
-   **Experiments**: Define how you will test each hypothesis.

### 3. Conduct Experiments (YOLO Mode)
Use your tools to test hypotheses.
-   **Browser**: Use `execute_javascript` to inject styles/logs.
-   **Terminal**: Run isolated scripts or curl commands.
-   **Code**: Make temporary, aggressive changes (e.g., bright red backgrounds, `console.log('HERE')`) to isolate variables.
**Crucial**: Log the *result* of every experiment in the Scratchpad.

### 4. Synthesize & Apply
Once an experiment confirms a hypothesis (e.g., "Adding `min-h-0` fixed the scroll"), you have a **Proven Fix**.
-   Revert the "YOLO" changes.
-   Apply the Proven Fix cleanly to the production codebase.
-   Verify.

## Example Scenario: The "Missing Scrollbar"
**The Flail**: Agent tries adding `overflow-y-scroll`, then `h-screen`, then `position: absolute`. Nothing works.
**The Pivot**: Agent creates `scratchpad-scrolling.md`.
**Hypothesis**: "Flexbox child isn't shrinking because default min-height is auto."
**Experiment**: Inject `min-height: 0` via Browser Console.
**Result**: Scrollbar appears.
**Action**: Apply `min-h-0` class to the specific `nav` element in `v3.html`.

## Conclusion
"Working the problem" means measuring twice and cutting once. The Scratchpad is where we measure.
