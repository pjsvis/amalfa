---
date: 2026-02-02
tags: [bun, markdown, ssr, capability-audit]
agent: claude
environment: local
---

## Task: Bun v1.3.8 Markdown Rendering Capability Audit

**Objective:** Investigate Bun v1.3.8's new markdown rendering API and evaluate integration into `public/docs` markdown browser.

---

## Executive Summary

Bun v1.3.8 includes a built-in markdown rendering API (`Bun.markdown`) that provides server-side rendering capability. This audit evaluates the API surface, compatibility with existing docs infrastructure, and integration recommendations.

**Key Finding:** Bun's markdown API works for basic markdown but lacks extended features (wiki links, math, heading IDs) that the docs browser requires. **Recommendation: Hybrid approach** - use Bun for SSR where applicable, keep marked.js for extended features.

---

## 1. Bun Markdown API Surface

### Available Methods

```typescript
Bun.markdown = {
  // Returns full HTML document with <html>, <head>, <body>
  html: (markdown: string) => string,

  // Returns just the rendered HTML fragment
  render: (markdown: string) => string,

  // Returns ReactNode (for React apps)
  react: (markdown: string) => ReactNode,
};
```

### Test Results

| Feature                                     | Status           | Notes                     |
| ------------------------------------------- | ---------------- | ------------------------- |
| Basic markdown (H1-H6, bold, italic, lists) | ✅ Works         | Standard GFM              |
| Code blocks with syntax highlighting        | ✅ Works         | Basic, no language badges |
| Tables                                      | ✅ Works         | Standard GFM tables       |
| Links & Images                              | ✅ Works         | Standard behavior         |
| Blockquotes                                 | ✅ Works         | Standard behavior         |
| Strikethrough                               | ✅ Works         | Via GFM extension         |
| Task lists                                  | ✅ Works         | GitHub-flavored           |
| Extended: wikiLinks                         | ❌ NOT supported | `[[Link]]` syntax         |
| Extended: latexMath                         | ❌ NOT supported | `$math$` or `$$math$$`    |
| Extended: headingIds                        | ❌ NOT supported | Auto-generated IDs        |
| Extended: autolinkHeadings                  | ❌ NOT supported | Anchor links              |

---

## 2. Current Docs Architecture

### Client-Side Rendering (Existing)

```
Browser Request
       ↓
index.html (loads)
       ↓
Alpine.js docViewer() component
       ↓
fetch() markdown files from /js/app.js or server
       ↓
marked.js (client-side) → HTML
       ↓
Inject via x-html="contentMain"
       ↓
Tailwind Typography (prose) → Styled output
```

### Styling Pipeline

The docs browser uses Tailwind CSS Typography plugin:

```html
<article
  class="markdown-body prose dark:prose-invert max-w-none"
  x-html="contentMain"
></article>
```

**CSS Classes:**

- `markdown-body` - Base markdown container styles
- `prose` - Tailwind Typography plugin (responsive prose constraints)
- `dark:prose-invert` - Dark mode, inverted prose colors
- `max-w-none` - Allow full width

### Key Files

| File                         | Purpose                                                |
| ---------------------------- | ------------------------------------------------------ |
| `public/docs/index.html`     | Main docs browser (Alpine.js + client-side rendering)  |
| `public/js/app.js`           | Contains docViewer() component with fetch/render logic |
| `public/css/app.css`         | Main application styles                                |
| `public/css/slab-layout.css` | Slab layout styles                                     |

### How Client-Side Markdown Rendering Works

1. **Fetching**: Alpine.js `docViewer()` component fetches `.md` files via XHR/Fetch
2. **Parsing**: Client-side library (marked.js or bundled parser) converts MD → HTML
3. **Injection**: `x-html` directive inserts HTML into DOM
4. **Styling**: CSS classes (`prose`, `dark:prose-invert`) apply typography styles
5. **Syntax Highlighting**: Highlight.js (via CDN in backup layouts)

---

## 3. Server-Side Rendering with Bun

### How Bun SSR Would Work

```typescript
// Server-side (Bun API route or SSR endpoint)
const html = Bun.markdown.html(markdownContent);
// Returns full <!DOCTYPE html> document

// Or fragment for embedding
const fragment = Bun.markdown.render(markdownContent);
// Returns <h1>...</h1> style fragment
```

### SSR + Styling Architecture

```
Browser Request
       ↓
Bun SSR endpoint (or API route)
       ↓
Bun.markdown.render(markdown) → HTML fragment
       ↓
Inject into template with CSS classes
       ↓
Response: Complete HTML with styled content
       ↓
Browser renders (no client-side parsing needed)
```

### Styling Integration

Bun's markdown output is **unstyled by default**. To apply styling:

**Option 1: Wrap in styled container**

```html
<div class="markdown-body prose dark:prose-invert">
  ${Bun.markdown.render(markdown)}
</div>
```

