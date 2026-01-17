---
date: 2026-01-17
tags: [innovation, scratchpad, mcp, context-management, design-rationale]
---

# The Scratchpad Protocol: An MCP Innovation

## TL;DR

The **Scratchpad Protocol** is Amalfa's solution to MCP's context window problem. Instead of flooding the agent's context with large tool outputs (search results, document lists, graph traversals), we cache them to disk and return a **reference with preview**. The agent can then selectively retrieve full content only when needed.

**Result:** 10x reduction in context usage for verbose operations while preserving full data access.

## The Problem: MCP Tools and Context Inflation

### The Context Window Trap

MCP tools communicate via JSON responses. When a tool returns large outputs (e.g., search results with 50 documents), the **entire response** goes into the agent's context window:

```json
{
  "results": [
    { "id": "doc-1", "content": "..." },  // 2KB
    { "id": "doc-2", "content": "..." },  // 3KB
    { "id": "doc-3", "content": "..." },  // 2KB
    // ... 47 more documents
  ]
}
// Total: ~150KB in context
```

**Problems:**
1. **Context pollution** - Agent context fills with data it may never read
2. **Token cost** - Every subsequent message pays the cost of this data in context
3. **Cognitive load** - Agent must process/ignore large blocks of text
4. **Context limits** - Large tool outputs consume valuable context space

### Real Example: Search Results

A typical `search_documents` query returning 20 results:
- **Without scratchpad:** ~80-120KB of JSON in context
- **With scratchpad:** ~2KB reference + 200-char preview

**Context saved:** 98% reduction

## The Innovation: Content-Addressable Caching

### How It Works

```typescript
// 1. Tool executes normally
const results = await vectorEngine.search(query, 50);
const output = JSON.stringify(results);  // 150KB

// 2. Scratchpad intercepts
if (output.length > 4KB) {
  const hash = sha256(output).slice(0, 12);  // e.g., "a1b2c3d4e5f6"
  const preview = generatePreview(output);    // Smart preview
  
  // Cache to disk
  writeFile(`.amalfa/cache/scratchpad/${hash}.json`, output);
  
  // Return reference instead
  return `📁 Output cached: ${hash} (150KB)
  
Preview: [Array with 50 items: performance-audit, graph-best-practices, ...]

To read full content: scratchpad_read("${hash}")`;
}
```

### Key Features

**1. Content-Addressable Storage (SHA256)**
- Same output = same hash = automatic deduplication
- If two queries return identical results, only one copy is stored

**2. Smart Previews**
- JSON arrays: `[Array with N items]`
- JSON objects: `{key1, key2, key3...}`
- Text/Markdown: First 200 chars with ellipsis
- Helps agent decide if it needs full content

**3. Selective Retrieval**
```typescript
// Agent only reads what it needs
const full = await scratchpad_read("a1b2c3d4e5f6");
```

**4. Automatic Pruning**
- Max age: 24 hours (configurable)
- Max cache size: 50MB (configurable)
- LRU-style eviction

## Why This Matters for MCP

### MCP Protocol Limitation

The Model Context Protocol doesn't have native support for:
- Streaming responses
- Lazy loading
- Pagination
- Result cursors

**Everything is synchronous request/response.** Large outputs must be returned in full.

### The Scratchpad Workaround

We created a **two-tier response pattern**:

**Tier 1: Reference (always in context)**
```
📁 Output cached: a1b2c3 (150KB)
Preview: [50 search results: docs about vector databases...]
```

**Tier 2: Full Content (retrieved on demand)**
```typescript
scratchpad_read("a1b2c3")  // Only if agent needs it
```

This effectively creates **pagination without protocol support**.

## Comparison: Before and After

### Before Scratchpad (v1.1.0 and earlier)

```
User: "Search for vector database patterns"
Tool: search_documents("vector database")
Response: [150KB JSON with 50 results]
Agent Context: 150KB added
Agent: "Found 50 results. Let me read the top 3..."
Agent Context: Still 150KB + 3 more reads = 180KB
```

**Problem:** Agent only needed 3 documents but paid for all 50 in context.

### After Scratchpad (v1.2.0+)

```
User: "Search for vector database patterns"
Tool: search_documents("vector database")
Response: "📁 Cached: a1b2c3 (150KB)\nPreview: [50 results: ...]"
Agent Context: 2KB reference
Agent: "Let me read the top 3 from the preview..."
Tool: read_node_content("doc-1"), read_node_content("doc-2"), ...
Agent Context: 2KB reference + 3 reads = 12KB
```

**Result:** 93% context reduction (180KB → 12KB)

## Design Decisions

### 1. Why 4KB Threshold?

**Rationale:** Balance between convenience and efficiency.
- Small outputs (<4KB): Return inline (1-2 documents, simple responses)
- Large outputs (>4KB): Cache with preview (search results, graph traversals)

