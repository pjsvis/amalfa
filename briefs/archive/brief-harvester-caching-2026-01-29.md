---
date: 2026-01-29
tags: [feature, ai, caching, mcp]
agent: antigravity
environment: local
---

## Task: Implement "Harvester" Caching Layer

**Objective:** Implement a persistent Content-Addressable Store (CAS) caching layer for LangExtract to decouple expensive extraction from graph construction, enabling rapid iteration (squashing) without re-incurring AI costs.

- [ ] **Infrastructure:** Create `src/core/HarvesterCache.ts` (Simple CAS based on SHA-256).
- [ ] **Integration:** Update `LangExtractClient.ts` to check cache before calling OpenRouter.
- [ ] **CLI:** Add `amalfa harvest` command to run the extraction pipeline over the entire codebase.
- [ ] **Verification:** Verify that subsequent runs are 0-cost and instant.

## Key Actions Checklist:
- [ ] Create `.amalfa/cache/lang-extract/` directory structure.
- [ ] Implement `FileSystemCache` class with `get(hash)` and `set(hash, data)`.
- [ ] Modify `LangExtractClient.extract()` to:
    1. Hash input text.
    2. Check cache.
    3. Return cached if hit.
    4. Call provider if miss.
    5. Save to cache on success.
- [ ] Create `harvest` command that iterates all `.ts`/`.md` files (ignoring `node_modules`).

## Best Practices
- **Atomic Writes:** Ensure cache files are written atomically to prevent corruption.
- **Predictable Hashing:** Use stable content hashing (ignore varied whitespace if possible, or just raw content).
- **Transparency:** The CLI should report "Cache Hit" vs "Cache Miss" stats.
