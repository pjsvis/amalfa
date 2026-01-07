# Repository Cleanup Summary

**Date:** 2026-01-05  
**Branch:** alpine-refactor  
**Issue:** Repository was tracking 966 files with .git size of 193 MB

---

## Problem Identified

The polyvis repository was accumulating artifacts that should not be versioned:

### Artifacts Found (40+ MB total)

1. **Database Files** (~20 MB)
   - `_misc/bento_ledger.sqlite`
   - `bento_ledger.sqlite`, `.sqlite-wal`, `.sqlite-shm`
   - `canary-persistence.db`
   - `test-graph-integrity.db-wal`
   - `public/resonance.db.pre-hollow-node` (5.9 MB)

2. **Database Backups** (~9 MB)
   - `backups/db/resonance.20251214140633.db` (5.9 MB)
   - `backups/db/benchmarks/resonance.db.pre-benchmark-20251217-184046` (8.5 MB)
   - `backups/db/benchmarks/resonance.db.corrupted-20251217-201947`

3. **Large PDFs** (~11 MB)
   - `experiments/enlightenment/representational-engineering.pdf` (10 MB)
   - `docs/2310.08560v2.pdf` (648 KB)

4. **Built Bundles**
   - `experiments/data-star-dashboard/dist/datastar.bundle.js` (80 KB)

---

## Actions Taken

### 1. Updated .gitignore

Added comprehensive patterns to prevent future commits:

```gitignore
# Database Files (Generated Artifacts - Never Commit)
*.db
*.db-wal
*.db-shm
*.sqlite
*.sqlite-wal
*.sqlite-shm

# Database Backups
backups/db/

# Built/Bundled JavaScript
**/dist/*.bundle.js
**/dist/*.min.js
experiments/**/dist/

# Test Artifacts
test-*.db
test-*.db-wal
canary-*.db

# Large Research Papers
*.pdf
!docs/architecture-diagrams/*.pdf
```

**Commit:** `0c3015e`

### 2. Created Documentation

**docs/COMMIT_GUIDELINES.md**
- Comprehensive guide on what to/not to commit
- Quick reference checklist
- Edge cases and troubleshooting
- Philosophy: "Repository should contain minimum necessary to build and understand"

**Key principles:**
- ✅ Source code, configs, documentation, small assets
- ❌ Generated artifacts, large binaries, backups, secrets

**Commit:** `0c3015e`

### 3. Created Cleanup Script

**scripts/cleanup-repo-artifacts.sh**
- Interactive script to remove artifacts from git history
- Safety checks (prevents running on main branch)
- Creates backup branch before cleanup
- Uses git-filter-repo (preferred) or filter-branch (fallback)
- Aggressive garbage collection

**Usage:**
```bash
./scripts/cleanup-repo-artifacts.sh
```

**Commit:** `0c3015e`

### 4. Removed Artifacts from Index

Removed 14 files from git tracking (not history):

```bash
git rm --cached -r backups/db/
git rm --cached _misc/bento_ledger.sqlite
git rm --cached bento_ledger.sqlite*
git rm --cached canary-persistence.db
git rm --cached test-graph-integrity.db-wal
git rm --cached public/resonance.db.pre-hollow-node
git rm --cached experiments/enlightenment/representational-engineering.pdf
git rm --cached docs/2310.08560v2.pdf
git rm --cached experiments/data-star-dashboard/dist/datastar.bundle.js
```

**Result:** 966 → 954 tracked files

**Commit:** `0c3015e`

---

## Current State

### Metrics (Post-Cleanup)

- **Files tracked:** 954 (down from 966)
- **Repository size:** 193 MB (unchanged - files remain in history)
- **Untracked files:** Database files now properly ignored

### Why .git Size Unchanged?

The removed files are still in git history. To fully reclaim space, you need to:

1. Run the cleanup script: `./scripts/cleanup-repo-artifacts.sh`
2. Force push to rewrite remote history
3. Coordinate with team (they'll need to re-clone or reset)

**⚠️ Important:** History rewriting is disruptive. Only do this if:
- Working on a feature branch (✅ we're on alpine-refactor)
- Team is coordinated
- No open PRs depend on current history

---

## Benefits Achieved

### Immediate Benefits

1. **Prevention:** `.gitignore` now prevents committing artifacts
2. **Documentation:** Clear guidelines on what to commit
3. **Tools:** Script ready for full history cleanup
4. **Current commits:** New work won't add artifacts

### Potential Future Benefits (After History Cleanup)

1. **Faster operations:** Clone, fetch, push will be quicker
2. **Smaller repo:** ~40-50 MB reduction estimated
3. **Cleaner history:** Only source code and docs versioned

---

## Next Steps (Optional)

### Full History Cleanup

If you want to reclaim the 40+ MB from history:

```bash
# 1. Ensure you're on alpine-refactor
git checkout alpine-refactor

# 2. Run the cleanup script
./scripts/cleanup-repo-artifacts.sh

# 3. Force push (after verification)
git push --force origin alpine-refactor

# 4. Notify team members to reset their branches
```

**Team coordination required!**

### Maintenance

**Going forward:**

1. Review `.gitignore` patterns regularly
2. Check commit size before pushing (see COMMIT_GUIDELINES.md)
3. Run `git ls-files | grep -E '\.(db|sqlite|pdf)$'` periodically
4. Educate contributors about artifact policies

---

## Related Files

- **Guidelines:** `docs/COMMIT_GUIDELINES.md`
- **Cleanup script:** `scripts/cleanup-repo-artifacts.sh`
- **Gitignore:** `.gitignore`
- **Beads playbooks:** `playbooks/beads-{agent,human}-playbook.md`

---

## Philosophy

**Core principle:** *Git is for source code, not generated artifacts.*

**Rationale:**
- Database files are generated from JSON (the source of truth)
- Built bundles are generated from TypeScript source
- Research papers should be linked, not embedded
- Backups belong in backup systems, not version control

**Goal:** Keep the repository lean, fast, and comprehensible.

---

## Before/After Comparison

### Before

```
Files tracked:    966
.git size:        193 MB
Issues:           Databases, PDFs, backups committed
Prevention:       Weak .gitignore patterns
Documentation:    None
```

### After (Current)

```
Files tracked:    954
.git size:        193 MB (history unchanged)
Issues:           Future commits prevented
Prevention:       Comprehensive .gitignore
Documentation:    COMMIT_GUIDELINES.md
Tools:            cleanup-repo-artifacts.sh
```

### After (If History Cleaned)

```
Files tracked:    954
.git size:        ~140 MB (estimated)
Issues:           Resolved
Prevention:       Comprehensive .gitignore
Documentation:    COMMIT_GUIDELINES.md
Tools:            cleanup-repo-artifacts.sh
```

---

## Commits

- `0c3015e` - Remove artifacts and add commit guidelines
- `aee1d2a` - Add Beads playbooks (includes initial .resonance/cache cleanup)

---

**Conclusion:** Immediate improvements achieved. Full history cleanup optional but recommended for long-term repository health.
