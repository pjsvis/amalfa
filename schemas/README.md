# Data Schemas

This directory contains the canonical [JSON Schema](https://json-schema.org/) files that define the official data structures for the `polyvis` project.

These schemas serve as the single source of truth for validating the project's core data artifacts.

## Files

- `cda.schema.json`: Defines the required structure for a Core Directive Array (CDA) file.
- `conceptual-lexicon.schema.json`: Defines the required structure for a Conceptual Lexicon (CL) file.

## Purpose

1.  **Validation:** To programmatically ensure that any data file (either the private source files or public examples) conforms to the expected structure before it is processed by any build scripts.
2.  **Documentation:** To act as precise, machine-readable documentation for the project's data models.
3.  **Tooling Integration:** To enable editor features like autocompletion and real-time validation when editing the corresponding JSON data files.

## Future Use

These schemas are intended to be integrated into the `scripts/build_db.ts` process as a preliminary validation step. The build will fail if the source data files do not adhere to these structures, ensuring data integrity throughout the pipeline.
