
# Ember Service

Automated enrichment service for the Amalfa Knowledge Graph.

## Stability Clause

> **Warning**
> This module is responsible for modifying user data (markdown files). 
> 
> *   **Do not modify** `squasher.ts` without explicit regression testing.
> *   **Do not change** the sidecar format without updating `types.ts` and `generator.ts`.
> *   **Always use** `safe-dump` equivalent (e.g., `gray-matter`) when writing back files.

## Architecture

- **Analyzer**: Scans graph for enrichment opportunities.
- **Generator**: Writes changes to `.ember.json` sidecar files.
- **Squasher**: Merges sidecars into `.md` files safely.

## Usage

Included in the main Amalfa daemon. Can be triggered via CLI.
