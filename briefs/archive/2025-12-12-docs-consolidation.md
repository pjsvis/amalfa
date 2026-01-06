# Documentation Consolidation Plan

**Date:** 2025-12-12  
**Protocol:** CMP (Change Management Protocol)  
**Type:** File Reorganization  
**Scope:** Organize docs/ structure

---

## Objective

1. Move `public/docs/vectra-docs/` → `docs/vectra-docs/` (legacy reference)
2. Move `docs/*.md` → `docs/webdocs/` (website documentation)
3. Create clear separation: website docs vs legacy docs

## Current State

### What Exists
- `docs/` root: 16 .md files (mixed website content + project docs)
- `docs/architecture/`: Architecture subdirectory (keep as-is)
- `public/docs/vectra-docs/`: Legacy vector implementation (10 files)

### Purpose Clarification
- **docs/**: Contains website documentation (public-facing)
- **vectra-docs**: Legacy implementation for review/reference
- **webdocs**: New subfolder to organize website .md files

### Settings Check
```bash
$ rg "vectra-docs|public/docs" polyvis.settings.json
# Result: Exit code 1 (no matches) ✅
```

### Code References Found
```bash
$ rg -t ts -t js "public/docs"
scripts/transform/transform_cda.ts: const docsPath = join(process.cwd(), "public/docs");
# Need to verify if this is actively used
```

## Proposed Changes

### Operation 1: Create webdocs and move current docs
```bash
mkdir -p docs/webdocs
mv docs/*.md docs/webdocs/
# Keep docs/architecture/ as-is
```

### Operation 2: Move vectra-docs files into webdocs
```bash
mv public/docs/vectra-docs/* docs/webdocs/
rmdir public/docs/vectra-docs
rmdir public/docs  # if empty
```

### Operation 3: Update code reference (if needed)
```typescript
// scripts/transform/transform_cda.ts
// Change: "public/docs" → "docs/webdocs" (if actively used)
// OR remove if obsolete
```

## Resulting Structure

```
docs/
├── webdocs/              # All website documentation (26 files)
│   ├── project-structure.md
│   ├── data-architecture.md
│   ├── database-capabilities.md
│   ├── embeddings.ts         # from vectra-docs
│   ├── embeddings-README.md  # from vectra-docs
│   ├── ollama-client.ts      # from vectra-docs
│   └── ...
└── architecture/         # Architecture diagrams (existing)
    └── pipeline.md
```

## Verification Criteria

### Pre-Flight Checks
- [x] List files in `public/docs/vectra-docs/` - 10 files ✅
- [x] Code references: 1 file (`transform_cda.ts`) ✅
- [x] Settings references: None ✅
- [ ] Check if `transform_cda.ts` is actively used

### Post-Move Checks
- [ ] `ls public/docs/` - Should not exist
- [ ] `ls docs/webdocs/` - 16 .md files
- [ ] `ls docs/vectra-docs/` - 10 files
- [ ] `ls docs/architecture/` - Unchanged
- [ ] Code reference updated or verified obsolete

### Functional Verification
- [ ] Frontend loads without errors
- [ ] Website docs accessible if served

## Verification Criteria

### Pre-Flight Checks
- [ ] List files in `public/docs/vectra-docs/`
- [ ] `rg -t ts -t js "public/docs" scripts/ src/` - Code references
- [ ] `rg -t md "public/docs" docs/ debriefs/` - Doc links
- [ ] Verify no settings references

### Post-Move Checks
- [ ] `ls public/docs/` - Should not exist (or empty)
- [ ] `ls docs/vectra-docs/` - All files present
- [ ] `tree docs -L 2` - Shows vectra-docs in structure
- [ ] No broken links in markdown
- [ ] No broken code imports

### Functional Verification
- [ ] Frontend loads without errors
- [ ] No 404s if docs are served

## Rollback Plan

```bash
# Simple rollback
mv docs/vectra-docs public/docs/vectra-docs
```

## Files Affected

### Moved
- All files in `public/docs/vectra-docs/*` → `docs/vectra-docs/*`

### Potentially Updated
- Any `.md` files with links to `public/docs/vectra-docs/`
- Any code with imports from `public/docs/`

## Success Criteria

✅ `public/docs/` directory removed or empty
✅ `docs/vectra-docs/` exists with all files
✅ All references updated
✅ No broken links
✅ Frontend still loads

---

**Status:** PLANNED - Ready for pre-flight checks

## Verification Criteria

### Pre-Flight Checks
- [ ] `rg -t ts -t js "public/docs" scripts/ src/` - Find code references
- [ ] `rg -t md "public/docs" docs/ briefs/ debriefs/` - Find doc links
- [ ] `cat polyvis.settings.json | grep docs` - Verify no settings refs

### Post-Move Checks
- [ ] `ls public/docs/` - Should not exist or be empty
- [ ] `tree docs -L 2` - Should show organized structure with vectra-docs
- [ ] `ls -1 *.md | wc -l` - Should equal 4 (README, AGENTS, _CURRENT-*, _staging if kept)
- [ ] All doc links in markdown still work
- [ ] No broken imports in code

### Functional Verification
- [ ] Frontend loads (no broken imports)
- [ ] Documentation accessible in browser if served
- [ ] No 404s for moved docs

## Rollback Plan

```bash
# Full rollback
git restore --staged .
git restore .

# Selective rollback  
mv docs/vectra-docs public/docs/
git restore docs/
```

## Files to Modify

### Moved
- `public/docs/vectra-docs/*` → `docs/vectra-docs/*`
- 13 root .md files → `docs/{analysis,walkthroughs,reviews,prompts,archive}/`

### Updated (if references found)
- Any markdown files with `public/docs` links
- Any code files importing from `public/docs`

## Risk Assessment

**Low Risk:**
- No settings.json references
- Documentation is reference material (not in build pipeline)
- Can easily rollback with git

**Medium Risk:**
- Potential markdown links to break
- Need to search/replace

## Success Criteria

✅ All docs in single `docs/` directory
✅ No `public/docs/` directory exists
✅ Root contains only essential .md files (4)
✅ All documentation links work
✅ No broken code references
✅ Frontend still loads

---

**Status:** PLANNED - Ready for execution  
**Next:** Run pre-flight checks, then execute
