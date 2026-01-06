# Debrief: Performance Benchmarking & MCP Stabilization

**Date:** 2025-12-16
**Topic:** Performance Baselines, Vector Strategy, and System Hardening.

## 1. Objectives
-   **Measure Performance:** Establish baselines for Memory, Disk, and Speed.
-   **Audit Vectors:** Verify compliance with "All settings folders included" policies.
-   **Stabilize MCP:** Fix "Invalid Character" protocol violations and crash loops.
-   **Codify Process:** Implement "Harden and Flense" standards.

## 2. Accomplishments

### A. Performance Baselines Established
We successfully measured and documented the system's performance (see [PERFORMANCE_BASELINES.md](../docs/PERFORMANCE_BASELINES.md)).
-   **Speed:** Search Latency ~71ms, Model Load ~192ms.
-   **Efficiency:** Narrative Vector Strategy successfully reduces vector count (-16%) while increasing node count (+37%).

### B. Vector Strategy Verified
-   **Policy Compliance:** 100% of required folders (`debriefs`, `playbooks`, `briefs`, `docs`) are vectorized.
-   **Optimizations:** Persona files (`lexicon`, `cda`) are intentionally excluded (Keyword/Graph match is sufficient).
-   **Transient Artifacts:** Test data (`test-doc-X`) identified and excluded from production concerns.

### C. MCP Server "Hardened and Flensed"
-   **Flensed:** Removed `console.log` pollution from `stdout`. All startup logs now go to `stderr`, fixing the JSON-RPC "Invalid Character" error.
-   **Hardened:** Implemented `SKIP_ZOMBIE_CHECK` to allow the Test Client to verify the server without triggering false-positive "Duplicate Service" defenses.

## 3. Lessons Learned (With Evidence)

### A. Output Discipline is System Critical
*   **The Trigger:** The MCP Client crashed with `SyntaxError: Unexpected token 'ð'` (from the emoji 🚀) and `invalid character 'ð' looking for beginning of value`.
*   **The Reality:** We were logging "🚀 Server Started" to `stdout`. In a piped architecture (JSON-RPC), `stdout` is the data wire. Any non-JSON text creates a protocol violation.
*   **The Lesson:** In agentic systems, **Log to Stderr, Data to Stdout.** This is now enforced in the *Harden and Flense Protocol*.

### B. "Flensing" the Inner Loop Saves the System
*   **The Evidence:** Our Performance Audit revealed that while Node count grew by **37%**, Vector count *dropped* by **16%**.
*   **The Optimization:** We intentionally omitted vectors for `concept` (161 nodes) and `directive` (24 nodes) files.
*   **The Result:** The system runs faster (~71ms search) and uses less memory because we stopped generating heavy vectors for structural nodes that are easily found via Graph Traversal.
*   **The Lesson:** Don't vectorize everything. **Subtract work** from the inner loop to gain stability.

### C. Standardization Prevents "Ghost" Bugs
*   **The Trigger:** In previous sessions, we fought constant `SQLITE_BUSY` and `disk I/O error`s when running scripts alongside the daemon.
*   **The Fix:** Today, we migrated *every* script to use `DatabaseFactory.connectToResonance()`.
*   **The Evidence:** During the complex MCP debugging (Server + Client + Test Script all accessing DB), we saw **zero** SQLite errors.
*   **The Lesson:** A Single Source of Truth for database connection logic is not just clean code; it is an operational requirement for SQLite concurrency.

### D. Automated Defense Needs Context Awareness
*   **The Trigger:** The `test_mcp_query.ts` script failed repeatedly.
*   **The Cause:** The `ZombieDefense` system saw the test client spawning a server and identified the server as a "Duplicate Service" (same entry point), immediately killing it.
*   **The Lesson:** blind automation kills valid use-cases. We added the `SKIP_ZOMBIE_CHECK` bypass to allow for "Self-Hosted" test scenarios.

## 4. Next Steps
-   Adhere to the Harden and Flense protocol for all future service implementations.
-   Promote baselines to official documentation.
