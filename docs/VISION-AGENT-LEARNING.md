# Agent-Generated Knowledge: Beyond Spec-Driven Development

**Author:** Insights from PolyVis project experience  
**Date:** 2026-01-06  
**Status:** Vision Document  

---

## Executive Summary

Traditional software development separates execution (agents/developers write code) from documentation (humans write specs and docs). The PolyVis project demonstrated a more effective pattern: **agents generate their own institutional knowledge** through structured reflection. This document explores why this works, how it scales, and what it means for Amalfa's design.

**Key Finding:** When given minimal structure (brief-debrief-playbook workflow), agents spontaneously maintain documentation, update standards, and build compounding organizational knowledge - with humans acting as curators rather than primary authors.

---

## Table of Contents

1. [The Problem with Traditional Documentation](#the-problem-with-traditional-documentation)
2. [The PolyVis Discovery](#the-polyvis-discovery)
3. [Why the Pattern Works](#why-the-pattern-works)
4. [The Brief-Debrief-Playbook Flywheel](#the-brief-debrief-playbook-flywheel)
5. [Spec-Driven vs. Learning-Driven Development](#spec-driven-vs-learning-driven-development)
6. [The Human Role: Reader, Not Writer](#the-human-role-reader-not-writer)
7. [Implications for Amalfa Design](#implications-for-amalfa-design)
8. [Evolution Path: From Manual to Emergent](#evolution-path-from-manual-to-emergent)
9. [Implementation Principles](#implementation-principles)
10. [Conclusion: Documentation as Cognition](#conclusion-documentation-as-cognition)

---

## The Problem with Traditional Documentation

### The Classic Pattern

```
Human writes spec → Agent executes → Code ships
                                      ↓
                            Knowledge stays in heads
                                      ↓
                              Next project: start over
```

**Problems:**
- Documentation lags reality (always outdated)
- Knowledge stays tacit (in developer heads)
- Human is bottleneck (must write everything)
- No feedback loop (learnings don't update specs)
- Context loss (why decisions were made)

### The Maintenance Burden

**Traditional approach:**
```
Day 1:   Human writes comprehensive style guide
Day 30:  Half the team forgot it exists
Day 90:  Guide is outdated, nobody updates it
Day 180: Guide is ignored, tribal knowledge rules
```

**Why it fails:**
- Writing docs is separate from doing work
- Updates require explicit effort
- No immediate payoff for maintainer
- Docs drift from reality

---

## The PolyVis Discovery

### The Pattern

```
Brief → Work → Debrief → Playbook Update
  ↓       ↓        ↓           ↓
Human  Agent    Agent    (mostly) Agent
```

### What Happened

**Expected behavior:**
- Agent executes brief
- Human writes debrief
- Human updates playbooks

**Actual behavior:**
- Agent executes brief
- Agent writes debrief (as required)
- **Agent updates playbooks spontaneously** (unprompted!)
- Human reads debriefs for oversight
- Human does "occasional tidy up"

### The Key Observation

> "Most times the lessons learned would be copied to the playbooks by the agent without prompting."

This wasn't programmed - it **emerged** from the structure.

---

## Why the Pattern Works

### 1. Immediate Context

**Debriefs capture knowledge while it's fresh:**

```markdown
## Debrief: Auth Refactor (2025-12-05)

### What Worked
- Alpine's x-data was better than manual state management
- Eliminated 200 lines of imperative DOM code

### What Failed
- Tried CSS Grid for layout → broke on Safari
- Switched to Flexbox → worked everywhere

### Lesson Learned
- Test layout in Safari EARLY, not as afterthought
- Alpine handles state better for reactive UIs
```

**Why this works:**
- Written **immediately** after work (context in memory)
- Captures **reasoning**, not just outcomes
- Documents **dead ends** (what not to try next time)
- Natural language (no friction to write)

### 2. The Reflection Gap

**Debrief forces cognitive processing:**

| Without Debrief | With Debrief |
|----------------|--------------|
| Task done → forget | Task done → reflect |
| Knowledge stays implicit | Knowledge becomes explicit |
| "It works" | "It works *because*..." |
| No pattern recognition | Patterns emerge from writing |

**The act of writing** the debrief causes:
- Pattern recognition ("Alpine was better than...")
- Causal reasoning ("Grid broke *because*...")
- Abstraction ("Test Safari *early*" - generalizable rule)

### 3. Intrinsic Motivation

**Without playbooks:**
```
Session 1: Agent solves problem (hard)
Session 2: Agent encounters same problem (hard again)
Session 3: Agent encounters same problem (hard again)
```
→ No incentive to document

**With playbooks:**
```
Session 1: Agent solves problem → writes debrief → updates playbook
Session 2: Agent reads playbook → solves similar problem (easy)
Session 3: Agent benefits from own past work
```
→ **Self-interest** drives documentation

### 4. Closed Feedback Loop

```
┌─────────────────────────────────────────┐
│                                         │
│  Brief ──→ Work ──→ Debrief ──→ Playbook│
│    ↑                             │      │
│    │                             │      │
│    └──────────── Next Brief ←────┘      │
│         (informed by playbook)          │
│                                         │
└─────────────────────────────────────────┘
```

**Each cycle:**
1. Brief references playbook ("follow CSS standards")
2. Agent works, encounters edge case
3. Debrief captures edge case + solution
4. Agent updates playbook unprompted
5. Next brief benefits from richer playbook

**Result:** Compounding knowledge with minimal human intervention.

---

## The Brief-Debrief-Playbook Flywheel

### Document Types

#### Brief (Tactical)
**Purpose:** Define specific task  
**Scope:** Single work session  
**Author:** Human (or agent proposal)  

**Contents:**
- Objective (what to build)
- Requirements (success criteria)
- Context (why this matters)
- Constraints (what to avoid)

**Example:**
```markdown
# Brief: Add Vector Search to Explorer

## Objective
Enable semantic search in graph explorer UI

## Requirements
- Search input in sidebar
- Results highlight matching nodes
- < 100ms response time

## Context
Users need to find concepts without knowing exact node names
```

#### Debrief (Reflective)
**Purpose:** Capture learnings  
**Scope:** Single work session  
**Author:** Agent (immediately after work)  

**Contents:**
- What worked (successes)
- What failed (dead ends)
- Lessons learned (abstractions)
- Open questions (future work)

**Example:**
```markdown
# Debrief: Vector Search Implementation

## What Worked
- Sigma's filter API for highlighting
- Debounced search (300ms) prevents lag
- Used existing VectorEngine (no new code)

## What Failed  
- Tried animating node transitions → janky on 1000+ nodes
- Z-index for results popup → broke in Safari
- Computed `position: fixed` instead

## Lessons Learned
- Animation performance degrades non-linearly with node count
- Test Safari layout EARLY (different stacking context rules)
- Debouncing is critical for live search

## Open Questions
- Should search history persist across sessions?
```

#### Playbook (Strategic)
**Purpose:** Codify standards  
**Scope:** All future work  
**Author:** Agent (extracted from debriefs)  

**Contents:**
- Principles (how we do things)
- Patterns (reusable solutions)
- Anti-patterns (what to avoid)
- Decision records (why we chose X over Y)

**Example:**
```markdown
# CSS Performance Playbook

## Principles
1. Test Safari early - different rendering behavior
2. Animations degrade with node count
3. Use CSS variables for all tweakable values

## Patterns

### Debounced Search Input
```javascript
let timeout;
input.addEventListener('input', (e) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => search(e.target.value), 300);
});
```

## Anti-Patterns
- ❌ `position: fixed` with z-index (breaks Safari)
- ✅ Use `position: absolute` with explicit stacking

## Decision Records
**DR-023: Why Flexbox over Grid for layouts**
Grid has better semantics but Safari rendering is inconsistent.
Flexbox trades elegance for reliability. See debrief-2025-12-05.
```

### The Flow

```
         Briefs
      (this task)
           ↓
         Work
      (execution)
           ↓
       Debriefs
    (what we learned)
           ↓
      Playbooks
    (how we do things)
           ↓
    Future Briefs
  (informed by standards)
```

**Key insight:** Knowledge flows **upward** (tactical → strategic) **and** **cycles** (strategic informs future tactical).

---

## Spec-Driven vs. Learning-Driven Development

### Spec-Driven (Traditional)

```
Define requirements → Implement → Verify against spec
                                          ↓
                                      Done ✓
```

**Optimization target:** This task  
**Question answered:** Did we meet requirements?  
**Knowledge captured:** None (implicit)  

### Learning-Driven (PolyVis)

```
Define requirements → Implement → Verify → Reflect → Update knowledge
                                                          ↓
                                                  All future tasks ✓
```

**Optimization target:** All future tasks  
**Question answered:** What did we learn?  
**Knowledge captured:** Explicit (codified)  

### The Synthesis

**Spec-driven is necessary but not sufficient.**

**Combined approach:**
- Spec-driven ensures **this task succeeds**
- Learning-driven ensures **future tasks succeed faster**

**Example:**

**Spec-driven only:**
```
Week 1: Build auth system (40 hours)
Week 5: Build payment system (40 hours - similar patterns)
Week 9: Build admin system (40 hours - similar patterns)
```
→ Linear time complexity

**Learning-driven addition:**
```
Week 1: Build auth (40h) + debrief (2h) + playbook (1h) = 43h
Week 5: Build payment (25h, leveraged auth playbook)
Week 9: Build admin (15h, leveraged both playbooks)
```
→ Compounding efficiency

---

## The Human Role: Reader, Not Writer

### The Inversion

**Old model:**
```
Human: Primary Author
  ↓
Writes specs, docs, standards
  ↓
Agent: Reader/Executor
  ↓
Follows documentation
  ↓
Human: Maintainer
  ↓
Updates docs (bottleneck)
```

**PolyVis model:**
```
Human: Editor/Curator
  ↓
Writes initial briefs
  ↓
Agent: Author/Executor
  ↓
Writes code + debriefs + playbooks
  ↓
Human: Reader/Overseer
  ↓
Reads debriefs, occasional tidy-up
```

### What "Occasional Tidy Up" Means

**Human didn't need constant maintenance because:**

1. **Agents write at point of knowledge creation** (fresh context)
2. **Agents have incentive to maintain** (benefit next session)
3. **Errors self-correct** (agent encounters bad advice → fixes playbook)
4. **Human passively monitors** (reads debriefs for issues)

**Human's "tidy up" role:**
- Merge duplicate playbooks
- Reorganize structure
- Deprecate obsolete sections
- Resolve contradictions
- **Curation, not creation**

### Why This Scales

**Traditional docs:**
```
N tasks = N × human_writing_time (linear bottleneck)
```

**PolyVis pattern:**
```
N tasks = N × agent_writing_time + √N × human_curation_time
                (parallelizable)       (sublinear oversight)
```

**Key:** Agent writing scales linearly (no bottleneck), human curation scales sublinearly (occasional intervention).

---

## Implications for Amalfa Design

### What PolyVis Taught Us

**PolyVis pattern:**
```
Briefs/Debriefs = Markdown files in repo
Playbooks = Markdown files in repo
Discovery = Grep/search file names
Links = Manual (file references)
```

**Strengths:**
- Simple (no infrastructure)
- Version controlled (git history)
- Human readable (markdown)

**Limitations:**
- Linear discovery (keyword matching)
- Manual linking (file references)
- No semantic search (must know filenames)
- Hard to find related concepts

### Amalfa Enhancement

**Amalfa pattern:**
```
Briefs/Debriefs = Nodes in semantic graph
Playbooks = Nodes in semantic graph
Discovery = Vector search + graph traversal
Links = Automatic (similarity + explicit)
```

**Example:**

**PolyVis:**
```bash
$ grep "CSS" playbooks/*.md
playbooks/css-performance.md
playbooks/css-variables.md
```
→ Must know keyword "CSS"

**Amalfa:**
```
Query: "styling broke on Safari"

Results:
1. debrief-2025-12-03-layout-debug (0.89 similarity)
   "Flexbox works, Grid breaks Safari stacking context"
   
2. playbook-cross-browser-testing (0.85 similarity)
   "Test Safari early - rendering differs from Chrome"
   
3. brief-safari-animation-bug (0.82 similarity)
   "Animation performance issues Safari vs Chrome"
```
→ Semantic matching, even without "CSS" keyword

### First-Class Workflow Support

**Bad Amalfa design:**
```
Generic document store
Agent dumps random markdown
No structure, no patterns
Human digs through chaos
```

**Good Amalfa design:**
```
Structured document types:
  - Brief: requirements, context, success criteria
  - Debrief: what worked, failed, lessons learned
  - Playbook: principles, patterns, anti-patterns

Auto-linking:
  - Debrief → Brief (what task it relates to)
  - Debrief → Playbook (which standard it updates)
  - Similar debriefs (encountered same problem)

Auto-promotion:
  - Extract lessons from debrief
  - Suggest playbook additions
  - Identify contradictions
```

### Discovery Patterns

**PolyVis (manual search):**
```
Agent: "I need to style this component"
Agent: *greps for CSS playbook*
Agent: *reads playbook*
Agent: *applies patterns*
```

**Amalfa (semantic discovery):**
```
Agent: "I need to style this component for Safari"
Agent: *queries "safari styling patterns"*
Amalfa: Returns:
  - Playbook: cross-browser CSS
  - Debrief: Safari layout debugging
  - Brief: Safari-specific animation work
Agent: *synthesizes from multiple sources*
```

**Key difference:** Amalfa returns **related concepts**, not just exact matches.

### Graph Traversal

**Beyond search - navigate relationships:**

```
Query: "What problems did auth work encounter?"

Amalfa returns graph:
  brief-auth-refactor
    ├─→ debrief-auth-refactor (completed)
    │     ├─→ playbook-alpine-patterns (updated)
    │     └─→ debrief-state-management (similar problem)
    ├─→ brief-auth-tests (follow-up work)
    └─→ issue-token-refresh (blocker)
```

**Agent can:**
- See full context (brief → debrief → playbook)
- Find related work (similar problems)
- Identify follow-ups (what came after)
- Understand dependencies (blockers)

---

## Evolution Path: From Manual to Emergent

### Level 1: Manual Process (Pre-Agent)

```
Human writes specs
Human writes code  
Human reviews code
Human documents learnings
Human maintains docs
```

**Characteristics:**
- Human bottleneck
- Linear scaling
- Knowledge stays tacit

### Level 2: Agent Execution (Early Agent Era)

```
Human writes specs
Agent writes code
Human reviews code
Human documents learnings
Human maintains docs
```

**Characteristics:**
- Execution scales
- Documentation still bottleneck
- Knowledge extraction still manual

### Level 3: Agent Reflection (PolyVis Pattern)

```
Human writes briefs
Agent writes code + debriefs
Agent updates playbooks
Human reads debriefs (oversight)
Human occasional tidy-up
```

**Characteristics:**
- Execution scales
- Documentation scales
- Human acts as curator
- **This is where PolyVis succeeded**

### Level 4: Semantic Infrastructure (Amalfa-Enhanced)

```
Human writes briefs (or reviews agent proposals)
Agent queries past work semantically
Agent writes code + debriefs
Agent links related concepts
Agent updates playbooks
Human queries debriefs for trends
Human sets strategic direction
```

**Characteristics:**
- Execution scales
- Documentation scales
- Discovery scales (semantic)
- Knowledge compounds faster

### Level 5: Full Emergence (Future Vision)

```
Agents propose work based on knowledge gaps
Agents self-organize documentation
Agents identify obsolete knowledge
Agents coordinate multi-agent work
Human sets goals and values
Human monitors for alignment
```

**Characteristics:**
- Agents manage full workflow
- Self-organizing knowledge base
- Human provides direction, not execution
- Emergent collective intelligence

**Note:** Level 5 requires significant AI advances. Level 4 is achievable today.

---

## Implementation Principles

### 1. Structure Enables Emergence

**Don't:** Create generic note-taking app  
**Do:** Provide structured templates that guide reflection

**Example:**

**Bad:**
```
"Write notes about your work"
```
→ Agent writes random thoughts

**Good:**
```markdown
# Debrief Template

## What Worked
[What approaches succeeded and why?]

## What Failed  
[What did you try that didn't work? Why did it fail?]

## Lessons Learned
[What generalizable insights emerged?]

## Open Questions
[What remains unclear or needs investigation?]
```
→ Agent follows structure, captures useful knowledge

### 2. Make Documentation Self-Interested

**Principle:** Agents maintain docs when *they* benefit.

**Design implications:**
- Debriefs inform future agent sessions (not just human record)
- Playbooks save agents time (not just human reference)
- Search finds agent's own past work (personal memory)

**Anti-pattern:** Documentation as "homework" (pure overhead)  
**Pattern:** Documentation as "external memory" (future productivity)

### 3. Reduce Friction

**Principle:** Easier to document than not document.

**Design implications:**
- In-line templates (don't make agents search for format)
- Auto-fill context (task ID, date, files changed)
- Suggest related docs (based on code changes)
- One-command workflows (`debrief create`, `playbook add`)

**Example:**
```bash
# Bad: Multiple steps, high friction
$ touch debrief.md
$ open debrief.md
$ # manually fill in metadata
$ # manually find related brief
$ # manually write content

# Good: Single command, pre-filled template
$ amalfa debrief create brief-auth-refactor

Creating debrief for brief-auth-refactor...

Auto-detected changes:
  - src/auth/login.ts (modified)
  - src/auth/session.ts (new)
  
Related documents:
  - playbook-auth-patterns
  - debrief-session-management-2025-11-12

Template loaded. Fill in sections below:
[opens editor with pre-filled template]
```

### 4. Close the Loop

**Principle:** Knowledge must flow back into workflow.

**Design implications:**
- Briefs reference playbooks (standards apply)
- Debriefs update playbooks (learnings codify)
- Playbooks link to debriefs (provenance)
- Search surfaces relevant past work (discovery)

**The cycle:**
```
Playbook → Brief → Work → Debrief → Playbook
   ↑                                    ↓
   └────────── (knowledge compounds) ───┘
```

### 5. Support Human Oversight

**Principle:** Human should read, not write.

**Design implications:**
- Dashboard: Recent debriefs (what happened today)
- Digest: Weekly summary (trends across sessions)
- Alerts: Contradictions (agent A says X, agent B says Y)
- Queries: "What did we learn about auth this month?"

**Example dashboard:**
```
Recent Debriefs (Last 7 Days)
  📝 debrief-vector-search (2h ago)
     Lesson: Debouncing critical for live search
     Updated: playbook-performance
  
  📝 debrief-safari-layout (1d ago)
     Lesson: Test Safari early, not late
     Updated: playbook-cross-browser
     ⚠️  Contradicts: playbook-css-grid (suggests Grid)

Playbook Updates (Last 30 Days)
  - performance: 3 updates
  - cross-browser: 2 updates
  - auth-patterns: 1 update

🔍 Query: "What problems did we have with Safari?"
```

### 6. Semantic Over Keyword

**Principle:** Match concepts, not strings.

**Design implications:**
- Vector embeddings for all documents
- Similarity search (not just keyword grep)
- Graph traversal (related concepts)
- Summarization (compressed context)

**Example:**

**Keyword search:**
```
Query: "authentication"
Matches: Documents containing "authentication"
Misses: Documents about "login", "session", "tokens" without exact word
```

**Semantic search:**
```
Query: "authentication"  
Matches:
  - Documents about authentication (exact)
  - Documents about login (related concept)
  - Documents about session management (related concept)
  - Documents about JWT tokens (related implementation)
  - Ranked by relevance
```

### 7. Explicit Over Implicit Links

**Principle:** Relationships should be first-class, not inferred.

**Design implications:**
- Debrief explicitly links to brief (task reference)
- Playbook explicitly links to debriefs (provenance)
- Cross-references are typed (related-to, contradicts, supersedes)

**Example graph:**
```
brief-auth-refactor
  ├─[completed-by]─→ debrief-auth-refactor
  │                    ├─[updated]─→ playbook-alpine-patterns
  │                    └─[similar-to]─→ debrief-state-management
  ├─[led-to]─→ brief-auth-tests
  └─[blocked-by]─→ issue-token-refresh
```

**Why explicit links:**
- Agent can traverse graph intentionally
- Human can audit reasoning
- Changes don't break relationships
- Provenance is clear

---

## Conclusion: Documentation as Cognition

### The Core Insight

**Documentation is not an artifact of work - it's a cognitive tool.**

When agents write debriefs:
- They **process** what happened (reflection)
- They **abstract** patterns (generalization)
- They **externalize** knowledge (memory)
- They **connect** concepts (synthesis)

**Writing forces thinking.**

### Why PolyVis Worked

The brief-debrief-playbook pattern succeeded because:

1. **Structured reflection** (debrief template)
2. **Immediate capture** (write while context fresh)
3. **Self-interest** (agents benefit from own docs)
4. **Closed loop** (playbooks inform future briefs)
5. **Minimal friction** (markdown, git, simple tools)
6. **Human oversight** (curator, not bottleneck)

### What Amalfa Adds

Amalfa enhances the pattern with:

1. **Semantic discovery** (find related work by concept)
2. **Graph structure** (navigate relationships)
3. **Auto-linking** (suggest connections)
4. **Multi-agent** (shared memory substrate)
5. **Cross-session** (persistent context)
6. **Queryable trends** (what are we learning about X?)

### The Vision

**Current state (2026):**
- Agents execute tasks
- Documentation is afterthought
- Knowledge resets each session

**Near future (Amalfa + PolyVis pattern):**
- Agents execute + reflect
- Documentation is intrinsic
- Knowledge compounds across sessions

**Long-term vision:**
- Agents self-organize work
- Documentation is infrastructure
- Collective intelligence emerges

### The Path Forward

**Phase 1: Replicate PolyVis** (MVP)
- Support brief/debrief/playbook types
- Markdown storage
- Basic search
- Git integration

**Phase 2: Add Semantics** (Enhanced)
- Vector embeddings
- Similarity search
- Auto-suggested links
- Graph traversal

**Phase 3: Multi-Agent** (Scaled)
- Shared knowledge base
- Cross-agent learning
- Conflict resolution
- Trend analysis

**Phase 4: Emergence** (Future)
- Agent-proposed work
- Self-organizing structure
- Automated maintenance
- Collective intelligence

---

## Appendix: Practical Examples

### Example 1: Auth Refactor Session

**Brief:**
```markdown
# Brief: Refactor Auth to Alpine.js

## Objective
Replace imperative DOM manipulation with Alpine state management

## Requirements
- User login/logout works
- Session persistence across page loads
- Token refresh on expiry

## Context
Current auth code is 400 lines of manual DOM updates. Hard to debug.
```

**Work:**
- Agent refactors code
- Replaces 400 lines with 80 lines of Alpine
- Tests pass
- Deploy succeeds

**Debrief (written by agent):**
```markdown
# Debrief: Auth Alpine Refactor

## What Worked
- Alpine's `x-data` eliminated manual state tracking
- `x-show` replaced 50+ lines of visibility toggling
- Token refresh using Alpine's `$watch` (reactive, not polling)

## What Failed
- Tried storing token in Alpine state → broke on page reload
- Switched to localStorage, Alpine reads on mount → works

## Lessons Learned
- Alpine is perfect for UI state, NOT persistence
- Alpine + localStorage is the right pattern
- 400 lines → 80 lines = 5x reduction, easier to debug

## Files Changed
- src/auth/login.ts (refactored)
- src/auth/session.ts (simplified)

## Test Results
All 23 auth tests pass
```

**Playbook Update (agent writes unprompted):**
```markdown
# Alpine.js Playbook

## State Management Patterns

### UI State: Use Alpine
```html
<div x-data="{ isLoggedIn: false, user: null }">
  <button @click="login()">Login</button>
  <div x-show="isLoggedIn">Welcome, {{ user.name }}</div>
</div>
```

### Persistent State: Use localStorage + Alpine
```javascript
// Mount: Read from localStorage
Alpine.data('auth', () => ({
  init() {
    this.token = localStorage.getItem('token');
    this.isLoggedIn = !!this.token;
  }
}));

// Update: Write to localStorage
function login(token) {
  localStorage.setItem('token', token);
  this.token = token;
  this.isLoggedIn = true;
}
```

**Provenance:** debrief-auth-alpine-refactor (2026-01-05)
```

**Result:**
- Brief defined task
- Debrief captured learnings
- Playbook codified pattern
- Future auth work references playbook
- Next agent doesn't repeat localStorage mistake

### Example 2: Safari Layout Bug

**Brief:**
```markdown
# Brief: Fix Explorer Layout on Safari

## Objective  
Sidebar + graph layout broken on Safari (works Chrome/Firefox)

## Requirements
- Sidebar 300px wide, fixed left
- Graph fills remaining space
- Responsive (mobile collapses sidebar)

## Context
User report: Safari shows overlapping panels
```

**Work:**
- Agent investigates Safari rendering
- Discovers CSS Grid stacking context bug
- Switches to Flexbox
- Verifies on Safari

**Debrief:**
```markdown
# Debrief: Safari Layout Fix

## What Worked
- Flexbox layout: `display: flex` for container
- `flex: 0 0 300px` for sidebar, `flex: 1` for graph
- Works Safari/Chrome/Firefox/Edge

## What Failed
- CSS Grid: `grid-template-columns: 300px 1fr`
- Safari bug: z-index doesn't work in grid context
- Searched for fixes, found Safari 15.x known issue

## Lessons Learned
- **Safari != Chrome** - test early, not at end
- CSS Grid has better semantics, but Safari bugs
- Flexbox is more reliable for layout (trade elegance for compatibility)
- Check caniuse.com for Safari quirks

## Browser Tested
- ✅ Safari 17.2
- ✅ Chrome 120
- ✅ Firefox 121

## Decision
Using Flexbox for all layouts going forward until Safari Grid bugs fixed.
```

**Playbook Update:**
```markdown
# Cross-Browser CSS Playbook

## Principles
1. **Test Safari EARLY** - rendering differs significantly
2. **Trade elegance for reliability** - Safari bugs beat clean code
3. **Check caniuse.com** - don't assume feature parity

## Layout Patterns

### ❌ CSS Grid (Safari Issues)
Safari 15-17 has z-index bugs in grid context. Avoid for layouts with overlays.

### ✅ Flexbox (Reliable)
Works consistently across browsers:
```css
.container {
  display: flex;
}
.sidebar {
  flex: 0 0 300px;  /* fixed 300px */
}
.main {
  flex: 1;  /* fill remaining */
}
```

## Decision Records

**DR-042: Why Flexbox over Grid**
Grid has better semantics (2D layout primitives), but Safari 15-17
has stacking context bugs that break z-index. Flexbox trades elegance
for reliability. Revisit when Safari 18+ adoption > 90%.

**Provenance:** debrief-safari-layout-fix (2026-01-05)
```

**Result:**
- Future layout work reads playbook
- Agents choose Flexbox, avoid Grid (Safari)
- Decision rationale is documented (not tribal knowledge)
- When Safari fixes bug, DR has revisit condition

### Example 3: Vector Search Performance

**Brief:**
```markdown
# Brief: Add Semantic Search to Explorer

## Objective
Search nodes by concept, not just exact name match

## Requirements
- Input box in sidebar
- Live results as user types
- Highlight matching nodes in graph
- < 100ms response time

## Context
Users want "find authentication stuff" not "find node named 'auth.ts'"
```

**Work:**
- Agent integrates VectorEngine
- Adds search input with Alpine
- Implements highlighting
- Tests performance

**Debrief:**
```markdown
# Debrief: Vector Search Implementation

## What Worked
- Reused existing VectorEngine (no new code!)
- Alpine + `@input` event (reactive search)
- Sigma's `setNodeAttribute` for highlighting
- Debounced search input (300ms delay)

## What Failed
- **Attempt 1:** No debouncing → laggy typing (search on every keystroke)
- **Attempt 2:** 100ms debounce → still laggy on slow machines
- **Attempt 3:** 300ms debounce → smooth, feels instant

## Lessons Learned
- **Debouncing is CRITICAL** for live search
- 300ms is sweet spot (feels instant, but batches queries)
- Never search on raw `@input` - always debounce
- VectorEngine already fast (<10ms), network overhead is the issue

## Performance
- Vector search: 8ms avg
- UI render: 12ms avg  
- Total with 300ms debounce: Feels instant

## Files Changed
- public/explorer/search.js (new)
- public/explorer/index.html (added input)
```

**Playbook Update:**
```markdown
# Performance Playbook

## Search Input Patterns

### ❌ Raw Input (No Debouncing)
```javascript
// DON'T: Fires on every keystroke
input.addEventListener('input', search);
```
**Problem:** Laggy typing, wasted queries

### ✅ Debounced Input
```javascript
// DO: Batch queries
let timeout;
input.addEventListener('input', (e) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => search(e.target.value), 300);
});
```
**Result:** Smooth typing, fewer queries

### Debounce Timing
- **100ms:** Still feels laggy on slow machines
- **300ms:** ✅ Sweet spot (feels instant, batches queries)
- **500ms:** Noticeable delay

**Provenance:** debrief-vector-search-implementation (2026-01-06)

## Animation Performance

### Rule: Performance Degrades Non-Linearly
- 100 nodes: animations smooth
- 500 nodes: animations slightly janky
- 1000+ nodes: animations unusable

**Lesson:** Disable animations above threshold, don't try to optimize.

**Provenance:** debrief-graph-animation-performance (2025-12-15)
```

**Result:**
- Future agents know to debounce search inputs
- 300ms is documented as best practice
- Performance thresholds are explicit
- Cross-referenced to original debrief

---

## References

- **PolyVis Project:** https://github.com/pjsvis/polyvis
- **Brief-Debrief-Playbook Pattern:** Emerged from PolyVis development (2025)
- **Amalfa:** This project (MCP server for agent memory)
- **Related Concepts:** 
  - Learning Organizations (Peter Senge)
  - After-Action Reviews (US Army)
  - Retrospectives (Agile)
  - Decision Records (ADRs)

---

**Status:** Vision document, not specification  
**Next Steps:** Design Amalfa schema to support this workflow  
**Feedback:** Iterate based on implementation experience  

---

_This document captures learnings from PolyVis and charts a path for Amalfa. The goal: make agent-generated knowledge the default, not the exception._
