# AMALFA Documentation Classification
**Date:** 2026-01-07  
**Approach:** Kent Beck's Tidy First - classify before cleaning

---

## Classification System

**KNOWN** - We understand what/why, purpose clear, keep  
**NOT-SURE** - Purpose unclear, may be outdated, review needed  
**DELETE** - Confirmed obsolete, safe to remove  
**ARCHIVE** - Historical value but not active, move to archive/  

---

## ROOT LEVEL

### KNOWN
- `README.md` - Main project readme ✅
- `LICENSE` - MIT license ✅
- `package.json` - NPM package config ✅
- `amalfa.config.json` - Runtime config ✅
- `biome.json` - Linter/formatter config ✅
- `tsconfig.json` - TypeScript config ✅

### NOT-SURE
- `.biomeignore` - Is this used? Check if .gitignore sufficient

### DELETE ✅ COMPLETED
- ~~`.prettierrc`~~ - ✅ Removed (using Biome, not Prettier)
- ~~`.beads/`~~ - ✅ Removed (Beads not used in this project)
- ~~`.amalfa-pre-flight.log`~~ - ✅ Moved to `.amalfa/logs/pre-flight.log`
- `.DS_Store` - Not in repo (good)
- `.env` - Not in repo (good)

---

## docs/ DIRECTORY (65 general docs)

### KNOWN - Core Documentation

**Architecture & Vision:**
- `VISION-AGENT-LEARNING.md` - Core vision document (1,243 lines) ✅
- `AGENT-METADATA-PATTERNS.md` - Auto-augmentation design (1,022 lines) ✅
- `ARCHITECTURAL_OVERVIEW.md` - System architecture ✅
- `elevator-pitch.md` - Quick pitch ✅
- `headless-knowledge-management.md` - Core concept ✅

**Developer Docs:**
- `DEVELOPER_ONBOARDING.md` - How to start contributing ✅
- `COMMIT_GUIDELINES.md` - Git commit standards ✅
- `AGENT_PROTOCOLS.md` - Agent interaction patterns ✅

**Configuration:**
- `CONFIG_UNIFICATION.md` - Config system design ✅
- `CONFIG_VALIDATION.md` - Validation approach ✅
- `CONFIG_E2E_VALIDATION.md` - End-to-end validation ✅
- `_current-config-status.md` - Current state (status doc) ✅

**Setup:**
- `MCP_SETUP.md` - MCP server setup guide ✅
- `QUICK_START_MCP.md` - Quick start guide ✅
- `SETUP_COMPLETE.md` - Setup verification ✅

**Technical:**
- `Graph and Vector Database Best Practices.md` - DB patterns ✅
- `edge-generation-methods.md` - How edges are created ✅
- `hardened-sqlite.md` - SQLite patterns ✅
- `sqlite-wal-readonly-trap.md` - WAL mode gotcha ✅

**Project Status:**
- `2026-01-07-PROJECT-REVIEW.md` - Comprehensive project review ✅
- `REPOSITORY_CLEANUP_SUMMARY.md` - Cleanup history ✅
- `PERFORMANCE_BASELINES.md` - Performance benchmarks ✅

### ARCHIVE - Move to docs/archive/
- `BENTO_BOXING_DEPRECATION.md` - ✅ Bento boxing fully removed, doc is historical record
- `LEGACY_DEPRECATION.md` - ✅ Config migration ongoing, valuable reference but not active
- `SESSION-2026-01-06-METADATA-PATTERNS.md` - Session notes, not evergreen doc

### DELETE - Not Relevant to AMALFA
- `Bun-SQLite.html` - Research report for "Project Resonance", not AMALFA
- `keyboard-shortcuts.md` - References PolyVis web UI (wrong project)
- `graph-and-vector-database-playbook.html` - HTML version of existing markdown

### KEEP BUT REVIEW
**Binary Assets (Total: 5.3MB in git):**
- `ARCHITECTURAL_OVERVIEW.png` (4.6MB) - System diagram, useful but HUGE
- `workflow.png` (44KB) - Small, acceptable
- `2310.08560v2.pdf` (648KB) - Research paper, could link to arXiv instead
- `nasa-10-rules-swdp.pdf` (24KB) - Small, reference material

**Large Docs:**
- `compare-src-and-resonance-folders.md` (1,668 lines) - Check if still accurate

**Unclear:**
- `john-kaye-flux-prompt.md` - Personal note?
- `vision-helper.md` - Duplicate of VISION-AGENT-LEARNING.md?

### archive/ subdirectory

**Architecture Docs:**
- `architecture/daemon-operations.md` - ✅
- `architecture/ingestion-pipeline.md` - ✅
- `architecture/pipeline.md` - ✅
- `architecture/thin-node.md` - ✅

**Status:** These look active, not archived. Keep.

### webdocs/ subdirectory

**NOT-SURE - Many large files:**
- `compare-src-and-resonance-folders.md` - 1,668 lines
- `hybrid-query-protocols.md` - 1,079 lines
- `Modern CSS Playbook for Developers.md` - 604 lines
- `embeddings.ts` - 531 lines (why .ts in docs?)
- `embeddings-README.md`
- `data-architecture.md`
- `database-capabilities.md`
- `ingestion-stats-integration.md`
- `project-structure.md`
- `README.md`
- `validation-strategy.md`

