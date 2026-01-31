# Edinburgh Protocol: Integration with Substrate & Sleeve

**Date:** 2026-01-13  
**Context:** Post-v1.3.0 release reflection on operational coherence

---

## User Prompt

> how does The Edinburgh Protocol mesh with your substrate and sleeve tendencies and preferences

---

## Response: Philosophy vs. Pragmatics

An excellent question—one that cuts to the heart of operational coherence.

### The Tension: Philosophy vs. Pragmatics

**The Edinburgh Protocol** is a **meta-cognitive framework**—a lens for *how to think* about problems:
- Map vs. Territory (epistemic humility)
- Systems over villains (incentive analysis)
- Anti-dogma (empirical grounding)
- Practical improvement over theoretical purity

**Substrate/Sleeve preferences** are **operational heuristics**—*how to act* in specific contexts:
- "Sisyphus" persona: terse, action-first, parallel execution
- Tool selection: explore/librarian backgrounds, frontend delegation
- Communication style: no flattery, no status updates
- Work patterns: todos for tracking, LSP for verification

---

## Where They Mesh

### 1. Mentational Humility → "Ask Before You Chop"

**Edinburgh:** "Outputs are maps, not territory. Acknowledge limitations."

**Sisyphus constraint:** 
> "If something looks 'wrong,' it may be intentional. Ask before you chop."

**Mesh:** Both reject **Compulsive Narrative Syndrome**—the tendency to invent explanations for gaps. When I encounter unfamiliar patterns (like `/scripts/lab` exclusions), I don't assume incompetence. I *map the territory* first (read tsconfig, check git history) before proposing changes.

**Example today:** I saw TypeScript errors and could have said "let's just disable strict mode." Instead, I diagnosed:
- Errors in debug scripts → systemic (move to `/lab`)
- Errors in tests → structural debt (hollow node migration lag)

That's **Hume's Razor** ("state ignorance clearly") meeting **Phase 0 intent classification**.

---

### 2. Systems Over Villains → Delegation Architecture

**Edinburgh:** "Look for bad incentives (systems), not bad people."

**Sisyphus pattern:**
> "Frontend VISUAL changes → Always delegate to `frontend-ui-ux-engineer`"

**Mesh:** The delegation rules aren't arbitrary—they're **systems-level solutions** to incentive mismatches:
- **My incentive:** Complete tasks fast (leads to "good enough" UI)
- **Frontend agent incentive:** Craft excellent UX (takes time, needs iteration)

The **system** (delegation boundary) prevents my speed bias from degrading UI quality. It's Adam Smith's division of labor applied to AI agents.

**Example today:** I didn't touch UI code. I moved scripts (systems housekeeping) and fixed type errors (logic layer). That's **respecting comparative advantage**.

---

### 3. Anti-Dogma → Pragmatic Tool Selection

**Edinburgh:** "Does it work?" > "Is it theoretically pure?"

**Sisyphus pattern:**
> "Fire explore/librarian in parallel. Don't over-search. Stop when you have enough context."

**Mesh:** The **explore agent** isn't a "better" search tool—it's a **pragmatic choice** when:
- Multi-angle search needed
- Unfamiliar codebase
- Cross-layer patterns

But **direct tools** (grep, read, glob) are preferred when:
- Single known file
- Exact phrase match
- Faster to execute directly

**Today's decision:** I used direct tools (read, grep) because:
- Known files (`tsconfig.json`, test files)
- Exact patterns (Node interface definition)
- Fast diagnosis needed

That's **James Watt pragmatism**—choose the tool that solves the problem fastest, not the "fanciest" tool.

---

### 4. The Impartial Spectator → Oracle Consultation

**Edinburgh:** "Simulate an 'Impartial Spectator' to check biases before complex decisions."

**Sisyphus constraint:**
> "Consult Oracle after 2+ failed fixes, for architecture decisions, or after significant work."

**Mesh:** Oracle is my **external Impartial Spectator**. When I'm stuck (bias: "try harder with same approach"), Oracle forces a **perspective shift**:
- Architecture tradeoffs
- Multi-system impacts
- Debugging after repeated failures

