# AMALFA Architecture Analysis & Opinion
**Date:** 2026-01-07  
**Purpose:** Justify current architecture and explore alternatives

---

## Current State Summary

**Three independent services:**
1. **MCP Server** (stdio) - Read-only query interface
2. **File Watcher Daemon** (background) - Ingestion coordinator  
3. **Vector Daemon** (HTTP :3010) - Optional embedding optimization

**One shared resource:**
- SQLite database (`.amalfa/resonance.db`)

---

## Question 1: Are We Doing the Simple and Elegant Thing?

### Current Architecture Evaluation

**Simplicity Score: 7/10**

**What's Simple:**
- ✅ Each service has one clear responsibility
- ✅ Services are independent - can start/stop individually
- ✅ Graceful degradation (Vector Daemon optional)
- ✅ Config file is single source of truth
- ✅ SQLite = no external database to manage

**What's Not Simple:**
- ❌ Three processes to manage vs one unified daemon
- ❌ Need to understand which service does what
- ❌ File Watcher name is misleading (it's an ingestion coordinator)
- ❌ Embedder has complex fallback logic

**Elegance Score: 8/10**

**What's Elegant:**
- ✅ Embedder abstraction hides complexity from callers
- ✅ Vector Daemon is pure performance optimization - zero business logic
- ✅ Config reload is "opportunistic" - no polling needed
- ✅ Service independence means failures don't cascade

**What's Not Elegant:**
- ❌ Three PID files, three log files, three lifecycle managers
- ❌ Embedder fallback feels defensive (is it necessary?)

---

## Question 2: Can We Do Better?

### Option A: Keep Current Architecture ✅

**Rationale:**
- Services have distinct lifecycles (MCP = foreground, others = background)
- Vector Daemon can serve multiple clients
- Failure isolation is valuable
- Performance optimization is optional

**Verdict:** **This is already good design**

---

### Option B: Merge File Watcher + Vector Daemon

**Proposal:** Single "AMALFA Daemon" that does both file watching and embedding.

```
┌─────────────────────────────────┐
│      Unified AMALFA Daemon      │
├─────────────────────────────────┤
│  - File watching                │
│  - Ingestion coordination       │
│  - Embedding generation (HTTP)  │
└─────────────────────────────────┘
```

**Pros:**
- ✅ Simpler - One daemon vs two
- ✅ Fewer PID files, fewer logs
- ✅ Embedding model loaded once, used by both ingestion + HTTP endpoint
- ✅ Single lifecycle to manage

**Cons:**
- ❌ Mixed concerns - file watching ≠ HTTP serving
- ❌ Can't run Vector Daemon standalone for other tools
- ❌ Harder to optimize - can't tune HTTP server separately
- ❌ Failure of HTTP server kills file watching (cascading failure)

**Opinion:** **DON'T DO THIS**

**Reason:** Violates separation of concerns. File watching and HTTP serving are fundamentally different responsibilities. Merging them creates tight coupling for minimal benefit.

---

### Option C: Remove Local Embedding Fallback

**Proposal:** Require Vector Daemon to be running. Remove local FastEmbed from Embedder.

**Current complexity:**
```typescript
// Embedder tries remote, falls back to local
async embed(text: string): Promise<Float32Array> {
  try {
    return await fetch('http://localhost:3010/embed');
  } catch {
    return await localEmbedder.embed(text); // REMOVE THIS
  }
}
```

**Simplified version:**
```typescript
async embed(text: string): Promise<Float32Array> {
  const res = await fetch('http://localhost:3010/embed');
  if (!res.ok) throw new Error('Vector Daemon unavailable');
  return res.json();
}
```

**Pros:**
- ✅ Simpler Embedder - no fallback logic
- ✅ One way to do embeddings, not two
- ✅ Smaller dependency footprint (no FastEmbed in File Watcher)
- ✅ Clear error message if Vector Daemon not running

**Cons:**
- ❌ Vector Daemon becomes **required**, not optional
- ❌ User must manage two daemons, not one
- ❌ Single point of failure for ingestion
- ❌ Loses "it just works" quality

**Benefits of Fallback:**
1. **Robustness** - System works even if Vector Daemon crashes
2. **Simplicity for users** - Don't need to think about Vector Daemon
3. **Graceful degradation** - Slower is better than broken
4. **Development** - Can work without Vector Daemon running

**Opinion:** **KEEP THE FALLBACK**

**Reason:** The fallback provides **massive value** (robustness, user experience) for **minimal cost** (200ms timeout + some code). This is the right trade-off.

---

## Question 3: Can the MCP Server Do More?

**Current role:** Read-only query interface

### Potential Expansions

#### A. Add Write Operations
```typescript
// New MCP tools
tools: [
  "search_documents",      // Current ✅
  "find_similar",          // Current ✅
  "create_document",       // New ❌
  "update_document",       // New ❌
  "delete_document",       // New ❌
]
```

**Opinion:** **NO - Don't add writes**

**Reasons:**
1. **Conflicts with File Watcher** - Two sources of truth (filesystem vs MCP)
2. **Breaks immutability** - Files should be canonical
3. **Complexity** - Need bidirectional sync (DB ↔ filesystem)
4. **MCP is for reading** - Writes should happen in user's editor

#### B. Add Statistics/Analytics
```typescript
tools: [
  "get_database_stats",    // New ✅
  "get_node_neighbors",    // New ✅
  "get_recent_changes",    // New ✅
]
```

**Opinion:** **YES - Read-only analytics are good**

**Reasons:**
1. ✅ Still read-only - no conflict with File Watcher
2. ✅ Valuable for users - understand graph structure
3. ✅ Low complexity - just database queries
4. ✅ Fits MCP's purpose - expose data to AI

#### C. Add Configuration Management
```typescript
tools: [
  "get_config",           // New ✅
  "update_config",        // New ❌
]
```

**Opinion:** **Read-only config viewing OK, no writes**

**Reason:** Same as document writes - config file is source of truth

**Summary:** MCP Server should remain **read-only** but can expose more read operations.

---

## Question 4: Should File Watcher + Vector Daemon Be Combined?

**Already answered:** NO (see Option B above)

**Key insight:** They serve different masters:
- File Watcher: Responds to filesystem events
- Vector Daemon: Responds to HTTP requests

Combining them would violate single responsibility principle.

---

## Question 5: Can We Remove the Fallback?

**Already answered:** NO (see Option C above)

**Key insight:** 200ms timeout + fallback = robustness with minimal cost.

---

## Harden and Flense Options

### What Does "Harden" Mean?
- Make more robust against failures
- Add validation and error handling
- Improve observability

### What Does "Flense" Mean?
- Remove unnecessary complexity
- Simplify code paths
- Reduce dependencies

---

## Hardening Opportunities

### 1. Service Health Checks ✅ RECOMMEND

**Current:** Services can be stale (PID exists but process dead)

**Add:**
```bash
amalfa health          # Check all services
amalfa health --fix    # Restart stale services
```

**Implementation:**
- Check PID file exists
- Check process is alive
- Check service is responding (HTTP health endpoint for Vector Daemon)
- Detect zombie processes

### 2. Config Validation ✅ RECOMMEND

**Current:** Config loaded silently, errors only show during operation

**Add:**
```bash
amalfa config validate    # Check config is valid
amalfa config check       # Compare running vs file config
```

**Validations:**
- Sources directories exist
- Database path is writable
- Embedding model is valid
- No conflicting settings

### 3. Database Integrity Checks ✅ RECOMMEND

**Add:**
```bash
amalfa validate --deep    # Check DB integrity
  - All nodes have embeddings
  - All edges reference existing nodes
  - No orphaned content
  - FTS index is in sync
```

### 4. Automatic Recovery ⚠️ MAYBE

**Proposal:** File Watcher auto-restarts Vector Daemon if it crashes

**Opinion:** **NO - Don't auto-restart**

**Reason:** Explicit is better than implicit. If Vector Daemon crashes, user should know and investigate. Fallback already provides robustness.

---

## Flensing Opportunities

### 1. Remove ServiceLifecycle Abstraction ❌ DON'T

**Current:** All services use `ServiceLifecycle` utility

**Opinion:** **KEEP IT**

**Reason:** Reduces duplication across three services. Worth the abstraction.

### 2. Simplify Embedder ❌ DON'T

**Already discussed:** Keep the fallback, it's valuable.

### 3. Remove Zombie Defense ✅ CONSIDER

**File:** `src/utils/ZombieDefense.ts`

**Purpose:** Detect and kill zombie processes from previous runs

**Opinion:** **KEEP BUT IMPROVE**

**Reason:** Prevents "daemon already running" errors. But could be simpler - just check if PID is alive, don't scan entire process table.

### 4. Remove Stats Tracking ❌ DON'T

**File:** `src/utils/StatsTracker.ts`

**Opinion:** **KEEP IT**

**Reason:** Provides historical data for debugging. Minimal overhead. Useful for detecting regressions.

---

## Final Opinion: Accept Current Architecture

### Justification

**The architecture is sound because:**

1. **Separation of Concerns** ✅
   - MCP Server: Query interface
   - File Watcher: Ingestion coordinator
   - Vector Daemon: Performance optimization
   - Each has distinct responsibility

2. **Graceful Degradation** ✅
   - System works without Vector Daemon
   - Embedder fallback provides robustness
   - Service failures don't cascade

3. **Right Level of Complexity** ✅
   - Three services is manageable
   - Each service is simple internally
   - Complexity is in coordination, not implementation

4. **Pragmatic Trade-offs** ✅
   - 200ms timeout = fast feedback + fallback
   - Config reload on file changes = zero polling overhead
   - Optional optimization = performance without forced complexity

### What's Wrong With It

1. **File Watcher name** - Should be "Ingestion Daemon" or "AMALFA Daemon"
2. **Three processes** - Inherently more complex than one
3. **Config reload inconsistency** - `sources` array requires restart

### What To Do Next

**Recommended Improvements (in priority order):**

1. ✅ **Add service health checks** - `amalfa health`
2. ✅ **Add config validation** - `amalfa config validate`
3. ✅ **Rename File Watcher** - "File Watcher" → "Ingestion Daemon"
4. ✅ **Add MCP read-only analytics** - More tools for introspection
5. ⚠️ **Consider hot-reload for sources** - But not urgent

**Do NOT Do:**
- ❌ Merge File Watcher + Vector Daemon
- ❌ Remove embedding fallback
- ❌ Add writes to MCP Server
- ❌ Auto-restart failed services

---

## Simple and Elegant? YES.

**Why this architecture is good:**

1. **Unix Philosophy** - Each service does one thing well
2. **Fail-Safe** - Graceful degradation everywhere
3. **Pragmatic** - Optimizes common case (Vector Daemon running) while handling edge case (Vector Daemon down)
4. **Maintainable** - Clear boundaries between components
5. **Flexible** - Can run different combinations for different use cases

**The three-service model is NOT too complex. It's appropriately complex for the problem space.**

---

## References

- Current architecture: `docs/architecture/SERVICE-ARCHITECTURE.md`
- MCP Server: `src/mcp/index.ts`
- File Watcher: `src/daemon/index.ts`
- Vector Daemon: `src/resonance/services/vector-daemon.ts`
- Embedder: `src/resonance/services/embedder.ts`
