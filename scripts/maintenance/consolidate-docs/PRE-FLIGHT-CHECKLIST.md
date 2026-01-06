# Pre-Execution Checklist: Documentation Consolidation

## Code/Settings Updates Required

### ✅ Settings Files
**Status:** NO CHANGES NEEDED

```bash
$ rg "docs|vectra" polyvis.settings.json
# Result: No matches ✅
```

Settings file does not reference documentation paths.

---

### ⚠️ Code References (1 file needs updating)

**File:** `scripts/transform/transform_cda.ts`  
**Line:** 262  
**Current Code:**
```typescript
const docsPath = join(process.cwd(), "public/docs");
```

**Issue:** This script uses semantic search over `public/docs/` to find concept relationships.

**Decision Required:**

**Option A:** Update to new location
```typescript
const docsPath = join(process.cwd(), "docs/webdocs");
```

**Option B:** Script appears experimental/unused - verify with:
```bash
git log --all --oneline -- scripts/transform/transform_cda.ts
# Check: Is this actively used?

rg "transform_cda" scripts/ package.json
# Check: Is it referenced elsewhere?
```

**Recommendation:** Check git history first. If unused, leave as-is or remove reference.

---

### ⚠️ Markdown Link References (3 files)

**Files with links to `docs/*.md`:**

1. `README.md` (root) - 1 reference
2. `public/docs/README.md` - 1 reference (duplicated from root)
3. Other duplicates

**Current Links:**
```markdown
[Project Structure](docs/project-structure.md)
```

**Required Update:**
```markdown
[Project Structure](docs/webdocs/project-structure.md)
```

**Command to find all:**
```bash
rg -t md "\(docs/[^w][^/]*\.md\)" --no-filename
```

---

## Update Script

Create a post-consolidation update script:

```typescript
// scripts/maintenance/consolidate-docs/update-references.ts

// 1. Update markdown links
const files = ["README.md", "public/docs/README.md"];
for (const file of files) {
  let content = await Bun.file(file).text();
  
  // Replace docs/*.md → docs/webdocs/*.md
  content = content.replace(
    /\(docs\/([^w][^\/]*\.md)\)/g,
    "(docs/webdocs/$1)"
  );
  
  await Bun.write(file, content);
}

// 2. Optionally update transform_cda.ts if needed
// (depends on decision from Option A vs B above)
```

---

## Execution Order

**CORRECT SEQUENCE:**

1. ✅ Run consolidation script
   ```bash
   bun run scripts/maintenance/consolidate-docs/index.ts
   ```

2. ✅ Update markdown links
   ```bash
   # Manual or scripted:
   sed -i '' 's|(docs/\([^w][^/]*\.md\))|(docs/webdocs/\1)|g' README.md
   ```

3. ⚠️ Decide on `transform_cda.ts`
   - Check if used
   - Update or remove reference

4. ✅ Verify
   ```bash
   # Check structure
   tree docs -L 2
   
   # Test links
   rg -t md "\(docs/[^w]" README.md
   # Should find no matches
   ```

---

## Verification Commands

### Pre-Execution
```bash
# 1. No settings references (verified ✅)
rg "docs|vectra" polyvis.settings.json

# 2. Find code references
rg -t ts -t js "public/docs" scripts/ src/

# 3. Find markdown links
rg -t md "\(docs/[^w][^/]*\.md\)"
```

### Post-Execution
```bash
# 1. Structure correct
tree docs -L 2
# Expected: docs/webdocs/ with 25-30 files

# 2. Public vectra gone
ls public/docs/vectra-docs
# Expected: No such file or directory

# 3. Links updated
rg -t md "\(docs/[^w][^/]*\.md\)" README.md
# Expected: No matches (or only docs/webdocs/)

# 4. No broken references
rg "public/docs/vectra" docs/ briefs/
# Expected: Only in brief documentation
```

---

## Summary: What Needs Updating

| Item | Status | Action |
|------|--------|--------|
| **Settings** | ✅ Clean | No changes needed |
| **Code** | ⚠️ 1 file | Check `transform_cda.ts` usage, update or remove |
| **Markdown Links** | ⚠️ 3 files | Update `README.md` and duplicates |
| **Frontend** | ✅ Clean | No imports from docs/ |

**Total Updates Required:** 1-4 files (depending on transform_cda decision)

---

## Ready to Execute?

**Pre-flight complete:**
- [x] Settings: No changes  
- [x] Code: 1 file identified  
- [x] Links: 3 files identified  
- [x] Sequence: Documented  
- [x] Verification: Commands ready  

**Proceed with consolidation?**
