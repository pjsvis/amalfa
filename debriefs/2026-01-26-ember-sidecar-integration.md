---
date: 2026-01-26
tags: [feature, sidecar, python, mcp, reranker, cleanup]
agent: gemini
environment: local
---

# Debrief: Ember Sidecar & Reranking Integration

## Overview
Successfully hardened the Ember enrichment pipeline, integrated the Python-based LangExtract sidecar, and finalized the BGE-M3 reranker integration. Also performed significant housekeeping by standardizing service naming ("watcher") and cleaning up corrupted metadata in the documentation.

## Accomplishments

### 1. LangExtract Sidecar Integration (Feature)
- **Robust Client:** Implemented `src/services/LangExtractClient.ts` to bridge Node.js and Python via MCP/Stdio. Features availability checks (`uv`), Zod validation, and structured Pino logging.
- **Ember Pipeline:** Wired the client into `EmberService` and `EmberAnalyzer`. Files >200 chars are now sent to the sidecar for entity extraction (if available).
- **Graceful Failure:** The system handles API rate limits (HTTP 429) gracefully, logging errors without crashing the main process.

### 2. Reranker Finalization (Feature)
- **CLI Integration:** Added `--rerank` flag to `amalfa search`.
- **End-to-End Logic:** Integrated `ContentHydrator` and `rerankDocuments` (BGE-M3 cross-encoder) to re-order search results based on semantic relevance.
- **Verification:** Verified searching for "database" yields improved ranking with the `--rerank` flag.

### 3. Tag Hygiene & Corruption Fix (Bugfix)
- **Root Cause Analysis:** Identified that "garbage tags" (single characters like `r`, `e`, `f`) were caused by iterating over a string as if it were an array in `EmberAnalyzer`.
- **The Fix:** Patched `analyzer.ts` to enforce array types and strictly sanitize tags (removing non-alphanumeric chars, stripping dashes).
- **Data Remediation:** Discovered that some Markdown files (`newbie-onboarding.md`, `embeddings-playbook.md`) were *already* corrupted. Manually cleaned these files.
- **Filter Logic:** Added logic to ignore single-character tags and numeric-only tags to prevent future pollution.

### 4. Housekeeping (Refactor)
- **Naming Standardization:** Renamed `amalfa daemon` to `amalfa watcher` to align CLI with internal service names. Added deprecation warning for the old command.
- **Configuration:** Created `amalfa.config.example.json` to provide a reference for new users.
- **Git Hygiene:** Added `*.ember.json` to `.gitignore` to prevent committing ephemeral sidecars.

## Problems & Resolutions

### 1. "Garbage In, Garbage Out"
- **Issue:** Even after fixing the code, garbage tags persisted in sidecar output.
- **Diagnosis:** The *database itself* contained corrupted tags from previous bad runs, and the analyzer was reading them back from neighbors.
- **Resolution:** Manually cleaned the source Markdown files. Recommended running `amalfa init` to flush the database with clean data.

### 2. API Rate Limits
- **Issue:** The Gemini Flash model (Free Tier) hits rate limits quickly during a full `ember scan`.
- **Resolution:** The system logs 429 errors and continues. For production, we will need to implement a queue/backoff system or use a paid key. For now, it is acceptable for a "best effort" enrichment service.

### 3. Duplicate Client Implementation
- **Issue:** A duplicate `LangExtractClient` existed in `src/lib/sidecar`.
- **Resolution:** Moved the robust implementation from `src/lib` to `src/services` and deleted the `src/lib` version to consolidate logic.

## Lessons Learned

1.  **Trust No Data:** Always sanitize inputs, even from your own database. The tag corruption persisted because we assumed `node.meta.tags` was valid.
2.  **Sidecars are Powerful:** The MCP/Stdio bridge pattern is extremely effective for mixing languages (TS/Python) locally.
3.  **Ephemeral Artifacts:** Sidecar files (`*.ember.json`) should be treated as temp files and ignored by git. They are proposals, not truth.

## Next Steps
1.  **Squash:** Execute the `amalfa ember squash` task to merge valid sidecars into markdown.
2.  **Historian:** Begin Phase 7 work on the Historian protocol.