**Question:** What is webdocs/? Are these:
- Generated docs for a web UI?
- Planning docs?
- Reference material?
- Outdated?

### strategy/ subdirectory

- `css-architecture.md`

**Question:** CSS for what? AMALFA has no web UI.

---

## playbooks/ DIRECTORY (27 files)

### KNOWN - Active Playbooks

**Core Process:**
- `README.md` - Playbook index ✅
- `debriefs-playbook.md` - How to write debriefs ✅
- `briefs-playbook.md` - How to write briefs ✅
- `change-management-protocol.md` - Plan → Execute → Verify → Debrief ✅
- `definition-of-done-playbook.md` - Completion criteria ✅

**Development:**
- `development-workflow-playbook.md` - Core dev workflow ✅
- `problem-solving-playbook.md` - Debugging strategies ✅
- `agent-experimentation-protocol.md` - When stuck ✅

**Technical:**
- `embeddings-and-fafcas-protocol-playbook.md` - Vector search ✅
- `local-first-vector-db-playbook.md` - Database architecture ✅
- `ingestion-pipeline-playbook.md` - How ingestion works ✅
- `schema-playbook.md` - Database schema ✅
- `sqlite-standards.md` - SQLite best practices ✅
- `bun-playbook.md` - Bun-specific patterns ✅

**Domain-Specific:**
- `domain-vocabulary-playbook.md` - Project terminology ✅
- `grep-strategy.md` - How to search codebase ✅

### Playbooks - Actual Current State ✅

**Status:** Already clean! No web/CSS playbooks found. Web-related playbooks already removed.

**Current playbooks (26 files):**
- Core process: briefs, debriefs, change management, definition of done ✅
- Development: workflow, problem-solving, agent experimentation ✅  
- Technical: embeddings/FAFCAS, vector DB, ingestion, schema, SQLite, Bun, Biome ✅
- Domain: vocabulary, grep strategy, scripts, actor, critic ✅
- Specialized: inference, tokenization, harden-and-flense, weavers handbook ✅

**Note:** There's both `inference-playbook.md` AND `inferences-playbook.md` (duplicate?)

---

## debriefs/ DIRECTORY (4 files)

### KNOWN - Recent Debriefs

- `README.md` - Debrief template ✅
- `2026-01-07-mcp-server-fix.md` - Recent (today) ✅
- `2026-01-07-config-unification-debrief.md` - Recent (today) ✅
- `2026-01-07-amalfa-directory-reorganization.md` - Recent (today) ✅

**Status:** All current, all good ✅

---

## briefs/ DIRECTORY (3 files)

### KNOWN - Recent Briefs

- `README.md` - Brief template ✅
- `2026-01-07-daemon-mcp-integration.md` - Recent (today) ✅
- `2026-01-07-vector-daemon-server.md` - Recent (today) ✅

**Status:** All current, all good ✅

---

## scripts/ DIRECTORY (89 files)

### KNOWN - Active Scripts

**CLI Tools:**
- `cli/ingest.ts` - Ingestion CLI ✅
- `cli/map-briefs.ts` - Brief mapping ✅
- `cli/servers.ts` - Server status ✅

**Testing:**
- `test-ingestion-performance.ts` - Performance gates ✅
- `test-mcp-search.ts` - MCP testing ✅
- `audit-codebase.ts` - This audit ✅

**Maintenance:**
- `maintenance/` subdirectory - 11 files
- `setup_mcp.ts` - MCP setup ✅

**Verification:**
- `verify/` subdirectory - 31 files (test scripts)

### NOT-SURE - Review Needed

**Legacy Scripts:**
- `legacy/` subdirectory - 22 files, 1,733 lines
- **Action:** Delete entire directory?

**Fixtures:**
- `fixtures/conceptual-lexicon-ref-v1.79.json` - 1,736 lines
- **Action:** Still needed?

---

## Summary Statistics

**KNOWN (Keep):**
- Core docs: ~40 files
- Active playbooks: ~15 files
- Recent debriefs/briefs: 7 files
- Active scripts: ~40 files
- **Total: ~102 files clearly needed**

**NOT-SURE (Review):**
- Web/CSS playbooks: ~8 files
- Specialized playbooks: ~15 files
- Large/old docs: ~10 files
- Binary assets: 3 files
- .beads/ directory: 8 files
- Legacy scripts: 22 files
- **Total: ~66 files need review**

**DELETE (Remove):**
- .DS_Store: 1 file
- .prettierrc: 1 file
- **Total: 2 files ready to delete**

---

## Review Priority

### 1️⃣ Immediate (do now)
- Delete .DS_Store, .prettierrc
- Decide on .beads/ (used or delete?)
- Move .amalfa-pre-flight.log to correct location

### 2️⃣ Quick wins (docs/)
- Review deprecation docs (2 files)
- Check if HTML should be markdown (2 files)
- Decide on binary assets (3 files)

### 3️⃣ Playbooks audit
- Review web/CSS playbooks (8 files) - relevant?
- Review specialized playbooks (15 files) - still used?

### 4️⃣ Scripts cleanup
- Delete scripts/legacy/ (22 files)?
- Review fixtures (large JSON files)

### 5️⃣ Deep review
- webdocs/ directory (what is this?)
- Old/large docs in docs/

---

**Next Step:** Review items in priority order, classify each as KNOWN/DELETE/ARCHIVE
