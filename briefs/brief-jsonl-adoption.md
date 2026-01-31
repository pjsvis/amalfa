# Brief: JSONL Adoption for Intermediate Data Formats

**Date:** 2026-01-31  
**Status:** 🚧 Draft  
**Target:** Implementation Phase

## Executive Summary

Adopt **JSONL (JSON Lines)** as the standard format for all intermediate, high-volume, or streamable data artifacts within the Amalfa ecosystem. This shifts the architecture from "Load & Process" (memory-bound) to "Stream & Filter" (IO-bound), aligning with the "Unixie" philosophy of the toolkit.

## The Problem: The "Dreaded Blob"

Currently, several parts of the system rely on standard JSON arrays (the "Blob") for data persistence. This has critical drawbacks:
1. **Memory Pressure:** Reading a large `edges.json` or `candidates.json` requires parsing the entire file into RAM.
2. **Atomicity:** Appending a single record to a JSON array requires rewriting the entire file (finding the closing `]`, backing up, writing `,`, etc., or reading/writing whole file).
3. **Auditability:** Standard CLI tools like `grep`, `wc`, `head`, and `tail` cannot meaningfully inspect or filter a minified or deeply nested JSON array.

## The Solution: The "Noble Line" (JSONL)

**JSONL (Newline Delimited JSON)** enforces that every line is a complete, valid JSON object.

### Benefits
1. **Streamable:** Can be processed line-by-line using standard Node.js streams or `readline`. massive datasets (GBs) use constant RAM (MBs).
2. **Append-Only:** Adding a record is an $O(1)$ operation: `fs.appendFileSync(file, JSON.stringify(obj) + '\n')`.
3. **Crash-Safe:** If a process dies while writing line 1000, lines 1-999 are perfectly valid. In standard JSON, a truncated file is corrupt.
4. **Unix-Friendly:**
   - Count records: `wc -l file.jsonl`
   - Find "Entropy": `grep "entropy" file.jsonl`
   - Sample data: `head -n 5 file.jsonl`

## Implementation Strategy

### 1. Identify Migration Targets

We must audit existing file outputs. **Configuration files (`config.json`, `package.json`) MUST stay as standard JSON.**

**Primary Candidates:**
- **Harvester Outputs:** The proposed `lexicon-candidates.json` --> `lexicon-candidates.jsonl`.
- **Edge Lists:** The proposed `proposed-edges.json` --> `proposed-edges.jsonl`.
- **Activity Logs:** Any potential audit logs or operation traces.
- **Sidecar Aggregates:** If we ever aggregate sidecars into a single file, it must be JSONL.
- **Cache Manifests:** `.amalfa/harvest-skipped.json` (currently JSON) could be `harvest-skipped.jsonl` for easier appending.

### 2. Tooling Support (`src/utils/JsonlUtils.ts`)

Create a lightweight utility wrapper for consistent JSONL handling.

```typescript
export class JsonlUtils {
  // Append a single record
  static async append(path: string, data: any): Promise<void>;
  
  // Stream file calling callback for each line
  static async stream<T>(path: string, onLine: (data: T) => Promise<void>): Promise<void>;
  
  // Read all (for small files only)
  static async readAll<T>(path: string): Promise<T[]>;
}
```

### 3. Migration Plan

#### Phase A: New Features (Immediate)
- Ensure the **Lexicon Harvester** (next task) is built using JSONL natively for `candidates` and `edges`.

#### Phase B: Retrofit (Maintenance)
- **Harvester Cache:** Switch `.amalfa/harvest-skipped.json` to JSONL.
- **Ember Sidecars:** *Decision Point:* Sidecars (`*.ember.json`) are currently individual files. Aggregating them into a single `corpus.ember.jsonl` could speed up "Full Sweep" operations significantly (avoiding 1000s of `fs.open` calls).
    - *Proposal:* Keep individual sidecars for incremental updates ("Watcher" mode). Use `corpus.ember.jsonl` as a cached "Snapshot" for the Harvester to read from?

## Decision Required

1. **Confirm Adoption:** Shall we mandate JSONL for all *generated data lists*?
2. **Sidecar Strategy:** Do we keep individual `.ember.json` files (better for git diffs/watching) or move to a managed `.jsonl` database?
    - *Recommendation:* Keep source files as Markdown. Keep Sidecars as individual JSONs (for now) to map 1:1 to files. Use JSONL for **Aggregated** data (Candidates, Edges, Logs).

## Next Steps

1. Create `src/utils/JsonlUtils.ts`.
2. Implement Lexicon Harvester using correct `.jsonl` formats.
3. Update `_CURRENT_TASK.md` to reflect this architectural standard.
