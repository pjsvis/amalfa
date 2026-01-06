# Commit Guidelines

**Purpose:** Define what should and should NOT be committed to the polyvis repository.

---

## ✅ What TO Commit

### Source Code
- `.ts`, `.js` - TypeScript/JavaScript source files
- `.html`, `.css` - HTML and stylesheets
- `.md` - Documentation (markdown)
- `.json` - Configuration files (package.json, tsconfig.json)
- `.yaml`, `.yml` - Configuration files

### Project Configuration
- `.gitignore`, `.gitattributes`
- `biome.json`, `tsconfig.json`
- `package.json` (but NOT `bun.lockb` - see exceptions)
- `.beads/` directory (Beads issue tracking)

### Documentation & Assets
- Small images (<500 KB) for documentation
- Architecture diagrams (optimized)
- Example data files (small samples, <100 KB)
- README files, playbooks, guides

### Scripts & Tools
- Build scripts (`scripts/*.ts`, `scripts/*.sh`)
- Development utilities
- Migration scripts (with documentation)

---

## ❌ What NOT to Commit

### Generated Artifacts

**Database Files:**
```
❌ *.db
❌ *.db-wal
❌ *.db-shm
❌ *.sqlite
❌ *.sqlite-wal
❌ *.sqlite-shm
```

**Why:** Database files are generated from source JSON. The JSON is the source of truth.

**What to do instead:**
- Commit source JSON files in `public/data/`
- Document database generation in README
- Use `scripts/build-db.ts` to regenerate

---

**Node Modules & Dependencies:**
```
❌ node_modules/
❌ bun.lockb (too large, changes frequently)
```

**Why:** Dependencies should be installed via `bun install`, not committed.

**What to do instead:**
- List dependencies in `package.json`
- Document installation steps in README
- Use `.nvmrc` or similar for version pinning

---

**Built/Bundled Files:**
```
❌ dist/*.bundle.js
❌ dist/*.min.js
❌ build/
❌ out/
```

**Why:** Built files are generated from source via build scripts.

**What to do instead:**
- Commit source files in `src/`
- Document build process in README
- Use CI/CD to build on deployment

---

**Cache & Temp Files:**
```
❌ .resonance/cache/
❌ local_cache/
❌ *.log
❌ .DS_Store
❌ *.tmp
```

**Why:** These are ephemeral, machine-specific files.

---

### Large Binary Files

**Research Papers:**
```
❌ *.pdf (research papers)
❌ Large images (>1 MB)
```

**Why:** Git is optimized for text, not large binaries. They bloat the repo.

**What to do instead:**
- Link to papers via URL (arXiv, DOI)
- Create `docs/REFERENCES.md` with links
- For critical PDFs, use external storage (GitHub releases, S3)

---

**Machine Learning Models:**
```
❌ *.gguf
❌ *.pt
❌ *.safetensors
❌ *.onnx (>50 MB)
```

**Why:** Models are huge and change frequently.

**What to do instead:**
- Document model download URLs
- Use model registry (Hugging Face, etc.)
- Store model metadata/config only

---

### Backups

**Database Backups:**
```
❌ backups/db/*.db
❌ *.backup
❌ *.bak
```

**Why:** Backups belong in backup systems, not version control.

**What to do instead:**
- Use external backup solutions
- Document backup/restore procedures
- Keep backups out of git entirely

---

### Test Artifacts

**Test Databases:**
```
❌ test-*.db
❌ canary-*.db
❌ *-test.sqlite
```

**Why:** Test artifacts should be created on-demand during testing.

**What to do instead:**
- Use `beforeEach()` to create fresh test DBs
- Clean up test artifacts in `afterEach()`
- Gitignore test patterns

---

## 🤔 Edge Cases

### Small Sample Databases

**✅ Acceptable IF:**
- < 1 MB in size
- Essential for examples/documentation
- Clearly named (e.g., `examples/sample-small.db`)
- Documented in README

**❌ Never acceptable:**
- Production database dumps
- Full-sized test databases
- Database backups

---

### Configuration Files with Secrets

**✅ Commit:**
```
config.example.yaml  # Template with placeholders
.env.example         # Example environment variables
```

**❌ Never commit:**
```
.env                 # Actual secrets
config.yaml          # With real API keys
```

