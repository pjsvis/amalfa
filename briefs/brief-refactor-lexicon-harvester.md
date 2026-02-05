---
date: 2026-02-05
tags: [brief, refactor, harvester, remeda]
status: ready
depends: brief-add-to-wrapper
---

# Brief: Refactor LexiconHarvester.ts with Remeda

## Overview

Refactor `LexiconHarvester.ts` to use `R.pipe()` for transformations, immutable operations, and `to()` wrapper for error handling.

## Current State

File: `src/core/LexiconHarvester.ts`

### Problem Areas

#### 1. Nested `.map()` and `.forEach()` (Lines 118-127)

```typescript
const terms = [
  ...(data.entities || []).map((e) => ({
    t: e.name || (typeof e === "string" ? e : String(e)),
    type: "entity",
  })),
  ...(data.concepts || []).map((c) => ({
    t: c.name || (typeof c === "string" ? c : String(c)),
    type: "concept",
  })),
];

for (const { t, type } of terms) {
  // ... processing
}
```

Issues:
- Nested spread operators
- No type narrowing
- Manual for-of loop

#### 2. Mutable Sort (Lines 160-162)

```typescript
const sorted = Array.from(this.candidates.values()).sort(
  (a, b) => b.frequency - a.frequency,
);
```

Issues:
- Mutates intermediate array
- Could use immutable `R.sort()`

#### 3. Silent Catch Blocks (Lines 47, 102)

```typescript
} catch (_e) {
  console.warn(...);
}
```

Issues:
- Silently ignores errors
- No `to()` wrapper

## Required Changes

### 1. Transform Terms with `R.pipe()` + `R.flatMap()`

```typescript
import * as R from 'remeda';

private extractTerms(data: LangExtractSidecar) {
  const entities = R.pipe(
    data.entities ?? [],
    R.compact(),
    R.map((e) => ({
      t: typeof e === "string" ? e : e.name ?? String(e),
      type: "entity" as const,
    }))
  );

  const concepts = R.pipe(
    data.concepts ?? [],
    R.compact(),
    R.map((c) => ({
      t: typeof c === "string" ? c : c.name ?? String(c),
      type: "concept" as const,
    }))
  );

  return R.flatMap(entities, (e) => [...e, ...concepts]);
}
```

### 2. Immutable Sort

```typescript
const sorted = R.sort(
  Array.from(this.candidates.values()),
  (a, b) => b.frequency - a.frequency
);
```

### 3. Add `to()` Wrapper for Async Operations

```typescript
import { to } from '../utils/JsonlUtils';

// In loadStopList()
const [err, content] = await to(bunFile.json());
if (err) {
  console.warn(`⚠️  Could not load stop-list: ${err}`);
  return;
}

// Process content with R.pipe
if (Array.isArray(content)) {
  // ... existing logic
}
```

### 4. Update Imports

```typescript
import * as R from 'remeda';
import { to } from '../utils/JsonlUtils';
```

## Additional Improvements

### 5. Use `R.isEmpty()` for Early Returns

```typescript
public async harvest() {
  await this.loadStopList();
  await this.loadManifest();

  const files = (await readdir(this.config.cacheDir))
    .filter((f) => f.endsWith(".json") && !f.startsWith("."));

  if (R.isEmpty(files)) {
    console.log("📂 No sidecars found.");
    return;
  }
  // ...
}
```

### 6. Extract `normalize()` to Utility

Consider moving `normalize()` to `JsonlUtils` or creating a `StringUtils`:

```typescript
export function normalizeTerm(term: string): string {
  return term.toLowerCase().trim();
}
```

## Success Criteria

- [ ] All `.map()` chains converted to `R.pipe()`
- [ ] All `.sort()` replaced with immutable `R.sort()`
- [ ] All `catch (_e)` replaced with `to()` wrapper
- [ ] Uses `R.isEmpty()` for early returns
- [ ] TypeScript compiles without errors
- [ ] Harvest produces identical output
- [ ] All tests pass

## Estimated Effort

- 2-3 hours for full refactor
- Testing: 1 hour

## See Also

- `playbooks/remeda-playbook.md` - Remeda patterns
- `src/core/LexiconHarvester.ts` - Current implementation
- `brief-add-to-wrapper.md` - Depends on `to()` being available
