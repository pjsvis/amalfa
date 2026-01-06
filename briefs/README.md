`# Briefs Directory

Active briefs ready for development work.

## Structure

```
briefs/
├── pending/          # Active briefs ready to work on
├── archive/          # Completed briefs (have corresponding debriefs)
└── README.md         # This file
```

## Convention

- All briefs use `brief-{slug}.md` naming
- Briefs are created in `pending/` when work begins
- When a brief is completed, its debrief is written to `debriefs/YYYY-MM-DD-{slug}.md`
- After debriefing, move the brief from `pending/` to `archive/`

## Workflow

1. **Create Brief:** Add to `briefs/pending/` using the template from `playbooks/briefs-playbook.md`
2. **Execute Work:** Follow the brief's checklist
3. **Debrief:** Write debrief to `debriefs/YYYY-MM-DD-{slug}.md`
4. **Archive:** Move brief from `pending/` to `archive/`

## Quick Status Check

Run `bun run map-briefs` to see:
- Which briefs are completed (have debriefs)
- Which briefs are pending (no debriefs)
- File organization status

## Reference

- **Brief Creation:** `playbooks/briefs-playbook.md`
- **Debrief Writing:** `playbooks/debriefs-playbook.md`
- **Task Tracking:** `_CURRENT_TASK.md`
