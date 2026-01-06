# Brief: Auto-Wikilinker — Vector-Powered Link Suggestions

**Locus Tag:** `[Locus: Auto_Wikilinker]`

## Problem Statement

ResonanceDB has 289 vector embeddings but only 499 edges. The semantic harvester yields <1% of edges despite significant ML complexity. We need a high-yield, low-complexity edge generation method that leverages existing vectors.

## Proposed Solution

**Auto-Wikilinker**: Use vector similarity to suggest `[[wikilinks]]` that humans review and approve.

```
┌─────────────────────────────────────────────────────────┐
│                    Workflow                             │
├─────────────────────────────────────────────────────────┤
│  1. suggest-links.ts                                    │
│     → Scan documents                                    │
│     → Find similar nodes (vector search)                │
│     → Output: suggestions.json                          │
│                                                         │
│  2. Human Review (UI or manual)                         │
│     → Accept/reject suggestions                         │
│     → Mark as "approved"                                │
│                                                         │
│  3. apply-links.ts                                      │
│     → Read approved suggestions                         │
│     → Inject [[wikilinks]] into source markdown         │
│                                                         │
│  4. On next ingest                                      │
│     → Parse [[links]] → create LINKS_TO edges           │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Link Suggester (`scripts/suggest-links.ts`)

```typescript
interface LinkSuggestion {
  source_id: string;
  source_file: string;
  suggestions: Array<{
    target_id: string;
    target_file: string;
    similarity: number;         // Raw cosine similarity
    confidence: number;         // Bayesian posterior (starts 0.5)
    judicial_score?: number;    // 1-5 rubric score (after review)
    veracity?: number;          // judicial_score / 5
    status: "pending" | "approved" | "rejected";
  }>;
}
```

**Algorithm:**
1. For each node with embedding
2. Find top-k similar nodes (k=5, threshold 0.7)
3. Initialize confidence = 0.5 + (similarity - 0.7) * 0.5 (prior boost for high similarity)
4. Filter out self-links and existing edges
5. Write to `suggestions.json`

### 2. Suggestions File (`ingest/suggestions.json`)

Persisted JSON artifact for review:

```json
{
  "generated": "2025-12-28T19:30:00Z",
  "suggestions": [
    {
      "source_id": "2025-12-28-session-wrap-up",
      "source_file": "/path/to/debriefs/2025-12-28-session-wrap-up.md",
      "suggestions": [
        {
          "target_id": "brief-hollow-node",
          "target_file": "/path/to/briefs/brief-hollow-node.md",
          "similarity": 0.89,
          "confidence": 0.60,
          "judicial_score": null,
          "veracity": null,
          "status": "pending"
        }
      ]
    }
  ]
}
```

### 3. Link Applicator (`scripts/apply-links.ts`)

Reads approved suggestions and:
1. Opens source file
2. Appends link block (non-destructive):
   ```markdown
   <!-- auto-wikilinks -->
   [[brief-hollow-node]] | [[docs/edge-generation-methods]]
   ```
3. Or injects inline where appropriate

### 4. Wikilink Parser (Ingestor update)

On ingestion, parse `[[target]]` patterns and create edges:
```typescript
type: "LINKS_TO"
source: current_node_id
target: resolved_target_id
confidence: suggestion.confidence   // Bayesian posterior
veracity: suggestion.veracity       // Judicial score / 5
context_source: "wikilink"
```

---

## Scoring Framework

### Judicial Veracity (Rubric-Based)

Human review uses a **1-5 judicial rubric**:

| Score | Label | Criteria |
|-------|-------|----------|
| **5** | Definitive | Explicit reference, same topic (Brief A defines what Debrief B implements) |
| **4** | Strong | Closely related, shared concepts (Both discuss Louvain communities) |
| **3** | Moderate | Related domain, some overlap (Both are database operations) |
| **2** | Weak | Tangential connection only (Both mention "performance") |
| **1** | Noise | No meaningful connection (False positive from similarity) |

**Veracity = Judicial Score / 5** → Range: 0.2 - 1.0

### Bayesian Confidence (Evidence-Based)

Confidence updates based on accumulated evidence:

```
Initial: confidence = 0.5 + similarity_boost

Updates:
  - Judicial score 5 → confidence += 0.25
  - Judicial score 4 → confidence += 0.15
  - Judicial score 3 → confidence += 0.05
  - Judicial score 2 → confidence -= 0.10
  - Judicial score 1 → confidence -= 0.20
  - Link survives 3+ review cycles → confidence stabilizes

Bounds: 0.1 ≤ confidence ≤ 0.95
```

### Louvain Edge Weight

Community detection uses the combined score:

```
edge_weight = confidence × veracity
```

| Scenario | Confidence | Veracity | Weight |
|----------|------------|----------|--------|
| High similarity + Judicial 5 | 0.85 | 1.0 | **0.85** |
| Moderate similarity + Judicial 3 | 0.55 | 0.6 | **0.33** |
| Low similarity + Judicial 2 | 0.40 | 0.4 | **0.16** |

---

## Configuration

```json
// polyvis.settings.json
{
  "autoWikilinker": {
    "threshold": 0.7,
    "maxSuggestionsPerNode": 5,
    "excludeDomains": ["root"],
    "suggestionsFile": "ingest/suggestions.json",
    "priorBoostFactor": 0.5,
    "bayesianBounds": [0.1, 0.95]
  }
}
```

---

## Interactive UI (Optional Enhancement)

Future: Show suggestions in Sigma Explorer
- Dotted lines = pending suggestions (opacity = confidence)
- Click to approve with judicial score (1-5 popup)
- Right-click to reject
- Edge thickness = confidence × veracity

---

## Verification Plan

1. Run `suggest-links.ts` → generates suggestions.json with initial confidence
2. Review 10 suggestions, assign judicial scores
3. Run `apply-links.ts` → wikilinks appear in source files
4. Run ingestion → LINKS_TO edges with confidence + veracity
5. Run Louvain → verify weighted community detection

---

## Comparison to Semantic Harvester

| Metric | Harvester | Auto-Wikilinker |
|--------|-----------|-----------------|
| Edges per run | ~3 | 100+ potential |
| Setup complexity | High (ML pipeline) | Low (existing vectors) |
| Edge quality | Variable | **Judicially verified** |
| Confidence source | SetFit probability | **Bayesian posterior** |
| Veracity source | LLM extraction | **Human judicial score** |
| Relationship types | IS_A, IMPLEMENTS... | LINKS_TO (generic) |
| Best for | Unstructured logs | Technical documentation |

