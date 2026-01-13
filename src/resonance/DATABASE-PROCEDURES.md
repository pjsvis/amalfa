---
status: canonical
last_updated: 2026-01-13
---

# Database Procedures & Migration Protocol

## ⚠️ CRITICAL: Read Before Any Database Changes

This document is the **single source of truth** for database operations in AMALFA. Deviation from these procedures causes schema drift and breaks production systems.

---

## Architecture Overview

### The Database Layer

AMALFA uses **SQLite** as a high-performance runtime storage engine with specific architectural constraints:

**What SQLite Does:**
- Stores node metadata (id, type, title, domain, layer, hash, meta, date)
- Stores vector embeddings (BLOB: Float32Array bytes via FAFCAS protocol)
- Stores graph edges (source, target, type, confidence, veracity)
- Provides ACID transactions for graph mutations

**What SQLite Does NOT Do:**
- Store document content (content lives in filesystem, read via `GraphGardener.getContent()`)
- Perform full-text search (FTS removed in v5 - use vector search + grep)
- Act as an ORM (we use raw SQL with `bun:sqlite` for performance)

### The Drizzle Contract

**Drizzle ORM** is used for:
1. **Schema Definition** - Single source of truth (`src/resonance/drizzle/schema.ts`)
2. **Migration Generation** - Type-safe schema changes (`bunx drizzle-kit generate`)
3. **Migration Execution** - Automated via `bunx drizzle-kit migrate`

**Drizzle ORM is NOT used for:**
- Runtime queries (use `db.prepare()` with raw SQL for performance)
- Data access in `ResonanceDB`, `GraphEngine`, `VectorEngine`

**Why?** FAFCAS architecture demands raw I/O speed. SQLite is treated as a storage engine, not an abstraction layer.

---

## Migration Protocol

### Rule #1: Always Use Drizzle for Schema Changes

**NEVER:**
- Edit SQL files directly
- Run manual `ALTER TABLE` commands
- Create ad-hoc migration scripts
- Use the old custom migration array (deprecated as of 2026-01-13)

**ALWAYS:**
1. Edit `src/resonance/drizzle/schema.ts`
2. Generate migration: `bunx drizzle-kit generate`
3. Review generated SQL in `src/resonance/drizzle/migrations/`
4. Apply migration: `bunx drizzle-kit migrate`

### Migration Workflow

```bash
# 1. Make schema change
vim src/resonance/drizzle/schema.ts

# 2. Generate migration
bunx drizzle-kit generate

# 3. Review the generated SQL
cat src/resonance/drizzle/migrations/XXXX_*.sql

# 4. Apply migration to development database
bunx drizzle-kit migrate

# 5. Verify schema
sqlite3 .amalfa/resonance.db ".schema nodes"

# 6. Test application
bun test

# 7. Commit schema.ts + generated migration
git add src/resonance/drizzle/
git commit -m "feat(db): add X column to Y table"
```

### Emergency Rollback

```bash
# Restore from backup
cp .amalfa/resonance.db.backup .amalfa/resonance.db

# Reset Drizzle state
bunx drizzle-kit drop

# Re-apply migrations from scratch
bunx drizzle-kit migrate
```

---

## Schema Change Examples

### Adding a Column

```typescript
// src/resonance/drizzle/schema.ts
export const nodes = sqliteTable("nodes", {
  id: text("id").primaryKey(),
  // ... existing fields
  newField: text("new_field"), // Add this
});
```

```bash
bunx drizzle-kit generate
# Review src/resonance/drizzle/migrations/XXXX_add_new_field.sql
bunx drizzle-kit migrate
```

### Removing a Column

**SQLite limitation:** Cannot `DROP COLUMN` directly. Must recreate table.

```typescript
// src/resonance/drizzle/schema.ts
export const nodes = sqliteTable("nodes", {
  id: text("id").primaryKey(),
  // Remove oldField line entirely
});
```

```bash
bunx drizzle-kit generate
# Drizzle generates: CREATE TABLE new → INSERT SELECT → DROP old → RENAME
bunx drizzle-kit migrate
```

### Adding an Index

```typescript
export const edges = sqliteTable(
  "edges",
  {
    source: text("source").notNull(),
    target: text("target").notNull(),
    type: text("type").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.source, table.target, table.type] }),
    sourceIdx: index("idx_edges_source").on(table.source),
    newIdx: index("idx_new_field").on(table.newField), // Add this
  }),
);
```

---

## Runtime Database Access

### ResonanceDB Class

**Location:** `src/resonance/db.ts`

**Purpose:** High-performance SQLite wrapper with FAFCAS optimizations.

