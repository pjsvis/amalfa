---
title: System Overview
type: architecture
tags: [system, architecture, overview, flow]
status: stable
---

# System Overview: The Mental Metabolism

## 1. Stephensonian Review

- **Who**: The User (Creator) and the Agent (Synthesizer).
- **What**: An autonomous "Mental Metabolism" that transforms raw information ("Stuff") into structured knowledge ("Things").
- **Where**: Local-first, privacy-centric environment (`.amalfa/`).
- **When**: Continuous background operation (Watcher) + On-demand batch processing (Squash).
- **Why**: To reduce cognitive load by offloading memory management and connection-finding to the machine.

## 2. Global Data Flow

The system operates as a cycle of ingestion, extraction, enrichment, and consolidation.

![System Diagram](./diagrams/00-system.svg)

<details>
<summary>Source (DOT)</summary>

```dot
digraph AmalfaSystem {
    compound=true;
    node [shape=record, fontname="Arial"];
    
    subgraph cluster_World {
        label = "External World";
        Docs [label="Markdown Docs"];
        Code [label="Source Code"];
    }
    
    subgraph cluster_Amalfa {
        label = "Amalfa Runtime";
        Ingest [label="Ingest\n(Watcher)"];
        DB [label="ResonanceDB\n(Graph Store)"];
        Enrich [label="Enrich\n(Ember)"];
        Sidecar [label="Sidecar\n(JSON)"];
    }
    
    Docs -> Ingest [label="Modify"];
    Ingest -> DB [label="Update Nodes"];
    Ingest -> Enrich [label="Trigger"];
    Enrich -> Sidecar [label="Generate"];
    
    subgraph cluster_Batch {
        label = "Maintenance";
        Consolidate [label="Consolidate\n(Squash)"];
    }
    
    Sidecar -> Consolidate [label="Read"];
    Consolidate -> Docs [label="Enrich (Write Back)"];
    
    DB -> Docs [label="Query/RAG"];
}
```

</details>

## 3. System Coherence Status

> **⚠️ Feedback Loop Warning:** The feedback loop between `Consolidate` (Write) and `Ingest` (Read/Trigger) is the system's heartbeat. Currently, we need to verify that `Ingest` events triggered by `Consolidate` are correctly classified as "Maintenance" rather than "User Input" to prevent unnecessary re-processing.
