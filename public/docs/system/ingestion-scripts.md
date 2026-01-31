# How to Run Data Ingestion Pipelines

This document provides the commands and descriptions for the scripts that process source data and prepare it for use by the Polyvis application. These scripts are essential for ensuring that changes to the knowledge base (e.g., new debriefs, updated lexicon terms) are reflected in the UI.

There are two primary pipelines that can be run independently.

---

## 1. Building the Knowledge Graph (`ctx.db`)

This pipeline processes the structured JSON data (the Conceptual Lexicon and Core Directives) into a relational SQLite database. This database powers the graph visualization and the relationships between different concepts.

-   **Script:** `scripts/build_db.ts`
-   **When to Run:** Run this script whenever you have made changes to the source JSON files (`conceptual-lexicon-ref-v1.79.json` or `cda-ref-v63.json`).

### Command

To execute the graph data pipeline, run the following command from the project root:

```sh
bun run scripts/build_db.ts
```

---

## 2. Building the Public Documentation

This pipeline processes the Markdown documents (Debriefs, Playbooks, etc.) and prepares them for display in the UI. It copies the files to the `public/docs` directory and performs any necessary transformations, such as reordering the sections in debrief files.

-   **Script:** `scripts/build_experience.ts`
-   **When to Run:** Run this script whenever you have added or modified Markdown files, such as creating a new debrief or updating a playbook.

### Command

To execute the document data pipeline, run the following command from the project root:

```sh
bun run scripts/build_experience.ts
```

---

## Running a Full Rebuild

To ensure all data is completely up-to-date, you should run both scripts. They can be run in any order.

```sh
## First, rebuild the documentation files
bun run scripts/build_experience.ts

## Second, rebuild the SQLite database
bun run scripts/build_db.ts
```
