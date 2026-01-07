# PolyVis Database Schema


## Proposed Migration

To support the Forensic-Pipeline

Based on the **Canonical Schema** and the requirements of the **Forensic/Epstein Pipeline**, here are the specific schema extensions required.

### Table: `nodes`

* **No Schema Changes Required.**
* *Operational Note:* Use the existing `meta` JSON column to store flight details (`tail_number`, `date`) and document status (`status`). Use `title` for Canonical Names.

## Canonical Nodes and Edges Schema

### Table: `edges`

* **Add Column:** `weight` `INTEGER` (Default: `2`)
* *Purpose:* To store the **OPM-11 Veracity Score** (0-5).


* **Add Column:** `meta` `TEXT`
* *Purpose:* To store the **Context Snippet** (Bento-Box) and Audit ID justifying the link.


* **Add Index:** `idx_edges_weight` on `(weight)`
* *Purpose:* To optimize "Falsifiability" queries (e.g., `SELECT * WHERE weight = 0`).

This document outlines the canonical schema for the `nodes` and `edges` tables in the PolyVis system. This schema is defined in `src/resonance/schema.ts` and mirrored in `src/db/schema.ts`.

## Core Tables

### Nodes (`nodes`)

The `nodes` table stores the fundamental units of the knowledge graph.

| Column | Type | Description |
| :--- | :--- | :--- |
| **`id`** | `TEXT` | **Primary Key**. Unique identifier for the node. |
| `type` | `TEXT` | The node type (e.g., `concept`, `note`, `chunk`). |
| `title` | `TEXT` | Human-readable title. |
| `content` | `TEXT` | The full text content of the node. |
| `domain` | `TEXT` | Taxonomy domain (e.g., `knowledge`). |
| `layer` | `TEXT` | Taxonomy layer (e.g., `experience`). |
| `embedding`| `BLOB` | The vector embedding (stored as a buffer/blob). |
| `hash` | `TEXT` | Content hash for integrity checking. |
| `meta` | `TEXT` | JSON string containing arbitrary metadata. |

### Edges (`edges`)

The `edges` table defines the relationships between nodes.

| Column | Type | Description |
| :--- | :--- | :--- |
| **`source`** | `TEXT` | **Foreign Key** (Node ID) - Origin of the edge. |
| **`target`** | `TEXT` | **Foreign Key** (Node ID) - Destination of the edge. |
| **`type`** | `TEXT` | The edge relationship type (e.g., `related_to`). |

> **Primary Key**: The `edges` table uses a composite primary key of `(source, target, type)`.

## Auxiliary Structures

### Full Text Search (`nodes_fts`)

A virtual table using `fts5` is maintained specifically for full-text search capabilities.

- **Columns**: `id` (UNINDEXED), `title`, `content`, `meta`.
- **Tokenizer**: `porter`.
- **Synchronization**: Automatically kept in sync with the `nodes` table via database triggers (`INSERT`, `UPDATE`, `DELETE`).

### Indexes

Performance indexes are maintained on the `edges` table to optimize graph traversals.

- `idx_edges_source`: Index on `edges(source)`
- `idx_edges_target`: Index on `edges(target)`