**Pattern:** Commit examples/templates, never actual secrets.

---

### Generated Documentation

**It depends:**

- **Commit:** Hand-written docs, playbooks, guides
- **Don't commit:** Auto-generated API docs (can be regenerated)

**Rule of thumb:** If a human wrote it, commit it. If a script generated it, don't.

---

## 🔍 How to Check Before Committing

### 1. Review Your Staged Files

```bash
git status
git diff --cached
```

**Red flags:**
- Files in `dist/`, `build/`, or `out/`
- Files ending in `.db`, `.sqlite`, `.log`
- Files > 1 MB
- Files with "backup" or "test" in the name

---

### 2. Use Git Hooks (Pre-commit)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check for large files
git diff --cached --name-only | while read file; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file" | awk '{print $1}')
        if [ $size -gt 1048576 ]; then  # 1 MB
            echo "⚠️  Warning: $file is larger than 1 MB ($size bytes)"
            echo "   Consider adding to .gitignore or using external storage"
        fi
    fi
done

# Check for database files
if git diff --cached --name-only | grep -E '\.(db|sqlite)$'; then
    echo "❌ Error: Database files detected!"
    echo "   Database files should not be committed."
    exit 1
fi
```

---

### 3. Audit Repository Size

```bash
# Check current repo size
du -sh .git

# List largest files in history
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '/^blob/ {print $3, $4}' \
  | sort -rn \
  | head -20
```

If you see large files, they may need to be removed from history (see cleanup script).

---

## 🧹 Cleaning Up Mistakes

### If You Accidentally Committed Artifacts

**Before pushing:**

```bash
# Remove from staging
git reset HEAD path/to/artifact.db

# Remove from last commit
git rm --cached path/to/artifact.db
git commit --amend --no-edit
```

**After pushing:**

Use the cleanup script:

```bash
./scripts/cleanup-repo-artifacts.sh
```

**⚠️ Warning:** This rewrites history. Coordinate with your team first.

---

## 📋 Quick Checklist

Before committing, ask yourself:

- [ ] Is this a source file I wrote/edited?
- [ ] Can this file be regenerated from source?
- [ ] Is this file larger than 1 MB?
- [ ] Does this file contain secrets/credentials?
- [ ] Is this a database, cache, or log file?
- [ ] Would someone else need this to build the project?

**If you answered:**
- "Yes" to 1 or 6 → Commit it
- "Yes" to 2-5 → DON'T commit it

---

## 🎯 Summary Table

| File Type | Commit? | Rationale |
|-----------|---------|-----------|
| `.ts`, `.js` (source) | ✅ Yes | Source code |
| `.db`, `.sqlite` | ❌ No | Generated artifacts |
| `package.json` | ✅ Yes | Dependency manifest |
| `bun.lockb` | ❌ No | Too large, auto-generated |
| `dist/*.js` | ❌ No | Built artifacts |
| `.md` (docs) | ✅ Yes | Documentation |
| `.pdf` (papers) | ❌ No | Too large, use links |
| `*.log` | ❌ No | Ephemeral logs |
| `.env` | ❌ No | Contains secrets |
| `.env.example` | ✅ Yes | Template without secrets |
| Small images (<500 KB) | ✅ Yes | Documentation assets |
| Large images (>1 MB) | ❌ No | Use external hosting |
| Test fixtures (<100 KB) | ✅ Yes | Required for tests |
| Test databases | ❌ No | Generated during tests |
| Scripts (`.sh`, `.ts`) | ✅ Yes | Automation tools |
| Backups (`.bak`) | ❌ No | Use backup systems |

---

## 🔗 Related Documentation

- **Cleanup Script:** `scripts/cleanup-repo-artifacts.sh`
- **Gitignore:** `.gitignore` (see patterns)
- **Beads Playbooks:** `playbooks/beads-human-playbook.md` (for issues)
- **Development Workflow:** `playbooks/development-workflow-playbook.md`

---

## 💡 Philosophy

**Guiding principle:** *The repository should contain the minimum necessary to build and understand the project.*

**Corollary:** If it can be generated, downloaded, or derived from committed files, it should NOT be committed.

**Goal:** Keep the repository lean, fast to clone, and easy to navigate.

---

**Last updated:** 2026-01-05
