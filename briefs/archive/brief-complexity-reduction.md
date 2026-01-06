## Task: Protocol Complexity Reduction

**Objective:** Reduce the cognitive overhead of the project's protocol system while maintaining quality standards through progressive disclosure and automation.

- [ ] Implement automated `tsc` gate (pre-commit verification)
- [ ] Create "Quick Tasks" protocol subset for simple work
- [ ] Implement Protocol Stratification (Tiered access)
- [ ] Consolidate overlapping protocols
- [ ] Create documentation dependency map

## Key Actions Checklist:

### Phase 1: Automation (P0)
- [ ] Create pre-commit hook for TypeScript verification
- [ ] Test hook catches `tsc` errors before commit
- [ ] Document hook in development workflow

### Phase 2: Quick Tasks Protocol (P0)
- [ ] Create `playbooks/quick-tasks.md` with simplified workflow
- [ ] Define criteria for "simple tasks" (<3 files, <50 lines)
- [ ] Exempt simple tasks from full brief/debrief cycle

### Phase 3: Protocol Stratification (P1)
- [ ] Create Tier system in AGENTS.md
- [ ] Tier 1: Core Protocols (Always Active)
- [ ] Tier 2: Development Protocols (After 3 sessions)
- [ ] Tier 3: Domain Playbooks (JIT loading)

### Phase 4: Protocol Consolidation (P1)
- [ ] Merge TFP + CVP → CCP (Centralized Control Protocol)
- [ ] Merge EVP + RAP → VAP (Verification & Alignment Protocol)
- [ ] Merge CMP + BCP → BVP (Browser Verification Protocol)

### Phase 5: FLIP Refinement (P2)
- [ ] Revise FLIP protocol with graduated targets
- [ ] Add ADR requirement for 500-700 line files
- [ ] Remove anxiety from "ideal" targets

## Detailed Requirements

**Pre-commit Hook:**
- Must run `tsc --noEmit` and `biome check`
- Should fail fast with clear error messages
- Must be executable via `bun run precommit`

**Quick Tasks Criteria:**
- Affects <3 files
- Changes <50 lines total
- No architectural changes
- No new dependencies

**Tier Unlock System:**
- Tier 1: All agents (Core safety)
- Tier 2: After 3 successful sessions
- Tier 3: JIT based on task domain

## Success Metrics
- `tsc` violations in SCOREBOARD drop to zero
- Simple tasks take 50% less time
- New agents can start work with <15 minutes of reading
