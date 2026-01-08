# Capabilities Summary

This document serves as the central index of AMALFA's capabilities, linking to detailed playbooks and technical reports.

## 1. Core Memory (ResonanceDB)
**Capability:** Semantic knowledge graph engine.
- **Description:** Stores documents as "Hollow Nodes" (metadata + embeddings) with edges woven by latent semantic analysis.
- **Key Features:**
    - **FAFCAS Protocol:** Normalized embeddings for 10x faster search.
    - **Hollow Nodes:** Filesystem is the source of truth; DB is the index.
    - **Graph Traversal:** Find related nodes via shared terms/entities.
- **Reference:** [Local-First Vector DB Playbook](local-first-vector-db-playbook.md)
- **Reference:** [Embeddings & FAFCAS Playbook](embeddings-and-fafcas-protocol-playbook.md)
- **Reference:** [SQLite Standards](sqlite-standards.md)

## 2. Ingestion Pipeline
**Capability:** Markdown-to-Graph transformation.
- **Description:** robust file watcher and batch ingestor.
- **Key Features:**
    - **Pre-flight Check:** Validates corpus health before ingestion.
    - **Pinch Check (OH-104):** Verifies physical file integrity after checkpoints.
    - **Staleness Detection:** Warns if DB is older than source files.
- **Reference:** [Ingestion Pipeline Architecture](../docs/architecture/ingestion-pipeline.md)

## 3. Sonar Agent (AI Layer)
**Capability:** Local LLM intelligence (Phi-3/TinyDolphin).
- **Description:** Background daemon providing "Intelligence as a Service."
- **Key Features:**
    - **Semantic Search:** Hybrid search (Keyword + Vector) with reranking.
    - **Metadata Enhancement:** Auto-generates tags, summaries, and themes.
    - **Context Extraction:** Smart snippet generation for RAG.
    - **Task Queue:** *Filesystem-based async task processing (In Progress).*
- **Reference:** [Sonar System Overview](sonar-system-overview.md)
- **Reference:** [Sonar Manual](sonar-manual.md)
- **Report:** [Capability Report (2026-01-08)](../docs/reports/SONAR-CAPABILITY-REPORT-2026-01-08.md)

## 4. MCP Server (The Interface)
**Capability:** Protocol for connecting to Cursor/Claude.
- **Description:** Exposes AMALFA tools to external agents.
- **Key Tools:**
    - `search_documents`: Semantic search.
    - `read_node`: Full content retrieval.
    - `explore_links`: Graph traversal.
    - `inject_tags`: *Gardening* tool for agent-led organization.
- **Reference:** [MCP Implementation Brief](../briefs/archive/brief-mcp-implementation-01.md)

## 5. Deployment & Release
**Capability:** Automated publishing workflow.
- **Description:** rigorous release gates and OIDC automation.
- **Key Features:**
    - **Single Source of Truth:** `package.json` drives all versioning.
    - **Automated Validation:** Lint, Build, and Config checks before publish.
- **Reference:** [Publishing Playbook](publishing-playbook.md)

---

## Index of Playbooks
| Playbook | Purpose |
| :--- | :--- |
| **[Local First DB](local-first-vector-db-playbook.md)** | Core database architecture decisions |
| **[Embeddings & FAFCAS](embeddings-and-fafcas-protocol-playbook.md)** | Vector math and optimization strategies |
| **[SQLite Standards](sqlite-standards.md)** | SQL patterns for reliability (WAL, Busy Timeout) |
| **[Sonar System](sonar-system-overview.md)** | Agent architecture and API spec |
| **[Publishing](publishing-playbook.md)** | Release engineering and safety |
| **[Scripts](scripts-playbook.md)** | Catalog of maintenance and utility scripts |
| **[Debriefs](debriefs-playbook.md)** | Guideline for writing reflective debriefs |
