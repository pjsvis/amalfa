# Protocol: Harden and Flense

**Status:** Active
**Context:** Coding Standards / System Stability
**Principle:** "Robustness through subtraction and strictness."

## The Philosophy
"Harden and Flense" is a mandatory final step in the coding process for the PolyVis system. It ensures that features not only work but are resilient (Hardened) and free of excess (Flensed).

### 1. FLENSE (Strip the Excess)
*   **Remove Console Noise:** All `console.log` statements used for debugging must be removed or converted to `console.error` if they are critical errors.
    *   **Rule:** Standard Output (`stdout`) is reserved for **Machine Readable Data** (JSON-RPC, piped output).
    *   **Rule:** Standard Error (`stderr`) is for logs, warnings, and human-readable status updates.
*   **Reduce Inner Loop Work:** Identify hot paths (e.g., ingestion iterators, search loops) and aggressively prune unnecessary operations.
    *   **Rule:** **Evidence-Based Inclusion.** Any operation added to the critical path (Ingestion, Startup, Search) must be justified. If it can be done lazily, asynchronously, or skipped, it must be.
    *   *Example:* We verified that `concept` nodes (161 items) could be retrieved via Graph Traversal (0ms cost) instead of Vector Search (~71ms cost), so we removed them from the vector index.
    *   *Benefit:* Radical reduction in memory pressure and faster feedback cycles.
*   **Remove Dead Code:** Delete commented-out blocks, unused imports (lint check), and temporary test logic.
*   **Simplify:** If a feature can be implemented with fewer lines or dependencies, refactor it.

### 2. HARDEN (Fortify the Logic)
*   **Zombie Defense:** Ensure services check for and handle stale locks, ghost processes, and duplicate instances.
    *   *Implementation:* Use `ZombieDefense.assertClean()`.
    *   *Bypass:* Implement `SKIP_ZOMBIE_CHECK` for test environments.
*   **Error Boundaries:** Wrap critical logic in try/catch blocks that fail gracefully or exit with specific error codes.
*   **Input Validation:** Never trust input, especially from `stdin` or external files. Verify schemas before processing.

## Checklist
Before marking a task as "Done":
- [ ] **Stdout Audit:** Is `stdout` clean? (Critical for MCP/Piped tools).
- [ ] **Inner Loop Audit:** Have I flensed the critical path? (No unjustified ops).
- [ ] **Process Hygiene:** Does it handle start/stop/restart cleanly?
- [ ] **Lint Check:** Are there unused variables or imports?
- [ ] **Crash Test:** What happens if I run it twice? (Should not crash or hang).
