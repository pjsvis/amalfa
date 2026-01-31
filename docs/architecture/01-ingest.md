---
title: Ingest Service
type: architecture
tags: [ingest, watcher, daemon, data-flow]
status: stable
---

# Ingest Service (Watcher)

## 1. Stephensonian Review

- **Who**: `AmalfaDaemon` (Node.js Service).
- **What**: File System Watcher (`chokidar`/`fs.watch`).
- **Where**: `src/daemon/index.ts`.
- **When**: Real-time on file modification (Debounced 1000ms).
- **Why**: To maintain an up-to-date registry of all nodes in `ResonanceDB` without manual sync.

## 2. State Machine

![Ingest Service Diagram](./diagrams/01-ingest.svg)

<details>
<summary>Source (DOT)</summary>

```dot
digraph IngestService {
    rankdir=LR;
    node [shape=box, fontname="Courier New"];
    
    Idle [label="Idle\n(Watching)"];
    ChangeDetected [label="Change Detected\n(fs.watch)"];
    Debounce [label="Debounce\n(Timer)"];
    Ingest [label="Ingest\n(AmalfaIngestor)"];
    TriggerEnrich [label="Trigger Enrich\n(Ember)"];
    SidecarGen [label="Generate Sidecar\n(.ember.json)"];
    Retry [label="Retry Queue\n(Backoff)"];
    
    Idle -> ChangeDetected [label="File Modified"];
    ChangeDetected -> Debounce [label="Add to Batch"];
    Debounce -> Debounce [label="New Event"];
    Debounce -> Ingest [label="Timer Expired"];
    
    Ingest -> TriggerEnrich [label="Success\n(Update DB Nodes)"];
    Ingest -> Retry [label="Error"];
    
    TriggerEnrich -> SidecarGen [label="Semantic Data Found"];
    TriggerEnrich -> Idle [label="No Data / Cached"];
    
    SidecarGen -> Idle [label="Complete"];
    
    Retry -> Ingest [label="Retry (Max 3)"];
    Retry -> Idle [label="Abandoned"];
}
```

</details>

## 3. Critical Paths & Risks

*   **Atomicity**: `Ingest` must update `ResonanceDB` atoms (Nodes) atomically.
*   **Retry Logic**: The `Retry Queue` handles transient file locks (common on macOS).
*   **Trigger**: The `Ingest` service is the *only* component authorized to trigger the `Enrich` cycle automatically.
