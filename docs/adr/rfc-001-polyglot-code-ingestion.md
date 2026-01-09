---
title: "RFC: Polyglot Code Ingestion (The Harvester Pattern)"
date: "2026-01-09"
status: "proposed"
target_phase: "Phase 6"
tags: ["rfc", "ingestion", "typescript", "python", "architecture"]
---

# RFC: Polyglot Code Ingestion

## 1. Context
Currently, AMALFA only ingests Markdown files. This creates a "Knowledge Gap": the agent understands the *documentation* of the code, but not the *structure* of the code itself. It cannot traverse dependency graphs or answer "How is X used?" questions without lucky text matches in the docs.

## 2. The Solution: "Hollow Node" Code Ingestion
We will ingest code files (`.ts`, `.py`, etc.) but strictly adhere to the **Hollow Node** pattern to maintain database efficiency.

### Core Principles
1.  **Metadata Only:** We do NOT store the full code content in `ResonanceDB`.
2.  **Structural Edges:** We parse imports to create `DEPENDS_ON` edges between files.
3.  **Semantic Vectors:** We only embed **Top-Level Documentation** (JSDoc, Docstrings) into the vector space. The code body is ignored for embeddings to prevent vector noise.
4.  **Language Agnostic:** The architecture must seamlessly support TS, Python, and future languages.

## 3. Architecture: The Harvester Pattern

We introduce a plugin-based system where `AmalfaIngestor` delegates processing to specialized `Harvester` classes based on file extension.

### A. The Interface
```typescript
interface CodeHarvester {
    /** Can this harvester handle this file? */
    supports(extension: string): boolean;

    /** Extract edges (imports/dependencies) */
    harvestEdges(content: string): string[];

    /** Extract vectorizable content (comments/docstrings only) */
    harvestConcept(content: string): string;
}
```

### B. The Plugins

#### 1. TypeScriptHarvester (`.ts`, `.tsx`)
*   **Strategy:** Regex-based parsing (Lightweight, no AST overhead).
*   **Imports:** Captures `import ... from "X"` and `export ... from "Y"`.
*   **Concepts:** Captures top-level `/** ... */` JSDoc blocks.

#### 2. PythonHarvester (`.py`)
*   **Strategy:** Regex-based parsing.
*   **Imports:** Captures `import X`, `from X import Y`.
*   **Concepts:** Captures module-level docstrings (`""" ... """` at file start).

## 4. Implementation Plan

### Step 1: Refactor Ingestor
Move the current Markdown logic into a default `MarkdownHarvester`.

### Step 2: Implement Harvester Registry
Create a registry in `src/core/ingestion/HarvesterRegistry.ts` that selects the correct strategy at runtime.

### Step 3: Implement TS/Python Harvesters
Build the specific regex logic for our two primary languages.

### Step 4: Update Graph Schema
Ensure `DEPENDS_ON` is a recognized edge type in `GraphEngine` for traversal logic.

## 5. Benefits
*   **Traversability:** The agent can navigate from a High-Level Concept (Doc) -> Implementation File (Node) -> Dependency (Node).
*   **Efficiency:** No "Code Dumping" into the DB. The DB remains small (~MBs), not GBs.
*   **Simplicity:** No Tree-sitter or complex C++ bindings required. Pure JS implementation.

## 6. Risks & Mitigation
*   **Risk:** Regex parsing is brittle (can miss complex multi-line imports).
*   **Mitigation:** Accept 80% accuracy for now. If precision becomes critical, we can swap the `Harvester` implementation for a heavier AST parser later without changing the architecture.
