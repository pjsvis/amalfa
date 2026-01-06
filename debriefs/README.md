# debriefs/

**Purpose:** Project debriefs - documentation of what ACTUALLY happened after executing work  
**Used by:** Developers, AI agents, project retrospectives  
**Git Status:** ✅ Versioned (committed)

---

## What Are Debriefs?

**Debriefs** are post-execution documents that record:
- **What we planned:** Reference to brief
- **What we did:** Actual implementation
- **What we learned:** Unexpected issues, insights
- **Metrics:** Actual time, changes, impact

**Think:** The "Debrief" phase of Change Management Protocol (CMP)

---

## When to Create a Debrief

✅ **Create a debrief when:**
- Completing briefed work
- Finishing a sprint/session
- Solving a complex problem
- Learning something valuable

❌ **Optional for:**
- Trivial fixes
- Routine maintenance
- Work without brief

**Rule:** Every brief should have a matching debrief!

---

## Naming Convention

**Format:** `YYYY-MM-DD-topic-name.md`

**Examples:**
- `2025-12-12-docs-consolidation.md`
- `2025-12-12-echoes-bootstrap.md`
- `2025-12-12-session-wrap.md`

**Why date prefix:**
- Sorts chronologically
- Pairs with briefs
- Easy to find history

**IMPORTANT:** Date comes FIRST (not `debrief-2025-12-12`)

---

## Debrief Template

```markdown
# Debrief: [Title]

**Date:** YYYY-MM-DD  
**Brief:** briefs/brief-YYYY-MM-DD-topic.md  
**Duration:** X hours  
**Status:** Complete | Partial

---

## Objective (From Brief)
[What we planned to do]

## What Actually Happened
[What we did, including deviations]

## Metrics
- Files changed: X
- Lines added/removed: +X/-Y
- Time spent: X hours
- Build status: Pass/Fail

## Unexpected Issues
[Problems we didn't anticipate]

## Lessons Learned
[Key insights for future work]

## Related Artifacts
- Briefs: [links]
- Code: [commits, PRs]
- Docs: [playbooks updated]

---

**Status:** Complete
```

---

## Lifecycle

### **Paired with Briefs**

```
briefs/brief-2025-12-12-feature.md  ← Plan
         ↓ (execute work)
debriefs/2025-12-12-feature.md      ← Reality
```

**Both should exist** for major work!

---

## Relationship to Other Docs

| Document | When | Purpose |
|----------|------|---------|
| **Brief** | Before | Plan |
| **Debrief** | After | Reality |
| **Playbook** | Anytime | Reusable procedure |

**Example flow:**
1. Read playbook (`playbooks/css-master-playbook.md`)
2. Write brief (`briefs/brief-2025-12-12-css-refactor.md`)
3. Do work
4. Write debrief (`debriefs/2025-12-12-css-refactor.md`)
5. Update playbook if learned something new

---

## Best Practices

### ✅ **Do:**
- Write debrief immediately after work
- Reference the original brief
- Document surprises (plan vs reality)
- Include metrics (time, changes)
- Capture lessons learned

### ❌ **Don't:**
- Wait days to write (memory fades!)
- Skip if "nothing interesting happened"
- Duplicate content from brief
- Forget to link related docs

---

## Change Management Protocol (CMP)

**Debriefs are mandatory for CMP:**

```
PLAN → EXECUTE → VERIFY → DEBRIEF
  ↓        ↓         ↓         ↓
Brief    Code    Tests    Debrief
```

**Why:** Audit trail, learning, accountability

---

## Naming Errors to Avoid

❌ **Wrong:**
- `debrief-2025-12-12-topic.md` (date not first)
- `DEBRIEF-topic.md` (no date)
- `topic-notes.md` (vague, no date)

✅ **Correct:**
- `2025-12-12-topic.md`
- `2025-12-12-session-wrap.md`
- `2025-12-12-echoes-bootstrap.md`

**Fix script available:** `scripts/maintenance/fix-debrief-names/`

---

## Current Structure Audit

```bash
$ ls -1 debriefs/*.md | wc -l
# Total debriefs

$ ls -1 debriefs/2025-12-*.md | wc -l
# This month's debriefs

$ rg "^# Debrief:" debriefs/ --type md | wc -l
# Properly formatted debriefs
```

---

## Related Documentation

- `briefs/README.md` - Pre-execution planning
- `playbooks/` - Reusable procedures
- `scripts/maintenance/fix-debrief-names/` - Naming enforcement

---

**Last Updated:** 2025-12-12  
**Reason:** Initial documentation (Friday cleanup session)
