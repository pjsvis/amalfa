---
date: 2025-12-11
tags: [tagging, safety, bento, markdown-masker, ollama]
---

## Debrief: Tagging & Safety Integration

## Accomplishments

- **Safety Verification:** Validated `MarkdownMasker` using a custom fixture (`tests/fixtures/safety_test.md`). The test confirmed that large code blocks (> 1 Seaman Constant) are treated as "Atomic Boulders" and are not split, even when surrounded by gravel filler. This protects code integrity during Bento Boxing.
- **Tagging Integration:** Updated `src/index.ts` (CLI) to support the `--tag` flag. This invokes the `TagEngine`, which connects to a local Ollama instance (`llama3.2`) to extract semantic entities and concepts from each box.
- **Clean Output:** Generated tags are injected as `<!-- tags: ... -->` comments in the output Markdown. This allows the Ingestion Pipeline (`EdgeWeaver`) to pick them up without polluting the visual rendering of the document.
- **Graceful degradation:** `TagEngine` catches connection errors (e.g., Ollama offline) and warns the user instead of crashing the pipeline.

## Problems

- **Ollama Dependency:** Use of `TagEngine` requires a local LLM running. While optional, this dependency is external. The current implementation defaults to `http://localhost:11434`.
- **Token Counting nuances:** Discovered that masked content (e.g. `__NFZ_...__`) counts as a single token. This means massive code blocks are never split, which is the desired behavior ("Atomic Boulders"), but it implies that a single box could theoretically exceed the token limit if the code block itself is huge. This is acceptable per the brief.

## Lessons Learned

- **Fixtures are critical for logic verification:** The `safety_test.md` fixture provided immediate visual proof that the `FractureLogic` respects the masking.
- **Comment-based metadata:** Storing metadata (Locus IDs, Tags) in HTML comments is a robust way to persist state in Markdown without affecting the rendered output or requiring complex sidecar files.
