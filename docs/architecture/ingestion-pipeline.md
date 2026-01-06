# Ingestion Pipeline Architecture

## Overview
The PolyVis "Resonance" Ingestion Pipeline is a robust, modular system designed to transform raw markdown content into a semantic Knowledge Graph. It follows a "Belt and Braces" philosophy, ensuring data integrity through strict schema validation and automated redundancy checks.

## Architecture Topology

```mermaid
graph TD
    Sources[Sources (Docs, Debriefs, Playbooks)] -->|Watch/Scan| Ingestor[Ingestor Class]
    Ingestor -->|Parse| Tokenizer[ZeroMagic Tokenizer]
    Ingestor -->|Embed| Embedder[Embedder Service]
    Ingestor -->|Store| DB[(ResonanceDB SQLite)]
    
    subgraph "The Weavers"
        DB -->|Read| TimelineWeaver
        DB -->|Read| SemanticWeaver
        TimelineWeaver -->|Write Edges| DB
        SemanticWeaver -->|Write Edges| DB
    end
    
    subgraph "The Bridge"
        Embedder -->|RPC| Daemon[Vector Daemon :3010]
        Daemon -.->|Fallback| LocalONNX[Local ONNX Model]
    end
```

## Key Components

### 1. The Bridge (`Embedder.ts`)
A fault-tolerant client that manages vector generation.
-   **Primary:** RPC call to `localhost:3010/embed` (Daemon). Fast, cached.
-   **Secondary:** Loads `fastembed` (ONNX) locally if Daemon is unreachable.
-   **Model:** `AllMiniLML6V2` (384 dimensions).

### 2. The Ingestor (`Ingestor.ts`)
The orchestrator.
-   **Phased Execution:**
    1.  **Persona Phase:** Lexicon (Terms) and CDA (Directives).
    2.  **Experience Phase:** Documents, Debriefs, Playbooks.
-   **Idempotency:** Uses `LocusLedger` hashing to skip unchanged files.
-   **Hybrid Storage:** Stores structured data (SQL) and Vectors (BLOBs) in the same `nodes` table.

### 3. The Weavers
Modular logic units that infer relationships *after* node insertion.
-   **TimelineWeaver:** Links nodes chronologically based on `YYYY-MM-DD` patterns in filenames (e.g., Debriefs). Creates `next`/`prev` edges.
-   **SemanticWeaver:** Performs vector similarity search (`findSimilar`) for orphan nodes and links them to their nearest semantic neighbors.
-   **LocusWeaver (Planned):** Links specific Code Locus blocks to their Definitions.

### 4. ResonanceDB (`db.ts`)
The Single Source of Truth.
-   **Schema:** Defined in `schema.ts`. Versioned migrations.
-   **FTS5:** Full-Text Search virtual table synchronized via Triggers.
-   **Performance:** WAL mode enabled.

## Enhancing the Pipeline
To add new capabilities (Enhancers):
1.  **Create a Weaver:** Implement a class with a static `weave(db: ResonanceDB)` method.
2.  **Register:** Add the call to `Ingestor.runWeavers()`.
3.  **Verify:** Run `bun run src/resonance/cli/ingest.ts` and check the validation report.
