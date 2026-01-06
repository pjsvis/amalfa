---
date: 2025-12-12
tags: [prototype, bento-box, ast, marked]
---

> ⚠️ **DEPRECATED (2026-01-05):** This work was superseded. The Bento Boxing system was never integrated into the main vector search pipeline and has been removed. Whole-document embeddings achieve 85% search accuracy without chunking. See `docs/BENTO_BOXING_DEPRECATION.md` for details.

---

# Debrief: Bento Boxing Prototype (Super-Grep)

## Accomplishments

- **Proven "Super-Grep" Concept:** Validated that we can use `marked` (AST Parser) as a "Surgeon" to identifying semantic boundaries (H2 headers) in Markdown without regex fragility.
- **Implemented "Boxer" Script:** Created `scripts/lab/bento-boxer.ts` which reads a raw Markdown file and injects `<!-- bento-id: ... -->` annotations.
- **Implemented "Reader" Script:** Created `scripts/lab/bento-reader.ts` which successfully extracts these chunks back out, proving the "Round Trip" capability.
- **Preserved Integrity:** Verified that code blocks and nested headers (H3) are not split or mangled during the boxing process.

## Problems

- **`ast-grep` (sg) Limitations:** The `sg` CLI tool did not support Markdown out-of-the-box in this environment. We pivoted to `marked.lexer` which proved superior for this specific task (AST analysis of Markdown).
- **`mgrep` Quota:** Cloud dependency failures reinforced the need for our "Zero Magic" local-first approach.

## Lessons Learned

- **AST > Regex:** Using `marked.lexer` provided a safe, structural way to manipulate the document compared to line-by-line regex.
- **Annotation as State:** Injecting metadata directly into the source file (via HTML comments) is a viable strategy for "stateful documentation" that doesn't break rendering.

## Files Modified

- Created `scripts/lab/bento-boxer.ts`
- Created `scripts/lab/bento-reader.ts`
- Created `scratchpads/dummy-debrief.md` (Artifact)
- Created `scratchpads/dummy-debrief-boxed.md` (Artifact)
