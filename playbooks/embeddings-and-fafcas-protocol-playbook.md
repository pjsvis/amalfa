# Embeddings & The FAFCAS Protocol

**Status:** Active
**Context:** Resonance Engine / Hybrid-DB
**Principle:** [OH-029] Effective Low-Tech Defence / [OH-041] Optimal Simplicity

## 1. The Core Philosophy
We do not use external Vector Databases (Pinecone, Weaviate, Qdrant).
For the scale of a software project (< 100,000 nodes), the latency of a network request exceeds the compute time of a brute-force search in RAM.

**The Rule:** If it fits in RAM, it lives in RAM.


**Related Protocols:** [Domain Vocabulary Playbook](./domain-vocabulary-playbook.md)

---

## 2. The FAFCAS Protocol
**Definition:** **F**ast **A**s **F*ck**, **C**ool **A**s **S**hit.

A binary storage specification for semantic vectors optimized for zero-dependency environments.

**But more importantly:** A philosophy. Everything we build must be both:
1. **Fast** - Sub-100ms operations, zero network calls, in-memory search
2. **Cool** - Elegant architecture, zero external services, aesthetically satisfying

If it's fast but ugly, we refactor it. If it's cool but slow, we flense it.

### The Specification
1.  **Data Type:** `Float32` (Little Endian).
2.  **Constraint (Unity):** All vectors **MUST** be normalized to a Unit Length (L2 Norm = 1.0) *before* storage.
3.  **Storage (Raw):** Vectors are stored as raw byte streams (`BLOB`) in SQLite. No headers, no metadata.
4.  **Retrieval (Algebra):** Similarity is calculated via pure **Dot Product** ($A \cdot B$).
    * *Why?* Cosine Similarity is $\frac{A \cdot B}{\|A\| \|B\|}$. Since $\|A\|$ and $\|B\|$ are always $1$, the divisor is $1$. The formula simplifies to just $A \cdot B$.
    * *Benefit:* Removes expensive `sqrt()` and `div` operations from the hot loop.

### FAFCAS In Practice

What does this look like in the wild?

**Example 1: Real-time Ingestion**
- You save a markdown file
- Daemon detects change in 2ms (file watcher)
- Embedding generated in 10ms (fastembed)
- Vector normalized and stored in 5ms
- Graph edges woven in 30ms
- Total: **~50ms** from save to searchable
- **Fast:** Sub-100ms end-to-end
- **Cool:** Zero manual steps, pure automation

**Example 2: Vector Search**
- Query arrives: "database corruption"
- Embedding generated: 10ms
- Scan 500 vectors (dot product): 8ms
- Hydrate top 10 results: 2ms
- Total: **<20ms** for semantic search
- **Fast:** No network, no external DB
- **Cool:** All in SQLite, portable single file

**Example 3: The Stack**
- Database: SQLite (built into Bun)
- Embeddings: fastembed (ONNX, local)
- Server: Bun.serve (zero dependencies)
- UI: Alpine.js (16KB, no build step)
- **Fast:** No docker, no services, no npm install hell
- **Cool:** `git clone && bun install && bun run dev` - you're live

**The Anti-Pattern:** Pinecone + Supabase + Vercel + Docker + 50 microservices = "enterprise architecture" = slow AND ugly.

### FAFCAS + Harden and Flense

These protocols work together:

**Harden (Make it Fast):**
- Enforce WAL mode + busy_timeout (concurrency)
- Use DatabaseFactory (zero config drift)
- Normalize vectors to unit length (pure dot product)
- SIMD-optimized loops (let the JIT work)

**Flense (Make it Cool):**
- Remove external vector DBs (Pinecone → SQLite)
- Remove chunking pipeline (documents are already chunk-sized)
- Remove FTS (vector search is better anyway)
- Remove magic numbers (semantic variables only)

**Result:** Fast AND Cool.

**See also:** 
- `playbooks/harden-and-flense-protocol.md` - Process definition
- `docs/sqlite-wal-readonly-trap.md` - Hardening example

---

## 3. Implementation Recipes (TypeScript)

### A. The Normalizer (Write-Side)
*Run this immediately after generating an embedding.*

```typescript
export function toFafcas(vector: Float32Array): Uint8Array {
  // 1. Calculate Magnitude (L2 Norm)
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    sum += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(sum);

  // 2. Normalize (Divide by Magnitude)
  // Optimization: If magnitude is 0, return zero vector
  if (magnitude > 1e-6) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }

  // 3. Serialize to Raw Bytes (FAFCAS Blob)
  return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}
```

### B. The Search Engine (Read-Side)
Run this in the "Hot Loop" (In-Memory).

```typescript
export function dotProduct(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  // Modern JS engines SIMD-optimize this loop automatically
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function search(query: Float32Array, index: Array<{vec: Float32Array}>) {
  // query MUST be normalized first!
  return index
    .map(item => ({ score: dotProduct(query, item.vec), item }))
    .sort((a, b) => b.score - a.score); // Descending
}
```

---

## 4. The Architecture (Index vs Voice)

### A. The Index (FastEmbed)
*   **Role:** Static Knowledge Retrieval (Ingestion).
*   **Tool:** `fastembed` (AllMiniLML6V2, ONNX).
*   **Why:** 10ms generation time allows for rebuilding the entire graph (1000+ nodes) in seconds.
*   **Status:** APPROVED.

### B. The Voice (LLMClient)
*   **Role:** Dynamic Reasoning & Synthesis (Query).
*   **Tool:** `LLMClient` -> `Ollama` / `LM Studio`.
*   **Why:** High-quality reasoning, even if slow (100ms+).
*   **Status:** APPROVED.

---

## 5. The Thin Node Protocol (Storage)
**Insight:** The Database is an Index, not a Warehouse.
-   **Old Way:** Storing full file content (10k tokens) in `nodes.content`. Result: DB Bloat (10MB+).
-   **New Way:** Store only a **Lead Summary** (500 chars).
-   **Retrieval:** Use `meta.source` path to read full content from disk (Local-First) only when needed by The Voice.
-   **Result:** Extreme compaction (-63% DB size) and faster traversals. 


