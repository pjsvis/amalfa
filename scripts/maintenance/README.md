amalfa/scripts/maintenance/README.md
# Maintenance Scripts

## Purpose
Operational and routine maintenance scripts for the Amalfa system.

## Key Files

- `cleanup_*.ts` - Repository cleanup operations
- `migrate_*.ts` - Data migration scripts
- `fix_*.ts` - One-time fix scripts

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