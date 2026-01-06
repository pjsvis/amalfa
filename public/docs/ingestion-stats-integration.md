# Ingestion Stats Integration Guide

## Overview

The `IngestionStats` class provides observability for the ingestion pipeline by tracking metrics at each stage and verifying against a baseline to detect silent failures.

## Quick Start

### 1. Import and Initialize

```typescript
import { IngestionStats } from "@resonance/src/services/stats";
import { join } from "path";

const stats = new IngestionStats();
await stats.loadBaseline(join(process.cwd(), "ingestion-baseline.json"));
```

### 2. Track Metrics During Ingestion

#### Lexicon Bootstrap (PERSONA)
```typescript
for (const item of lexiconItems) {
    db.insertNode({
        id: item.id,
        type: "concept",
        domain: "persona",
        ...
    });
    stats.recordNode("persona");
    stats.recordVector("persona"); // if embedding created
}
```

#### Document Ingestion (EXPERIENCE)
```typescript
db.insertNode({
    id: nodeId,
    type: "debrief",
    domain: "experience",
    ...
});
stats.recordNode("experience");
stats.recordVector("experience");
stats.recordSemanticTokens("experience"); // if tokens extracted
```

#### Edge Weaving
```typescript
// After EdgeWeaver creates edges
weaver.weave(nodeId, content, tokens);

// Track each edge created
stats.recordEdge("experience", "MENTIONS");
stats.recordEdge("experience", "CONTAINS");
```

### 3. Verify and Report

```typescript
// Print summary
stats.printSummary();

// Verify against baseline
const mismatches = stats.verifyAgainstBaseline();
stats.printVerification(mismatches);

// Generate markdown report
const reportPath = join(
    process.cwd(), 
    `reports/ingestion-stats-${new Date().toISOString().split('T')[0]}.md`
);
await stats.generateReport(reportPath);

// Fail if mismatches detected
if (mismatches.length > 0) {
    console.error("❌ Baseline verification failed");
    process.exit(1);
}
```

## API Reference

### Methods

#### `recordNode(domain: "persona" | "experience")`
Increment node count for the specified domain.

#### `recordEdge(domain: "persona" | "experience", type: string)`
Increment edge count for the specified domain and type.

#### `recordVector(domain: "persona" | "experience")`
Increment vector count for the specified domain.

#### `recordSemanticTokens(domain: "experience")`
Increment semantic token count for experience domain.

#### `verifyAgainstBaseline(): Mismatch[]`
Compare current metrics against baseline and return mismatches.

#### `printSummary()`
Print formatted summary to console.

#### `printVerification(mismatches: Mismatch[])`
Print verification results with mismatch table.

#### `generateReport(path: string)`
Generate markdown report and save to specified path.

## Example Output

### Console Summary
```
📊 Ingestion Summary
════════════════════════════════════════════════════════════
🧠 PERSONA Domain:
   Nodes:   161
   Edges:   0
   Vectors: 161

📚 EXPERIENCE Domain:
   Nodes:   125
   Edges:   111
   Vectors: 125
   Tokens:  125

════════════════════════════════════════════════════════════
✅ Baseline Verification: PASSED
```

### Verification Failure
```
❌ Baseline Verification: FAILED
════════════════════════════════════════════════════════════
┌─────────┬──────────────┬──────────┬────────┬───────┬──────────────┐
│ Domain  │ Metric       │ Expected │ Actual │ Delta │ Variance %   │
├─────────┼──────────────┼──────────┼────────┼───────┼──────────────┤
│ persona │ edges.total  │ 3000     │ 0      │ -3000 │ 100.0%       │
└─────────┴──────────────┴──────────┴────────┴───────┴──────────────┘
════════════════════════════════════════════════════════════
```

## Baseline Management

### Structure
See `ingestion-baseline.json` for the expected format.

### Updating Baseline
When you intentionally change the expected outcomes (e.g., add new content):

1. Run ingestion and note the new metrics
2. Manually update `ingestion-baseline.json` with new values
3. Commit the baseline change with a descriptive message:
   ```bash
   git add ingestion-baseline.json
   git commit -m "chore: update baseline after adding 10 playbooks"
   ```

**Example Update Workflow:**
```bash
# Run ingestion
bun run scripts/pipeline/ingest.ts

# Note the output:
# EXPERIENCE Domain: Nodes: 135 (was 125)

# Update baseline file
# Change: "total": 125 → "total": 135

# Verify
bun run scripts/pipeline/ingest.ts
# Should now pass verification

# Commit
git add ingestion-baseline.json
git commit -m "chore: baseline updated for 10 new playbooks"
```

### Tolerance
The baseline includes tolerance levels:
- **Nodes:** 2% variance allowed
- **Edges:** 5% variance allowed
- **Vectors:** 2% variance allowed

Exceeding tolerance triggers a verification failure.

## Integration Checklist

- [ ] Import `IngestionStats` in `ingest.ts`
- [ ] Initialize stats and load baseline
- [ ] Add `stats.recordNode()` calls after node inserts
- [ ] Add `stats.recordEdge()` calls after edge creation
- [ ] Add `stats.recordVector()` calls after embedding generation
- [ ] Add `stats.recordSemanticTokens()` calls after token extraction
- [ ] Call `stats.printSummary()` at end of pipeline
- [ ] Call `stats.verifyAgainstBaseline()` and handle mismatches
- [ ] Generate report with `stats.generateReport()`
- [ ] Exit with error code if verification fails

## Testing

Run the test script to verify stats tracking works:

```bash
bun run docs/ingestion-stats-integration.md
```

This will simulate an ingestion and verify against the baseline.
