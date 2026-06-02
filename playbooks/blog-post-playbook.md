---
date: 2026-04-10
tags:
  - playbook
  - writing
  - blog
  - content
  - communication
agent: any
environment: local
---

# Blog Post Playbook

## Purpose
A codified protocol for writing effective blog posts that engage readers, communicate ideas clearly, and follow a proven structure. Ensures consistency across posts while allowing for voice and topic variation.

## Context & Prerequisites

### Inputs Required
- Core idea or thesis
- Target audience (who is this for?)
- Desired outcome (inform, persuade, provoke, teach?)

### Related Playbooks
- `first-contact-playbook.md` — For capturing novel ideas worth writing about
- `justfile-design-playbook.md` — For technical how-to posts

---

## The Protocol

### Step 1: Define the Core Thesis

Write one sentence answering: **"What's the one thing I want readers to take away?"**

```markdown
Thesis: [Your single sentence]
```

- *Constraint:* If you can't state it in one sentence, you don't have a post yet — you have a topic.
- *Constraint:* The thesis should be specific enough to argue against.

---

### Step 2: Choose the Post Type

| Type | Structure | Best For |
|------|-----------|----------|
| **Argument** | Claim → Evidence → Implication | Persuading, provoking |
| **How-To** | Problem → Steps → Validation | Teaching a process |
| **Story** | Setup → Tension → Resolution | Engaging, inspiring |
| **Explainer** | Concept → Breakdown → Examples | Educating on complex topics |
| **Listicle** | Intro → N Items → Wrap-up | Skimmable value delivery |

Select one. Mixed types create muddy posts.

---

### Step 3: Write the Hook (First 100 Words)

The hook must accomplish three things:

1. **Create tension** — a question, contradiction, or gap
2. **Signal relevance** — why should *this reader* care?
3. **Promise value** — what will they gain by reading?

**Patterns that work:**

```markdown
# Provocative Question
"What if everything we know about X is backwards?"

# Contradiction
"We invest heavily in X. Yet Y remains epidemic."

# Personal Stakes
"For the past six months, I've been doing X. Here's what I learned."

# Bold Claim
"X is not about Y. It's about Z."
```

- *Constraint:* Do not bury the lead. The hook is not preamble — it's the contract.

---

### Step 4: Outline the Body

Create 3-7 sections that build the argument or narrative.

**For Argument posts:**
```markdown
1. [Establish the problem/status quo]
2. [Introduce your frame/model]
3. [Present the core evidence/logic]
4. [Address the strongest objection]
5. [Explore implications]
```

**For How-To posts:**
```markdown
1. [The problem this solves]
2. [Prerequisites/setup]
3. [Step-by-step process]
4. [Common pitfalls]
5. [Validation — how to know it worked]
```

**For Story posts:**
```markdown
1. [Setup — establish normal]
2. [Inciting incident — what changed]
3. [Rising action — the struggle]
4. [Climax — the turn]
5. [Resolution — what's different now]
```

- *Constraint:* Each section should have one clear purpose. If a section does two things, split it.

---

### Step 5: Write Section by Section

For each section:

1. **Write the first sentence** — it should state the section's point
2. **Support with evidence, example, or logic**
3. **End with a transition** to the next section (or a punchy close)

**Section length guidelines:**

| Section Type | Target Length |
|--------------|---------------|
| Hook | 50-150 words |
| Body sections | 150-300 words each |
| Conclusion | 100-200 words |
| Total post | 1,000-2,000 words |

- *Constraint:* One idea per paragraph. If you say "also" or "another thing," you need a new paragraph.

---

### Step 6: Add Visual Structure

Readers scan before they read. Help them.

**Required elements:**
- [ ] Subheadings (H2) every 200-400 words
- [ ] At least one table, list, or code block for scannability
- [ ] Bold key phrases (sparingly — 1-2 per section max)
- [ ] Short paragraphs (3-5 sentences max)

**Optional enhancements:**
- Pull quotes for key insights
- Comparison tables (A vs. B)
- Numbered lists for sequences
- Bullet lists for sets

---

### Step 7: Write the Conclusion

The conclusion is NOT a summary. It should:

1. **Restate the thesis** (in new words)
2. **Extend the implication** — so what? what now?
3. **End with resonance** — a callback, a challenge, or an invitation

**Patterns:**

```markdown
# The Callback
"We started with X. Now we see it's really about Y."

# The Challenge
"The question isn't whether X — it's whether you're willing to Y."

# The Invitation
"I'd love to hear your experience with X."
```

- *Constraint:* Don't introduce new information in the conclusion.

---

### Step 8: Write the Title (Yes, Last)

The title must:
- **Be specific** — not generic clickbait
- **Create curiosity** — open a loop
- **Contain the topic** — for searchability

**Formulas:**

