---
date: 2026-02-05
tags: [brief, refactor, utility, error-handling]
status: ready
---

# Brief: Add `to()` Wrapper to JsonlUtils

## Overview

Add the `to()` error wrapper to `JsonlUtils` for explicit async error handling.

## Current State

`src/utils/JsonlUtils.ts` has:
- `append()`, `appendAsync()` - write operations
- `stream()` - async generator
- `process()` - line-by-line callback
- `readAll()` - read all into memory

Missing: explicit error handling for async operations.

## Required Changes

### Add `to()` function

```typescript
/**
 * The "to" Wrapper: Converts a promise into a [error, data] tuple.
 * Eliminates try/catch nesting.
 */
export async function to<T, E = Error>(
  promise: Promise<T>
): Promise<[E, undefined] | [null, T]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err as E, undefined];
  }
}
```

### Add `toJsonl()` helper

```typescript
/**
 * Parse a JSONL line with error handling.
 */
export async function toJsonl<T>(
  line: string
): Promise<[Error, undefined] | [null, T]> {
  if (!line.trim()) return [null, undefined as any];
  return to(JSON.parse(line));
}
```

## Usage Examples

```typescript
import { to } from './JsonlUtils';

// Before: try/catch nesting
try {
  const data = await fetchData();
  return data;
} catch (err) {
  log.error({ err });
  return [];
}

// After: explicit tuple
const [err, data] = await to(fetchData());
if (err) {
  log.error({ err });
  return [];
}
return data;
```

## Success Criteria

- [ ] `to()` function added to `JsonlUtils`
- [ ] `toJsonl()` helper added for safe JSON parsing
- [ ] TypeScript compiles without errors
- [ ] Brief refactor dashboard-daemon uses the new utilities

## See Also

- `playbooks/remeda-playbook.md` - The `to()` pattern
- `src/utils/JsonlUtils.ts` - Current implementation
