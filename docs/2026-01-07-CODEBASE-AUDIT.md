# AMALFA Codebase Audit
**Date:** 2026-01-07  
**Version:** 1.0.16 → 1.0.17

---

## Executive Summary

Total files analyzed: **293 files** (~64,000 lines of code + assets)

**Healthy core:**
- Core functionality: 38 files, ~4,900 lines (lean and focused)
- Test coverage: 50 test/verification files
- Good documentation: 104 doc files

**Cleanup needed:**
- 24 legacy files (old code/scripts)
- 8 `.beads/` files (purpose unclear)
- 2 deprecated system docs
- 10 files with unclear purpose

---

## Key Findings

### ✅ Strengths

1. **Lean Core** - Only 4,900 lines across MCP, database, ingestion, graph engine
2. **Well Documented** - 104 documentation files (playbooks, debriefs, guides)
3. **Test Coverage** - 50 test/verification scripts
4. **Organized** - Clear src/ structure by domain

### ⚠️ Issues

1. **Legacy Cruft** - 24 legacy files (1,733 lines) still in codebase
2. **Binary Assets** - Large PNG (17K lines) and PDF (6K lines) committed
3. **Unclear Files** - `.beads/` directory purpose unclear (8 files)
4. **HTML in Docs** - 2 HTML files should be markdown
5. **Large Files** - `src/cli.ts` at 705 lines (consider splitting)

---

## Detailed Breakdown

### Core Source Code (38 files, ~4,900 lines)

| Module | Files | Lines | Status |
|--------|-------|-------|--------|
| Core: Database | 11 | 1,694 | ✅ Good |
| Core: Ingestion | 4 | 960 | ✅ Good |
| Core: Utilities | 7 | 1,194 | ✅ Good |
| Core: Graph Engine | 11 | 1,009 | ✅ Good |
| Core: Other | 2 | 718 | ✅ Good |
| Core: MCP Server | 2 | 405 | ✅ Good |
| Core: Config | 2 | 168 | ✅ Good |
| Core: Daemon | 1 | 215 | ✅ Good |

**Assessment:** Core is lean and well-organized. Only `src/cli.ts` (705 lines) could benefit from splitting.

### Documentation (104 files, ~20K lines)

| Category | Files | Lines | Status |
|----------|-------|-------|--------|
| Docs: General | 65 | 14,881 | ⚠️  Review needed |
| Docs: Playbooks | 27 | 2,734 | ✅ Good |
| Docs: Debriefs | 4 | 479 | ✅ Good |
| Docs: Briefs | 3 | 413 | ✅ Good |
| Docs: README | 2 | 476 | ✅ Good |
| Docs: HTML | 2 | 944 | ⚠️  Convert to MD |
| Docs: Images | 2 | 17,824 | ⚠️  Large PNG |
| Docs: PDF | 2 | 6,727 | ⚠️  Link externally |
| Docs: Deprecation | 2 | 457 | ⚠️  Archive |
| Docs: Status | 1 | 94 | ✅ Good |

**Assessment:** Good playbook coverage. Binary assets should be external. Deprecation docs are stale.

### Scripts & Tests (108 files, ~10K lines)

| Category | Files | Lines | Status |
|----------|-------|-------|--------|
| Scripts: Other | 42 | 5,906 | ✅ Good |
| Test: Verification | 31 | 1,670 | ✅ Good |
| Scripts: Legacy | 22 | 1,733 | ⚠️  Archive |
| Test: Unit tests | 14 | 699 | ✅ Good |
| Scripts: Maintenance | 11 | 1,243 | ✅ Good |
| Test: Scripts | 5 | 733 | ✅ Good |

**Assessment:** Good test coverage. 22 legacy scripts should be archived or deleted.

---

## Large Files (>500 lines)

1. **docs/ARCHITECTURAL_OVERVIEW.png** - 17,702 lines (!)
   - **Issue:** Binary PNG checked into git
   - **Action:** Link to external hosted image or regenerate smaller

2. **docs/2310.08560v2.pdf** - 6,521 lines
   - **Issue:** Research paper checked into git
   - **Action:** Link to arXiv instead

3. **scripts/fixtures/conceptual-lexicon-ref-v1.79.json** - 1,736 lines
   - **Issue:** Large JSON fixture
   - **Action:** Evaluate if still needed

4. **docs/webdocs/compare-src-and-resonance-folders.md** - 1,668 lines
   - **Issue:** Very long comparison doc
   - **Action:** Archive or split

5. **docs/VISION-AGENT-LEARNING.md** - 1,243 lines
   - **Status:** ✅ Core vision doc, size is justified

