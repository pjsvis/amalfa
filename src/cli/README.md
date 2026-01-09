amalfa/src/cli/README.md


# CLI Directory

## Purpose
Command-line interface implementation for Amalfa, providing the primary user-facing interface for interacting with the system.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | CLI entry point and command routing |
| `commands/` | Individual command implementations |

## Patterns

- Uses a command pattern for extensibility
- Supports subcommands for different operations
- Consistent help and argument parsing

## ⚠️ Stability
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.