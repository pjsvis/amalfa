# Brief: Semantic Linking Upgrade (mgrep & ripgrep)

**Context:**
The current `transform_cda.ts` pipeline relies on naive keyword matching (`includes()`) to link Directives to Concepts. This misses obvious semantic relationships (e.g., "Login" -> "Authentication") and is brittle to typos or terminology shifts.

**Objective:**
Integrate our new tooling (`mgrep` and `ripgrep`) to create a robust, "Tiered Linking" system that generates both **Hard Links** (Explicit) and **Soft Links** (Semantic).

---

## 1. The Strategy: Tiered Linking

We will upgrade the `candidate_relationships` generation logic to use three tiers of discovery:

### Tier 1: Explicit hard Links (Status: Good)
- **Source:** Explicit Tags `[RELATED_TO: Usage Data]`
- **Tool:** Current Regex Logic (or `ast-grep` if we move to Markdown files).
- **Confidence:** 1.0 (Auto-validated).

### Tier 2: Keyword Soft Links (Status: Needs Optimization)
- **Source:** Shared Terminology.
- **Current:** Basic `extractKeywords` + `text.includes(keyword)`.
- **Upgrade:** Use `ripgrep` (via `bun:spawn`) to perform rapid, exact-match scanning against the **Lexicon** if the dataset scales beyond memory.
- **Confidence:** 0.5 - 0.8.

### Tier 3: Semantic Soft Links (Status: NEW)
- **Source:** Conceptual Similarity.
- **Tool:** `mgrep`.
- **Implementation:**
    1.  Index the **Lexicon** using `mgrep watch`.
    2.  For each **Directive**, run an `mgrep search` using its definition as the query.
    3.  Extract the top 3 matches.
    4.  Create relationship candidates with `source: "semantic_search"`.
- **Example:**
    - *Directive:* "Users must sign in before accessing the dashboard."
    - *Lexicon:* "Authentication: The process of verifying identity."
    - *Result:* `mgrep` links these. Keyword match would fail.
- **Confidence:** 0.4 - 0.7 (Requires human or confidence-threshold validation).

---

## 2. Implementation Plan

### Phase 1: The `SemanticMatcher` Class
Create a helper wrapper around the `mgrep` CLI.

```typescript
// scripts/utils/SemanticMatcher.ts
export class SemanticMatcher {
    async findCandidates(query: string): Promise<MatchResult[]> {
        // Spawns: mgrep search --json "query"
        // returns parsed JSON results
    }
}
```

### Phase 2: Pipeline Integration
Update `scripts/transform/transform_cda.ts`:

```typescript
// Add new step in main loop
const semanticRels = await semanticMatcher.findCandidates(entry.definition);
const candidateRels = [...explicitRels, ...keywordRels, ...semanticRels];
```

### Phase 3: Validation
- Run the new pipeline.
- Inspect `cda-enriched.json`.
- Verify new "Soft Links" appear that make sense.

## 3. Benefits
1.  **Discovery:** We will find connections we didn't know existed.
2.  **Resilience:** The graph becomes robust to vocabulary changes.
3.  **Modernization:** moves us away from brittle `if (text.includes("foo"))` logic.

## 4. Dependencies
- `mgrep` installed and logged in.
- `bun` for fast subprocess spawning.
