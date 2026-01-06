# Change Management Protocol

**Status:** Active Protocol  
**Type:** Operational Procedure  
**Priority:** MANDATORY for all non-trivial changes  

---

## Principle

**"Undocumented changes didn't happen."**

Every significant change must follow the Plan → Execute → Verify → Debrief cycle. Verification is not optional - it's the proof that work was completed.

---

## When to Apply

### REQUIRED For:
- Schema changes
- File reorganization (moving >3 files)
- Configuration updates
- Capability additions/removals
- Database migrations
- API changes

### OPTIONAL For:
- Single file edits
- Documentation typo fixes
- Formatting changes

---

## The Cycle

### Phase 1: PLAN (Before Touching Code)

**Document:** `briefs/brief-YYYY-MM-DD-topic.md` OR section in `_CURRENT_TASK.md`

**Contents:**
1. **Objective**: What are we trying to achieve?
2. **Current State**: What exists now?
3. **Proposed Changes**: What will change?
4. **Verification Criteria**: How will we prove it worked?
5. **Rollback Plan**: How to undo if it fails?

**Example:**
```markdown
## Objective
Reorganize root documentation files into docs/ subdirectories

## Current State
- 13 .md files scattered in root
- No doc paths in settings.json
- Files: walkthrough*.md, CLAUDE.md, *_ANALYSIS.md, etc.

## Proposed Changes
- Move to docs/walkthroughs/, docs/analysis/, docs/archive/
- Keep README.md, AGENTS.md, _CURRENT-*.md in root

## Library Consolidation Protocol
When moving scattered scripts into a centralized library (e.g., `scripts/` -> `src/lib/`):

1.  **Iterative Strategy**: Move *one file at a time*.
    -   **Move**: `mv old/path/file.ts new/path/file.ts`
    -   **Refactor**: Update imports to use aliases (`@src/*`) immediately.
    -   **Verify**: Run `tsc --noEmit` AND the script itself (if runnable).
    -   **Document**: Update READMEs in both old and new locations.
2.  **Alias Enforcement**: Do not use relative paths (e.g., `../../`) for library code. Use defined `tsconfig` aliases to ensure portability.
3.  **Continuity Check**: Before signing off, run the full pipeline to ensure no "invisible" regressions (like runtime SQL schema mismatches) occurred.

## Verification Criteria
- [ ] Root contains only 4 .md files
- [ ] tree docs -L 2 shows organized structure
- [ ] bun run scripts/pipeline/ingest.ts succeeds
- [ ] git status shows moves, not deletions
- [ ] No broken links in docs/

## Rollback Plan
git restore --staged . && git restore .
```

### Phase 2: EXECUTE (Make Changes)

**Guidelines:**
1. Work from the documented plan
2. Make changes incrementally
3. Document deviations immediately
4. Stop if unexpected issues arise

**Anti-Pattern:** Making changes not in the plan without updating the plan first

### Phase 3: VERIFY (Prove It Worked)

**MANDATORY - NO EXCEPTIONS**

Run ALL verification criteria from the plan:
```bash
# Example verification commands
ls -1 *.md | wc -l  # Expected: 4
tree docs -L 2
bun run scripts/pipeline/ingest.ts
git status
rg -t md "broken-link"
```

**Capture Output:**
- Screenshot CLI output
- Save command results
- Note any failures

**Rule:** If verification fails, changes are NOT complete.

### Phase 4: DEBRIEF (Document Reality)

**Document:** `debriefs/YYYY-MM-DD-topic.md`

**Contents:**
1. **What Was Planned**: Link to brief/task
2. **What Actually Happened**: Reality (may differ from plan)
3. **Verification Results**: Proof with command output
4. **Issues Encountered**: Problems and solutions
5. **Lessons Learned**: What we discovered
6. **Files Modified**: Complete list

**Critical:** Debrief documents **what actually happened**, not what was planned.

**Example:**
```markdown
## What Was Planned
Reorganize 13 docs files into docs/ subdirectories

## What Actually Happened
- Found _staging.md is referenced by scripts/harvest.ts
- Decided to keep _staging.md in root (not in plan)
- Moved 12 files instead of 13
- Created docs/walkthroughs/, docs/analysis/, docs/archive/

## Verification Results
✅ Root files: 5 (README, AGENTS, _CURRENT-*, _staging)
✅ Ingestion pipeline: PASSED (no errors)
✅ Git status: Files moved (not deleted)
❌ Broken link found: DESIGN.md references walkthrough.md
   → Fixed: Updated link to docs/walkthroughs/walkthrough.md

## Issues Encountered
- _staging.md is actively used by harvest script
- Decision: Keep in root, update script later

## Lessons Learned
- Always grep for references before moving files
- Harvest script should use settings.json for paths

## Files Modified
- Moved: 12 files to docs/*
- Updated: docs/DESIGN.md (fixed link)
```

---

## Verification Commands Template

Every plan must include specific verification commands:

```bash
# Database integrity
sqlite3 public/resonance.db 'PRAGMA integrity_check;'

# File counts
ls -1 *.md | wc -l  # Expected: X

# Build passes
tsc --noEmit

# Tests pass
bun test

# Pipeline works
bun run scripts/pipeline/ingest.ts

# Git clean
git status --short

# No broken links
rg -t md "broken-pattern"
```

---

## Debrief Template

Save as `debriefs/YYYY-MM-DD-topic.md`:

```markdown
# [Topic] - YYYY-MM-DD

**Objective:** [One sentence]  
**Status:** ✅ Complete / ⚠️ Partial / ❌ Failed  
**Duration:** [Time taken]  

---

## Plan Reference
[Link to brief or _CURRENT_TASK.md section]

## What Actually Happened
[Narrative of reality]

## Verification Results
[Copy-paste of command outputs]

✅ Criterion 1: [result]
✅ Criterion 2: [result]
❌ Criterion 3: [result and fix]

## Issues Encountered
1. [Problem] → [Solution]
2. [Problem] → [Solution]

## Lessons Learned
- [Learning 1]
- [Learning 2]

## Files Modified
### Created
- file1.ts
- file2.md

### Modified
- file3.ts
- file4.json

### Deleted
- file5.old

---

**Verified:** [Date/Time]  
**Next Steps:** [What comes next]
```

---

## Integration with _CURRENT-PROJECT-STATE.md

After completing a change cycle:

1. Update verification commands if capabilities changed
2. Update baseline metrics
3. Document new "red flags" if discovered
4. Add to "Files Modified" tracking

---

## Red Flags (Protocol Violations)

⛔ **Immediate Stop** if you catch yourself:
- Making changes without a plan
- Skipping verification steps
- Not documenting deviations
- Claiming "done" without proof

---

## Example: Full Cycle

### 1. Plan (brief-2025-12-12-root-docs.md)
```markdown
## Objective: Clean root directory

## Current: 13 files
## Proposed: Move to docs/
## Verification:
- [ ] ls -1 *.md | wc -l  # 4
- [ ] Ingestion passes
```

### 2. Execute
```bash
bun run scripts/maintenance/organize-root-docs/index.ts
# (makes changes)
```

### 3. Verify
```bash
$ ls -1 *.md | wc -l
4  ✅

$ bun run scripts/pipeline/ingest.ts
✅ 328 nodes, no errors

$ git status
Modified: 12 files moved  ✅
```

### 4. Debrief (debriefs/2025-12-12-root-docs-cleanup.md)
```markdown
## Verification Results
✅ All criteria passed
❌ Found _staging.md reference - kept in root

## Lessons
- Always grep before moving
```

---

## Success Criteria

**A change is complete when:**
1. ✅ Plan exists and is reviewed
2. ✅ Changes implemented
3. ✅ ALL verification criteria passed
4. ✅ Debrief written with proof
5. ✅ _CURRENT-PROJECT-STATE.md updated if needed

**Not before.**

---

## Related Protocols

- `AGENTS.md` - NCVP (No Completion Without Verification)
- `_CURRENT-PROJECT-STATE.md` - Baseline verification commands
- `playbooks/definition-of-done-playbook.md` - DoD requirements

---

**Effective:** 2025-12-12  
**Review:** Every sprint
