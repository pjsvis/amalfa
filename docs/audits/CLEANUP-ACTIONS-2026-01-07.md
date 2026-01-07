# AMALFA Codebase Cleanup - Actions Summary
**Date:** 2026-01-07  
**Approach:** Kent Beck's Tidy First

---

## ✅ COMPLETED

### Immediate Cleanup
- ✅ Removed `.prettierrc` (using Biome, not Prettier)
- ✅ Removed `.beads/` directory (Beads not used in AMALFA)
- ✅ Moved `.amalfa-pre-flight.log` to `.amalfa/logs/pre-flight.log`
- ✅ Archived `BENTO_BOXING_DEPRECATION.md` to `docs/archive/`
- ✅ Archived `LEGACY_DEPRECATION.md` to `docs/archive/`
- ✅ Archived `SESSION-2026-01-06-METADATA-PATTERNS.md` to `docs/archive/`
- ✅ Deleted `docs/Bun-SQLite.html` (Project Resonance research, not AMALFA)
- ✅ Deleted `docs/keyboard-shortcuts.md` (PolyVis web UI, wrong project)
- ✅ Deleted `docs/graph-and-vector-database-playbook.html` (HTML duplicate)

---

## 🔍 NEEDS REVIEW

### Priority 1: docs/webdocs/ Directory
**Problem:** README.md says "# Polyvis Documentation Directory" - entire directory may be PolyVis leftover

**Files to review (23 files):**
```
ARCHITECTURE.md
Bun-SQLite-and-Local-Embeddings.md
Modern CSS Playbook for Developers.md
browserAllowList.txt.md
compare-src-and-resonance-folders.md (1,668 lines!)
data-architecture.md
database-capabilities.md
domain-vocabulary-draft.md
embeddings-README.md
embeddings.ts (why .ts in docs?)
gemini-cli-guide.md
hybrid-query-protocols.md
IMPLEMENTATION.md
ingestion-stats-integration.md
knowledge-engineering-taxonomy.md
project-standards.md
project-structure.md
proposal.md
README.md
report-graph-first-strategy.md
tooling-showcase.md
topic-modelling-README.md
validation-strategy.md
vector-commands.ts
```

**Action needed:**
1. Read each file
2. Classify as:
   - **AMALFA-relevant** → Extract, move to proper location
   - **PolyVis-specific** → Delete
   - **Generic/useful** → Archive as reference
3. Delete `webdocs/` directory once cleared

**Candidates for keeping:**
- `database-capabilities.md` - If AMALFA-specific
- `embeddings-README.md` - If AMALFA-specific
- `hybrid-query-protocols.md` - If AMALFA-specific
- `ingestion-stats-integration.md` - Recent topic?

### Priority 2: Binary Assets (5.3MB in git)
**Large files:**
- `ARCHITECTURAL_OVERVIEW.png` (4.6MB) - Useful diagram but HUGE
- `2310.08560v2.pdf` (648KB) - Research paper, link to arXiv instead?

**Options:**
1. Convert PNG to compressed format or regenerate smaller
2. Move to external hosting (GitHub Wiki, CDN)
3. Keep in Git LFS
4. Link to external sources instead

**Keep as-is (small):**
- `workflow.png` (44KB) ✅
- `nasa-10-rules-swdp.pdf` (24KB) ✅

### Priority 3: Unclear Files
**docs/ root:**
- `john-kaye-flux-prompt.md` - Personal note or reference?
- `vision-helper.md` - Duplicate of VISION-AGENT-LEARNING.md?
- `compare-src-and-resonance-folders.md` (1,668 lines) - Still accurate?
- `docs/strategy/css-architecture.md` - CSS for what? AMALFA has no web UI

**Root:**
- `.biomeignore` - Is this used? Or is .gitignore sufficient?

### Priority 4: scripts/legacy/ Directory
**Status:** Already organized with README.md explaining purpose

**Contents:**
- 18 .ts files from polyvis.settings.json deprecation
- mistral/ subdirectory (experimental)
- 1 Python script (pre-Bun)

**Decision needed:**
- Keep as-is (documented legacy)?
- Delete entirely (already deprecated)?
- Archive to separate repo?

**Recommendation:** Keep for now - well documented, not hurting anything

---

## 📊 STATISTICS

### Cleaned So Far
- **Removed:** 12 items (.beads/, .prettierrc, 3 HTML files, 1 markdown, moved 4 docs to archive)
- **Saved:** ~5-10MB from .beads/ deletion
- **Status:** Repository cleaner, less confusion

### Remaining Work
- **23 files** in docs/webdocs/ to review
- **4-5 files** in docs/ to check
- **5.3MB** binary assets to optimize
- **scripts/legacy/** (optional decision)

### Impact
- **Before:** 293 files, unclear structure, mixed PolyVis/AMALFA content
- **After cleanup:** Focused AMALFA codebase, clear purpose for each file
- **Next:** Ready for v1.0.17 publication

---

## 🎯 RECOMMENDED NEXT STEPS

### Option A: Quick Path (ready to publish)
1. Review and classify docs/webdocs/ (30 min)
2. Delete PolyVis-specific content
3. Extract any AMALFA-relevant content
4. Commit and publish v1.0.17

### Option B: Thorough Path (optimal)
1. Same as Option A
2. Optimize/externalize large binary assets
3. Review unclear files (john-kaye-flux-prompt.md, etc.)
4. Decide on scripts/legacy/
5. Commit and publish v1.0.17

### Option C: Ship Now, Clean Later
1. Commit current cleanup
2. Publish v1.0.17
3. Create GitHub issue for remaining cleanup
4. Address in v1.0.18 or v1.1

---

## 📝 COMMIT MESSAGE

```
chore: Tidy First cleanup - remove PolyVis artifacts and organize docs

Removed:
- .prettierrc (using Biome)
- .beads/ directory (not used in AMALFA)
- Bun-SQLite.html (Project Resonance research)
- keyboard-shortcuts.md (PolyVis web UI)
- graph-and-vector-database-playbook.html (HTML duplicate)

Archived:
- BENTO_BOXING_DEPRECATION.md
- LEGACY_DEPRECATION.md
- SESSION-2026-01-06-METADATA-PATTERNS.md

Organized:
- Moved .amalfa-pre-flight.log to .amalfa/logs/

Part of Kent Beck "Tidy First" cleanup before v1.0.17 publication.
See docs/CLEANUP-ACTIONS-2026-01-07.md for remaining work.
```

---

## 🔗 REFERENCES

- Classification: `docs/DOCS-CLASSIFICATION.md`
- Audit: `docs/2026-01-07-CODEBASE-AUDIT.md`
- Legacy deprecation: `docs/archive/LEGACY_DEPRECATION.md`
