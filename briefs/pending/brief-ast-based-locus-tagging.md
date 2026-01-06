# Brief: AST-Based Locus Tagging (RESONANCE)

## 1. Problem Statement
Regex-based tagging is destructive in complex Markdown. It can accidentally corrupt code blocks, math formulas, or nested metadata.

## 2. The AST Solution
We will use an Abstract Syntax Tree (AST) approach to "Wikify" and "Locus-Tag" our source documents.
* **Parser:** Use `remark-parse` or a similar AST generator.
* **Safety:** The injector must walk the tree and only operate on `text` or `paragraph` nodes, explicitly ignoring `code` and `inlineCode` nodes.
* **Determinism:** If a `` exists, the script must update the associated metadata (hash/tags) without moving the tag's position in the file.

## 3. Desired Outcome
A script `resonance-tagger.ts` that can be run as a pre-commit hook or part of the `ingest` pipeline to ensure every "Bento Box" is uniquely and safely identified.