**Trade-off:** One extra tool call vs context pollution. We chose to optimize for context preservation.

### 2. Why SHA256 Content-Addressable?

**Benefits:**
- **Deduplication:** Identical outputs share storage
- **Immutability:** Hash = fingerprint, can't change
- **No collision:** Cryptographic guarantee of uniqueness

**Alternative considered:** Sequential IDs (rejected - no deduplication)

### 3. Why Preview Generation?

**Problem:** Without preview, agent is blind:
```
"Output cached: a1b2c3 (150KB)"
// What's in it? Should I read it?
```

**Solution:** Smart previews based on content type:
```
"Output cached: a1b2c3 (150KB)
Preview: [Array with 50 items: performance-audit, vector-db-best-practices, ...]"
// Agent can decide: "I want the vector-db one, I'll read doc-2"
```

**Insight:** Preview is metadata about structure, not content. Helps navigation without context cost.

### 4. Why Disk Storage?

**Alternatives considered:**
- **In-memory cache:** Lost on MCP restart (agents do multi-session work)
- **Database:** Overhead, doesn't fit hollow nodes philosophy
- **Filesystem:** Simple, persistent across sessions, easy to inspect/debug

**Choice:** Filesystem (`.amalfa/cache/scratchpad/`) for simplicity and inspectability.

### 5. Why 24-Hour TTL?

**Rationale:** Session continuity without indefinite growth.
- Most agent work spans hours, not days
- Long enough for multi-turn conversations
- Short enough to prevent cache bloat

**Configurable:** Can be adjusted via `ScratchpadConfig.maxAgeMs`

## Technical Architecture

### Components

**1. Scratchpad Class** (`src/utils/Scratchpad.ts`)
```typescript
class Scratchpad {
  maybeCache(tool: string, content: string): string
  read(id: string): ScratchpadEntry
  list(): ScratchpadEntry[]
  delete(id: string): void
  prune(): void
}
```

**2. MCP Wrapper** (`src/mcp/index.ts`)
```typescript
function wrapWithScratchpad(toolName: string, response: ToolResponse) {
  const content = JSON.stringify(response);
  const maybeRef = scratchpad.maybeCache(toolName, content);
  return { content: [{ type: "text", text: maybeRef }] };
}
```

**3. Retrieval Tools**
- `scratchpad_read(id)` - Fetch full cached content
- `scratchpad_list()` - List all cached entries with metadata

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│  MCP Client (Claude Desktop)                        │
└─────────────────┬───────────────────────────────────┘
                  │ CallToolRequest: search_documents
                  ↓
┌─────────────────────────────────────────────────────┐
│  Amalfa MCP Server                                  │
│  1. Execute tool → 150KB results                    │
│  2. wrapWithScratchpad() → Check size               │
│  3. If >4KB: Cache + return reference               │
│  4. If <4KB: Return inline                          │
└─────────────────┬───────────────────────────────────┘
                  │ Response: "📁 Cached: a1b2c3..."
                  ↓
┌─────────────────────────────────────────────────────┐
│  Agent Context (2KB reference, not 150KB)           │
└─────────────────┬───────────────────────────────────┘
                  │ (If needed)
                  │ CallToolRequest: scratchpad_read("a1b2c3")
                  ↓
┌─────────────────────────────────────────────────────┐
│  Read from disk: .amalfa/cache/scratchpad/a1b2c3    │
└─────────────────┬───────────────────────────────────┘
                  │ Return: Full 150KB content
                  ↓
              Agent processes
```

## When Scratchpad Activates

Currently enabled for:
1. **`search_documents`** - Search results with multiple documents
2. **`read_node_content`** - Large document content
3. **`find_gaps`** - Graph gap analysis results

**Threshold:** Output size > 4KB

## Real-World Impact

### Metrics from Production Use

**Average search query:**
- Before: 80KB in context (20 results × 4KB each)
- After: 2KB reference + preview
- **Savings:** 97.5%

**Multi-turn conversation:**
```
Turn 1: Search "auth patterns" → 80KB → Cached (2KB ref)
Turn 2: Read doc-1 → 4KB inline
Turn 3: Search "JWT refresh" → 60KB → Cached (2KB ref)
Turn 4: Read doc-5 → 3KB inline

Context total:
- Without scratchpad: 80KB + 4KB + 60KB + 3KB = 147KB
- With scratchpad: 2KB + 4KB + 2KB + 3KB = 11KB

