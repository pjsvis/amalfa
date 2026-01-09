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

#### 4. Add Colocated README Files to All Code Folders
- **Folders Missing READMEs:**
  - `src/`, `src/types`, `src/config`, `src/utils`, `src/cli`, `src/daemon`
  - `src/resonance/types`, `src/resonance/transform`, `src/resonance/services`
  - `scripts/enlightenment`, `scripts/maintenance`, `scripts/maintenance/cleanup-root`
- **Issue:** Agents have no local context when entering a folder. They guess or make drastic changes.
- **Impact:** Agents may violate architectural constraints or "refactor" working code without understanding why it exists.
- **Suggested Fix:** 
  - Create README.md in each folder
  - Include: Purpose, Key Files, Patterns, In Progress
  - Include a **⚠️ Stability Clause:**
    ```
    ## ⚠️ Stability
    This module is stable and intentionally designed.
    Do NOT refactor, rewrite, or change the architecture without:
    1. Consulting the user first
    2. Having a documented, compelling reason
    3. Understanding WHY the current design exists
    
    If something looks "wrong," it may be intentional. Ask before you chop.
    ```
- **Priority:** High (directly improves agent reliability)

#### 5. Deprecate Legacy `tag-slug` Syntax in EdgeWeaver
- **File:** `src/core/EdgeWeaver.ts` (lines 74-82)
- **Issue:** Two tag syntaxes are supported: modern `[tag: Concept]` and legacy `tag-slug`.
- **Impact:** Dual support creates confusion. Legacy format should be phased out.
- **Suggested Fix:**
  - Add deprecation warning when legacy format is detected
  - Document migration path in a playbook
  - Remove support in a future version
- **Priority:** Low (works, just noisy)

#### 6. Excise Legacy "Polyvis" Naming
- **Files:** ~50+ files across `src/`, `scripts/`, docs
- **Issue:** The project was renamed from "Polyvis" to "Amalfa" but many references remain.
- **Impact:** Confusing for new users and agents. Inconsistent branding.
- **Key Locations:**
  - `src/mcp/README.md`, `src/core/README.md`, `src/resonance/README.md`
  - `scripts/README.md`, `scripts/setup_mcp.ts`
  - Many `scripts/lab/*.ts` files reference `polyvis.settings.json`
  - `DatabaseFactory.ts` docstring
- **Suggested Fix:**
  - Global find/replace "Polyvis" → "Amalfa" in docs/comments
  - Legacy scripts referencing `polyvis.settings.json` can stay (they're deprecated)
  - Update all README files to use "Amalfa"
- **Priority:** Medium (branding consistency)

#### 7. Remove or Revive SemanticHarvester (Dead Code)
- **File:** `src/pipeline/SemanticHarvester.ts`
- **Issue:** This file implements a Python subprocess bridge to `ingest/harvester.py`, but:
  - The `ingest/` directory does not exist
  - `SemanticHarvester` is not imported anywhere
  - References `polyvis_classifier_v1` which doesn't exist
- **Impact:** ~220 lines of dead code. Confuses future maintainers.
- **Suggested Fix:**
  - **Option A:** Delete the file if Python harvester is abandoned
  - **Option B:** Recreate `ingest/` with the Python pipeline if still needed
- **Priority:** Low (doesn't affect runtime, just clutter)

#### 8. Clean Up Orphaned/Empty Directories with Stale READMEs
- **Locations Found:**
  - `src/resonance/cli/` - README claims `ingest.ts`, `migrate.ts` (don't exist)
  - `src/resonance/pipeline/` - README claims `extract.ts`, `transform_docs.ts` (don't exist)
  - `src/resonance/transform/` - Likely empty
  - `src/pipeline/README.md` - Claims `Ingestor`, `HarvesterPipeline` (may exist, verify)
- **Issue:** These are placeholder directories with stale READMEs describing non-existent files.
- **Impact:** Confuses agents and developers looking for functionality that isn't there.
- **Suggested Fix:**
  - Delete empty directories if they serve no purpose
  - Or populate them with the intended functionality
- **Priority:** Low (cleanup task)

#### 9. Remove Stale Deprecation Comments
- **File:** `src/resonance/DatabaseFactory.ts` (line 16)
- **Issue:** `connectToResonance()` is marked `@deprecated` but still exists. The deprecation notice adds noise without value.
- **Principle:** Deprecation notices are for transition periods. Once the old way is dead, remove both the code AND the notice.
- **Impact:** Confuses agents: "Should I use the deprecated method or not?"
- **Suggested Fix:**
  - If `connectToResonance()` is no longer needed, delete it entirely
  - If it's still needed, remove the `@deprecated` tag
  - Apply this principle project-wide
- **Priority:** Low (code hygiene)

#### 10. Delete Empty `src/resonance/transform/` Directory
- **Location:** `src/resonance/transform/`
- **Status:** Completely empty (verified)
- **Suggested Fix:** `rm -rf src/resonance/transform`
- **Priority:** Low (trivial cleanup)

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

#### 13. Scripts Folder Cleanup
- **Summary:** Classify and clean up `scripts/` folder
- **DELETE (Dead/Legacy):**
  - `scripts/legacy/*` - Entire folder, uses deprecated `polyvis.settings.json`
  - `scripts/fix_lexicon_json.ts`, `scripts/fix_oh125_db.ts` - One-time fixes
  - `scripts/validate-css-variables.js` - PolyVis UI artifact
  - `scripts/test-classifier.ts`, `scripts/run-semantic-harvest.ts` - Dead SemanticHarvester
  - `scripts/setup_mcp.ts` - Superseded by `amalfa setup-mcp`
  - `scripts/lift-to-amalfa*.sh` - Migration done
  - `scripts/remove-node-deps.ts`, `scripts/fix/*` - One-time cleanups
- **KEEP:**
  - `scripts/maintenance/pre-commit.ts`, `doc-consistency-check.ts`
  - `scripts/verify/verify-sonar-capabilities.test.ts`
  - `scripts/release.ts`, `scripts/inspect-db.ts`
- **REVIEW (Lab):**
  - `scripts/lab/*` - Individual review needed
- **Priority:** Medium (reduces confusion)

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

#### 17. Delete Stale `local_cache/` Directory
- **Location:** `local_cache/fast-all-MiniLM-L6-v2`
- **Issue:** Legacy FastEmbed cache from old version. Code now correctly uses `.amalfa/cache/`.
- **Impact:** ~170MB of unused data on root. Violates "all runtime data in .amalfa/" principle.
- **Suggested Fix:** 
  - `rm -rf local_cache`
  - Add `local_cache/` to `.gitignore` if not already
- **Priority:** Low (one-time cleanup)

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

#### 19. Pin All Dependency Versions
- **Issue:** Some dependencies use `^` (caret range), allowing automatic minor/patch updates.
- **Risk:** Breaking changes in updates (especially `graphology ^0.26.0` which is pre-1.0)
- **Currently Unpinned:**
  - `graphology: ^0.26.0`
  - `graphology-library: ^0.8.0`
  - `pino: ^10.1.0`
  - `pino-pretty: ^13.1.3`
  - `typescript: ^5.9.3`
  - `only-allow: ^1.2.2`
- **Suggested Fix:**
  - Run `bun install --frozen-lockfile` to capture current versions
  - Remove `^` from all versions in `package.json`
  - Or use `bun.lockb` as source of truth
- **Priority:** Medium (stability)

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
