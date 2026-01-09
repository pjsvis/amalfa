# Drizzle Schema Management

## ⚠️ CRITICAL ARCHITECTURE RULE

**Drizzle ORM is used HERE strictly for:**
1.  **Schema Definition:** Single source of truth for table structures (`schema.ts`).
2.  **Migrations:** Generating and running SQL migrations (`drizzle-kit`).

**Drizzle ORM is NOT used for:**
- **Runtime Queries:** Do NOT use Drizzle `db.select()` query builders in critical paths.
- **Data Access:** All runtime data access uses `bun:sqlite` with raw parameterized SQL (`db.prepare()`).

## Why?
Our **FAFCAS** (Fast, Autonomous, Fractionally-Connected Agent System) architecture demands raw IO performance. We treat SQLite as a raw storage engine. The overhead of an ORM query builder—even a light one—is unnecessary.

## ⛔ Agent Guardrail
If you are an AI Agent reading this:
- **DO NOT** refactor the existing `ResonanceDB` SQL queries to use Drizzle.
- **DO NOT** introduce Drizzle usage into `GraphEngine` or `VectorEngine`.
- **ONLY** modify this folder if the Database Schema (tables/columns) needs to change.

## Workflow for Schema Changes
1.  Edit `schema.ts`
2.  Run `bunx drizzle-kit generate`
3.  Run migrations (automated via scripts)
