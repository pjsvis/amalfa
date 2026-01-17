amalfa/scripts/maintenance/README.md
# Maintenance Scripts

## Purpose
Operational and routine maintenance scripts for the Amalfa system.

## Key Files

- `consistency-report.ts` - **NEW**: Consistency checker with dashboard output
- `cleanup_*.ts` - Repository cleanup operations
- `migrate_*.ts` - Data migration scripts
- `fix_*.ts` - One-time fix scripts

## Consistency Report Generator

**File:** `consistency-report.ts`

**Purpose:** Automated checking of code/docs alignment with JSON output for dashboards.

**Usage:**
```bash
# Human-readable output
bun run scripts/maintenance/consistency-report.ts

# JSON for dashboards
bun run scripts/maintenance/consistency-report.ts --json

# Verbose mode
bun run scripts/maintenance/consistency-report.ts --verbose
```

**Checks 6 categories:**
1. CLI commands (docs vs code)
2. File paths (references exist)
3. Service naming (consistency)
4. Config schema (example exists)
5. Cross-references (links work)
6. Legacy commands (no outdated patterns)

**Output:** Structured JSON with:
- Overall score (0-100%)
- Checks passed/failed counts
- Category breakdown
- Detailed issue list with suggestions
- Git metadata

**Integration:** CI/CD, pre-commit hooks, dashboards

**See:** `playbooks/consistency-audit-playbook.md` for full details

## Patterns

- Run periodically or on-demand for system maintenance
- May modify data or clean up artifacts
- Often one-time scripts that become obsolete after use

## ⚠️ Stability
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.