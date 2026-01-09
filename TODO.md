# Amalfa Technical Debt & Improvement Backlog

This file captures issues surfaced during code reviews. Items are recorded here for triage and planning—**not immediate action**.

---

## Discovery Log

### 2026-01-09: Core Module Review

#### 1. LouvainGate Threshold Hardcoded
- **File:** `src/core/LouvainGate.ts`
- **Issue:** Super-node threshold is hardcoded at 50. Should be configurable.
- **Impact:** Users with large graphs may need higher thresholds; small projects lower.
- **Suggested Fix:** 
  - Add `graph.tuning.louvain.superNodeThreshold` to config schema
  - Read from config in LouvainGate.check()
- **Priority:** Low (works fine for most cases)

#### 2. LouvainGate Rejection Metrics Not Tracked
- **File:** `src/core/LouvainGate.ts`, `src/core/EdgeWeaver.ts`
- **Issue:** Edges rejected by LouvainGate are logged to console but not tracked in stats.
- **Impact:** No visibility into graph health or centralization issues.
- **Suggested Fix:**
  - Add `louvainGate.rejected`, `louvainGate.superNodes` to StatsTracker
  - Surface in `amalfa stats` output
- **Priority:** Medium (useful for Gardener intelligence)

#### 3. Migrate Sonar Agent to Hono
- **File:** `src/daemon/sonar-agent.ts`
- **Issue:** Manual if/else routing is growing unwieldy (10+ endpoints). No middleware support.
- **Impact:** Poor maintainability; blocks future UI work (SSR JSX needs Hono).
- **Suggested Fix:**
  - `bun add hono`
  - Create `src/daemon/sonar-server.ts` with Hono app
  - Migrate routes, add CORS middleware
  - Verify with existing tests
- **Priority:** Medium (do before UI work begins)

#### 4. Add Colocated README Files to All Code Folders ✅ COMPLETED
- **Folders Missing READMEs:**
  - `src/`, `src/types`, `src/config`, `src/utils`, `src/cli`, `src/daemon`
  - `src/resonance/types`, `src/resonance/transform`, `src/resonance/services`
  - `scripts/enlightenment`, `scripts/maintenance`, `scripts/maintenance/cleanup-root`
- **Issue:** Agents have no local context when entering a folder. They guess or make drastic changes.
- **Impact:** Agents may violate architectural constraints or "refactor" working code without understanding why it exists.
- **Fix Applied (2026-01-09):**
  - Created README.md in all identified folders with Stability Clause.
- **Priority:** High (directly improves agent reliability) ✅

#### 5. Deprecate Legacy `tag-slug` Syntax in EdgeWeaver
- **File:** `src/core/EdgeWeaver.ts` (lines 74-82)
- **Issue:** Two tag syntaxes are supported: modern `[tag: Concept]` and legacy `tag-slug`.
- **Impact:** Dual support creates confusion. Legacy format should be phased out.
- **Suggested Fix:**
  - Add deprecation warning when legacy format is detected
  - Document migration path in a playbook
  - Remove support in a future version
- **Priority:** Low (works, just noisy)

#### 6. Excise Legacy "Polyvis" Naming ✅ COMPLETED
- **Files:** ~50+ files across `src/`, `scripts/`, docs
- **Issue:** The project was renamed from "Polyvis" to "Amalfa" but many references remain.
- **Impact:** Confusing for new users and agents. Inconsistent branding.
- **Key Locations:**
  - `src/mcp/README.md`, `src/core/README.md`, `src/resonance/README.md`
  - `scripts/README.md`, `scripts/setup_mcp.ts`
  - Many `scripts/lab/*.ts` files reference `polyvis.settings.json`
  - `DatabaseFactory.ts` docstring
- **Fix Applied (2026-01-09):**
  - Updated all README files with "Amalfa" branding
  - Cleaned up docstrings and comments
  - Legacy lab scripts referencing `polyvis.settings.json` excluded from Biome linting
