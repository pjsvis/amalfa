---
id: debrief-naming-enforcer
type: snippet
tags: [maintenance, naming-convention, automation]
status: active
summary: "Automated script to enforce YYYY-MM-DD-topic.md naming convention for debrief files."
---

# Debrief Naming Convention Enforcer

## Context
Inconsistent naming conventions for debrief files created confusion and made chronological discovery difficult. Some files had dates at the end (`debrief-topic-2025-12-12.md`), others had no dates, breaking the canonical date-first pattern.

**Problem:** Mixed naming conventions force cognitive overhead and break tooling reliability.

**Solution:** Automated script that scans, detects violations, extracts dates, and renames files with user confirmation.

## Usage

**File:** `scripts/maintenance/fix-debrief-names/index.ts`

**Convention:** `YYYY-MM-DD-topic.md` (date first, always)

**Features:**
- Scans `debriefs/` directory for naming violations
- Extracts dates from content (`**Date:**` field in frontmatter)
- Falls back to file modification time
- Shows preview with extraction method
- Interactive confirmation before renaming
- Reusable for future enforcement

**Run the script:**
```bash
bun run scripts/maintenance/fix-debrief-names/index.ts
```

# It will show violations and prompt:
# Proceed with renaming? (y/n):
```

**Example Output:**
```
📝 debrief-semantic-linking.md
   → 2025-12-12-semantic-linking.md
   Date: 2025-12-12 (from content **Date:** field)
```

**Why Date-First Matters:**

1. **Chronological Discovery** - Latest files appear at bottom when sorted
2. **Pattern Matching** - Tools can reliably extract dates with regex
3. **Context at a Glance** - Temporal sequence immediately visible
4. **Cognitive Efficiency** - No mental translation needed

**Integration:**

Add to verification checklist in `_CURRENT-PROJECT-STATE.md`:
```bash
# 15. Debrief naming convention
ls -1 debriefs/*.md | grep -v '^debriefs/[0-9]{4}-[0-9]{2}-[0-9]{2}-'
# Expected: Exit code 1 (no violations)
```

Or run as pre-commit hook:
```bash
# .git/hooks/pre-commit
bun run context/fix_debrief_names.ts --check
```

**Date Extraction Priority:**
1. Content `**Date:**` field (most reliable)
2. File modification time (fallback)

**Related:**
- `playbooks/debriefs-playbook.md` - Debrief writing guide
- `_CURRENT-PROJECT-STATE.md` - Verification checklist
