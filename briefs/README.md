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