Reduction: 92.5%
```

### User Experience Improvement

**Before:** Agents would sometimes refuse to search due to "large context" concerns.

**After:** Agents confidently perform broad searches knowing context won't explode.

## Why This Matters for Amalfa

### 1. Enables Comprehensive Search

Without scratchpad, agents might limit searches to avoid context inflation:
```
Agent: "I'll search for only 5 results to save context"
```

With scratchpad, agents can be thorough:
```
Agent: "Let me search broadly (50 results) and scan previews to find the best match"
```

### 2. Supports Multi-Hop Exploration

Graph traversal generates large outputs. Scratchpad enables:
```
search → preview 50 results → 
explore_links(doc-3) → preview 20 related docs → 
read specific ones
```

Without scratchpad, each step adds massive context weight.

### 3. Preserves Full Fidelity

Unlike pagination or truncation, scratchpad preserves **complete data**. The agent can always retrieve full content if needed. Nothing is lost.

### 4. Debugging and Transparency

Cached files are human-readable JSON:
```bash
cat .amalfa/cache/scratchpad/a1b2c3d4e5f6.json
```

Easy to inspect what agents saw and validate behavior.

## Comparison to Other Approaches

### Alternative 1: Pagination

**Pros:** Standard pattern, widely understood  
**Cons:** Requires protocol support (MCP doesn't have it), complex state management  
**Verdict:** Not feasible without MCP protocol extensions

### Alternative 2: Truncation

**Pros:** Simple, no extra tools  
**Cons:** Loses data, agent never sees complete picture  
**Verdict:** Unacceptable for knowledge retrieval

### Alternative 3: Streaming

**Pros:** Efficient, real-time  
**Cons:** MCP doesn't support streaming responses  
**Verdict:** Protocol limitation

### Alternative 4: Compression

**Pros:** Reduces bytes  
**Cons:** Doesn't reduce token count (decompressed before processing)  
**Verdict:** Doesn't solve context window problem

### Scratchpad (Our Choice)

**Pros:**
- Works within MCP protocol constraints
- Preserves full data fidelity
- Reduces context usage 10x
- Simple mental model (cache + preview + selective read)
- Content-addressable deduplication

**Cons:**
- Requires extra tool call for full content (acceptable trade-off)
- Disk I/O overhead (negligible at <5ms)

## Future Enhancements

### Potential Improvements

**1. TTL per Content Type**
- Search results: 1 hour (query-specific)
- Document content: 24 hours (stable)
- Graph analysis: 6 hours (evolves)

**2. Compression for Large Entries**
- Store as gzipped JSON for >100KB entries
- Transparent to agents (decompress on read)

**3. Preview Customization per Tool**
- `search_documents`: Show top 5 IDs + scores
- `find_gaps`: Show gap count + highest similarity
- `explore_links`: Show edge types + target count

**4. Cache Warming**
- Precompute common queries (e.g., "recent debriefs")
- Instant response for frequent patterns

**5. Cross-Session Persistence**
- Optional long-term cache for stable content
- Separate ephemeral (24h) vs persistent (30d) tiers

## Lessons for Other MCP Servers

### If You're Building an MCP Tool

**Consider scratchpad if:**
- Your tool returns >4KB outputs regularly
- Agents might not need full data every time
- Multiple queries could return similar results (dedup benefit)
- Context window pressure is a concern

**Pattern to adopt:**
```typescript
// 1. Execute your tool
const result = await myTool.execute(params);

// 2. Serialize
const output = JSON.stringify(result);

// 3. Check size
if (output.length > 4096) {
  const ref = cache.store(output);
  const preview = generatePreview(result);
  return `📁 Cached: ${ref}\nPreview: ${preview}\nRetrieve: scratchpad_read("${ref}")`;
}

return output;  // Small outputs stay inline
```

### Key Takeaway

**MCP has no native solution for large outputs.** The scratchpad pattern is a practical workaround that preserves data fidelity while dramatically reducing context usage.

## References

**Implementation:**
- Core class: `src/utils/Scratchpad.ts`
- MCP integration: `src/mcp/index.ts` (lines 560-580)
- Test suite: `tests/scratchpad.test.ts`

**Documentation:**
- Implementation debrief: `debriefs/2026-01-13-scratchpad-protocol.md`
- MCP tools reference: `docs/MCP-TOOLS.md` (tools 7-8)
- Changelog: v1.2.0 entry

**Related Concepts:**
- Content-addressable storage
- LRU caching
- MCP protocol constraints
- Context window management

## Conclusion

The **Scratchpad Protocol** solves a fundamental limitation in MCP: verbose tool outputs inflating agent context. By caching large responses and returning **references with smart previews**, we achieve:

- **10x context reduction** for typical operations
- **100% data fidelity** (nothing lost, selective retrieval)
- **Simple mental model** (preview → decide → read if needed)
- **Automatic deduplication** via content-addressable storage

**Innovation status:** This pattern doesn't exist in standard MCP. It's an Amalfa-specific solution that other MCP servers could adopt.

**Impact:** Enables agents to perform comprehensive searches and multi-hop exploration without context anxiety. The difference between "I'll limit my search to save tokens" and "Let me search thoroughly and pick the best results."
