---
date: 2026-02-05
tags: [brief, refactor, dashboard, jsonl]
status: ready
depends: brief-add-to-wrapper
---

# Brief: Refactor dashboard-daemon.ts JSONL Handling

## Overview

Replace manual `readFileSync` + string operations with `JsonlUtils` and add `to()` wrapper for error handling.

## Current State

File: `src/services/dashboard-daemon.ts`

Lines 341-352 show problematic JSONL reading:

```typescript
private async getRecentRuns() {
  const runsFile = ".amalfa/runs.jsonl";
  if (!existsSync(runsFile)) return [];

  const lines = readFileSync(runsFile, "utf-8")
    .split("\n")
    .filter((l) => l.trim());

  return lines
    .slice(-10)
    .reverse()
    .map((line) => JSON.parse(line));
}
```

Issues:
- Uses `readFileSync` instead of `Bun.file()` or `JsonlUtils`
- No error handling for `JSON.parse` failures
- Manual string split instead of line-based streaming
- No `to()` wrapper

## Required Changes

### 1. Use `JsonlUtils.readAll()`

```typescript
import { JsonlUtils } from "@src/utils/JsonlUtils";
import * as R from 'remeda';

private async getRecentRuns(): Promise<RunsEntry[]> {
  const runsFile = ".amalfa/runs.jsonl";

  const entries = await JsonlUtils.readAll<RunsEntry>(runsFile);
  if (R.isEmpty(entries)) return [];

  return R.slice(entries, -10).reverse();
}
```

### 2. Add TypeScript interface

```typescript
interface RunsEntry {
  timestamp: string;
  command: string;
  status: string;
  duration?: number;
}
```

### 3. Remove unused imports

After refactor, should not need:
- `readFileSync` from `node:fs` (check if used elsewhere first)

## Success Criteria

- [ ] `getRecentRuns()` uses `JsonlUtils.readAll()`
- [ ] Uses `R.pipe()` or `R` utilities for slicing/reversing
- [ ] Empty array early return
- [ ] TypeScript compiles without errors
- [ ] Dashboard still displays recent runs correctly

## See Also

- `src/utils/JsonlUtils.ts` - Utilities
- `playbooks/remeda-playbook.md` - R.pipe patterns
- `brief-add-to-wrapper.md` - Depends on this being done first