- **Priority:** Medium (branding consistency) ✅

#### 7. Remove or Revive SemanticHarvester (Dead Code) ✅ COMPLETED
- **File:** `src/pipeline/SemanticHarvester.ts`
- **Status:** Already deleted (was dead code)
- **Impact:** ~220 lines of dead code removed. Confusing Python subprocess bridge eliminated.
- **Priority:** Low (doesn't affect runtime, just clutter) ✅

#### 8. Clean Up Orphaned/Empty Directories with Stale READMEs ✅ COMPLETED
- **Locations Found:**
  - `src/resonance/cli/` - README claims `ingest.ts`, `migrate.ts` (don't exist)
  - `src/resonance/pipeline/` - README claims `extract.ts`, `transform_docs.ts` (don't exist)
  - `src/resonance/transform/` - Likely empty
  - `src/pipeline/README.md` - Claims `Ingestor`, `HarvesterPipeline` (may exist, verify)
- **Fix Applied (2026-01-09):**
  - Deleted empty directories: `src/resonance/cli/`, `src/resonance/pipeline/`, `src/resonance/transform/`
  - Cleaned up `scripts/maintenance/cleanup-root/` subdirectory
- **Priority:** Low (cleanup task) ✅

#### 9. Remove Stale Deprecation Comments ✅ COMPLETED
- **File:** `src/resonance/DatabaseFactory.ts` (line 16)
- **Issue:** `connectToResonance()` is marked `@deprecated` but still exists. The deprecation notice adds noise without value.
- **Fix Applied (2026-01-09):**
  - Removed `@deprecated` tag. Method kept for convenience.
- **Priority:** Low (code hygiene) ✅

#### 10. Delete Empty `src/resonance/transform/` Directory ✅ COMPLETED
- **Location:** `src/resonance/transform/`
- **Status:** Deleted (2026-01-09)
- **Priority:** Low (trivial cleanup) ✅

#### 11. Add Pipeline History Tracking (Future Feature)
- **Context:** User request to track nodes, edges, and changes over time
- **Issue:** Currently no history/audit trail for graph mutations
- **Suggested Approach:**
  - Add `history` table: `(id, entity_type, entity_id, action, old_value, new_value, timestamp)`
  - Hook into `insertNode()`, `insertEdge()`, `updateNode()` to log changes
- **Priority:** Medium (useful for debugging and rollback)

#### 12. Adopt Drizzle ORM for Type-Safe Schema & Migrations
- **Context:** PolyVis successfully used Drizzle. User has prior experience.
- **Issue:** Current `db.ts` uses raw SQL strings—no compile-time type safety.
- **Benefits:**
  - Type-safe queries: `db.select().from(nodes)` with full autocomplete
  - Automated migrations: `drizzle-kit generate` tracks schema changes
  - Better DX: Schema changes propagate to TypeScript types instantly
- **Considerations:**
  - Vector BLOB columns need custom handling (Drizzle doesn't know about embeddings)
  - Initial migration effort from current `schema.ts`
- **Suggested Approach:**
  1. Install `drizzle-orm`, `drizzle-kit`
  2. Convert `src/resonance/schema.ts` to Drizzle table definitions
  3. Generate baseline migration from existing DB
  4. Migrate `ResonanceDB` methods to use Drizzle query builder
- **Priority:** Medium (do before UI work)

#### 13. Scripts Folder Cleanup ✅ COMPLETED
- **Summary:** Classify and clean up `scripts/` folder
- **Status (2026-01-09):**
  - Deleted dead `scripts/legacy/` and one-time fix scripts.
  - Kept only active maintenance and verification scripts.
- **Priority:** Medium (reduces confusion) ✅

#### 14. Promote Diagnostic Scripts to API
- **Candidates:**
  - `verify_graph_integrity.ts` → `amalfa validate --graph`
  - `analyze_health.ts` → Enhanced `/health` endpoint
  - `analyze_orphans.ts` → `amalfa stats --orphans`
  - `run-community-detection.ts` → `amalfa stats --communities`
  - `inspect-db.ts` → `amalfa inspect <table>`
- **Issue:** Useful diagnostics exist as standalone scripts, not accessible via CLI/API.
- **Impact:** Users/agents can't easily run these checks.
- **Suggested Approach:**
  - Add subcommands to `amalfa` CLI
  - Expose key metrics in Sonar `/health` endpoint
- **Priority:** Medium (improves discoverability)

#### 15. Tests Folder Cleanup
- **DELETE/FIX:**
  - `tests/harvester.test.ts` - Placeholder tests (`expect(true).toBe(true)`)
  - `tests/unit/` - Empty directory, delete or populate
- **KEEP:**
  - `DatabaseFactory.test.ts`, `weaver.test.ts`, `bento_normalizer.test.ts`
  - `daemon-realtime.test.ts`, `fafcas_compliance.test.ts`
  - `tests/fixtures/` - Test data files
- **Priority:** Low (cleanup)

#### 16. Expand Test Coverage (Gaps Identified)
- **Critical Gaps (High Priority):**
  - `GraphEngine` - PageRank, Louvain, Adamic-Adar algorithms
  - `VectorEngine` - Embedding generation, similarity search
  - `ResonanceDB` - Node/edge CRUD, transactions, migrations
- **Medium Priority:**
  - `LouvainGate` - Edge filtering logic
  - `AmalfaIngestor` - End-to-end ingestion
  - CLI commands - `amalfa init`, `serve`, `stats`
  - MCP tools - `search_documents`, `explore_links`
- **Current State:** ~7 test files, ~15-20 test cases
- **Target:** 80%+ coverage on core modules
- **Priority:** Medium (stability before features)

#### 17. Delete Stale `local_cache/` Directory ✅ COMPLETED
- **Location:** `local_cache/fast-all-MiniLM-L6-v2`
- **Status:** Deleted (2026-01-09) - Freed ~170MB
- **Fix Applied:**
  - Removed legacy cache directory
  - All runtime data now correctly uses `.amalfa/` directory
- **Priority:** Low (one-time cleanup) ✅

#### 18. Leverage Unused Graphology Features
- **Context:** `graphology-library` is already installed but underutilized
- **Available but Unused:**
  - **Traversal:** BFS, DFS for graph walking (e.g., "find all nodes within 3 hops")
  - **Assertions:** Graph validation (check for cycles, isolated nodes, consistency)
  - **Layout:** ForceAtlas2 for UI visualization positions
  - **GEXF Export:** Export to Gephi for external analysis
- **Suggested Use Cases:**
  - Add `GraphEngine.validateIntegrity()` using assertions
  - Add `GraphEngine.traverse(startNode, depth)` for neighborhood exploration
  - Prepare layout data for future dashboard
- **Priority:** Low (enhancement, not critical)

#### 19. Pin All Dependency Versions ✅ COMPLETED
- **Issue:** Some dependencies use `^` (caret range), allowing automatic minor/patch updates.
- **Risk:** Breaking changes in updates (especially `graphology ^0.26.0` which is pre-1.0)
- **Fix Applied (2026-01-09):**
  - Removed `^` from all dependencies in `package.json`.
  - Ran `bun install` to lock versions.
- **Priority:** Medium (stability) ✅

---

## Backlog Format

When adding new items, use this template:

```markdown
#### [Short Title]
- **File:** `path/to/file.ts`
- **Issue:** What's wrong or missing
- **Impact:** Why it matters
- **Suggested Fix:** High-level approach
- **Priority:** Low | Medium | High | Critical
```

---

## Triage Notes

_To be filled after discovery phase is complete._

---

## Completed Items

_Moved here after fix is verified._
