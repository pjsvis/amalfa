---
date: 2025-12-29
tags: [protocols, complexity, automation, documentation]
---

## Debrief: Protocol Complexity Reduction

## Accomplishments

- **Pre-commit Automation (P0):** Created `scripts/maintenance/pre-commit.ts` that combines TypeScript (`tsc --noEmit`) and Biome checks into a single verification gate. Added `bun run precommit` to package.json scripts. This should eliminate the "Strict Compiler" User points that have dominated SCOREBOARD Season 1.

- **Quick Tasks Protocol (P0):** Created `playbooks/quick-tasks-playbook.md` defining a simplified workflow for low-risk tasks (<3 files, <50 lines, no architectural impact). Quick Tasks are exempt from brief/debrief cycles and protocol initialization, reducing overhead for routine work.

- **Protocol Stratification (P1):** Implemented 3-tier progressive disclosure system in AGENTS.md:
  - **Tier 1 (Core):** 6 safety protocols for all agents
  - **Tier 2 (Development):** 17 protocols unlocked after 3 successful sessions
  - **Tier 3 (Domain):** JIT-loaded playbooks based on task context

- **Protocol Consolidation (P1):** Merged overlapping protocols into consolidated versions:
  - **CCP (Protocol 22):** Merges TFP + CVP → Centralized Control Protocol
  - **VAP (Protocol 23):** Merges EVP + RAP → Verification & Alignment Protocol
  - **BVP (Protocol 24):** Merges CMP + BCP → Browser Verification Protocol
  - Reduced TIER 2 from 20 protocols to 17 items.

- **FLIP Protocol v2.0 (P2):** Revised File Length Integrity Protocol with graduated targets:
  - < 300 lines: 🟢 Ideal (no action)
  - 300-500 lines: 🟡 Acceptable (add TODO comment)
  - 500-700 lines: 🟠 Review (requires ADR)
  - > 700 lines: 🔴 Critical (must split)
  - Removed anxiety from "ideal" targets, allows cohesion to justify length.

## Problems

- **Biome Errors in Codebase:** During `bun run precommit` testing, discovered 1430 Biome errors and 2800 warnings already present in the codebase. The hook works correctly (blocks commits on errors), but the codebase needs cleanup.

- **Documentation Dependency:** TIER 3 domain playbook list needed to be compiled by searching the playbooks directory. Some playbook names may have changed or need updating.

## Lessons Learned

- **Progressive Disclosure Works:** Moving from 21 protocols upfront to 6 (Tier 1) + optional loading dramatically reduces initial cognitive load.

- **Automation Beats Documentation:** The pre-commit hook is more effective than written protocols because it actually blocks bad behavior rather than just describing it.

- **Graduated Targets > Absolute Thresholds:** FLIP v2.0's graduated system acknowledges that code organization is nuanced. Cohesion sometimes justifies length, and the ADR requirement for 500-700 line files provides structure without artificial constraints.

- **Consolidation Reduces Confusion:** Merging TFP+CVP, EVP+RAP, and CMP+BCP eliminates redundancy while preserving all important guidance.

## Files Created/Modified

**Created:**
- `scripts/maintenance/pre-commit.ts` - Automated verification hook
- `playbooks/quick-tasks-playbook.md` - Simplified workflow for small tasks
- `debriefs/2025-12-29-protocol-complexity-reduction.md` - This document

**Modified:**
- `AGENTS.md` - Added Protocol Stratification section, consolidated protocols, revised FLIP v2.0, updated Quality Gates
- `package.json` - Added `precommit` script
- `_CURRENT_TASK.md` - Updated task status

## Metrics

- **Protocol Reduction:** TIER 1: 6 protocols (was 21 upfront)
- **Protocol Consolidation:** 21 protocols → 17 TIER 2 items + 3 consolidated
- **Quick Tasks Threshold:** <3 files, <50 lines (no brief/debrief needed)

## Verification

- [x] `bun run precommit` executes and catches errors correctly
- [x] AGENTS.md stratification section readable and organized
- [x] All consolidated protocols reference their deprecated predecessors
- [x] FLIP v2.0 includes graduated targets table and example ADR

## Next Steps (Optional)

1. **Clean up Biome errors:** Run `bun run format` and `bun run lint` to fix existing 1430 errors
2. **Create ADR directory:** `docs/adr/` for architecture decision records (FLIP 500-700 line cases)
3. **Brief archival:** Move `briefs/brief-complexity-reduction.md` to `briefs/archive/`
4. **Test Quick Tasks:** Try a quick task (e.g., typo fix) to verify streamlined workflow

## Success Criteria Met

✅ P0: Automated `tsc` gate implemented
✅ P0: Quick Tasks protocol created
✅ P1: Protocol stratification implemented
✅ P1: Overlapping protocols consolidated
✅ P2: FLIP protocol refined with graduated targets

**Overall Status:** All phases completed successfully. The protocol system now supports progressive disclosure while maintaining quality standards through automation.
