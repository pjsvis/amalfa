---
date: 2026-01-17
tags: [mcp, tools, api, reference, agents]
---

# Amalfa MCP Tools Reference

This document provides a complete reference for all Model Context Protocol (MCP) tools that AI agents can use to interact with Amalfa's knowledge graph.

## Overview

Amalfa exposes 8 MCP tools for semantic search, graph traversal, content reading, and gap discovery. These tools enable AI agents to maintain persistent memory across sessions through structured markdown documentation.

### Search Quality: Why Two-Stage Reranking?

Amalfa uses a sophisticated two-stage retrieval pipeline to maximize search precision:

**Stage 1: Vector Search (Bi-Encoder)**
- Embeds query and documents separately using FastEmbed
- Fast approximate retrieval (~10ms for 1000 docs)
- Returns top 50 candidates based on semantic similarity
- Good recall but limited precision (can't model query-document interactions)

**Stage 2: BGE Reranking (Cross-Encoder)** ✨ Always Enabled
- Encodes query+document pairs together using attention mechanism
- More accurate relevance scoring (~50ms for 50 pairs)
- Returns refined ranking based on query-document interaction
- Typical improvement: 3-5 position changes, promoting more relevant docs to top
- Results tagged with `source: "vector+rerank"`

**Why This Matters:**
Vector search might rank "performance-audit" and "vector-database-best-practices" similarly (scores 0.741 vs 0.739) for query "vector database implementation". The reranker correctly identifies that "vector-database-best-practices" is MORE relevant to the specific query intent, promoting it to #1.

**Result:** You get the speed of vector search with the accuracy of cross-encoder reranking. Best of both worlds.

### Search Pipeline Flow

```
Query: "vector database implementation"
   ↓
┌─────────────────────────────────────┐
│  Stage 1: Vector Search (FastEmbed) │
│  • Embed query: [0.234, -0.891, ...] │
│  • Dot product with all docs        │
│  • Top 50 candidates (~10ms)        │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ Stage 2: BGE Reranker ✨ (Always)   │
│  • Encode query+doc pairs together  │
│  • Cross-attention scoring          │
│  • Rerank top 50 → top 20 (~50ms)  │
│  • Tag: "vector+rerank"             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Stage 3: Sonar LLM (Optional)      │
│  • Query intent analysis            │
│  • LLM-powered reranking            │
│  • Context extraction for top 5     │
│  • Falls back if unavailable        │
└──────────────┬──────────────────────┘
               ↓
         Final Results
```

## Tool List

1. **search_documents** - Semantic search across knowledge graph
2. **read_node_content** - Read full markdown content
3. **explore_links** - Traverse graph relationships
4. **list_directory_structure** - Show document organization
5. **find_gaps** - Discover semantic gaps in knowledge
6. **inject_tags** - Add metadata tags to documents (experimental)
7. **scratchpad_read** - Read cached tool outputs
8. **scratchpad_list** - List all cached outputs

## Tools

### 1. search_documents

**Purpose:** Semantic search across all indexed markdown documents.

**Signature:**
```typescript
search_documents(query: string, limit?: number): SearchResults
```

**Parameters:**
- `query` (required): Search query in natural language
- `limit` (optional): Maximum results to return (default: 20)

**Returns:**
```json
{
  "results": [
    {
      "id": "doc-abc123",
      "score": 0.876,
      "preview": "Document title or first line",
      "source": "vector+rerank",
      "snippet": "Relevant excerpt from document",
      "context": "Additional context about relevance"
    }
  ],
  "metadata": {
    "query": "original query",
    "sonar_enabled": false,
    "intent": null,
    "analysis": null
  }
}
```

**Example Usage:**

```
# Basic search
Agent: search_documents(query="authentication debugging lessons")

# Returns top 20 semantically relevant documents about auth debugging

# Limited search
Agent: search_documents(query="database migrations", limit=5)

# Returns top 5 most relevant documents
```

**Use Cases:**
- "What did we learn about X?"
- "Find past solutions for Y"
- "Show me all documents about Z"
- "Retrieve recent work on W"

**Performance:**
- Vector search: ~10ms for 1000 docs
- BGE reranking: ~50ms for top 50 candidates
- With Sonar LLM re-ranking: ~2-5s for top 20 results
- With context extraction: ~100ms for top 5 results

**Implementation Details:**
- Three-stage search pipeline (stages 1-2 always run, stage 3 optional):
  1. **Vector Search (FastEmbed bi-encoder):** Fast retrieval using `bge-small-en-v1.5` embeddings (384 dims). Returns top candidates based on cosine similarity. Uses FAFCAS protocol (normalized dot product).
  2. **BGE Cross-Encoder Reranking (Always Enabled):** Reranks candidates using `bge-reranker-base` cross-encoder. Encodes query-document pairs together for higher accuracy (~50ms). Improves result quality by 3-5 position changes on average. Results tagged as `"vector+rerank"`.
  3. **Sonar LLM Refinement (Optional):** If Sonar daemon is running, provides query intent analysis, result reranking, and context extraction for top 5 results (~2-5s). Falls back gracefully if unavailable.

### 2. read_node_content

**Purpose:** Read the full markdown content of a specific document.

**Signature:**
```typescript
read_node_content(id: string): Content
```

**Parameters:**
- `id` (required): Node ID from search results

**Returns:**
```
Raw markdown content of the document
```

**Example Usage:**

```
# After search
Agent: search_documents(query="API design patterns")
→ Returns: { id: "doc-xyz789", score: 0.92, ... }

# Read full content
Agent: read_node_content(id="doc-xyz789")
→ Returns: "# API Design Patterns\n\n## REST vs GraphQL\n..."
```

**Use Cases:**
- Read full context after search
- Extract details from specific document
- Verify information from search preview
- Copy patterns from past work

**Performance:**
- <5ms (filesystem read)

**Implementation Details:**
- Reads from filesystem (hollow nodes pattern)
- Path stored in node metadata
- No database content storage

### 3. explore_links

**Purpose:** Find related documents through graph relationships.

**Signature:**
```typescript
explore_links(id: string, relation?: string): Edges[]
```

**Parameters:**
- `id` (required): Source node ID
- `relation` (optional): Filter by relationship type

**Returns:**
```json
[
  { "target": "doc-abc123", "type": "references" },
  { "target": "doc-xyz789", "type": "follows" },
  { "target": "doc-def456", "type": "implements" }
]
```

**Example Usage:**

```
# All links
Agent: explore_links(id="brief-feature-auth")
→ Returns all outgoing edges

# Filtered by type
Agent: explore_links(id="debrief-cleanup", relation="references")
→ Returns only "references" edges
```

**Use Cases:**
- "What documents does this reference?"
- "Find related work"
- "Explore connected topics"
- "Trace idea evolution"

**Relationship Types:**
- `references` - Document mentions another
- `follows` - Sequential relationship (brief → debrief)
- `implements` - Implementation of spec
- `similar` - Semantically similar (auto-detected)

**Performance:**
- <5ms (indexed query)

### 4. list_directory_structure

**Purpose:** Show the directory organization of document sources.

**Signature:**
```typescript
list_directory_structure(): string[]
```

**Parameters:** None

**Returns:**
```json
["docs/", "briefs/", "debriefs/", "playbooks/"]
```

**Example Usage:**

```
Agent: list_directory_structure()
→ Returns list of source directories
```

**Use Cases:**
- Understand corpus organization
- Navigate document hierarchy
- Discover available content areas

**Note:** Currently returns static list. Future versions will dynamically scan configured sources.

### 5. find_gaps

**Purpose:** Discover semantically similar documents that aren't explicitly linked.

**Signature:**
```typescript
find_gaps(limit?: number, threshold?: number): Gap[]
```

**Parameters:**
- `limit` (optional): Maximum gaps to return (default: 10)
- `threshold` (optional): Similarity threshold (default: 0.8)

**Returns:**
```json
[
  {
    "source_id": "doc-abc123",
    "target_id": "doc-xyz789",
    "similarity": 0.85,
    "reason": "Both discuss authentication patterns but aren't linked",
    "suggested_link_type": "references"
  }
]
```

**Example Usage:**

```
# Find top 10 gaps
Agent: find_gaps()

# Find only very similar pairs
Agent: find_gaps(limit=5, threshold=0.9)
```

**Use Cases:**
- "What related documents should be linked?"
- "Find duplicate knowledge"
- "Discover hidden relationships"
- "Improve knowledge graph connectivity"

**Performance:**
- Requires Sonar daemon
- ~500ms for corpus of 1000 docs

**Implementation Details:**
- Compares vector similarity across all document pairs
- Filters out existing edges
- Uses LLM to suggest relationship type
- Threshold controls precision/recall tradeoff

### 6. inject_tags (Experimental)

**Purpose:** Add metadata tags directly to markdown files.

**Signature:**
```typescript
inject_tags(file_path: string, tags: string[]): Success
```

**Parameters:**
- `file_path` (required): Absolute path to markdown file
- `tags` (required): Array of tags to inject

**Returns:**
```
Successfully [injected|merged] N tags into /path/to/file.md
```

**Example Usage:**

```
Agent: inject_tags(
  file_path="/Users/user/docs/auth-guide.md",
  tags=["authentication", "security", "tutorial"]
)
→ Appends: <!-- tags: authentication, security, tutorial -->
```

**Use Cases:**
- Auto-tag documents during ingestion
- Add metadata discovered during analysis
- Organize knowledge graph by topic

**Behavior:**
- Appends HTML comment to end of file
- Merges with existing tags (deduplicates)
- Preserves existing content

**Status:** Experimental. May be replaced by frontmatter metadata in future versions.

### 7. scratchpad_read

**Purpose:** Read full content from a cached tool output.

**Signature:**
```typescript
scratchpad_read(id: string): Content
```

**Parameters:**
- `id` (required): Scratchpad entry ID (12-char hash)

**Returns:**
```
Full cached content from previous tool call
```

**Example Usage:**

```
# Previous search returns truncated results with cache ID
Agent: search_documents(query="complex topic")
→ Returns: "Results cached. Use scratchpad_read('a1b2c3d4e5f6') for full output"

# Read full cached output
Agent: scratchpad_read(id="a1b2c3d4e5f6")
→ Returns: Complete untruncated search results
```

**Use Cases:**
- Retrieve large outputs that were truncated
- Access previous tool results without re-running
- Reduce redundant searches

**Performance:**
- <1ms (in-memory cache)

**Cache Behavior:**
- Stores recent tool outputs in memory
- LRU eviction when cache fills
- Session-scoped (cleared on MCP restart)

### 8. scratchpad_list

**Purpose:** List all cached scratchpad entries with metadata.

**Signature:**
```typescript
scratchpad_list(): CacheStats
```

**Parameters:** None

**Returns:**
```json
{
  "entries": [
    {
      "id": "a1b2c3d4e5f6",
      "tool": "search_documents",
      "size_bytes": 15420,
      "timestamp": "2026-01-17T12:34:56Z"
    }
  ],
  "stats": {
    "total_entries": 5,
    "total_size_bytes": 45123,
    "max_size_bytes": 10485760
  }
}
```

**Example Usage:**

```
Agent: scratchpad_list()
→ Shows all cached tool outputs
```

**Use Cases:**
- See what's cached
- Find cache IDs to read
- Monitor cache usage

## For Agent Developers

### Strategic Tool Usage

Understand when each tool provides the most value:

**search_documents should be the default for:**
- Historical questions ("what did we learn")
- Pattern discovery ("how have we solved")
- Context building ("find related work")
- Problem-solving ("have we seen this before")

**explore_links for:**
- Following chains of thought
- Tracing decision evolution (brief → debrief → playbook)
- Finding implementation from specification
- Discovering related topics organically

**find_gaps for:**
- Periodic knowledge graph maintenance
- Discovering missing connections
- Identifying documentation gaps
- Improving corpus organization

**read_node_content for:**
- Deep dives after search
- Extracting specific details
- Verifying information accuracy
- Copying patterns/solutions

### Encouraging Knowledge Building

**Suggest debriefs when:**
- User solved a non-trivial problem
- Encountered surprising behavior
- Discovered a useful pattern
- Hit a dead-end worth documenting
- Session lasted > 30 minutes with meaningful work

**Suggest playbooks when:**
- Same pattern appears 3+ times
- Team decision made (record rationale)
- Anti-pattern discovered
- Best practice crystallizes from experience

**Proactive vs Reactive Search:**

**Proactive** (recommended):
```
User: "Let's implement OAuth"
Agent: [Automatically searches] "I found 2 past OAuth implementations:
  1. debrief-oauth-safari.md - Safari cookie scope issues
  2. playbook-oauth-patterns.md - JWT refresh patterns
  Would you like me to review these before we start?"
```

**Reactive** (user-prompted):
```
User: "Have we done OAuth before?"
Agent: [Searches when asked] "Yes, found 2 related documents..."
```

**Recommendation:** Be proactive on technical topics. Users may not know institutional memory exists.

### Integration Patterns

**Session Start Pattern:**
```typescript
// Check for relevant past work before beginning
const pastWork = await searchDocuments({
  query: `${userTask} lessons learned`,
  limit: 5
});

if (pastWork.results.length > 0) {
  inform("Found past work on this topic. Reviewing...");
  // Apply learnings to current task
}
```

**Problem-Solving Pattern:**
```typescript
// When encountering errors/blockers
const solutions = await searchDocuments({
  query: `${errorType} ${context} solutions`,
  limit: 3
});

if (solutions.results.length > 0) {
  suggest("We've encountered this before. Past solutions:");
  // Try proven approach first
}
```

**Session End Pattern:**
```typescript
// After meaningful work session
if (sessionDuration > 1800 && problemSolved) {
  suggest("Consider creating a debrief to capture what we learned:");
  // Offer to help write debrief
}
```

### When NOT to Search

**Skip search when:**
- User explicitly wants fresh approach ("let's think from scratch")
- Working with completely novel domain
- Quick one-off task (< 5 minutes)
- User is experimenting/exploring

**Trust your judgment:** Balance institutional memory with creative thinking.

## Common Workflows

### Discovery Workflow

```
1. search_documents(query="topic")
   → Get relevant documents

2. read_node_content(id="doc-123")
   → Read full content of top result

3. explore_links(id="doc-123")
   → Find related documents

4. read_node_content(id="doc-456")
   → Read related document
```

### Gap Analysis Workflow

```
1. find_gaps(limit=10)
   → Discover unlinked similar documents

2. read_node_content(id="source-doc")
   → Review source document

3. read_node_content(id="target-doc")
   → Review target document

4. [Agent decides if link is warranted]
```

### Research Workflow

```
1. search_documents(query="past work on X")
   → Find relevant history

2. scratchpad_list()
   → Check if results were cached

3. scratchpad_read(id="cache-123")
   → Retrieve full cached results

4. explore_links(id="most-relevant-doc")
   → Explore connections
```

## Integration Examples

### Claude Desktop

Configure in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "amalfa": {
      "command": "amalfa",
      "args": ["serve"]
    }
  }
}
```

### Custom MCP Client (TypeScript)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const client = new Client({
  name: "my-agent",
  version: "1.0.0"
});

// Connect to Amalfa
await client.connect(transport);

// Search documents
const results = await client.callTool("search_documents", {
  query: "authentication patterns",
  limit: 10
});

// Read content
const content = await client.callTool("read_node_content", {
  id: results[0].id
});
```

