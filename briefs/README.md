# Briefs - Work Specifications

Briefs are aspirational work specifications - like New Year's Resolutions, they represent **intent** but may not survive contact with reality. Debriefs document what **actually** happened.

## Directory Structure

### `briefs/*.md` (Root)
**Active or recently completed work**
- Currently being worked on
- Just finished (before moving to archive)
- **Signal:** This is happening NOW

### `briefs/pending/`
**Approved, waiting for go-ahead**
- Ready to start
- Just needs final trigger/timing
- Next in queue
- **Signal:** Green light needed

### `briefs/holding/`
**Paused for a reason**
- Needs more research/design
- Unclear requirements or feasibility
- Waiting for dependencies
- Scope needs reconsideration
- **Signal:** Not ready yet

### `briefs/future/`
**Aspirational enhancements**
- Nice to have features
- Low priority but well-specified
- Not urgent
- **Signal:** Someday/maybe

### `briefs/archive/`
**Completed, superseded, or abandoned**
- Completed work (with matching debrief)
- Superseded by different approach
- Abandoned as not viable
- **Signal:** Historical record

---

## Active Work: Remeda Adoption

The following briefs document the adoption of the Remeda toolkit for ingestion pipeline hardening.

### Execution Order

1. **`brief-add-to-wrapper.md`** - Add foundational `to()` wrapper to JsonlUtils
2. **`brief-refactor-dashboard-daemon.md`** - Small, isolated refactor using new utilities
3. **`brief-refactor-lexicon-harvester.md`** - Larger refactor with multiple Remeda patterns

### Quick Links

- [Master Brief](./brief-remeda-adoption-2026-02-05.md) - Overview and context
- [Remeda Playbook](../playbooks/remeda-playbook.md) - Pattern documentation

### Summary

Goal: Refactor the codebase to use:
- `to()` wrapper for explicit async error handling
- `R.pipe()` for linear data transformations
- Immutable operations (no mutation)
- Empty array early returns for type narrowing

## Lifecycle

```
holding/ → pending/ → briefs/ (active) → archive/
                ↓
              future/ → pending/ → briefs/ → archive/
```

Briefs may also skip stages or move backward if reality requires it.

## Guidelines

**Creating a brief:**
- Put in root if starting immediately
- Put in `pending/` if approved but waiting
- Put in `holding/` if needs more work
- Put in `future/` if someday/maybe

**Moving a brief:**
- To `archive/` when work is complete (create matching debrief first)
- To `archive/superseded/` if approach changed during implementation
- To `holding/` if blocked or needs rethinking
- To `future/` if deprioritized

**Remember:** Briefs are living documents. Reality trumps plans. Debriefs tell the real story.