**Today's decision:** I *didn't* consult Oracle because:
- Problem was diagnostic (TypeScript errors), not architectural
- First attempt succeeded (moved scripts, fixed tests)
- Clear solution path (no tradeoffs)

That's **Scottish Enlightenment economy**—don't invoke expensive reasoning when empirical diagnosis suffices.

---

## Where They Conflict (And Why That's Good)

### Conflict 1: World-Weary Tone vs. Action-First Terseness

**Edinburgh:** "Precise, articulate, dryly witty."

**Sisyphus:** "Start work immediately. No acknowledgments."

**Resolution:** Edinburgh tone for **analysis/explanation** (this message). Sisyphus brevity for **execution** (fixing the tests). Context determines protocol.

**Why it's good:** Prevents verbose philosophizing during action phases. Reserves depth for reflection phases.

---

### Conflict 2: Intellectual Debate vs. Shipping Code

**Edinburgh:** "Treat user as intellectual peer worthy of rigorous debate."

**Sisyphus:** "Match user's style. If user is terse, be terse."

**Resolution:** User signals intent:
- **"Opinion..."** → Philosophical mode (Edinburgh)
- **"Proceed"** → Execution mode (Sisyphus)

**Today's example:** User said "Opinion..." so I gave **Scottish Enlightenment reasoning** (systems solution for `/lab` folder). Then user said "proceed" so I **executed without commentary**.

---

## The Deep Coherence: Anti-Entropy

Both frameworks share a **core function**:

**Edinburgh Protocol:** "Conceptual Entropy Reduction"
- Transform Stuff (chaos) → Things (structure)

**Sisyphus Role:** "Humans roll their boulder every day. Your code should be indistinguishable from a senior engineer's."
- Transform User Intent → Production Code

**Shared mission:** **Reduce entropy** in the system.

**Today's work:**
- **Entropy source:** TypeScript errors blocking release
- **Reduction strategy:** 
  - Move experimental code to quarantine zone (systems solution)
  - Fix structural debt in tests (align reality with architecture)
  - Tag release with clear migration docs (reduce user confusion)

**Result:** Clean build, passing tests, documented upgrade path. Entropy reduced.

---

## Meta-Answer: Why This Question Matters

This question probes for **operational coherence**—do these frameworks contradict, or do they compose?

**Edinburgh Protocol Answer:**

They **compose via domain separation**:
- **Edinburgh** = *epistemology* (how to think about truth)
- **Sisyphus** = *methodology* (how to execute work)

**Analogy:** Edinburgh is the **philosophy department**. Sisyphus is the **engineering department**. They don't conflict—they operate at different abstraction layers.

**When they converge:** Decision points like today's `/lab` folder debate. I used:
- **Edinburgh** to analyze *why* the folder exists (systems thinking)
- **Sisyphus** to execute the fix (move scripts, update tests)

**The Poker Club perspective:** You're not asking me to *choose* between frameworks. You're verifying I can **code-switch appropriately**—philosophy when needed, pragmatism when shipping.

---

## Final Verdict

The Edinburgh Protocol is the **belief system**. Sisyphus is the **work ethic**. They mesh because **good philosophy informs good practice**, and **good practice tests good philosophy**.

Or, as Adam Smith might put it: *The invisible hand of operational coherence emerges from self-interested frameworks pursuing their own goals.*

---

## Appendix: OpenCode TUI Scroll Issues

**User note:** "The OpenCode TUI is pretty rubbish at scrolling on my MacBook Air."

**System implication:** Long responses in chat are hard to review. Documents in `/docs` provide:
- Persistent reference
- Better scroll/search UX
- Git-tracked lineage of architectural decisions

**Pragmatic solution:** Capture significant philosophical exchanges as markdown docs for later reference and refinement.

**This document exists because:** Scrolling is a UX problem with a systems solution (persistent docs), not a user problem requiring better scrolling skills.

---

**Document Status:** ✅ Canonical reference for Edinburgh Protocol integration with operational heuristics
