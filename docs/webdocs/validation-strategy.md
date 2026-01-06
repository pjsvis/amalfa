# Validation Strategy: Belt & Braces

**Date:** 2025-12-12  
**Status:** Implemented  
**Philosophy:** Test Expectations Against Reality

---

## Overview

The validation framework implements a **Contract Testing** approach where we:
1. **Declare expectations** before operations
2. **Execute operations** (ingestion, transformation)
3. **Validate results** against baselines and expectations
4. **Fail fast** if validation fails (exit code 1)

This ensures **data integrity**, **prevents silent failures**, and **documents expected behavior**.

---

## Architecture

### Three-Layer Validation

```
┌─────────────────────────────────────────┐
│ Layer 1: Baseline Snapshot             │
│ Capture DB state BEFORE operation      │
│ { nodes: 327, edges: 1516, vectors: 139 }│
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Layer 2: Operation Expectations        │
│ Define what SHOULD happen               │
│ { min_nodes_added: 68, max_errors: 0 } │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Layer 3: Post-Operation Validation     │
│ Compare results vs baseline + expectations│
│ Report pass/fail with detailed errors  │
└─────────────────────────────────────────┘
```

---

## Implementation

### Core Validator (`scripts/utils/validator.ts`)

```typescript
const validator = new PipelineValidator();

// 1. Capture baseline
validator.captureBaseline(db);

// 2. Set expectations
validator.expect({
  files_to_process: 138,
  min_nodes_added: 138,
  required_vector_coverage: "experience"
});

// 3. Validate after operation
const report = validator.validate(db);
validator.printReport(report);

// 4. Exit with error if failed
if (!report.passed) {
  process.exit(1);
}
```

### Checks Performed

#### Quantitative Checks
- **Minimum Nodes Added:** `(results.nodes - baseline.nodes) >= min_nodes_added`
- **Vector Coverage:** 
  - `"all"`: Every node must have an embedding
  - `"experience"`: All experience domain nodes must have embeddings
  - `"none"`: No vector coverage required
- **Orphaned Edges:** `COUNT(edges where source/target not in nodes) == 0`
- **Duplicate Nodes:** `COUNT(nodes grouped by id having count > 1) == 0`

#### Qualitative Checks (Future)
- Console log parsing for `ERROR`, `❌`, `WARN` patterns
- Error categorization and summarization

---

## Integration Points

### 1. `ingest.ts` (Resonance Pipeline)
```typescript
// After ingestion completes
validator.expect({
  files_to_process: processedCount,
  min_nodes_added: processedCount,
  required_vector_coverage: "experience"
});

const report = validator.validate(sqliteDb);
validator.printReport(report);
```

### 2. `ingest_experience_graph.ts` (Experience Pipeline)
```typescript
// After experience graph ingest
validator.expect({
  files_to_process: indexData.length,
  min_nodes_added: indexData.length,
  required_vector_coverage: "none"
});

const report = validator.validate(db);
validator.printReport(report);
```

### 3. Standalone Validation (`scripts/verify/validate_db.ts`)
```bash
# Manual database health check
bun run scripts/verify/validate_db.ts
```

---

## Example Output

### Success Case
```
📊 Baseline Captured:
   - Nodes: 327
   - Edges: 1516
   - Vectors: 139

🎯 Expectations Set:
   - Files to process: 68
   - Min nodes to add: 68
   - Vector coverage: experience

============================================================
🧪 VALIDATION REPORT
============================================================
✅ PASSED | +68 nodes, +123 edges, +68 vectors

📊 Final State:
   - Nodes: 395
   - Edges: 1639
   - Vectors: 207
============================================================
```

### Failure Case
```
============================================================
🧪 VALIDATION REPORT
============================================================
❌ FAILED | +1 nodes, +1 edges, +1 vectors

❌ ERRORS:
   - [min_nodes_added] Expected at least 68 nodes added, got 1
   - [orphaned_edges] Found 2 orphaned edges (pointing to non-existent nodes)

⚠️  WARNINGS:
   - [vector_coverage] Expected vectors for all experience nodes (68), got 1

📊 Final State:
   - Nodes: 328
   - Edges: 1517
   - Vectors: 140
============================================================

💡 Tip: Run ingestion pipeline to fix data integrity issues.
```

---

## Benefits

### Immediate
1. **Catches Silent Failures:** Scripts that complete without errors but produce wrong data are caught
2. **Data Integrity:** Orphaned edges, duplicate nodes detected instantly
3. **Debugging Speed:** Know exactly which invariant failed
4. **Self-Documenting:** Expectations serve as inline documentation

### Long-Term
1. **Regression Detection:** Changes that break invariants fail in CI
2. **Refactoring Confidence:** Can safely optimize if validation passes
3. **Agent Handoff:** Future AI agents get clear pass/fail signals
4. **Historical Baselines:** Track database growth over time

---

## Current Known Issues

### Issue 1: Idempotent Ingest
**Observation:** Running `ingest.ts` twice adds 0 nodes (idempotent skip)  
**Validation Failure:** `min_nodes_added` expectation fails  
**Resolution:** Validator correctly identifies this as suspicious (might be legitimately unchanged OR a bug)

### Issue 2: Orphaned Edges
**Observation:** 2 orphaned edges detected in current database  
**Impact:** Graph visualization may show broken connections  
**Fix Required:** Run `scripts/verify/validate_db.ts` to identify specific edges, then remove or fix references

---

## Future Enhancements

### Phase 2: Console Log Parsing
```typescript
const logCapture = new ConsoleCapture();
logCapture.start();

// ... ingestion ...

logCapture.stop();
const errorCount = logCapture.count("ERROR", "❌");
validator.assert(
  errorCount <= 0,
  "error_threshold",
  `Found ${errorCount} errors in console output`
);
```

### Phase 3: Performance Assertions
```typescript
validator.expect({
  max_duration_sec: 30,
  min_throughput_chars_sec: 20000
});
```

### Phase 4: Schema Validation
```typescript
// Verify domain values are in allowed set
validator.assertDomainValues(["persona", "resonance", "system", "knowledge"]);

// Verify all required columns exist
validator.assertSchemaIntegrity();
```

---

## Usage Examples

### Quick Health Check
```bash
bun run scripts/verify/validate_db.ts
```

### Full Rebuild with Validation
```bash
# Clean slate
rm public/resonance.db

# Rebuild (will fail if validation fails)
bun run scripts/pipeline/ingest.ts

# If passed, validation report shows final stats
```

### CI Integration (Future)
```yaml
# .github/workflows/validate.yml
- name: Validate Database Integrity
  run: |
    bun run scripts/pipeline/ingest.ts
    # Pipeline will exit(1) if validation fails
```

---

## Files

- **Validator:** `scripts/utils/validator.ts`
- **Integrated Into:**
  - `scripts/pipeline/ingest.ts`
  - `scripts/pipeline/ingest_experience_graph.ts`
- **Standalone Check:** `scripts/verify/validate_db.ts`
- **Documentation:** `docs/validation-strategy.md` (this file)

---

## Summary

The validation framework ensures **belt & braces** protection by:
1. Capturing **baseline state** before changes
2. Declaring **explicit expectations**
3. **Validating results** against both
4. **Failing fast** with detailed error reports

This prevents silent data corruption, documents expected behavior, and gives developers/agents clear feedback on data integrity.
