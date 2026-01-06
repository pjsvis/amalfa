# Brief: Hollow Node Simplification — Remove FTS

**Locus Tag:** `[Locus: FTS_Removal_Hollow_Node]`
**Status:** ✅ COMPLETED (Migration v5 - December 2025)
**Outcome:** FTS removed, vector search (85% accuracy) + grep are sufficient

## Problem Statement

The current schema stores **content** in the `nodes` table and maintains an FTS5 virtual table for text search. This creates:

1. **Data duplication** — Content exists in both filesystem and database
2. **Sync complexity** — FTS triggers cause SQL errors when rowid mappings drift
3. **Architectural violation** — Breaks "Single Source of Truth" principle

## Proposed Solution: Pure Hollow Node Architecture

```
┌─────────────────┐     ┌──────────────┐
│  nodes table    │     │  File System │
│  ───────────    │     │  ────────    │
│  id             │────▶│  .md files   │
│  title          │     │  (content)   │
│  domain         │     │              │
│  meta.source    │     └──────────────┘
│  embedding      │
│  (NO content)   │
└─────────────────┘
```

**Nodes reference files by URI; content is retrieved at render time.**

---

## Changes Required

### Schema (`src/resonance/schema.ts`)

1. **Remove** `content TEXT` column from nodes table
2. **Remove** FTS5 virtual table `nodes_fts`
3. **Remove** all FTS triggers (`nodes_ai`, `nodes_ad`, `nodes_au`)

### Database Access (`src/resonance/db.ts`)

1. **Remove** `searchText()` method
2. **Update** any methods that reference `content` column

### MCP Server (`src/mcp/index.ts`)

1. **Update** `search_documents` tool to use **vector-only** search
2. Remove FTS hybrid search logic

### Ingestor (`src/pipeline/Ingestor.ts`)

1. **Stop** storing content in nodes
2. **Ensure** `meta.source` contains file path for retrieval

---

## Search Strategy Comparison

| Approach | Before | After |
|----------|--------|-------|
| Semantic similarity | ✅ Vector search | ✅ Vector search |
| Exact phrase | ✅ FTS | Terminal: `rg "phrase" docs/` |
| Content display | DB content column | Filesystem read |
| Snippet generation | FTS snippet() | Generate at render |

### Note on Grep Tools

Tools like `ripgrep`, `mgrep`, and `ast-grep` are available but **not needed** for this change:

- **Vector search** handles semantic similarity (primary use case)
- **Terminal access** provides exact phrase search when needed
- **YAGNI** — avoid complexity without clear benefit

If exact phrase search via UI becomes a requirement, we can add a grep wrapper later.

---

## Benefits

- **Smaller database** — No duplicated content
- **No sync issues** — Single source of truth on filesystem
- **Simpler schema** — No FTS triggers to corrupt
- **Faster writes** — No trigger overhead

## Risks

- **Exact phrase search removed** — Mitigated by terminal `rg` command
- **Migration required** — Drizzle schema update needed

---

## Migration Plan (Drizzle ORM)

### 1. Update Drizzle Schema (`src/db/schema.ts`)

```typescript
// Remove content column from nodes table
export const nodes = sqliteTable("nodes", {
  id: text("id").primaryKey(),
  title: text("title"),
  domain: text("domain"),
  meta: text("meta"),
  embedding: blob("embedding"),
  // content: text("content"),  // REMOVED
});
```

### 2. SQLite Migration (`src/resonance/schema.ts`)

```typescript
// Migration v5: Remove FTS and content column
const MIGRATION_V5 = `
  -- SQLite doesn't support DROP COLUMN before 3.35
  -- Recreate table without content column
  CREATE TABLE nodes_new (
    id TEXT PRIMARY KEY,
    title TEXT,
    domain TEXT,
    meta TEXT,
    embedding BLOB
  );
  INSERT INTO nodes_new SELECT id, title, domain, meta, embedding FROM nodes;
  DROP TABLE nodes;
  ALTER TABLE nodes_new RENAME TO nodes;
  
  -- Remove FTS
  DROP TABLE IF EXISTS nodes_fts;
`;
```

### 3. Run Migration

```bash
bun run build:data  # Rebuilds DB with new schema
```

---

## Verification

1. MCP `search_documents` returns results using vector-only
2. Schema has no `content` column: `PRAGMA table_info(nodes);`
3. No FTS tables exist: `SELECT name FROM sqlite_master WHERE name LIKE '%fts%';`
4. Node detail view retrieves content from filesystem via `meta.source`
