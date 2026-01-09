amalfa/src/config/README.md
```

# Configuration Directory

## Purpose
The `config/` directory handles configuration loading, validation, and management for the Amalfa application. It provides a unified interface for accessing configuration values from TypeScript and JSON configuration files.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Main export barrel and configuration interface |
| `loader.ts` | Configuration file loading logic |
| `validator.ts` | Schema validation for configuration values |
| `defaults.ts` | Default configuration values |

## Patterns

### Configuration Loading
- Primary: `amalfa.config.ts` (TypeScript module)
- Fallback: `amalfa.config.json` (JSON format)
- Environment variables can override config values

### Validation
- Uses schema validation to ensure configuration integrity
- Provides helpful error messages for missing or invalid values

### Access Pattern
```typescript
import { config } from './config';

const apiKey = config.get('api.key');
```

## ⚠️ Stability
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.