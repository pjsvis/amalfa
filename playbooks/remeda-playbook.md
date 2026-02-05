---
date: 2026-02-05
tags: [playbook, typescript, remeda, data-engineering, ingestion]
---

# Remeda Playbook

Remeda is our "Brutal Ingestion Toolkit" for data engineering. It provides functional, immutable operations that make code predictable, testable, and agent-readable.

## Core Philosophy

**"Always Pipe, Never Nest"** - Data flows from top to bottom. No nested `map(filter(data))`.

## Installation

Remeda is already installed: `^2.33.5`

```bash
bun add remeda
```

## The Bouncer Pattern (Early Return)

Validate at the gate and bounce invalid data immediately. Flattens code and narrows types early.

```typescript
import * as R from 'remeda';

const processItems = (items: unknown[]) => {
  // Bouncer: Empty array, exit early
  if (R.isEmpty(items)) return [];

  return R.pipe(
    items,
    R.filter((item) => item != null),
    R.map((item) => transform(item))
  );
};
```

**Benefits:**
- TypeScript narrows types at each step
- Empty case handled explicitly
- No wasted cycles on invalid data

## The `to()` Wrapper

Exceptions are not for flow control. Wrap async operations in `to()` for explicit error handling.

```typescript
import * as R from 'remeda';

async function to<T, E = Error>(
  promise: Promise<T>
): Promise<[E, undefined] | [null, T]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err as E, undefined];
  }
}

// Usage: Explicit error handling
const [err, data] = await to(fetchData());
if (err) {
  log.error({ err }, "Fetch failed");
  return [];
}
return data;
```

## Remeda vs Native Patterns

| Operation | Native | Remeda | Why Remeda |
|-----------|--------|--------|------------|
| Filter nulls | `.filter(x => !!x)` | `R.compact` | Narrows types correctly |
| First item | `arr[0]` | `R.first()` | Returns `T \| undefined`, forces handling |
| Last item | `arr[arr.length - 1]` | `R.last()` | Same safety as first |
| Sort | `arr.sort()` | `R.sort(arr, ...)` | Immutable, returns new array |
| Pick keys | Manual | `R.pick(obj, keys)` | Explicit, type-safe |
| Omit keys | `delete obj.key` | `R.omit(obj, keys)` | Immutable, no mutation |
| Group by | `reduce` | `R.groupBy` | Readable primitive |
| Flatten | `.flat(1)` | `R.flatten` | Consistent behavior |

## Empty Array Early Return

Return early when processing empty arrays. Gives TypeScript exact type information.

```typescript
function getItems(): Item[] {
  const rows = db.query("SELECT * FROM items").all();
  if (rows.length === 0) return [];
  return rows.map((row) => mapToItem(row));
}

// Or with Remeda
function getItems(): Item[] {
  const rows = db.query("SELECT * FROM items").all();
  if (R.isEmpty(rows)) return [];
  return R.map(rows, (row) => mapToItem(row));
}
```

## No-Op Pattern

Explicitly define no-op values for optional handlers.

```typescript
import * as R from 'remeda';

const noop = () => {};

interface HandlerOptions {
  onSuccess?: () => void;
  onFailure?: () => void;
  onSkip?: () => void;
}

const handlers: HandlerOptions = {
  onSuccess: () => console.log("done"),
  onFailure: () => console.log("failed"),
  onSkip: noop,
};

// Clean call site
handlers.onSkip();
```

## Immutable Object Manipulation

Never mutate objects. Use `R.pick`, `R.omit`, `R.readonly`.

```typescript
// Strip sensitive data - immutable
const publicProfile = R.pipe(
  userRecord,
  R.pick(['id', 'username', 'avatar']),
  R.readonly
);

// Add computed field - returns new object
const withTimestamp = R.merge(userRecord, {
  createdAt: new Date().toISOString()
});
```

## JSONL Streaming (Ingestion Pipelines)

For large data files, stream JSONL instead of parsing massive JSON arrays.

```typescript
import * as R from 'remeda';
import { to } from './utils';

async function processJsonl(path: string): Promise<Processed[]> {
  const file = Bun.file(path);
  const text = await file.text();

  const lines = R.pipe(
    text.split('\n'),
    R.filter((line) => line.trim().length > 0)
  );

  const results: Processed[] = [];

  for (const line of lines) {
    const [err, data] = await to(JSON.parse(line));
    if (err) {
      log.error({ err, line }, "Parse failed");
      continue;
    }
    results.push(transform(data));
  }

  return results;
}
```

## Idempotency with Hashing

Every record generates a deterministic ID via `Bun.hash()`.

```typescript
import * as R from 'remeda';

function generateIdempotencyKey(record: RawRecord): string {
  const normalized = R.pipe(
    record,
    R.pick(['type', 'source', 'content']),
    JSON.stringify
  );
  return `hash_${Bun.hash(normalized)}`;
}
```

## Error Handling Patterns

### Bouncer with `R.isDefined`

```typescript
const processInput = (input: string | null) => {
  return R.pipe(
    input,
    R.confirm(R.isDefined),  // Bouncer: fails if null
    R.map((s) => s.trim()),
    R.map((s) => s.toLowerCase())
  );
};
```

### Result Type for Production

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function parseItem(input: unknown): Result<ProcessedItem> {
  if (R.isEmpty(input)) {
    return { success: false, error: "Empty input" };
  }
  // ... parsing logic
  return { success: true, data: parsed };
}
```

## Playbook Summary

| Pattern | Remeda Strategy | Rationale |
|---------|-----------------|-----------|
| Logic Flow | `R.pipe` | Linear, agent-readable |
| Null Safety | `R.compact` | Hard type narrowing |
| Indexing | `R.first()` / `R.last()` | Forces undefined handling |
| Objects | `R.pick()` / `R.omit()` | Explicit, immutable |
| Grouping | `R.groupBy()` | Replaces complex reduce |
| Error Handling | `to()` wrapper | Explicit tuples |
| Empty Cases | `R.isEmpty()` | Early exit |

## When to Use

| Scenario | Approach |
|----------|----------|
| Data transformation (2+ steps) | `R.pipe()` |
| Ingestion pipelines | JSONL + `to()` + pipe |
| API responses | `R.compact()` + error handling |
| Object shaping | `R.pick()` / `R.omit()` |
| Optional handlers | No-op pattern |
| Empty arrays | Early return `[]` |

## Anti-Patterns to Avoid

```typescript
// BAD: Nested
const result = users.filter(u => u.active).map(u => u.name);

// GOOD: Piped
const result = R.pipe(
  users,
  R.filter((u) => u.active),
  R.map((u) => u.name)
);

// BAD: Mutating
users.sort((a, b) => a.name.localeCompare(b.name));
users.push(newUser);

// GOOD: Immutable
const sorted = R.sort(users, (a, b) => a.name.localeCompare(b.name));
const updated = R.append(users, newUser);
```

## See Also

- `playbooks/typescript-patterns-playbook.md` - TypeScript specific patterns
- `playbooks/problem-solving-playbook.md` - Debugging strategies
