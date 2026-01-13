# Briefs Directory

Active briefs ready for development work.

## Active Briefs

| Status | Priority | Brief | Description |
| :--- | :--- | :--- | :--- |
| 🟢 Ready | High | [Graphology Workflows](./brief-graphology-workflows.md) | Implement advanced graph algorithms (PageRank, Louvain) for content enrichment. |
| 🟡 Draft | Medium | [Dynamic Tool Discovery](./brief-dynamic-tool-discovery.md) | Runtime discovery of agent tools. |
| 🟡 Draft | Low | [Meta Swarm](./brief-meta-swarm.md) | Concept for agent swarms. |
| 🟡 Draft | Low | [Node Dependency Removal](./brief-node-dependency-removal.md) | Reduce dependency footprint. |

## Completed Briefs (Archived)

| Date | Brief | Debrief |
| :--- | :--- | :--- |
| 2026-01-13 | [Phase 5 - Autonomous Research](./archive/brief-phase5-enhancements.md) | [2026-01-13-phase5](./debriefs/2026-01-13-phase5-autonomous-research.md) |
| 2026-01-09 | [Ember Service](./archive/2026-01-09-ember-service.md) | - |
| 2026-01-09 | [Phase 3 - Infrastructure](./archive/brief-phase3-infrastructure.md) | - |
| 2026-01-09 | [Phase 4 - Testing](./archive/brief-phase4-testing.md) | - |
| 2026-01-06 | [Phase 2 - Guardrails](./archive/brief-phase2-guardrails-naming.md) | - |

## Convention

- All briefs use `brief-{slug}.md` naming
- When a brief is completed, its debrief is written to `debriefs/YYYY-MM-DD-{slug}.md`
- After debriefing, move the brief to `briefs/archive/`

## Workflow

1. **Select Brief:** Pick a `Ready` brief from the table above.
2. **Execute Work:** Follow the brief's checklist.
3. **Debrief:** Write debrief to `debriefs/YYYY-MM-DD-{slug}.md`.
4. **Archive:** Move brief to `archive/` and update this README.

## Reference

- **Brief Creation:** `playbooks/briefs-playbook.md`
- **Debrief Writing:** `playbooks/debriefs-playbook.md`
- **Task Tracking:** `_CURRENT_TASK.md`
