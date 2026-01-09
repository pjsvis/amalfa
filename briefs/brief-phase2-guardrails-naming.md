## Task: Phase 2 - Agent Guardrails & Naming

**Objective:** Add colocated README files to all code folders with stability clauses, and excise legacy "Polyvis" naming throughout the codebase.

**TODO Items:** #4, #6, #9

- [ ] Add colocated README files to all code folders (#4) - **HIGH PRIORITY**
- [ ] Excise legacy "Polyvis" naming (#6)
- [ ] Remove stale deprecation comments (#9)

## Key Actions Checklist:

### Folder READMEs (Priority Task)
Create README.md in each folder with: Purpose, Key Files, Patterns, Stability Clause.

**Directories needing READMEs:**
- [ ] `src/README.md` (root src overview)
- [ ] `src/types/README.md`
- [ ] `src/config/README.md`
- [ ] `src/utils/README.md`
- [ ] `src/cli/README.md`
- [ ] `src/daemon/README.md`
- [ ] `src/resonance/types/README.md`
- [ ] `src/resonance/services/README.md`
- [ ] `scripts/enlightenment/README.md`
- [ ] `scripts/maintenance/README.md`

**Stability Clause Template:**
```markdown
## ⚠️ Stability
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.
```

### Polyvis → Amalfa Naming
- [ ] Update `src/mcp/README.md` - "Polyvis" → "Amalfa"
- [ ] Update `src/core/README.md` - "Polyvis" → "Amalfa"
- [ ] Update `src/resonance/README.md` - "Polyvis" → "Amalfa"
- [ ] Update `src/resonance/DatabaseFactory.ts` docstring
- [ ] Update `scripts/README.md`
- [ ] Update `scripts/setup_mcp.ts` (if not deleted in Phase 1)
- [ ] Global search: `rg -i polyvis src docs` and fix remaining

### Deprecation Cleanup
- [ ] Review `src/resonance/DatabaseFactory.ts` - remove `@deprecated` if method is still needed
- [ ] Apply principle: if deprecated code is dead, delete both code AND notice

## Verification:

- [ ] `rg -i polyvis src` returns 0 results (excluding comments about the rename)
- [ ] All 10+ new README files exist
- [ ] Each README has Stability Clause
