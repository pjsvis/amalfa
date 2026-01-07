# AMALFA Ingestion Pipeline
**Date:** 2026-01-07  
**Status:** Current Implementation

---

## Overview

AMALFA uses a **single ingestion pipeline** for all document processing. The same code path is used whether you run `amalfa init` manually or the daemon processes file changes automatically.

---

## Core Principle: One Pipeline, Multiple Triggers

```
┌─────────────────────────────────────────────────────────┐
│           AmalfaIngestor.ingest()                       │
│           Single source of truth for ingestion          │
└─────────────────────────────────────────────────────────┘
                    ▲                    ▲
                    │                    │
         ┌──────────┴──────────┐   ┌────┴──────────┐
         │   Manual Trigger    │   │ Auto Trigger  │
         │   (amalfa init)     │   │ (daemon)      │
         │   Run once, exit    │   │ Watch, repeat │
         └─────────────────────┘   └───────────────┘
```

---

## The Single Ingestion Pipeline

**File:** `src/pipeline/AmalfaIngestor.ts`

### What It Does

1. **Discover** markdown files from `config.sources`
2. **Two-pass processing:**
   - **Pass 1:** Create all nodes (no edges)
   - **Pass 2:** Create edges (now that lexicon is populated)
3. **For each file:**
   - Read content
   - Parse frontmatter
   - Generate ID from filename
   - Check hash (skip if unchanged)
   - Generate embedding (via Embedder)
   - Extract semantic tokens
   - Insert node into database
4. **Edge weaving** (Pass 2):
   - Extract markdown links
   - Build lexicon from nodes
   - Create relationships between nodes
5. **Finalize:**
   - Force WAL checkpoint
   - Return statistics

### Key Feature: Hash Checking

```typescript
const currentHash = hasher.digest("hex");
const storedHash = this.db.getNodeHash(id);

if (storedHash === currentHash) {
  return; // No change - skip processing
}
```

**This makes full re-ingestion efficient** - only processes changed files.

---

## Identical Behavior

### Both Triggers Use Same Code

| Aspect | `amalfa init` | `amalfa daemon` |
|--------|---------------|-----------------|
| Ingestion class | `AmalfaIngestor` | `AmalfaIngestor` |
| Method called | `ingest()` | `ingest()` |
| File processing | Identical | Identical |
| Embedding generation | Same | Same |
| Hash checking | Yes | Yes |
| Edge weaving | Yes | Yes |
| Database updates | Identical | Identical |

**No differences in accuracy, completeness, or quality.**

**ONLY difference:** *When* it runs (manual vs automatic)

---

## Full Ingestion Every Time

**Important:** The daemon does NOT do incremental ingestion.

```typescript
// Daemon detects 1 file changed
pendingFiles.add("docs/new-file.md");

// But runs FULL ingestion
await ingestor.ingest(); // Scans ALL files
```

### Why?

1. **Simplicity** - One code path
2. **Correctness** - Always consistent
3. **Edge updates** - May affect other files
4. **Performance** - Hash checking makes it fast
5. **Safety** - No risk of missing dependencies

**Performance:** 75 files, 1 changed = ~1.2 seconds total

---

## Config Reload

**Key insight:** Daemon reloads config on every trigger.

```typescript
// Daemon on file change:
const config = await loadConfig(); // Fresh config!
const ingestor = new AmalfaIngestor(config, db);
```

**Without restart, these changes are picked up:**
- ✅ `database` path
- ✅ `embeddings.model`
- ✅ `excludePatterns`

**Requires restart:**
- ❌ `sources` array (watchers set at startup)

---

## Embedder: Same Everywhere

Both triggers use identical embedding logic:

```
1. Call Embedder.embed(text)
2. Try Vector Daemon (200ms timeout)
3. Fallback to local FastEmbed
4. Return normalized Float32Array
```

**Same model, same algorithm, same results.**

---

## Architecture Benefits

### Single Code Path

- **Maintainability** - Fix bugs once
- **Testability** - Test once
- **Consistency** - Same results everywhere
- **Simplicity** - No special cases

### Separation of Concerns

**What** (ingestion logic) is separate from **When** (trigger mechanism).

```
Core Logic (What)  ──uses──▶  AmalfaIngestor
Triggers (When)    ──use──▶   Core Logic
```

---

## Performance

**`amalfa init` (all files):**
- Cold: ~15s (with model loading)
- Hot: ~5-7s (Vector Daemon running)

**`amalfa daemon` (1 file changed):**
- Detection + debounce: 1000ms
- Hash check all: ~100ms
- Process changed: ~100ms
- **Total: ~1.2s**

---

## Comparison Table

| Aspect | amalfa init | amalfa daemon |
|--------|-------------|---------------|
| Execution | Foreground | Background |
| Frequency | Once | Continuous |
| Config reload | Once | Every trigger |
| Error handling | Exit | Retry 3x |
| Notifications | No | Yes |
| **Ingestion code** | **Identical** | **Identical** |

---

## Key Takeaways

1. **Same pipeline everywhere** - One truth
2. **Hash checking** - Makes full scan efficient
3. **Config reload** - Daemon picks up changes
4. **Embedder fallback** - Same everywhere
5. **Perfect separation** - What vs When

**This is excellent architecture.**

---

## References

- Implementation: `src/pipeline/AmalfaIngestor.ts`
- CLI trigger: `src/cli.ts`
- Daemon trigger: `src/daemon/index.ts`
- Embedder: `src/resonance/services/embedder.ts`
