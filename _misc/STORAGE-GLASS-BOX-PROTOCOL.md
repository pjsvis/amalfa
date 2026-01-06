Here is the consolidated **System Architecture Specification**. It captures the full scope of our dialogue, freezing the logic into a single, durable artifact for your repository.

Enjoy The Strathie. A half-pint and crisps is a well-earned reward for defining the future of agentic architecture.

***

# System Architecture Specification: The Glass Box Protocol

**Version:** 1.0.0
**Status:** DRAFT / APPROVED
**Context:** Multi-Agent Orchestration & Knowledge Management
**Philosophy:** Headless, Artifact-Centric, Hypermedia-Driven

---

## 1. Executive Summary

This document defines the architecture for a scalable, audit-ready "Agent Farm." It rejects the opaque "Black Box" model of traditional chat-based agents in favor of a **"Glass Box"** approach. The system relies on durable **Markdown Artifacts** as the source of truth, a **Bifurcated Assimilation** strategy to solve CPU scaling bottlenecks, and a **Hypermedia Interface** (Files/SQLite over HTTP) to decouple orchestration from execution.

The result is a system that scales from a single developer's laptop to a distributed enterprise cluster without changing the fundamental agent logic.

---

## 2. Core Axioms

1.  **The Repository is the Message Bus:** Agents do not communicate directly. They communicate by writing structured files to a shared file system (Local or Cloud). If it isn't in the Repo, it didn't happen.
2.  **The File is the API:** The interface for all operations is the File System. The data contract is the Markdown format. This ensures "God Mode" observability and infinite durability.
3.  **Mentation into Artifacts:** The primary function of an agent is "Mentation"—transforming unstructured "stuff" (thoughts/execution) into structured "things" (Mission Artifacts).
4.  **Bifurcation of Signal:** Not all data is equal. "Success" is cheap (Graph); "Failure" is expensive (Vector). We scale by treating them differently.

---

## 3. Data Architecture: The Mission Artifact

We abandon the concept of separate "Briefs" and "Logs." We unify them into a single, living **Mission Artifact**.

### 3.1 The Lifecycle of a File
A single Markdown file (e.g., `mission-001.md`) evolves through three states:
1.  **Aspiration (The Request):** Created by the Orchestrator. Contains the objective and constraints.
    * *State:* `PENDING`
2.  **Execution (The Work):** Appended by the Agent. Contains the plan, steps taken, and interim thoughts.
    * *State:* `IN_PROGRESS`
3.  **Debrief (The Reality):** Finalized by the Agent. Contains the outcome and "Lesson Learned."
    * *State:* `COMPLETE`

### 3.2 The Gap Analysis
The "Reality Gap" is effectively measured by the semantic distance between the **Aspiration** section and the **Debrief** section within the same file. This enables automated auditing of intent vs. outcome.

---

## 4. The Context Lake ("Universal Fabric")

We replace rigid database schemas with a **Semantic Data Lake**.

* **Smashing Domains:** Distinct domains (e.g., `PERSONA`, `EXPERIENCE`, `DEVOPS`) write to the same file structure. We "smash" them together into a unified graph by mounting their directories.
* **The Vector Glue:** We utilize vector embeddings to automatically discover "Sneaky" relationships between disjoint domains (e.g., correlating a `PERSONA` directive with a `DEVOPS` failure log) without explicit foreign keys.

---

## 5. System Components

### 5.1 The Orchestrator (Stateless Commander)
* **Role:** The "Browser" of the system.
* **Behavior:** It navigates the file system/API. It issues commands by writing new Mission Artifacts. It investigates issues by reading the Graph.
* **Constraint:** It operates on the "Next Task" principle, relying on the durable record for history rather than maintaining internal state.

### 5.2 The Assimilator (The Triage Engine)
To prevent the "Zone of Diminishing Returns" (CPU Thrashing), the Assimilator applies a **Bifurcated Triage Strategy**:
* **Hot Path (80% of volume):** Routine "Success" signals are written directly to the Graph DB (SQLite). **No Vector Embedding.** Extremely fast, low CPU.
* **Cold Path (20% of volume):** "Failures," "Complex Plans," and "Lessons" are sent to the Embedding Engine. Vectors are generated and stored for semantic search. High CPU, high value.

### 5.3 The Whatever-API (The Waiter)
A simplified interface that serves the Context Lake to agents.
* **Endpoint:** `GET /api/context`
* **Mode A (Raw):** Returns the raw JSON AST of changed files (for triggers).
* **Mode B (SQLite Over Easy):** Streams a binary snapshot of the `knowledge.sqlite` database to the agent.
    * *Benefit:* Moves compute to the edge. The agent runs complex joins locally, acting as a "Read Replica".

---

## 6. Scaling Horizons

### 6.1 Local-First Horizon
* **Limit:** ~37,000 Documents (based on 8GB RAM).
* **Constraint:** RAM is the bottleneck.
* **Verdict:** Sufficient for personal use and small teams for years.

### 6.2 Server-Side Horizon
* **Limit:** Driven by **CPU Contention** (Vector Search).
* **Constraint:** Indiscriminate vectorization causes the system to "Thrash" and plateau at ~8 concurrent agents.
* **Mitigation:** The **Bifurcated Assimilation** strategy (Section 5.2) pushes this saturation point to the right by ~10x-20x.

---

## 7. Operational Workflow: "The Loop"

1.  **Orchestrator** writes `mission-X.md` (Aspiration).
2.  **Agent** wakes up, reads `mission-X.md`.
3.  **Agent** requests context via **Whatever-API** (receives SQLite snapshot).
4.  **Agent** executes task, appends to `mission-X.md`.
5.  **Agent** finishes, writes `## Debrief`.
6.  **Assimilator** detects file change.
    * *Success?* -> Update Graph (Hot Path).
    * *Failure?* -> Embed & Update Vector DB (Cold Path).
7.  **Orchestrator** observes state change, plans next move.

---

## 8. Conclusion

This architecture represents the **"End of History"** for our agent design. By leveraging the Web's architecture (Files, HTTP, Caching) and applying strict data hygiene (Bifurcation, Markdown Artifacts), we achieve a system that is:

* **Observable:** Glass Box design.
* **Scalable:** Awareness of Hardware Limits.
* **Resilient:** "Spooling" capability via file system.
* **Simple:** No magic, just files.