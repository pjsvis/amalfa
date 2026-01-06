# Root Documentation Organizer

## Purpose

Cleans up root directory by moving documentation files to proper subdirectories in `docs/`.

## Why This Matters

**Problem:** Documentation scattered in root creates clutter and makes it hard to find files.

**Solution:** Systematic organization by document type:
- `docs/analysis/` - Analysis reports (CDA, ORPHAN, PERSONA)
- `docs/walkthroughs/` - Step-by-step guides
- `docs/reviews/` - Summary and review documents
- `docs/prompts/` - AI prompts and templates
- `docs/archive/` - Completed tasks and staging files

**Files Kept in Root:**
- `README.md` - Project overview
- `AGENTS.md` - Operational protocols
- `_CURRENT-PROJECT-STATE.md` - Live capability baseline
- `_CURRENT_TASK.md` - Active task tracking
- `LICENSE` - License file

## Usage

### Step 1: Preview Changes

```bash
bun run scripts/maintenance/organize-root-docs/index.ts
```

The script will show what it plans to move and ask for confirmation.

### Step 2: Verify Settings (Pre-Flight Check)

```bash
# Check if any code references docs in root
rg -t ts -t js "walkthrough\.md|CLAUDE\.md|_staging\.md" --no-filename

# Expected: No critical references
```

### Step 3: Run Organization

Confirm with `y` when prompted. The script will:
1. Create necessary subdirectories
2. Move files to appropriate locations
3. Report success/failures

### Step 4: Post-Move Verification

```bash
# 1. Check root is clean
ls -1 *.md
# Expected: Only README.md, AGENTS.md, _CURRENT-PROJECT-STATE.md, _CURRENT_TASK.md

# 2. Verify docs structure
tree docs -L 2
# Expected: Organized subdirectories (analysis, walkthroughs, reviews, etc.)

# 3. Run ingestion pipeline (shouldn't be affected, uses briefs/debriefs/playbooks)
bun run scripts/pipeline/ingest.ts --dry-run
# Expected: No errors

# 4. Test git status
git status
# Expected: Files moved, not deleted
```

### Step 5: Update Documentation References

Search for any broken links:
```bash
# Find markdown files that might reference moved docs
rg -t md "walkthrough\.md|CLAUDE\.md|_staging\.md" docs/ debriefs/ briefs/

# Update any found references manually
```

## What Gets Moved

| Pattern | Category | Destination | Example |
|---------|----------|-------------|---------|
| `CDA_*ANALYSIS.md` | analysis | `docs/analysis/` | `CDA_EDGE_ANALYSIS.md` |
| `ORPHAN_*` | analysis | `docs/analysis/` | `ORPHAN_NODES_ANALYSIS.md` |
| `walkthrough*.md` | walkthrough | `docs/walkthroughs/` | `walkthrough_active.md` |
| `*review*.md` | review | `docs/reviews/` | `final_review.md` |
| `*summary*.md` | review | `docs/reviews/` | `refactoring-summary-sigma.md` |
| `*prompt*.md` | prompt | `docs/prompts/` | `deep-research-prompt.md` |
| `_staging.md` | staging | `docs/archive/` | `_staging.md` |
| `CLAUDE.md` | agent-note | `docs/archive/` | `CLAUDE.md` |
| `implementation_plan.md` | completed | `docs/archive/` | `implementation_plan.md` |

## Verification Checklist

- [ ] Preview looks correct (no critical files being moved)
- [ ] No settings file references docs in root
- [ ] No code imports docs from root
- [ ] Run organization script
- [ ] Verify root contains only essential `.md` files
- [ ] Check `docs/` structure is correct
- [ ] Test ingestion pipeline (not affected by doc moves)
- [ ] Search for broken documentation links
- [ ] Update any found references
- [ ] Git commit the reorganization

## Rollback

If issues occur:
```bash
# Revert all moves
git restore --staged .
git restore .

# Or selective rollback
git restore docs/walkthroughs/
mv docs/walkthroughs/*.md .
```

## Related

- `_CURRENT-PROJECT-STATE.md` - Capability baseline
- `docs/project-structure.md` - Project organization
- `polyvis.settings.json` - No doc paths (verified)