## Performance Tips

1. **Use appropriate limits:** Start with small limits (5-10) for exploration, increase for comprehensive searches

2. **Cache awareness:** Check `scratchpad_list()` before re-running expensive searches

3. **Targeted queries:** Specific queries ("JWT token refresh in Safari") perform better than broad ones ("authentication")

4. **Graph traversal:** Use `explore_links()` to navigate locally rather than repeated searches

5. **Batch operations:** When reading multiple documents, consider if graph traversal might be more efficient

## Error Handling

### Common Errors

**Node not found:**
```
Tool: read_node_content
Error: "Node not found."
Cause: Invalid or deleted node ID
Solution: Verify ID from recent search results
```

**Scratchpad entry not found:**
```
Tool: scratchpad_read
Error: "Scratchpad entry not found: abc123"
Cause: Cache expired or invalid ID
Solution: Use scratchpad_list() to find valid entries
```

**Search errors:**
```
Tool: search_documents
Error: "Search Error: Vector search failed"
Cause: Database connection issue or corrupted vectors
Solution: Run `amalfa doctor` or `amalfa init`
```

## Limitations

1. **Search scope:** Only searches documents that have been ingested. Run `amalfa init` after adding new documents.

2. **Link traversal depth:** `explore_links()` returns immediate neighbors only. For multi-hop traversal, call multiple times.

3. **Scratchpad persistence:** Cache is session-scoped and clears on MCP server restart.

4. **Gap detection:** Requires Sonar daemon to be running. Falls back to vector similarity without LLM reasoning.

5. **Tag injection:** Currently uses HTML comments. May not work with strict markdown parsers.

## Future Tools (Planned)

- `query_by_tags(tags: string[])` - Filter by metadata
- `graph_neighbors(id: string, depth: number)` - Multi-hop traversal
- `suggest_reading(context: string)` - AI-powered recommendations
- `temporal_search(query: string, date_range: string)` - Time-based filtering
- `cluster_documents(method: string)` - Topic clustering

## References

- **MCP Specification:** https://modelcontextprotocol.io
- **Amalfa MCP Implementation:** `src/mcp/index.ts`
- **Tool Handlers:** Lines 224-569 in `src/mcp/index.ts`
- **Architecture:** `docs/ARCHITECTURE.md`