**Option 2: Inline styles**

```typescript
const html = Bun.markdown.render(markdown);
// Post-process to add classes
```

**Option 3: CSS Reset + Custom Styles**

```css
/* Bun output needs these for Tailwind Typography */
.markdown-body h1 {
  @apply text-3xl font-bold mb-4;
}
.markdown-body p {
  @apply mb-4 leading-relaxed;
}
/* etc. */
```

---

## 4. Bundle Analysis (--metafile)

### Bun v1.3.8 Bundle Metadata

Bun includes `--metafile` and experimental `--metafile-md` options:

```bash
# Build with metadata
bun build --target bun --outdir .bun-dist src/cli.ts --metafile meta.json

# Generate LLM-friendly report (experimental)
bun build ... --metafile-md report.md
```

### Analysis Results

**Last Run:**

- Input Files: 611
- Total Input: 13.15 MB
- Total Output: 3.77 MB
- Compression: 28.6%
- External Packages: 100

**Dependencies Breakdown:**

- tokenizers: ~8 MB (native binary - largest)
- @anthropic-ai/sdk: ~500 KB
- Other runtime deps: ~2 MB

---

## 5. Integration Recommendations

### For `public/docs` Browser

**Recommended: Hybrid Approach**

1. **Use Bun.markdown.render()** for basic markdown documents (debriefs, simple playbooks)
2. **Keep marked.js** for documents requiring extended features:
   - Wiki links (`[[Concept]]`)
   - Math equations (`$$E=mc^2$$`)
   - Custom heading IDs

### Implementation Strategy

```typescript
// utils/markdown-renderer.ts
import { marked } from "marked";

export function renderMarkdown(content: string, useExtended = false): string {
  if (useExtended) {
    // Use marked.js for extended features
    return marked(content);
  } else {
    // Use Bun for basic markdown (faster, SSR-ready)
    return Bun.markdown.render(content);
  }
}

// API endpoint example
Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/markdown/")) {
      const file = url.pathname.replace("/api/markdown/", "");
      const content = await Bun.file(`docs/${file}.md`).text();
      const useExtended = content.includes("[[") || content.includes("$$");
      return new Response(renderMarkdown(content, useExtended), {
        headers: { "Content-Type": "text/html" },
      });
    }
  },
});
```

---

## 6. Bundle Analysis Use Cases

### When to Use Bundle Analysis

1. **Dependency Audits**: Identify large/unexpected dependencies
2. **Optimization Decisions**: Code splitting candidates (e.g., tokenizers)
3. **Build Monitoring**: Track bundle size over time
4. **LLM Context**: `--metafile-md` generates readable reports for AI assistants

### Recommended Workflow

```bash
# During development
bun run bundle:build    # After major changes
bun run bundle:analyze  # Review impact

# Before release
# 1. Run bundle analysis
# 2. Compare against baseline
# 3. Investigate any significant changes
```

---

## 7. Action Items

### Immediate

- [ ] Test Bun.markdown.render() with actual project documents
- [ ] Create SSR endpoint prototype in `scripts/lab/dev.ts`
- [ ] Benchmark performance (Bun SSR vs client-side marked.js)

### Short-term

- [ ] Implement hybrid rendering in `public/docs/index.html`
- [ ] Add feature detection (auto-detect extended features)
- [ ] Create build script integration for bundle analysis

### Long-term

- [ ] Consider code splitting for large dependencies (tokenizers)
- [ ] Evaluate `--metafile-md` for CI/CD reporting
- [ ] Document bundle size budgets

---

## 8. Appendix: Test Files Created

| File                                                    | Purpose          |
| ------------------------------------------------------- | ---------------- |
| `scripts/lab/bun-1-3-8-markdown-test/test-markdown.ts`  | Basic API test   |
| `scripts/lab/bun-1-3-8-markdown-test/test-detailed.ts`  | Feature testing  |
| `scripts/lab/bun-1-3-8-markdown-test/test-extended.ts`  | Extended options |
| `scripts/lab/bun-1-3-8-markdown-test/markdown-api.ts`   | Rendering module |
| `scripts/lab/bun-1-3-8-markdown-test/analyze-bundle.ts` | Bundle analysis  |

---

## Key Actions Checklist:

- [x] Investigate Bun.markdown API surface
- [x] Test basic markdown rendering
- [x] Verify extended options support
- [x] Analyze current docs architecture
- [x] Test bundle analysis capabilities
- [x] Create test files and documentation
- [ ] Implement SSR endpoint prototype (next step)
- [ ] Benchmark performance vs marked.js
- [ ] Evaluate integration into public/docs

---

## References

- [Bun Markdown Documentation](https://bun.sh/docs/runtime/bun-markdown)
- [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin)
- [marked.js](https://marked.js.org/)
- `playbooks/briefs-playbook.md` - Brief template reference
