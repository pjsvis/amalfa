# Playbook: The Grep Strategy

**Goal:** Standardize search workflows to maximize efficiency and precision using the right tool for the job.

We use a **"Tiered Search"** approach. Do not default to `grep` for everything. Choose the tool based on your intent: **Speed (Foundation)**, **Meaning (Explorer)**, or **Structure (Surgeon)**.

---

## 1. The Foundation: `ripgrep` (`rg`)
**Intent:** "I know the exact text or regex pattern I'm looking for."
**Use Cases:**
- Finding exact variable names.
- Searching for specific error strings.
- Standard CI/CD checks.
- Zero-latency local search.

**Installation:**
```bash
brew install ripgrep
```

**Common Patterns:**
```bash
# Basic Search (Recursive, Git-Aware)
rg "search_term"

# Case Insensitive
rg -i "search_term"

# Show only filenames
rg -l "search_term"

# Search specific file types
rg -t js "function"
```

---

## 2. The Explorer: `mgrep`
**Intent:** "I need to find concepts, ideas, or files related to X, but I don't know the exact wording."
**Use Cases:**
- **Semantic Linking:** Finding nodes for the PERSONA graph.
- **Onboarding:** "Where is authentication handled?"
- **Feature Discovery:** "Do we have any logic for retrying requests?"

**Installation:**
```bash
bun add -g @mixedbread/mgrep
mgrep login
```

**Common Patterns:**
```bash
# Natural Language Query
mgrep "How do we handle dark mode switching?"

# Watch Mode (Keep index fresh)
mgrep watch

# Limit results
mgrep -m 5 "Auth Logic"
```

---

## 3. The Surgeon: `ast-grep` (`sg`)
**Intent:** "I need to find or modify code based on its syntax/structure, ignoring formatting."
**Use Cases:**
- **Refactoring:** "Change all calls of `foo(a)` to `foo({ value: a })`."
- **Linting:** "Find all hardcoded `bg-gray-50` classes in HTML attributes."
- **Extraction:** "List all Class names in the `src/js` folder."

**Installation:**
```bash
bun add -g @ast-grep/cli
```

**Common Patterns:**
```bash
# Find function calls (ignores whitespace)
sg -p 'console.log($$$ARG)'

# Replace Pattern (Refactor)
sg -p 'console.log($$$ARG)' -r 'logger.info($$$ARG)' -i

# Scan with rule file
sg scan -r rules/no-hardcoded-colors.yml
```

---

## Decision Matrix

| IF YOU WANT TO FIND... | USE... | WHY? |
| :--- | :--- | :--- |
| "The string `bg-gray-50`" | `rg` | Fastest. Exact match. |
| " Places where we set colors" | `mgrep` | Understands "set colors" ~ `background-color`, `text`, `fill`. |
| " `<div class="bg-gray-50">`" | `sg` | Understands it's an HTML attribute, ignores spacing. |
