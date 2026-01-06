# PolyVis Architecture

## System Overview

PolyVis is a knowledge graph system with two distinct domains:
- **PERSONA**: The ontology (concepts, protocols, directives)
- **EXPERIENCE**: The temporal knowledge (debriefs, playbooks, telemetry)

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    INGESTION PIPELINES                       │
├──────────────────────────┬──────────────────────────────────┤
│   PERSONA PIPELINE       │   EXPERIENCE PIPELINE            │
│                          │                                  │
│   Input:                 │   Input:                         │
│   - Lexicon (CL)         │   - Debriefs/*.md                │
│   - Directives (CDA)     │   - Playbooks/*.md               │
│                          │   - Briefs/*.md                  │
│   Process:               │                                  │
│   1. Load JSON           │   Process:                       │
│   2. Insert as nodes     │   1. Scan for locus tags         │
│   3. Create edges        │   2. Extract semantic tokens     │
│      (from CDA links)    │   3. Generate embeddings         │
│                          │   4. Weave edges (via tokens)    │
│                          │                                  │
│   Domain: 'persona'      │   Domain: 'experience'           │
│   Layer: 'ontology'      │   Layer: 'experience'            │
└──────────────────────────┴──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  public/resonance.db   │
              │  (SQLite + WAL)        │
              │                        │
              │  Tables:               │
              │  - nodes               │
              │  - edges               │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Sigma Explorer UI    │
              │   (http://localhost:3000/sigma-explorer/)
              │                        │
              │   Views:               │
              │   - Persona Graph      │
              │   - Experience Graph   │
              │   - Unified Graph      │
              └────────────────────────┘
```

## Configuration (Single Source of Truth)

**File:** `polyvis.settings.json`

```json
{
  "paths": {
    "database": {
      "resonance": "public/resonance.db"  // ← CANONICAL PATH
    },
    "sources": {
      "experience": {
        "directories": ["debriefs", "playbooks", "briefs"]
      },
      "persona": {
        "lexicon": "scripts/fixtures/conceptual-lexicon-ref-v1.79.json",
        "cda": "scripts/fixtures/cda-ref-v63.json"
      }
    }
  }
}
```

## Core Components

### 1. ResonanceDB (`resonance/src/db.ts`)
- SQLite wrapper with FAFCAS protocol
- Schema: nodes (with embeddings) + edges
- WAL mode for concurrent access

### 2. TokenizerService (`resonance/src/services/tokenizer.ts`)
- **Zero Magic** brute-force lexicon scanner
- Extracts domain-specific terms from text
- Returns: `{protocols: [], concepts: [], ...}`

### 3. EdgeWeaver (`src/core/EdgeWeaver.ts`)
- Creates edges between nodes
- Uses semantic tokens to link documents to concepts
- Edge types: `MENTIONS`, `CONTAINS`, `RELATED_TO`

### 4. Embedder (`resonance/src/services/embedder.ts`)
- Generates 384-dim vectors via fastembed
- Normalized via FAFCAS protocol
- Used for semantic search

## Ingestion Scripts

### Experience Pipeline
**Script:** `scripts/pipeline/ingest.ts`

```bash
bun run scripts/pipeline/ingest.ts
```

**Process:**
1. Scans `debriefs/`, `playbooks/`, `briefs/`
2. Parses locus tags (`<!-- locus: id -->`)
3. Extracts semantic tokens via TokenizerService
4. Generates embeddings
5. Inserts nodes (domain='experience')
6. Weaves edges via EdgeWeaver

### Persona Pipeline
**Script:** `scripts/pipeline/ingest.ts` (same script, different phase)

**Process:**
1. Loads `conceptual-lexicon-ref-v1.79.json`
2. Inserts each concept as a node (domain='persona')
3. Loads `cda-ref-v63.json` (future: create edges from directives)

## Database Schema

### nodes
```sql
CREATE TABLE nodes (
    id TEXT PRIMARY KEY,
    type TEXT,              -- 'concept', 'debrief', 'playbook', etc.
    title TEXT,
    content TEXT,
    domain TEXT,            -- 'persona' or 'experience'
    layer TEXT,             -- 'ontology' or 'experience'
    embedding BLOB,         -- FAFCAS normalized vector
    hash TEXT,              -- content hash for delta detection
    meta TEXT               -- JSON: {semantic_tokens, tags, etc.}
);
```

### edges
```sql
CREATE TABLE edges (
    source TEXT,
    target TEXT,
    type TEXT,              -- 'MENTIONS', 'CONTAINS', etc.
    PRIMARY KEY (source, target, type)
);
```

## Known Issues & TODOs

1. **CDA Integration:** Directives (CDA) are loaded but not yet creating edges
2. **Orphan Nodes:** Experience nodes may be orphaned if no semantic tokens match lexicon
3. **Legacy Scripts:** Several scripts still reference deprecated `resonance.settings.json`

## Development Workflow

1. **Modify Content:** Edit debriefs/playbooks or update lexicon
2. **Run Ingestion:** `bun run scripts/pipeline/ingest.ts`
3. **View Graph:** Navigate to `http://localhost:3000/sigma-explorer/`
4. **Select Domain:** Click "Persona" or "Experience" in left sidebar

## Troubleshooting

### "Graph shows 0 nodes"
- Check database exists: `ls -l public/resonance.db`
- Verify ingestion ran: Check for "Ingestion Complete" message
- Inspect DB: `bun run scripts/verify/verify_db_content.ts public/resonance.db`

### "Database is locked"
- Close any open connections
- Stop dev server if needed
- Run checkpoint: `bun run scripts/pipeline/checkpoint.ts`

### "No edges in Experience graph"
- Verify semantic tokens are being extracted (check node meta)
- Ensure lexicon terms appear in document content
- Check EdgeWeaver logs for `[Weaver]` messages