| Formula | Example |
|---------|---------|
| `Why I [Action]: A [Frame] Perspective` | "Why I Sleep on the Floor: A Tensegrity Perspective" |
| `The [Adjective] Guide to [Topic]` | "The Pragmatic Guide to API Versioning" |
| `[Number] [Things] That [Outcome]` | "5 Patterns That Make CLIs Delightful" |
| `[Topic] is Not About [Expected]. It's About [Unexpected].` | "Debugging is Not About Code. It's About Assumptions." |
| `What [Doing X] Taught Me About [Y]` | "What Building Compilers Taught Me About Writing" |

---

### Step 9: Add Meta Elements

```markdown
# Subtitle/Deck (optional)
*One sentence expanding on the title*

# Estimated read time
~X min read (calculate: word count ÷ 250)

# Call-to-action (optional)
"Subscribe | Follow | Comment | Share"
```

---

### Step 10: Edit in Three Passes

**Pass 1: Structure**
- Does each section serve the thesis?
- Is the argument/narrative coherent?
- Cut any section that doesn't earn its place.

**Pass 2: Clarity**
- Is every sentence necessary?
- Are there ambiguous pronouns? Jargon without definition?
- Read aloud — where do you stumble?

**Pass 3: Polish**
- Check for repeated words/phrases
- Verify formatting consistency
- Confirm links, code blocks, tables render correctly

---

## Standards & Patterns

### Voice Guidelines

| Do | Don't |
|----|-------|
| Write in first person when sharing experience | Use "one" or passive voice unnecessarily |
| Use "you" to address the reader directly | Over-hedge ("I think maybe perhaps...") |
| Be concrete and specific | Use vague abstractions |
| Use active verbs | Rely on "is/are/was/were" |

### Formatting Standards

- **Headings:** Sentence case ("Why this matters" not "Why This Matters")
- **Lists:** Parallel structure (all start with verbs, or all are nouns)
- **Code blocks:** Always specify language for syntax highlighting
- **Links:** Descriptive text, not "click here"
- **Emphasis:** Bold for key terms, *italics* for subtle emphasis or titles

### Length Guidelines

| Platform | Target Length |
|----------|---------------|
| Medium / Substack | 1,200-2,000 words |
| Company blog | 800-1,500 words |
| Technical tutorial | 1,500-3,000 words |
| Quick tip | 400-800 words |

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Throat-clearing intro | Delays value, loses readers | Start with the hook |
| Wall of text | Unreadable, skipped | Add structure, break paragraphs |
| Burying the point | Readers miss it | State thesis in first 100 words |
| Hedging everything | Weakensauthority | Take a position |
| Jargon without context | Excludes readers | Define terms or use plain language |
| "In conclusion, to summarize..." | Redundant, amateurish | Just conclude |

---

## Validation

Blog post is ready for publication when:

- [ ] Thesis is clear in the first 100 words
- [ ] Each section serves the thesis
- [ ] Visual structure aids scanning (headings, lists, tables)
- [ ] Title is specific and compelling
- [ ] Three editing passes completed
- [ ] Read aloud without stumbling
- [ ] Meta elements added (subtitle, read time, CTA)
- [ ] Rendered/previewed in target platform

---

## Templates

### Argument Post Template

```markdown
# [Title]: A [Frame] Perspective

*[Subtitle — one sentence expanding on title]*

---

## The Provocation

[Hook — 100 words establishing tension, relevance, promise]

---

## The Standard View

[What most people think / do — the status quo]

---

## The Problem With That

[Why the standard view is incomplete or wrong]

---

## A Different Frame

[Introduce your model / perspective / approach]

---

## How It Works

[The mechanics — evidence, examples, logic]

---

## Objections

[Address the strongest counterargument]

---

## Implications

[So what? What changes if this is true?]

---

## Conclusion

[Restate thesis, extend implication, end with resonance]

---

*[Call-to-action or invitation to discuss]*
```

### How-To Post Template

```markdown
# How to [Achieve Outcome] in [Context]

*[Subtitle — who this is for and what they'll learn]*

---

## The Problem

[What pain does this solve? Why does it matter?]

---

## Prerequisites

[What do readers need before starting?]

---

## The Process

### Step 1: [Action]

[Details, examples, warnings]

### Step 2: [Action]

[Details, examples, warnings]

### Step N: [Action]

[Details, examples, warnings]

---

## Common Pitfalls

[What goes wrong and how to avoid it]

---

## How to Know It Worked

[Validation criteria — what does success look like?]

---

## Next Steps

[Where to go from here — related topics, advanced techniques]
```

---

## Maintenance

- **Review frequency:** When writing style evolves or platforms change
- **Refresh:** Add new patterns as they prove effective
- **Deprecation:** If moving to a different content system, archive and link to successor
