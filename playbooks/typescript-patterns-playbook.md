---
date: 2026-01-13
tags: [playbook, typescript, patterns, best-practices]
---

# TypeScript Patterns Playbook

Patterns for handling TypeScript's type system in pragmatic ways, particularly where static analysis cannot verify runtime behavior.

## Regex Capture Group Extraction

### The Problem

TypeScript types regex capture groups as `string | undefined` because it cannot statically verify:
1. That the regex will match at all
2. That specific capture groups will be populated

```typescript
const match = text.match(/id=(\d+)/);
const id = match[1];  // Error: 'string | undefined' not assignable to 'string'
```

### Anti-Patterns

**Scattered non-null assertions:**
```typescript
// Bad: biome flags noNonNullAssertion, intent unclear
const id = match![1];
const name = otherMatch![2];
```

**Inline type assertions:**
```typescript
// Bad: hides the runtime risk, no error handling
const id = match[1] as string;
```

**ts-expect-error:**
```typescript
// Bad: suppresses all errors on the line, maintenance hazard
// @ts-expect-error
const id = match[1];
```

### Recommended Pattern: Extraction Helper

Centralize the runtime check in a helper function. The error handling strategy depends on context.

#### For Tests: Throw on Failure

In test utilities, throwing is correct. A failed extraction means the test setup is broken—an exceptional condition that should fail fast with a clear stack trace:

```typescript
function extractId(reference: string): string {
  const match = reference.match(/Scratchpad\.read\("([^"]+)"\)/);
  if (!match?.[1]) {
    throw new Error("Could not extract ID from reference");
  }
  return match[1];
}

// Usage is clean, test fails immediately if regex breaks
const id = extractId(reference);
const entry = scratchpad.read(id);
```

**Why throw in tests:**
- Failure = test setup is wrong, not a case to handle
- Clean call sites without error handling boilerplate
- Stack trace points directly to the problem
- Satisfies both TypeScript and biome linting

#### For Production: Result Types

In production code, regex mismatches are often *expected* failure modes. Use discriminated unions to force callers to handle both cases:

```typescript
type ExtractionResult = 
  | { success: true; id: string }
  | { success: false; error: string };

function extractId(ref: string): ExtractionResult {
  const match = ref.match(/id=([^&]+)/);
  if (!match?.[1]) {
    return { success: false, error: "No ID found in reference" };
  }
  return { success: true, id: match[1] };
}

// Caller must handle both cases
const result = extractId(userInput);
if (!result.success) {
  log.warn(result.error);
  return fallbackBehavior();
}
processId(result.id);
```

**Why result types in production:**
- Invalid input is expected, not exceptional
- Caller decides how to handle failure (log, retry, fallback)
- No hidden control flow via exceptions
- Type system enforces error handling

### When to Use Each Approach

| Scenario | Approach | Rationale |
|----------|----------|-----------|
| Test utilities | Throw | Failure = broken test, want fast crash |
| Production parsing | Result type | Failure = expected case to handle |
| Library/API | Result type | Caller decides error handling |
| One-off scripts | Non-null `!` | Acceptable for throwaway code |
| Validated input | `as string` | After explicit existence check |

## Optional Chaining vs Non-Null Assertion

Prefer optional chaining (`?.`) when the value *might* legitimately be null:

```typescript
// Good: handles null case gracefully
const name = user?.profile?.name ?? "Anonymous";

// Bad: crashes if user is null
const name = user!.profile!.name;
```

Use non-null assertion only when you have *external knowledge* that TypeScript cannot infer:

```typescript
// Acceptable: we just called .set(), we know it exists
map.set(key, value);
const retrieved = map.get(key)!;
```

## Array Access Safety

TypeScript does not narrow array access by default. Use optional chaining or explicit checks:

```typescript
const items = ["a", "b", "c"];

// Risky: items[10] returns undefined, not caught by TS
const tenth = items[10];

// Safe: explicit undefined handling
const tenth = items[10] ?? "default";

// Safe: check before access
if (items.length > 10) {
  const tenth = items[10];
}
```

## Empty Array Early Return

Return early when processing an empty array. This gives TypeScript exact type information and is honest about the work done.

```typescript
function getItems(): Item[] {
  const rows = db.query("SELECT * FROM items").all();
  if (rows.length === 0) return [];
  return rows.map((row) => mapToItem(row));
}
```

**Benefits:**
- TypeScript infers exact `Item[]` from empty literal `[]`
- No map inference chain to trace
- Honest: "I processed your empty array, here it is"
- Defensive: handles the edge case explicitly

## No-Op Pattern

When an option or callback can legitimately "do nothing," define a no-op value explicitly.

```typescript
// No-op as a function
const noop = () => {};

// No-op as a value
const noop = {};

// Usage in options
interface HandlerOptions {
  onSuccess?: () => void;
  onFailure?: () => void;
  onSkip?: () => void;
}

const handlers: HandlerOptions = {
  onSuccess: () => console.log("done"),
  onFailure: () => console.log("failed"),
  onSkip: noop,  // Explicit: I chose to do nothing
};

// Clean call site - no conditionals needed
handlers.onSkip();
handlers.onSuccess();
```

**Benefits:**
- **Explicit** - "I considered this case and chose no-op"
- **Truthy** - no `if (handler) handler()` checks needed
- **Type-safe** - always consistent return type
- **Composable** - can be selected or overridden from options

**Use cases:**
- Logger options where logging is optional
- Event handlers where some events do nothing
- Callback hooks in lifecycle methods
- Feature flags that disable behavior

## See Also

- `playbooks/biome-playbook.md` - Linting rules and configuration
- `playbooks/problem-solving-playbook.md` - Debugging strategies
