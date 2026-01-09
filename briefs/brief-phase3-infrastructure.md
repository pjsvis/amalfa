## Task: Phase 3 - Infrastructure Upgrades

**Objective:** Upgrade core infrastructure before building new features. Migrate to Hono for routing, adopt Drizzle for type-safe database, and pin dependency versions.

**TODO Items:** #3, #12, #19

- [ ] Migrate Sonar Agent to Hono (#3)
- [ ] Adopt Drizzle ORM for type-safe schema & migrations (#12)
- [ ] Pin all dependency versions (#19)

## Key Actions Checklist:

### Hono Migration (#3)
- [ ] `bun add hono`
- [ ] Create `src/daemon/sonar-server.ts` with Hono app
- [ ] Migrate routes from `sonar-agent.ts`:
  - [ ] `GET /health`
  - [ ] `POST /chat`
  - [ ] `POST /metadata/enhance`
  - [ ] `POST /task`
  - [ ] All other endpoints
- [ ] Add CORS middleware (single declaration, not per-route)
- [ ] Update `sonar-agent.ts` to use new Hono server
- [ ] Verify all tests pass

### Drizzle ORM (#12)
- [ ] `bun add drizzle-orm drizzle-kit`
- [ ] Create `src/resonance/drizzle/schema.ts` with table definitions:
  - [ ] `nodes` table
  - [ ] `edges` table
  - [ ] `vectors` table (custom BLOB handling)
  - [ ] `semantic_edges` table
- [ ] Generate baseline migration: `bunx drizzle-kit generate`
- [ ] Create `drizzle.config.ts`
- [ ] Migrate `ResonanceDB` methods to use Drizzle query builder (incremental)
- [ ] Verify type safety: TypeScript errors on invalid queries

### Pin Versions (#19)
- [ ] Update `package.json`:
  - [ ] `graphology: "0.26.0"` (remove ^)
  - [ ] `graphology-library: "0.8.0"` (remove ^)
  - [ ] `pino: "10.1.0"` (remove ^)
  - [ ] `pino-pretty: "13.1.3"` (remove ^)
  - [ ] `typescript: "5.9.3"` (remove ^)
  - [ ] `only-allow: "1.2.2"` (remove ^)
- [ ] Run `bun install` to update lockfile
- [ ] Commit lockfile changes

## Verification:

- [ ] `bun test` passes
- [ ] `amalfa sonar chat` works with Hono routing
- [ ] `curl localhost:3012/health` returns expected response
- [ ] Drizzle schema compiles without errors
- [ ] `bun install --frozen-lockfile` succeeds (no version drift)
