# Resonance Services Directory

## Purpose
Service implementations for the Resonance engine - Amalfa's semantic memory and knowledge graph system. These services handle core operations like database interactions, graph traversal, and semantic queries.

## Key Services

| Service | Purpose |
|---------|---------|
| `DatabaseFactory` | Factory for creating database connections |
| `GraphService` | Knowledge graph operations (nodes, edges, queries) |
| `MemoryService` | Semantic memory storage and retrieval |
| `EmbeddingService` | Text embedding generation and management |

## Key Files

- `index.ts` - Main exports of all services
- `database.ts` - Database connection and query services
- `graph.ts` - Knowledge graph traversal and manipulation
- `semantic.ts` - Semantic similarity and search services

## Patterns

- Services are stateless where possible
- Dependency injection for testability
- Async/await for all I/O operations
- Error handling with context-rich messages

## Related

- See also: `src/resonance/README.md` for overall resonance documentation
- See also: `src/resonance/types/` for type definitions
- See also: `src/resonance/pipeline/` for data processing pipelines

## ⚠️ Stability
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.