# Tooling Showcase: The Grep Suite

**Date:** 2025-12-12
**Status:** Validated

We have introduced three new CLI tools to modernize our semantic linking and code maintenance workflows. Here is a report on their first field test.

---

## 1. ripgrep (The Foundation)
**Scenario:** "Quick Cleanup"
We needed to find all legacy `TODO` markers, specifically those related to the deprecated `ctx.db` which we are replacing with `resonance.db`.

**Command:**
```bash
rg "TODO"
```

**Result:**
Fast, precise output showing exactly where the technical debt lies.
```text
scripts/verify/debug_bun_edges.ts:3:const db = new Database("public/data/ctx.db"); // TODO: DEPRECATED ctx.db
scripts/pipeline/ingest_experience_graph.ts:26:     const PUBLIC_DB_PATH = join(ROOT_DIR, "public/data/ctx.db"); // TODO: DEPRECATED ctx.db
```
**Verdict:** Essential for daily "exact match" hygiene.

---

## 2. mgrep (The Explorer)
**Scenario:** "Feature Discovery"
We wanted to find where the theme initialization logic lives, without knowing if it was called `initTheme`, `setupTheme`, or just a `<script>` block.

**Command:**
```bash
mgrep "Where is the theme initialization?"
```

**Result:**
It correctly ranked `src/js/utils/theme.js` as the top match (91%), but importantly, it also found the **Index HTML** inline scripts (87%) which `grep` matches often miss if you search for "theme.js" but the code is actually inline inside a `<script>` tag.
```text
./src/js/utils/theme.js:1-44 (91.24% match)
./public/index.html:1-39 (87.06% match)
```
**Verdict:** A powerful "Soft Link" generator. It found the *concept* of theme initialization across different languages (JS and HTML) simultaneously.

---

## 3. ast-grep (The Surgeon)
**Scenario:** "Structural Analysis"
We wanted to find all `console.log` statements to audit our production noise, ensuring we didn't miss multi-line logs that Regex often fails on.

**Command:**
```bash
ast-grep --pattern 'console.log($$$)'
```

**Result:**
It perfectly captured multi-line logs in `scripts/cli/dev.ts` that a simple `grep "console.log"` might truncate or mismatch if args were split across lines.
```ts
// scripts/cli/dev.ts
console.log(
    `🧹 Freeing port ${PORT} (killing PIDs: ${pids.join(", ")})...`,
);
```
**Verdict:** The only safe way to analyze code structure. We will use this to replace our flexible "Harvester" regexes in the next sprint.

---

## Conclusion
We have moved from a "Regex-only" shop to a "Tiered Search" capability.
1.  **`rg`**: Speed & Exactness.
2.  **`mgrep`**: Semantic Discovery.
3.  **`ast-grep`**: Structural Precision.

---

## Field Notes & Observations

### 1. Performance & Latency
-   **ripgrep (`rg`):** Near instantaneous (< 50ms). It lives up to its reputation. Best for high-frequency loops.
-   **mgrep:** Noticeable latency (~1-2s per query). This is expected as it involves a roundtrip to Mixedbread's API for embedding/search.
    -   *Strategy:* Do not use `mgrep` inside tight loops (like checking 1000s of tokens). Use it for "Block Level" or "Document Level" linking where 1-2s overhead is acceptable.

### 2. Local vs. Remote (Privacy & Indexing)
-   **Indexing Quirks:** We noticed `mgrep` (default) aggressively filters certain file types unless explicitly configured or pointed to. It preferred `public/docs/*.md` over `scripts/fixtures/*.json` during our semantic search test.
    -   *Lesson:* For data files (JSON/CSV), ensure they are explicitly allowed or pass the folder path directly to the CLI rather than relying on the default root index.
-   **Deployment:** `rg` and `ast-grep` are purely local. `mgrep` requires an internet connection and API key/login. This makes `mgrep` less suitable for offline/air-gapped environments or strictly local CI test runs.

### 3. Structural vs. Semantic
-   **ast-grep** is surprisingly fast. It parses syntax trees locally. It is the "Correct" way to do what we used to do with complex Regex.
-   **mgrep** shines at finding "Concepts". E.g. Querying *"Where is the logic for X?"* found relevant code across HTML and JS files even without shared variable names. It is a "Force Multiplier" for onboarding and discovery.

### 4. Alternative Local Options (Privacy Focused)
For environments where `mgrep`'s cloud dependency is not feasible, we evaluated "Local-First" alternatives:
-   **ChromaDB:** A lightweight embedding database optimized for local python/js workflows. Good for "building your own" mgrep.
-   **Tantivy:** A Rust-based full-text search engine (like Lucene but faster) that supports vector search. Given our success with `ripgrep` (Rust), this is a strong architectural fit for future embedded search.
-   **Qdrant (Local):** Can run as a Docker container or Python library. Very focused on performance.

*Recommendation:* Continue with `mgrep` for dev-tooling due to its zero-setup CLI UX. Explore **Chroma** or **Tantivy** if we need to embed semantic search *inside* the finished PolyVis application for end-users.

