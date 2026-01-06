---
date: 2025-12-12
tags: [bento-box, batch-processing, automation, marked]
---

> ⚠️ **DEPRECATED (2026-01-05):** This work was superseded. The Bento Boxing system was never integrated into the main vector search pipeline and has been removed. Whole-document embeddings achieve 85% search accuracy without chunking. See `docs/BENTO_BOXING_DEPRECATION.md` for details.

---

# Debrief: Bento Processor (Batch Mode)

## Accomplishments

- **Scaled the Prototype:** Converted the single-file `bento-boxer.ts` into a directory-walking `bento-processor.ts`.
- **Processed 48 Files:** Successfully annotated the entire `scratchpads/debriefs/` corpus (48 files) in sub-second time.
- **Generated 294 Bento Boxes:** Created ~300 addressable semantic units from our documentation.
- **Verified Fidelity:** Manual inspection of complex files (code blocks, lists, front matter) confirmed that the original content remains intact and renderable.

## Lessons Learned

- **Front Matter as Headers:** Markdown's "Setext" header syntax (`Title\n---`) conflicts with YAML front matter (`key: val\n---`). `marked` (and many parsers) will interpret the key-value pairs as an H2 header if the opening `---` is missing or interpreted as a separate HR.
    -   *Impact:* Front matter often becomes its own "Bento Box". This is acceptable for now but suggests we might want to parse/strip front matter *before* lexing if we want to treat it purely as metadata.
- **Idempotency:** The current script blindly appends annotations. Running it twice would duplicate them. Future versions need an "Idempotency Check" (e.g., `if (src.includes(bentoId)) continue`) or a "Clean Build" strategy (stripping comments before processing).

## Files Created
- `scripts/lab/bento-processor.ts`
- `scratchpads/debriefs/*.md` (Annotated)

