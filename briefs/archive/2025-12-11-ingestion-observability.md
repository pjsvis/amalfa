## Task: Ingestion Pipeline Observability

**Objective:** Instrument the ingestion pipeline with comprehensive stats tracking and verification to detect silent failures (e.g., PERSONA graph losing 3,000 edges without error).

- [ ] Add checkpoint stats at each pipeline stage
- [ ] Implement round-trip verification (expected vs actual counts)
- [ ] Generate detailed ingestion reports with metrics
- [ ] Fail loudly when expectations don't match reality

## Key Actions Checklist:

### 1. Baseline Management
- [ ] Create `ingestion-baseline.json` with known-good expected values
- [ ] Store baseline in `.resonance/` directory
- [ ] Version baseline file (track in git)
- [ ] Create `scripts/update-baseline.ts` for intentional updates

### 2. Stats Tracking Infrastructure
- [ ] Create `IngestionStats` class to track metrics across pipeline stages
- [ ] Add checkpoint methods: `recordParse()`, `recordExtract()`, `recordWeave()`, `recordInsert()`
- [ ] Track by domain (persona vs experience) and type (nodes, edges, vectors)

### 2. Instrumentation Points
- [ ] **Stage 1: Lexicon Load** - Record items loaded, nodes created
- [ ] **Stage 2: CDA Parse** - Record directives loaded, edges extracted from tags
- [ ] **Stage 3: Edge Weaving** - Record edges created by EdgeWeaver (by type: MENTIONS, CONTAINS, etc.)
- [ ] **Stage 4: Database Insert** - Record actual inserts (nodes, edges, vectors)
- [ ] **Stage 5: Verification** - Query database and compare to expected counts

### 3. Verification Gates
- [ ] After each major stage, compare expected vs actual counts
- [ ] Flag mismatches as ERRORS (not warnings)
- [ ] Halt pipeline if critical metrics fail verification
- [ ] Generate diff report showing what's missing

### 4. Reporting
- [ ] Real-time console output with progress indicators
- [ ] Final summary table (expected vs actual for all metrics)
- [ ] Markdown report saved to `reports/ingestion-stats-YYYY-MM-DD.md`
- [ ] Include historical comparison (vs previous run)

### 5. PERSONA Pipeline Focus
- [ ] Verify lexicon → nodes mapping (161 expected)
- [ ] Verify CDA → edges extraction (track by relationship type)
- [ ] **Critical:** Detect if edges drop to 0 (was 3,000 → now 0)
- [ ] Identify root cause of edge loss

### 6. EXPERIENCE Pipeline Focus
- [ ] Verify document → node mapping
- [ ] Verify semantic token extraction coverage
- [ ] Verify EdgeWeaver edge creation (currently 111 edges for 125 docs)

## Detailed Requirements

### Baseline Structure
```json
{
  "version": "1.0.0",
  "last_updated": "2025-12-11",
  "persona": {
    "nodes": {
      "concepts": 161,
      "directives": 89,
      "total": 250
    },
    "edges": {
      "IMPLEMENTS": 1200,
      "GUIDED_BY": 800,
      "RELATED_TO": 1000,
      "total": 3000
    },
    "vectors": 250
  },
  "experience": {
    "nodes": {
      "debriefs": 61,
      "playbooks": 21,
      "briefs": 43,
      "total": 125
    },
    "edges": {
      "MENTIONS": 80,
      "CONTAINS": 31,
      "total": 111
    },
    "vectors": 125
  }
}
```

### Stats Structure
```typescript
interface PipelineStats {
  domain: 'persona' | 'experience';
  stage: 'parse' | 'extract' | 'weave' | 'insert' | 'verify';
  
  expected: {
    nodes: number;
    edges: { [type: string]: number };
    vectors: number;
  };
  
  actual: {
    nodes: number;
    edges: { [type: string]: number };
    vectors: number;
  };
  
  mismatches: Array<{
    metric: string;
    expected: number;
    actual: number;
    delta: number;
  }>;
}
```

### Console Output Example
```
📊 PERSONA Pipeline
   ├─ Lexicon Load: 161 items → 161 nodes ✅
   ├─ CDA Parse: 89 directives → 247 tag edges ✅
   ├─ Edge Weaving: 2,753 relationship edges ✅
   ├─ Database Insert: 3,000 edges queued...
   └─ Verification: 
      Expected: 3,000 edges
      Actual:   0 edges
      ❌ CRITICAL MISMATCH - Pipeline halted
```

### Report Format
```markdown
# Ingestion Report: 2025-12-11

## PERSONA Domain
| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Nodes  | 161      | 161    | ✅     |
| Edges  | 3,000    | 0      | ❌     |
| Vectors| 161      | 161    | ✅     |

### Edge Breakdown
| Type | Expected | Actual | Delta |
|------|----------|--------|-------|
| IMPLEMENTS | 1,200 | 0 | -1,200 |
| GUIDED_BY  | 800   | 0 | -800   |
| RELATED_TO | 1,000 | 0 | -1,000 |

## EXPERIENCE Domain
[Similar table]

## Root Cause Analysis
- PERSONA edges: All edges lost during insert phase
- Investigate: EdgeWeaver output vs DB.insertEdge calls
```

### Verification Logic
```typescript
function verifyStage(stats: PipelineStats) {
  const mismatches = [];
  
  if (stats.actual.nodes !== stats.expected.nodes) {
    mismatches.push({
      metric: 'nodes',
      expected: stats.expected.nodes,
      actual: stats.actual.nodes,
      delta: stats.actual.nodes - stats.expected.nodes
    });
  }
  
  // Check each edge type
  for (const [type, expectedCount] of Object.entries(stats.expected.edges)) {
    const actualCount = stats.actual.edges[type] || 0;
    if (actualCount !== expectedCount) {
      mismatches.push({
        metric: `edges.${type}`,
        expected: expectedCount,
        actual: actualCount,
        delta: actualCount - expectedCount
      });
    }
  }
  
  if (mismatches.length > 0) {
    console.error('❌ VERIFICATION FAILED');
    console.table(mismatches);
    throw new Error('Pipeline verification failed');
  }
}
```

## Success Criteria
- [ ] Pipeline generates stats at every stage
- [ ] Verification catches the PERSONA edge loss (3,000 → 0)
- [ ] Report clearly shows expected vs actual for all metrics
- [ ] Pipeline fails loudly (non-zero exit code) on mismatch
- [ ] Root cause of edge loss is identified and documented

## Non-Goals
- Fixing the edge loss (separate task)
- UI visualization of stats (future enhancement)
- Historical trend analysis (future enhancement)

## Dependencies
- Existing `ingest.ts` pipeline
- `ResonanceDB.getStats()` method
- EdgeWeaver edge creation logic

## Estimated Complexity
**Medium** - Requires instrumentation across multiple pipeline stages but doesn't change core logic.
