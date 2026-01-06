# Quick Tasks Protocol

## Purpose

For simple, low-risk tasks that don't require the full brief/debrief cycle. This protocol exists to reduce overhead for routine work while maintaining quality standards.

## Task Eligibility Criteria

A task qualifies as "Quick" if **ALL** of the following apply:

| Criterion | Threshold |
|-----------|-----------|
| Files affected | < 3 files |
| Lines changed | < 50 lines total |
| Architectural impact | None (no structure changes) |
| Dependencies | No new packages |
| Database | No schema changes |
| Testing | No new test files required |

## Allowed Quick Tasks

**Examples of qualifying tasks:**
- Typo fixes
- Color/spacing tweaks via `theme.css`
- Documentation updates
- Variable/function renames
- Adding console.log for debugging
- Small bug fixes (one-liners)
- Comment additions

**Examples that DO NOT qualify:**
- New features
- Database migrations
- New dependencies
- Cross-file refactors
- Protocol changes
- Test file additions

## Quick Task Checklist

### Before Starting
- [ ] Verify task meets eligibility criteria above
- [ ] Read affected files

### Execution
- [ ] Make changes
- [ ] Run `bun run check` (Biome)
- [ ] Run `tsc --noEmit` (TypeScript)

### UI Changes Only
- [ ] Open in browser
- [ ] Verify visual result

### Completion
- [ ] Run `bun run precommit` (verifies both Biome + tsc)
- [ ] Task complete - **no brief/debrief required**

## Exemptions

Quick Tasks are **exempt** from:
- ❌ Brief creation
- ❌ Debrief writing
- ❌ Protocol initialization (OCIP)
- ❌ _CURRENT_TASK.md updates
- ❌ Playbook deep-dive

Quick Tasks **must still**:
- ✅ Pass `bun run precommit`
- ✅ Follow AFP (Alpine First Protocol) for UI
- ✅ Follow TFP/CVP (Theme First) for CSS
- ✅ Follow DOSP-CTX (Destructive Operations) if deleting files

## When in Doubt

If you're unsure whether a task qualifies as "Quick":
1. **Default to full process** - create a brief
2. **Ask the user** - "Is this a quick task or should I create a brief?"
3. **Use the 3-file rule** - if it touches 3+ files, it's NOT quick

## Examples

### Quick Task (✅ Qualifies)
> "Fix typo in README.md: change 'visulaization' to 'visualization'"
>
> **Process:** Edit file → Run `bun run precommit` → Done

### NOT Quick Task (❌ Requires Brief)
> "Add dark mode toggle to navigation"
>
> **Reason:** Multiple files, state management, UI interaction
> **Process:** Create brief → Implement → Debrief

## Tracking

Quick Tasks should NOT be recorded in:
- `_CURRENT_TASK.md`
- `debriefs/` directory
- SCOREBOARD match history

Quick Tasks MAY be noted in:
- Git commit messages
- Personal notes

---

**Remember:** The goal is velocity for trivial changes without sacrificing quality. When in doubt, brief it out.
