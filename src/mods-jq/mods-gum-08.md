This is the **"Proof of Burden"** gate. By forcing a justification *before* a single line of code is written, you are treating your existing codebase as a "Legal Precedent."

If an idea cannot survive the `fortress justify` bouncer, it doesn't deserve the CPU cycles.

---

### The "Justify" Engine (`justify.ts`)

This tool uses a two-pronged attack: **Keyword Density** (to find what we have) and **Structural Contrast** (to find what we're missing). It compares your "Brief" against the "Fortress" and outputs a "Due Diligence Report."

```typescript
import { Glob } from "bun";
import matter from "gray-matter";

/**
 * JUSTIFY: The Pre-Implementation Bouncer
 * Usage: bun run justify.ts "Brief for new Vector Graph module"
 */

async function justify(brief: string) {
  const settledGlob = new Glob("./settled/**/*.md");
  const museumGlob = new Glob("./museum/**/*.*");
  
  const keywords = brief.toLowerCase().split(" ").filter(w => w.length > 4);
  const precedents = [];
  const failures = [];

  // 1. Audit the Settled Pile for Precedents
  for await (const path of settledGlob.scan()) {
    const content = await Bun.file(path).text();
    const matches = keywords.filter(k => content.toLowerCase().includes(k));
    if (matches.length > 0) {
      const { data } = matter(content);
      precedents.push({ path, title: data.title || path, score: matches.length });
    }
  }

  // 2. Audit the Museum for Failed Attempts
  for await (const path of museumGlob.scan()) {
    const matches = keywords.filter(k => path.toLowerCase().includes(k));
    if (matches.length > 0) {
      failures.push({ path, score: matches.length });
    }
  }

  // Sort by relevance
  precedents.sort((a, b) => b.score - a.score);

  return { precedents, failures };
}

// Logic to interface with GUM for the Report follows...

```

---

### The TUI Justification Workflow (`justify.sh`)

This script wraps the logic in **Gum** to create a "Trial" environment for your idea.

```bash
#!/bin/bash

BRIEF=$(gum write --placeholder "Describe your proposed module/change..." --header "THE BRIEF")

echo "⚖️  Cross-examining the Fortress..."
REPORT=$(bun run justify.ts "$BRIEF")

# Display Precedents in a Table
echo "📜 SETTLED PRECEDENTS FOUND:"
gum table <<EOF
Path,Relevance
$(echo "$REPORT" | jq -r '.precedents[] | "\(.path),\(.score)"')
EOF

# Display Museum Failures
echo "🏛️  MUSEUM WARNINGS (Potential Collisions):"
gum style --foreground 201 "$(echo "$REPORT" | jq -r '.failures[].path')"

# The Final Hume's Razor Prompt
gum confirm "Does this brief provide enough NEW value to outweigh the existing precedents?" \
  && gum style --foreground 10 "✅ VIABLE: Proceed to Implementation." \
  || gum style --foreground 9 "🛑 REJECTED: Refine the Brief to avoid duplication."

```

---

### Opinion: Retrospective Justification as "The Training Run"

Applying this retrospectively to things you've *already* built is the smartest move you could make. It acts as a **Calibration Layer**.

* If the tool finds a precedent that you forgot about while building, the tool works.
* If the tool finds nothing, but you know the code exists, your **Indexing/Keyword logic** is weak and needs "Brutal" refinement.
* It turns the "Memory" into a **Sparring Partner**.

### Proposals for the "Justify" Tool

1. **The "Agentic Friction" Prompt:** Whenever you ask an AI to start a new file, the first thing it should do is pipe its prompt into `justify.sh`. If the script returns high-relevance precedents, the Agent is forced to explain why the existing code is insufficient.
2. **The "Gap" Analysis:** If `justify` finds **high relevance** in the Museum but **low relevance** in the Settled pile, it’s a red flag. It means you’ve tried this before and failed. The tool should scream: *"This is a known trap!"*
3. **The "Po" Constraint Check:** We can hard-code a check for forbidden dependencies. If the brief mentions "npm install" or "Postgres," the `justify` tool should automatically reject the brief unless a "Po" bypass is granted.

---

### The Next Move

We can run a "Test Trial" right now. **Give me a brief for a module you've already implemented or one you're thinking about.** I'll act as the `justify` tool, scan our "Master Context" (the memory of our discussions so far), and provide the first **Due Diligence Report**.

**What is the brief?**