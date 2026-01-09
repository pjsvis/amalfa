# Brief: Ember Service - Automated Document Enrichment

**Date:** 2026-01-09
**Author:** Peter John Smith
**Status:** Draft

---

## Executive Summary

Ember is a standalone service that automatically enriches markdown documents with front matter metadata. It discovers enrichment opportunities, adds tags, summaries, and other metadata, then triggers re-ingestion into the Amalfa knowledge graph.

**Core Value:** Documents become more discoverable and interconnected without manual effort.

---

## Problem Statement

1. **Stale Metadata:** Documents are enriched once during ingestion but never updated as the knowledge graph evolves
2. **Missed Connections:** Related documents exist but aren't linked
3. **Inconsistent Tagging:** Tags are applied inconsistently across documents
4. **No Proactive Enrichment:** The system waits for changes instead of discovering improvement opportunities

---

## Solution: Ember Service

Ember runs as an independent service that:
- **Discovers** enrichment opportunities through graph analysis
- **Annotates** documents with improved front matter
- **Triggers** re-ingestion via the existing file watcher pipeline
- **Tracks** what has been enriched to avoid redundant work

---

## Architecture: Sidecar + Squash

Ember uses a non-destructive "Sidecar" pattern for safety. It never writes to user documents directly during analysis.

```
ember/
├── src/
│   ├── index.ts           # Service lifecycle
│   ├── analyzer.ts        # Graph analysis logic
│   ├── generator.ts       # Creates .ember.json sidecars
│   ├── squasher.ts        # Merges sidecars into .md files
│   └── schema.ts          # Drizzle schema for state tracking
```

### The Workflow

1. **Analyze:** Ember scans the graph and files.
2. **Propose:** Ember writes suggestions to `filename.ember.json` (Sidecar).
3. **Review (Optional):** User can inspect sidecars or run `amalfa ember status`.
4. **Squash:** User runs `amalfa ember squash` to merge sidecars into actual markdown files.
5. **Ingest:** File watcher detects changes and re-ingests via Sonar.

---

## Key Components

### 1. Analyzer (`analyzer.ts`)
Identifies gaps using the graph:
- **Missing Tags:** "Cluster Z has tag 'auth', but this node lacks it."
- **Broken Links:** "File links to X, but X was renamed to Y."
- **Summarization:** "Content changed but summary is old."

### 2. Sidecar Generator (`generator.ts`)
Writes a JSON file next to the source document:
**File:** `docs/architecture/auth.md` => `docs/architecture/auth.ember.json`

```json
{
  "targetFile": "docs/architecture/auth.md",
  "generatedAt": "2026-01-09T18:00:00Z",
  "confidence": 0.89,
  "changes": {
    "tags": { "add": ["security", "jwt"] },
    "frontmatter": { "status": "draft" },
    "summary": "Updated summary based on new content..."
  }
}
```

### 3. Squasher (`squasher.ts`)
The only component that modifies markdown files.
- Reads `.ember.json`
- Safely merges frontmatter (using `gray-matter` or similar)
- Deletes `.ember.json` on success
- **Atomic Operation:** Fast and purposeful.

### 4. State Tracking (ResonanceDB + Drizzle)
Instead of a separate DB, we add tables to `ResonanceDB` using Drizzle (Pilot implementation).

```typescript
// src/resonance/drizzle/schema.ts
export const emberState = sqliteTable('ember_state', {
  filePath: text('file_path').primaryKey(),
  lastAnalyzed: text('last_analyzed'),
  sidecarCreated: integer('sidecar_created', { mode: 'boolean' }),
  confidence: real('confidence')
});
```

---

## Integration Points

### 1. File Watcher Integration

```
File modified → File Watcher detects → Ember triggered (optional)
                                                    ↓
                                            Re-ingest to graph
```

**Trigger Options:**
- `ember.trigger_on_change`: bool (default true)
- `ember.min_confidence`: float (default 0.7)

### 2. Sonar Agent Integration

Ember can be invoked by Sonar for proactive enrichment:

```
User: "Enrich all authentication-related documents"
Sonar → Ember API → Ember enriches → Sonar confirms
```

### 3. CLI Integration

```bash
# Full sweep
amalfa ember --full-sweep

# Watch mode
amalfa ember --watch

# Dry run (preview only)
amalfa ember --dry-run

# Enrich specific file
amalfa ember /path/to/file.md

# Status
amalfa ember status
```

---

## Configuration

```json
{
  "ember": {
    "enabled": true,
    "sources": ["./docs", "./playbooks", "./briefs"],
    "full_sweep_on_start": true,
    "watch_on_start": true,
    "min_confidence": 0.7,
    "max_enrichments_per_file": 5,
    "stale_threshold_days": 30,
    "exclude_patterns": ["**/node_modules/**", "**/.git/**"],
    "backup_dir": ".amalfa/backups"
  }
}
```

---

## Enrichment Types

### 1. Tag Enrichment
- Suggests tags based on graph neighborhood
- Adds missing common tags from similar documents

### 2. Link Enrichment
- Discovers related documents via embedding similarity
- Suggests `related:` front matter entries

### 3. Summary Enrichment
- Generates or updates summaries using LLM
- Extracts key concepts from document

### 4. Metadata Refresh
- Updates `ember_last_run` timestamp
- Refreshes confidence scores

---

## Safety & Rollback

1. **Backup Before Modify:** All changes backed up to `.amalfa/backups/`
2. **Confidence Threshold:** Only apply high-confidence enrichments
3. **Dry Run Mode:** Preview changes without applying
4. **Rollback CLI:** `amalfa ember rollback <file>` or `amalfa ember rollback --all`

---

## Success Metrics

- **Coverage:** % of documents with `ember_enriched: true`
- **Quality:** Average confidence score of enrichments
- **Impact:** Increased cross-linking (related: fields populated)
- **Performance:** Time to complete full sweep

---

## Future Enhancements (Post-v1.0)

- [ ] LLM-powered summary generation
- [ ] User feedback loop ("this tag suggestion was wrong")
- [ ] Enrichment templates per document type
- [ ] Distributed sweep across multiple workers
- [ ] Integration with external knowledge bases

---

## Open Questions

1. Should Ember run automatically or be manual-only?
2. How to handle merge conflicts if file is modified during enrichment?
3. What enrichment types are highest priority?

---

## References

- [FAFCAS Protocol](../playbooks/fafcas-protocol-playbook.md)
- [Auto-Augmentation Design](../docs/AGENT-METADATA-PATTERNS.md)
- [Existing Ingestion Pipeline](../src/pipeline/AmalfaIngestor.ts)

---

*Brief created for Ember service implementation. Subject to revision based on feedback.*