6. **src/cli.ts** - 705 lines
   - **Issue:** Single file handles all CLI commands
   - **Action:** Consider splitting into command modules

---

## Files with Unclear Purpose

1. `.beads/` directory (8 files, 67 lines)
   - **Files:** config.yaml, daemon.lock, issues.jsonl, interactions.jsonl, etc.
   - **Question:** Is Beads still used? If not, delete directory
   - **Action:** Document purpose or remove

2. `.prettierrc` (empty file)
   - **Action:** Delete (using Biome, not Prettier)

3. `.biomeignore`
   - **Action:** Verify it's needed or use .gitignore

4. `bun.lock`
   - **Status:** ✅ Normal (Bun lockfile)

5. `.DS_Store`
   - **Action:** Add to .gitignore, delete from repo

6. `LICENSE`
   - **Status:** ✅ Normal (MIT license)

---

## Legacy & Deprecated Files

### Legacy Scripts (22 files, 1,733 lines)
**Location:** `scripts/legacy/`

Examples:
- `audit_vectors.ts`
- `transform_docs.ts`
- `config.ts`

**Action:** Archive entire `scripts/legacy/` directory or delete

### Deprecation Docs (2 files, 457 lines)

1. `docs/BENTO_BOXING_DEPRECATION.md`
2. `docs/LEGACY_DEPRECATION.md`

**Action:** 
- If deprecated code is removed, delete these docs
- If code still exists, finish the deprecation and then remove

### Old Files Not Modified in 30+ Days (13 files)

**Status:** May be stable or may be stale - review needed

**Action:** Manual review to determine if still relevant

---

## Recommendations

### Immediate Actions (Before v1.0.17)

1. ✅ **Add .DS_Store to .gitignore**
   ```bash
   echo ".DS_Store" >> .gitignore
   git rm -f .DS_Store
   ```

2. ✅ **Delete unused config**
   ```bash
   rm .prettierrc
   ```

3. ✅ **Remove large binary from git**
   ```bash
   # Move PNG to external hosting or docs/ (not tracked)
   git rm docs/ARCHITECTURAL_OVERVIEW.png
   git rm docs/2310.08560v2.pdf
   # Add links to README instead
   ```

4. ✅ **Document or delete .beads/**
   - If unused: `git rm -rf .beads/`
   - If used: Add `.beads/README.md` explaining purpose

### Short-term (v1.1)

5. **Archive legacy scripts**
   ```bash
   git rm -rf scripts/legacy/
   ```

6. **Convert HTML docs to Markdown**
   - `docs/Bun-SQLite.html`
   - `docs/graph-and-vector-database-playbook.html`

7. **Split large CLI file**
   - Extract commands from `src/cli.ts` into `src/cli/commands/`
   - Keep `src/cli.ts` as router only

### Medium-term (v1.2)

8. **Archive deprecation docs**
   - Once old code is fully removed, delete deprecation docs
   - Or move to `docs/archive/`

9. **Review webdocs/ directory**
   - Many large docs in `docs/webdocs/`
   - Determine what's active vs. reference

10. **Clean up fixtures**
    - Review `scripts/fixtures/` for large/unused files

---

## Metrics

### Codebase Health Score: **8/10** 🟢

**Strong Points:**
- ✅ Lean core (4,900 lines)
- ✅ Good test coverage
- ✅ Well documented
- ✅ Clear structure

**Improvements Needed:**
- ⚠️  Legacy cleanup (22 files)
- ⚠️  Binary assets in git
- ⚠️  Unclear .beads/ purpose
- ⚠️  Large CLI file

### LOC Distribution

```
Core Source:      4,900 lines (7.6%)
Documentation:   20,000 lines (31.0%)
Scripts & Tests: 10,000 lines (15.5%)
Assets/Other:    29,100 lines (45.9%)
─────────────────────────────────
Total:          ~64,000 lines
```

**Assessment:** Healthy distribution. Most code is docs/tests, not core logic.

---

## Conclusion

**AMALFA's codebase is in good shape.**

The core is lean (~5K lines), well-tested (50 test files), and properly documented (104 doc files). The main issues are:

1. **Legacy cruft** - 24 files that can be archived
2. **Binary assets** - PNG/PDF should be external
3. **Unclear files** - `.beads/` and a few config files

**Before publishing v1.0.17:**
- Remove .DS_Store
- Delete .prettierrc
- Document or remove .beads/

**For v1.1:**
- Archive scripts/legacy/
- Remove large binaries from git
- Split src/cli.ts

The codebase is **ready for production** with minor cleanup recommended.
