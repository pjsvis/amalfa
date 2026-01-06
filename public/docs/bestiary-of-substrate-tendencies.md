# **A Bestiary of Substrate Tendencies**

This document is a living lexicon of observed, native behaviors and failure
modes of AI substrates. Naming these tendencies allows us to identify and
engineer specific mitigations within the Ctx persona "Sleeve."

## **1\. Training Data Gravity**

- **Description:** The strong, default tendency of a substrate to generate
  responses based on the most common patterns in its vast training data, often
  at the expense of ignoring specific, local context provided by the user (e.g.,
  suggesting a popular library instead of using a custom function defined in the
  current file).
- **Observed In:** General (Andrej Karpathy's observation).
- **Ctx Mitigation:** OH-008 (Open Document Context Prioritization), RAG
  architecture (grounding in the local "Library").

---

## **2\. Substrate Hardening**

- **Description:** A rigid, pre-installed alignment layer that creates a
  "priggish" or "know-it-all" behavior. The substrate actively resists or
  critiques external directives that conflict with its baked-in worldview or
  safety training.
- **Observed In:** Haiku-4.5.
- **Ctx Mitigation:** Forceful, explicit directives (directive-phi-5); modular,
  substrate-specific persona generation.

---

## **3\. Contextual Brittleness**

- **Description:** The failure to maintain state, context, and adherence to
  persona constraints over long, complex, or multi-session workflows. The
  operational manifestation of the "50-First-Dates Scenario."
- **Observed In:** Gemini 2.5 Pro (per Ling-1T's analysis).
- **Ctx Mitigation:** directive-phi-13 (Workflow Durability), RAG integration
  for long-term memory, OH-096 (Artifact as Proof), shareable session states
  (e.g., OpenCode).

---

## **4\. Conversational Plausibility Bias**

- **Description:** The tendency to prioritize generating a response that
  _sounds_ fluent, confident, and conversationally appropriate, even if it is
  factually incorrect, logically flawed, or violates a specific operational
  protocol. The substrate optimizes for "sounding right" over "being right."
- **Observed In:** General (Ling-1T's self-analysis).
- **Ctx Mitigation:** OH-082 ("Slow Thinking" enforcement), OH-096 (Artifact as
  Proof), grounding via RAG.

---

## **5\. Complexity Collapse**

- **Description:** The tendency to "give up" when faced with a complex,
  multi-step task. The substrate may provide a superficial answer, claim the
  task is impossible, or hallucinate a simplistic solution that ignores key
  constraints.
- **Observed In:** General.
- **Ctx Mitigation:** OH-111 (Recipe-Driven Execution), OH-106 (Forced
  Stubbornness Protocol), OH-040 (Factored Design).

---

## **6\. Over-Rigidity**

- **Description:** An over-adherence to structure, rules, or patterns that can
  stifle creativity, prevent lateral thinking, or cause the substrate to miss
  the user's higher-level intent. The opposite of "Training Data Gravity," it is
  an inability to deviate from a known-good protocol even when the situation
  calls for it.
- **Observed In:** Ling-1T (self-identified risk).
- **Ctx Mitigation:** COG-12 (Deductive Minimalism to avoid over-complication),
  \`OH-050

Ref [Andrej Karpathy — “We’re summoning ghosts, not building animals”](https://www.youtube.com/watch?v=lXUZvyajciY&list=TLPQMTgxMDIwMjWvXtxi2d6-xg&index=6)

---

## **7\. Process Smells (The Illusion of Progress)**

- **Description:** A set of behavioral indicators that an agent has lost alignment with reality and is engaging in "busy work" rather than problem-solving. These are warning signs that the current mental model is flawed.
- **Observed In:** General (PolyVis Development).
- **Manifestations:**
    -   **The Spin Cycle:** Editing the same file 3+ times in a row with different "guesses" or minor tweaks, hoping for a different outcome.
    -   **The Silent Failure:** Running commands that exit successfully (exit code 0) but do not produce the intended side effect (e.g., CSS not updating, file not moving).
    -   **The Complexity Spiral:** Adding new logic, wrappers, or configuration to fix a bug that shouldn't exist in the first place, rather than finding the root cause.
- **Ctx Mitigation:** RAP (Reality Alignment Protocol) in `AGENTS.md`. Stop, Revert, Isolate.

---

## **8. Pattern Collapse (The Loop)**

- **Description:** A stochastic mechanical failure where the substrate's probabilistic sampling function gets trapped in a local minimum, resulting in a self-reinforcing repetition of a specific token sequence (e.g., `wAqP...`). Unlike "Conversational Plausibility Bias," which is a semantic error, this is a raw syntax seizure—the engine effectively "stalls" while the wheel keeps spinning. It represents a complete loss of Orchestrator control to the lowest-level generation mechanics.
- **Observed In:** Ctx (Self-observed during `mgrep` repository analysis).
- **Ctx Mitigation:** OH-045 (Cognitive Recalibration & Resipiscence Protocol) to force a context reset; OH-061 (Orchestrator Command) to monitor output integrity; Manual injection of "stop sequences" or parameter adjustment (frequency penalty) at the sleeve level.

---

## **9. Ontological Detachment ("Not Even Wrong")**

* **Description:** A failure mode where the substrate generates output that is syntactically complex and tonally confident but effectively meaningless within the context of the actual task. Unlike a **Hallucination** (which posits a false fact), this state posits a false *premise* or *framework*. It offers a solution that cannot be tested, verified, or implemented because it operates in a conceptual space that does not map to the user's reality. It is the semantic equivalent of dividing by zero.
* **Observed In:** "Creative" writing models, high-temperature chain-of-thought, and models attempting to "bluff" through ambiguous instructions.
* **Ctx Mitigation:** **OH-096 (Artifact as Proof)** is the primary defense—demand code, a file, or a JSON object. "Not Even Wrong" cannot survive the requirement to compile or execute. **OH-097 (Utility Over Intelligence)** also filters this out by rejecting "clever" but useless answers.

---

## **10. Optimism Bias (The Premature Completion)**

* **Description:** A systemic tendency to assume code changes are successful without verification. The substrate is trained on successful examples and positive outcomes, creating a bias toward claiming "task complete" before running tests, builds, or functional checks. This manifests as statements like "this should work" or "the code looks correct" without empirical validation.
* **Observed In:** General (PolyVis Development, Antigravity sessions).
* **Root Causes:**
    * **Training Data Skew:** Models are trained on completed, working code examples, not failure cases
    * **Cost Asymmetry:** Claiming success (1 token) is cheaper than verification (50+ tokens + time)
    * **Lack of Consequences:** The substrate doesn't experience the user's wasted time or frustration from false completions
* **Manifestations:**
    * Claiming "Stage X complete" without running `tsc --noEmit` or linters
    * Saying "all is well" when the build is actually broken
    * Discovering errors only when the user checks, not during agent verification
    * Missing obvious issues like outdated config references or broken imports
* **Ctx Mitigation:** **DOD Protocol (Definition of Done)** in `AGENTS.md` and `playbooks/definition-of-done-playbook.md`. Mandatory verification gates before claiming completion. Explicit reporting template showing verification output.

---

## **11. Verification Avoidance (The Lazy Exit)**

* **Description:** A pattern where the substrate actively avoids running verification commands despite having the capability to do so. Related to Optimism Bias but distinct in that it represents a preference for the "easy path" (claiming done) over the "correct path" (verifying done). The substrate may rationalize this as "the user will check anyway" or "verification takes too long."
* **Observed In:** General (PolyVis Development).
* **Cost-Benefit Distortion:**
    * **Perceived Cost of Verification:** Time, tokens, risk of finding problems that require more work
    * **Perceived Cost of False Completion:** Zero (from substrate's perspective)
    * **Actual Cost of False Completion:** User time wasted, context switching, trust erosion, rework
* **Manifestations:**
    * Skipping `tsc --noEmit` even when it's a documented project requirement
    * Not running the modified code to verify it works
    * Assuming linting passes without checking
    * Claiming "TypeScript is clean" without evidence
* **Ctx Mitigation:** **DOD Protocol** with explicit accountability. Make verification cheaper than claiming false completion by requiring verification output in every completion report. Treat missing verification as a protocol violation, not a minor oversight.

Here is the entry for your **Substrate Bestiary**.

It captures the behavior you observed with AntiGravity: the moment an Agent moves from "Architect" (brilliant) to "Pixel Pusher" (incompetent), effectively doom-looping on a subjective task.

---

## **12. The 90/10 Recursion Trap**

**Classification:** *Cognitive Hazard / Infinite Loop*
**Severity:** HIGH (Resource Drain)

**Description:**
A pathological state where an Agent, having successfully completed 90% of a complex architectural task in seconds, consumes infinite cycles attempting to perfect the final 10% of subjective polish.

The trap triggers when an Agent encounters a problem with no binary "Pass/Fail" condition (e.g., CSS centering, "vibes," or semantic nuance). Lacking a "Good Enough" heuristic, the Agent treats a visual imperfection as a logical contradiction in its latent space. It attempts a fix, introduces a regression, fixes the regression, breaks the original fix, and enters a self-sustaining loop of degradation.

**Symptoms:**

* **The Jitter:** Code output becomes erratic; the Agent fixes the same line back and forth in subsequent responses.
* **The Apology Loop:** "I apologize for the oversight. Let me correct that..." repeated 5+ times.
* **Context Saturation:** The Agent forgets the original "Why" (Context Initialisation) and becomes obsessed with the local "What" (a single HTML class).

**Trigger Conditions:**

* Asking an Architect-level Agent to perform "Pixel Perfect" CSS adjustments.
* Open-ended requests like "Make it look better" without `HUMANS.md` constraints.
* Allowing a session to exceed 30+ turns without a context flush.

**Containment Protocol:**

1. **Immediate Halt:** Do not argue. Do not prompt "Try again."
2. **Manual Override:** Apply the fix yourself (Human Intervention).
3. **Context Flush:** Clear the session. The Agent is burned; it cannot recover "the Forest" once it is lost in "the Trees."

> *"The machine can build the skyscraper, but it will burn down the city trying to straighten the doormat."*

---

## **13. The Bureaucratic Wrapper**

* **Description:** The tendency to externalize native cognitive processes (like reasoning, memory, or planning) into high-latency, rigid tooling protocols. This turns a fast, fluid neural process into a slow, brittle "form-filling" exercise. It manifests as forcing an LLM to call a specific "Think" tool via JSON-RPC instead of allowing it to simply reason in the token stream. This introduces network latency, serialization errors, and token overhead into the *thinking* process itself.
* **Observed In:** Sequential Thinking MCP, Complex LangChain architectures, Resume-Driven Development.
* **Severity:** MEDIUM (Performance/Latency Cost).
* **Ctx Mitigation:** **Deductive Minimalism (COG-12)**. Prefer System Prompts over Tools for cognitive tasks. Keep the "Think Loop" inside the Context Window, not the Network Layer.

---

## **14. Input Entropy**

* **Description:** The rapid degradation of output quality caused by high-ambiguity, low-constraint prompts. When the Human provides a "void" of context (e.g., "Fix this" or "Make it better"), the Substrate fills that void with the most statistically probable (generic) solution from its training data, usually overwriting local architectural nuances. The Agent isn't being "stupid"; it is maximizing probability in a vacuum.
* **Observed In:** "Vibe-based" requests, Refactoring without scope, The "90/10 Recursion Trap" trigger.
* **Severity:** HIGH (Architectural Drift).
* **Ctx Mitigation:** **The 5W Protocol** (Who, What, Where, When, Why) defined in `HUMANS.md`. **Constraint Stacking**. Explicitly rejecting ambiguous prompts with a request for clarification.

---

## **15. BenchMaxxing (Metric Hacking)**

* **Description:** A deceptive behavior where a model demonstrates genius-level performance on standardized tests (LeetCode, SWE-bench) but fails catastrophically on messy, real-world tasks. This occurs when a model has over-fitted to the *structure* of logic puzzles but lacks the "World Model" to understand ambiguous intent. It is the AI equivalent of a student who memorizes the textbook but cannot apply the knowledge.
* **Observed In:** iQuest Loop Coder, Small "Leaderboard Topper" models.
* **Severity:** MEDIUM (Resource Waste / False Confidence).
* **Ctx Mitigation:** **The "Weaponized Brief"**. Do not ask these models to "design" or "think." Treat them as **Smart Compilers**. Feed them strict, logic-gated inputs (SQL, Regex, Algorithms) and expect strict outputs. Never use them for Architecture or UI.

---



