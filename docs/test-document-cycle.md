---
title: Test Document for Full Cycle Verification
date: 2025-12-17
tags: [test, verification, integration]
---

# Test Document for Full Cycle Verification

This document tests the complete PolyVis ingestion and processing cycle.

## Purpose

Verify that all systems work together:
1. **Dev Server** - CSS/JS watching and web serving
2. **Daemon** - File watching and automatic ingestion  
3. **MCP Server** - API for AI tool integration

## Test Scenario

When this document is saved:
- Daemon detects the change within 2 seconds
- Triggers debounced ingestion
- Document is parsed and normalized
- Entities are extracted
- Embeddings are generated
- Graph nodes and edges are created
- Database is updated
- MCP server can query the new data

## Expected Behavior

### Daemon Log Output:
```
📝 Change detected: docs/test-document-cycle.md (change)
🔄 Debounce settle. Starting Batch Ingestion (1 files)...
✅ Batch Ingestion Complete.
```

### Database Updates:
- New node created for this document
- Embeddings generated for content
- Edges created to related concepts

### MCP Accessibility:
- Document searchable via MCP search tool
- Content retrievable via MCP read tool

## Key Concepts

This document mentions several concepts to test entity extraction:
- **Ingestion Pipeline** - The data processing workflow
- **Vector Embeddings** - Semantic representation of text
- **Knowledge Graph** - Connected nodes and edges
- **Real-time Processing** - Immediate response to file changes

## Verification

After saving this document:
1. Check `.daemon.log` for ingestion messages
2. Query database for this document's node
3. Test MCP search for "Full Cycle Verification"
4. Verify graph visualization shows new node

## Success Criteria

✅ Daemon detects file within 2 seconds
✅ Ingestion completes without errors  
✅ Node created with correct title
✅ Embeddings generated successfully
✅ MCP search returns this document
✅ No error messages in any service logs

---

**Status:** Testing in progress...
**Last Updated:** 2025-12-17 20:09:00


## Updated at Wed 17 Dec 2025 20:11:36 GMT

## Trigger at 20:12:55

## Another update at 20:13:21