**Key Methods:**
- `upsertNode(node)` - Insert/update node with embedding
- `getNode(id)` - Retrieve node metadata (no content)
- `getNodes(options)` - Batch retrieval with filters
- `getRawDb()` - Access underlying SQLite Database for custom queries

**Performance Requirements:**
- All queries use prepared statements (`db.prepare()`)
- Embeddings stored as raw BLOBs (no serialization overhead)
- WAL mode enabled (`PRAGMA journal_mode = WAL`)
- Busy timeout set (`PRAGMA busy_timeout = 5000`)

### Content Hydration

**Content is NEVER in the database.** Use `GraphGardener.getContent(nodeId)` to read from filesystem.

```typescript
// ❌ WRONG
const node = db.getNode(id);
const content = node.content; // Always undefined

// ✅ CORRECT
const node = db.getNode(id);
const content = await gardener.getContent(id); // Reads from filesystem
```

---

## Database Lifecycle

### Initialization

```typescript
import { ResonanceDB } from "@src/resonance/db";

const db = new ResonanceDB(".amalfa/resonance.db");
// Database opened, migrations auto-applied via Drizzle
```

### Backup Strategy

**Before schema changes:**
```bash
cp .amalfa/resonance.db .amalfa/resonance.db.backup-$(date +%Y%m%d)
```

**Automated backups** (planned):
- Pre-migration automatic backup
- Retention policy: 7 days
- Location: `.amalfa/backups/`

### Vacuum & Maintenance

```bash
# Reclaim space after large deletions
sqlite3 .amalfa/resonance.db "VACUUM;"

# Analyze query performance
sqlite3 .amalfa/resonance.db "ANALYZE;"

# Check integrity
sqlite3 .amalfa/resonance.db "PRAGMA integrity_check;"
```

---

## Troubleshooting

### "Database is locked"

**Cause:** Multiple processes accessing WAL file.

**Fix:**
```bash
# Check for rogue processes
lsof .amalfa/resonance.db

# Kill daemons
amalfa servers stop

# Restart
amalfa servers start
```

### "Table does not exist"

**Cause:** Migrations not applied.

**Fix:**
```bash
bunx drizzle-kit migrate
```

### "Schema mismatch"

**Cause:** Manual SQL changes bypassed Drizzle.

**Fix:**
```bash
# Generate migration from current schema
bunx drizzle-kit generate

# Review diff
cat src/resonance/drizzle/migrations/XXXX_*.sql

# Apply if correct, otherwise restore from backup
```

---

## Migration from Custom System (2026-01-13)

**Historical Context:** AMALFA initially used a custom migration array in `schema.ts`. This was replaced with Drizzle as of v1.2.0.

**Transition Steps (for existing databases):**

1. **Verify database is at custom v9:**
   ```bash
   sqlite3 .amalfa/resonance.db "PRAGMA user_version;"
   # Should return 9
   ```

2. **Mark Drizzle migrations as applied:**
   ```bash
   bunx drizzle-kit migrate --dry-run
   # Review that migrations match current schema
   bunx drizzle-kit migrate
   ```

3. **Remove custom migration code:**
   - Delete `migrations` array from `src/resonance/schema.ts`
   - Remove `runMigrations()` logic from `ResonanceDB` constructor

4. **Verify state:**
   ```bash
   sqlite3 .amalfa/resonance.db ".schema" > schema-current.sql
   # Compare with Drizzle expected schema
   ```

---

## Agent Guardrails

If you are an AI agent modifying this codebase:

### ✅ YOU MAY:
- Edit `src/resonance/drizzle/schema.ts` to add/remove columns
- Run `bunx drizzle-kit generate` to create migrations
- Run `bunx drizzle-kit migrate` to apply migrations
- Use `db.prepare()` for runtime queries in `ResonanceDB`

### ❌ YOU MUST NOT:
- Use Drizzle query builders (`db.select()`, `db.insert()`) in production code
- Edit migration SQL files after generation
- Run manual `ALTER TABLE` commands
- Bypass Drizzle for schema changes
- Store document content in the database
- Add ORM abstractions over SQLite

### 🚨 BEFORE ANY SCHEMA CHANGE:
1. Backup the database
2. Read this document fully
3. Generate migration via Drizzle
4. Review generated SQL
5. Test on dev database first

---

## References

- **Drizzle ORM:** https://orm.drizzle.team/docs/overview
- **Drizzle Kit:** https://orm.drizzle.team/kit-docs/overview
- **SQLite WAL:** https://www.sqlite.org/wal.html
- **FAFCAS Protocol:** `playbooks/embeddings-and-fafcas-protocol-playbook.md`
- **Hollow Nodes:** `docs/architecture/hollow-nodes.md` (TODO)

---

**Last Updated:** 2026-01-13  
**Maintained By:** Database integrity is project-critical. Any confusion warrants immediate clarification.
