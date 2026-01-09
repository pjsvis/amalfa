
# Utils Directory

## Purpose
The `utils/` directory contains shared utility functions and helper modules used throughout the Amalfa application.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Main exports of utility functions |
| `file.ts` | File system operations |
| `logger.ts` | Logging utilities |
| `validation.ts` | Common validation helpers |

## Patterns

- Pure functions where possible
- Reusable across multiple modules
- Well-documented with JSDoc comments
- Side effects are clearly isolated

## ⚠️ Stability
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.