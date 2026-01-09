amalfa/src/README.md
```

# Source Directory

## Purpose

This directory contains the core source code for the Amalfa project. Amalfa is an AI-powered documentation and knowledge management system that evolved from patterns discovered in the PolyVis project. The system enables agents and users to maintain living documentation through brief-debrief-playbook workflows.

## Key Files

- `cli.ts` - Main CLI entry point for the application
- `cli/` - CLI command implementations
- `config/` - Configuration management and loading
- `core/` - Core application logic and services
- `daemon/` - Background services (Vector Daemon, Sonar Agent)
- `mcp/` - Model Context Protocol server implementation
- `pipeline/` - Data processing pipelines
- `resonance/` - Knowledge graph and semantic services
- `types/` - TypeScript type definitions
- `utils/` - Utility functions and helpers

## Patterns

### Module Organization
Each major feature area has its own directory with a colocated README documenting its purpose, key exports, and stability status.

### Configuration
- Uses `amalfa.config.ts` for user configuration
- Supports JSON fallback (`amalfa.config.json`)
- Configuration is loaded via `config/` module

### CLI Architecture
- Main entry: `cli.ts`
- Commands are implemented as subdirectories in `cli/`
- Uses a command pattern for extensibility

### Service Architecture
- Daemon processes run in `daemon/` for long-running services
- MCP server in `mcp/` provides external API access
- Resonance services in `resonance/` handle knowledge graph operations

## ⚠️ Stability

This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.