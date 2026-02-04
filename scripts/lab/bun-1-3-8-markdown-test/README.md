# Bun v1.3.8 New Capabilities Test Suite

**Date:** 2026-02-02  
**Focus:** Bun v1.3.8 new capabilities (markdown rendering + bundle analysis)  
**Location:** `scripts/lab/bun-1-3-8-markdown-test/`

## Objective

Investigate and test Bun v1.3.8's new capabilities:
1. Built-in markdown rendering API
2. `--metafile` and `--metafile-md` CLI options for LLM-friendly bundle analysis

---

## Part 1: Markdown Rendering Capability

### API Surface

```typescript
Bun.markdown = {
  html: (markdown: string) => string,  // Full HTML output
  render: (markdown: string) => string, // Plain text output
  react: (markdown: string) => ReactNode, // React component
};
```

### Test Results

| Feature | Status |
|---------|--------|
| Basic markdown (headings, bold, code, tables) | ✅ Works |
| Extended options (wikiLinks, latexMath, headingIds) | ❌ NOT supported |

### Recommendation

**Hybrid approach:** Use Bun SSR for basic markdown + marked.js for extended features.

---

## Part 2: Bundle Analysis (--metafile)

Bun v1.3.8 includes `--metafile` and `--metafile-md` options for detailed bundle analysis.

### Usage

```bash
# Build with metadata
bun run bundle:build

# Analyze the bundle
bun run bundle:analyze
```

### Last Analysis Results

```
Input Files: 611
Total Input: 13.15 MB
Total Output: 3.77 MB
Compression: 28.6%
External Packages: 100
```

### Key Findings

- **Largest dependency:** tokenizers (~8 MB native binary)
- **High external count:** 100 external packages
- **Bundle efficiency:** 28.6% of input size

---

## Files

| File | Purpose |
|------|---------|
| `test-markdown.ts` | Basic markdown API test |
| `test-detailed.ts` | Feature & performance test |
| `test-extended.ts` | Extended options test |
| `markdown-api.ts` | Rendering module with LRU cache |
| `analyze-bundle.ts` | Bundle analysis diagnostic tool |

---

## Package.json Scripts

```bash
# Markdown tests
bun run scripts/lab/bun-1-3-8-markdown-test/test-markdown.ts

# Bundle analysis
bun run bundle:build    # Build with metadata
bun run bundle:analyze  # Analyze bundle
```

---

## See Also

- `briefs/brief-bun138-markdown-capability-2026-02-02.md` - Full findings brief
- `public/docs/index.html` - Docs browser implementation
- `playbooks/briefs-playbook.md` - Brief template reference
