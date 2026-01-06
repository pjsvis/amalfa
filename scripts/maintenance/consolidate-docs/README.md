# Documentation Consolidation Script

## What This Script Does

### High-Level Goal
Organizes all technical documentation into a single `docs/webdocs/` directory, creating clear separation between project documentation and website content.

### Specific Operations

**1. Creates Structure**
```
docs/webdocs/  # New directory for all technical docs
```

**2. Moves Documentation Files**
- All `.md` files from `docs/` root → `docs/webdocs/`
  - Example: `docs/project-structure.md` → `docs/webdocs/project-structure.md`
  - Approximately 14-16 files
  
- All files from `public/docs/vectra-docs/` → `docs/webdocs/`
  - Legacy vector implementation documentation
  - Code examples (`.ts` files)
  - Reference guides
  - Approximately 10 files

**3. Cleanup**
- Removes empty `public/docs/vectra-docs/` directory
- Leaves `docs/architecture/` unchanged
- Leaves `public/docs/` main directory intact (website content)

### What It Does NOT Touch

❌ **Does NOT modify:**
- `public/docs/` (website playbooks, debriefs, guides)
- `docs/architecture/` (architecture diagrams)
- Any code references to docs
- Settings files

### Resulting Structure

**Before:**
```
docs/
├── project-structure.md
├── data-architecture.md
├── database-capabilities.md
├── ... (14 more .md files)
└── architecture/
    └── pipeline.md

public/docs/vectra-docs/
├── README.md
├── embeddings.ts
├── ollama-client.ts
└── ... (7 more files)
```

**After:**
```
docs/
├── README.md (explains structure)
├── webdocs/ (25-30 files total)
│   ├── project-structure.md
│   ├── data-architecture.md
│   ├── database-capabilities.md
│   ├── embeddings.ts (from vectra)
│   ├── ollama-client.ts (from vectra)
│   └── ... (all other docs)
└── architecture/
    └── pipeline.md (unchanged)

public/docs/
├── playbooks/
├── debriefs/
└── ... (unchanged - website content)
```

## Why This Matters

**Problem:** Documentation scattered across two locations
- `docs/` - Project documentation
- `public/docs/vectra-docs/` - Legacy reference

**Solution:** Single `docs/webdocs/` for all technical reference
- Clear separation: `docs/` = developer reference, `public/docs/` = website
- Easier to find documentation
- Consolidated legacy materials for review

## Usage

```bash
# Preview what will be moved
bun run scripts/maintenance/consolidate-docs/index.ts

# The script will show:
# - List of files from docs/
# - List of files from vectra-docs/
# - Resulting structure
# Then prompt for confirmation
```

## Verification After Running

```bash
# 1. Check structure
tree docs -L 2
# Expected: docs/webdocs/ with 25-30 files

# 2. Verify vectra-docs gone
ls public/docs/vectra-docs
# Expected: No such file or directory

# 3. Check no broken links
rg "public/docs/vectra" docs/ briefs/
# Expected: Only in this brief (if any)
```

## Post-Script Tasks

After running the script:

1. **Update code reference** (if needed):
   - `scripts/transform/transform_cda.ts` has `public/docs` reference
   - Check if actively used, update to `docs/webdocs` or remove

2. **Check for broken markdown links**:
   ```bash
   rg -t md "public/docs/vectra" docs/ debriefs/
   ```

3. **Update any documentation** that references old paths

## Safety

- **Preview first**: Shows all operations before executing
- **Interactive confirmation**: Must type 'y' to proceed
- **Rollback**: Can simply `git restore docs/ public/docs/`
- **No data loss**: Only moves files, doesn't delete

## Approval Needed

**Ready for execution?**
- [ ] Script logic reviewed
- [ ] Understands what will be moved
- [ ] Comfortable with resulting structure
- [ ] Ready to handle post-script updates

**If approved, run:**
```bash
bun run scripts/maintenance/consolidate-docs/index.ts
```
