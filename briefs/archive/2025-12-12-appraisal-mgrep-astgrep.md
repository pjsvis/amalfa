# Tool Appraisal: mgrep & ast-grep

**Date:** 2025-12-12
**Context:** Evaluating modern search tools to enhance "Semantic Linking" and Graph Operations in PolyVis.

## 1. mgrep (Semantic Search)
**URL:** [https://github.com/mixedbread-ai/mgrep](https://github.com/mixedbread-ai/mgrep)

### Overview
`mgrep` is a CLI tool that brings "semantic search" to the terminal. Unlike `grep` which matches exact text patterns, `mgrep` uses embeddings to match the **intent** and **meaning** of a query.

### Key Capabilities
- **Natural Language Querying:** "Where do we set up auth?" vs `grep -r "auth" .`
- **Semantic Matching:** Can link "login" -> "authentication" -> "sign-in" without explicit keywords.
- **Multimodal:** Supports Code, PDFs, Markdown, Images.
- **Watch Mode:** `mgrep watch` keeps a background index in sync.
- **Agent Integration:** Explicitly designed to reduce Agent token usage by retrieving relevant context first.

### Value for PolyVis
- **Semantic Linking (High Potential):**
    - **Current state:** We use regex/keyword extraction to link PERSONA cards.
    - **With mgrep:** We could query `mgrep "Related concepts to 'Resonance'"` and get a list of files that are semantically distinct but conceptually related.
    - **Graph Building:** It acts as a "Soft Link" generator.
- **Risks:**
    - **Cloud Dependency:** Indexes are stored in Mixedbread's cloud. This is a privacy consideration for enterprise/local-only constraints.
    - **Dependency:** Requires `mgrep` binary and account/API key.

### Recommendation
**Adopt for Semantic Exploration.** The ability to find "related files" without exact keyword matches is exactly what our "Soft Linking" strategy needs.

---

## 2. ast-grep (Structural Search)
**URL:** [https://ast-grep.github.io](https://ast-grep.github.io)

### Overview
`ast-grep` (`sg`) uses Abstract Syntax Trees (ASTs) to search code. It understands that `foo(bar)` is a function call, regardless of whitespace or line breaks.

### Key Capabilities
- **Precision:** zero false positives caused by comments or strings.
- **Rewriting:** Can perform massive refactors safely (e.g. "Replace all calls to `deprecated_func(a, b)` with `new_func(b, a)`").
- **Agent Prompting:** The `ast-grep-mcp` allows agents to "test" their search patterns before editing, reducing hallucinations.

### Value for PolyVis
- **Code Maintenance (High Potential):**
    - **Refactoring:** Perfect for tasks like "Find all Alpine.js data objects and add a new property."
    - **Linting:** We can write custom rules (like our "No bg-gray-50" rule) much more robustly than regex.
- **Graph Ingestion:**
    - Can be used to parse complex source code into graph nodes (e.g. "Find all Classes and their methods" to build a dependency graph).

### Recommendation
**Adopt for Code Operations.** Use it to replace fragile regex in our "Harvester" scripts and for future bulk refactors.

---

## 3. ripgrep (speed & Privacy)
**URL:** [https://github.com/BurntSushi/ripgrep](https://github.com/BurntSushi/ripgrep)

### Overview
`ripgrep` (`rg`) is the current gold standard for local, text-based search. It combines the usability of The Silver Searcher with the raw speed of GNU grep.

### Key Capabilities
- **Extreme Speed:** Built in Rust, optimized for speed on large codebases.
- **Git-Aware:** Automatically respects `.gitignore` rules.
- **Local-First:** Completely runs on-device. Zero data leakage.
- **Regex:** Supports standard regex patterns for exact text matching.

### Value for PolyVis
- **Privacy & Security:** Best option when working with sensitive matching where cloud-upload (mgrep) is not permitted.
- **Baseline Tool:** The fallback when semantic search is too fuzzy or ast-grep is overkill.
- **CI/CD:** Ideal for fast, deterministic checks in pipelines without external dependencies.

### Recommendation
**Retain as Core Utility.** It remains the best tool for "I know exactly what string I'm looking for" workflows.

## Strategic Fit
- **ripgrep:** The **Foundation**. Fast, local, exact text matching.
- **mgrep:** The **Explorer**. Semantic, fuzzy, intent-based retrieval.
- **ast-grep:** The **Surgeon**. Precise, structural extraction and manipulation.
