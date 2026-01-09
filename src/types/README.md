amalfa/src/types/README.md
```

# Type Definitions

## Purpose
The `types/` directory contains TypeScript type definitions used throughout the Amalfa application. These types ensure type safety and provide a single source of truth for data structures.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Main export barrel for all types |
| `config.ts` | Configuration-related type definitions |
| `resonance.ts` | Resonance engine type definitions |
| `daemon.ts` | Daemon service type definitions |
| `cli.ts` | CLI command type definitions |

## Patterns

- Use interfaces for object shapes
- Use type aliases for unions and intersections
- Export all types from `index.ts` for easy importing
- Keep types focused and composable

## ⚠️ Stability
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.
