---
date: 2026-01-07
tags: [hardening, oh-104, pinch-check, mcp-tools, resilience, code-audit, typescript, biome]
---

## Debrief: Code Audit & Hardening Implementation

**Context:** Comprehensive code audit against Actor Playbook heuristics revealed critical gaps in resilience layer, leading to production hardening improvements and codebase cleanup.

## Accomplishments

- **OH-104 (Pinch Check) Implemented:** Added physical file verification after WAL checkpoint in `src/pipeline/AmalfaIngestor.ts`. The system now verifies the database file exists and has non-zero size before declaring success. This prevents silent corruption where the OS lies about fsync or `bun:sqlite` fails silently.
  
  **Verification:** Running `init` now logs `✅ Pinch Check: db=208.0KB` confirming physical write.

- **inject_tags Tool Idempotency Fixed:** Implemented merge/replace logic in `src/mcp/index.ts` to deduplicate tags and prevent stacking multiple tag blocks. The tool now checks for existing `<!-- tags: ... -->` blocks and merges new tags into them instead of blindly appending.
  
  **Verification:** Test script confirms single tag block maintained across multiple injections.

- **TypeScript & Biome Compliance:** Fixed all TypeScript errors related to private property access (replaced `db.db` with `db.getRawDb()` in 6 locations). Applied Biome formatting to all modified files.

- **Test Coverage:** Created `scripts/verify/test-hardening.ts` to verify both OH-104 and inject_tags improvements.

- **Documentation:** Comprehensive debrief documenting the audit findings, fixes, and architectural insights.

## Problems

- **Missing OH-104 in Production:** The ingestion pipeline was running without physical file verification after checkpoint. While unlikely, this could have resulted in silent data loss if the OS or SQLite lied about fsync success.
  
  **Resolution:** Added file existence and size checks immediately after `PRAGMA wal_checkpoint(TRUNCATE)` with explicit error messages referencing OH-104.

- **TypeScript Strictness Violations:** Multiple test and script files were accessing the private `db` property directly, bypassing the public API. This broke TypeScript compilation.
  
  **Resolution:** Systematically replaced all `db.db.query()` calls with `db.getRawDb().query()` across the codebase.

- **Biome Formatting Inconsistencies:** Files had import ordering and formatting issues that failed CI checks.
  
  **Resolution:** Ran `bunx biome check --write --unsafe` to auto-fix all formatting issues while preserving intentional `as any` usage in test files.

## Lessons Learned

- **Actor Playbook Heuristics Are Gold:** The OH-104 and OH-105 patterns from the Actor Playbook caught a real production gap. These "paranoia" checks are not theoretical—they prevent real failure modes. **Action:** Reference Actor Playbook during all database/persistence work.

- **Hollow Node Pattern is Brilliant:** The decision to store only metadata+embeddings in SQLite while keeping content on the filesystem creates a resilient, rebuildable system. The database is just an index. **Action:** Document this pattern in architecture docs.

- **Public APIs Exist For a Reason:** The `getRawDb()` method was created specifically to provide controlled access to the underlying database connection. Tests and scripts should use it instead of reaching into private properties. **Action:** Audit other scripts for similar violations.

- **Idempotency Matters For Agent Tools:** The inject_tags bug demonstrated that MCP tools will be called repeatedly by agents. Every tool must be idempotent. **Action:** Audit other MCP tools (search_documents, explore_links) for similar issues.

- **Code Audits Are High-Value:** A focused code audit against known patterns (like the Actor Playbook) surfaced two production issues and improved overall code quality in one session. **Action:** Schedule quarterly code audits against established playbooks.

## Files Modified

1. `src/pipeline/AmalfaIngestor.ts` - OH-104 implementation + formatting
2. `src/mcp/index.ts` - inject_tags idempotency + null check + formatting  
3. `tests/daemon-realtime.test.ts` - Fixed private property access + formatting
4. `scripts/query-node-ids.ts` - Fixed private property access + formatting
5. `scripts/verify/test-hardening.ts` - New comprehensive test script
6. `debriefs/2026-01-07-hardening-improvements.md` - Technical documentation

**Total:** 174 insertions, 94 deletions across 6 files

## Verification Status

- ✅ OH-104 active and logging in production
- ✅ inject_tags merge logic tested and working
- ✅ All TypeScript errors resolved
- ✅ Biome formatting compliant 
- ✅ Core test suite passing
- ✅ Hardening test script passing

**System Status:** Production-ready and hardened against silent failures.