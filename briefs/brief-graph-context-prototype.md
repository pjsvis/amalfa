### Brief: "Ctx" Graph Context Prototype (Structural & Relational Ingestion)

This brief outlines the development of a **Minimum Viable Prototype** for a structural graph ingestor within the Sidecar ecosystem. The goal is to move from linear text search to a relational "Mental Map" of the repository, significantly reducing token costs by providing high-density, pre-connected context.

---

#### 1. Objective

Build a local, SQLite-backed graph ingestion service that parses **Conceptual artifacts** (CDA/CL JSON), **Operational metadata** (`td` tasks), and **Structural code data** (Go source) into a unified relational network.

#### 2. Core Entities (The Node Schema)

We will implement the following node types to bridge the "Persona Stack":

* **`Artifact` (Conceptual)**: Entries from `conceptual-lexicon-ref-v1.79.json` and `CDA #63`.
* *Properties:* ID, Term, Definition, Category, Version.


* **`Task` (Operational)**: Tasks from the `td` management system.
* *Properties:* TaskID, Title, Status, Worktree.


* **`CodeUnit` (Structural)**: Files and functions from the local repository.
* *Properties:* FilePath, SymbolName, Type (File/Func), LastCommit.


* **`Session` (Historical)**: Conversation logs ingested from `.jsonl` adapters.
* *Properties:* SessionID, AdapterID, Summary, UpdatedAt.



#### 3. Relation Logic (The Edge Schema)

The prototype will focus on three "high-signal" relationship types:

* **`AUTHORIZES`**: `Artifact`  `Task` (e.g., "Directive COG-12 authorizes this task").
* **`IMPLEMENTS`**: `CodeUnit`  `Artifact` (e.g., `adapter.go` implements the `Adapter` interface defined in the CL).
* **`EVOLVED_IN`**: `Artifact` or `CodeUnit`  `Session` (Linking logic changes to the conversation where they were decided).

#### 4. The Prototype Pipeline

The ingestion should extend the existing `internal/adapter/cache/jsonl.go` and `internal/adapter/adapter.go` patterns:

1. **Scanner Extension**: Utilize the `ScannerPool` and `NewScanner` logic to efficiently parse large JSONL logs for "Relationship Markers" (e.g., tags like `[Guided_By: OH-096]`).
2. **SQLite Graph Backend**: Implement a simple table structure:
* `nodes`: `(id PRIMARY KEY, type, data_json)`
* `edges`: `(source_id, target_id, relation_type, weight)`


3. **Discovery Layer**: Leverage the `Adapter` interface's `Sessions` and `Detect` methods to identify what needs to be indexed per-project.

#### 5. Proposed "Low-Cost" Capability

**The Trace Query**: Replace a global Ripgrep of "Mentation" with a graph hop.

* *Input:* Current File (`internal/adapter/adapter.go`) + Query ("Mentation").
* *Process:* 1. Look up `adapter.go` node.
2. Find connected `Artifact` nodes (e.g., `Mentation`).
3. Return only the definition and related `Heuristics` (OHs).
* *Token Savings:* ~90% reduction compared to broad-file RAG.

#### 6. Next Steps

* **A. Persistence**: Save this brief to `docs/prototypes/graph-ingestor-v1.md`.
* **B. Implementation**: Create `internal/graph/sqlite.go` to handle the initial DDL and node insertion logic.
* **C. Integration**: Add a `GraphWatch` method to the `Adapter` interface to trigger incremental updates during the "Work" phase.

**Does this align with your vision for the "Amalfa" project extension?**