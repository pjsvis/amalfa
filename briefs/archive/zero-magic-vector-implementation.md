# Zero Magic Vector Implementation

### Opinion: The "Zero Magic" Vector Implementation

**Verdict:** Since `sqlite-vec` is off the table due to substrate restrictions, the optimal move is **In-Memory Vector Search** leveraging Bun's speed.

Here are my recommended answers to implement this architecture efficiently.

-----

### 1\. Serialization (Packing)

**Question:** How are you packing the `Float32Array` into the SQLite BLOB?
**Recommendation:** Use the underlying `ArrayBuffer` directly. Bun/SQLite handles `Uint8Array` natively as BLOBs.

  * **The Trick:** Do not JSON.stringify (too slow/big). Dump the raw bytes.
  * **Code Pattern:**
    ```typescript
    // 1. Get embedding from Transformers.js (Float32Array)
    const vector = await embedder.run("My text"); 

    // 2. Normalize it immediately (Length = 1)
    // This simplifies Cosine Similarity to just a Dot Product later.
    const normalized = normalize(vector); 

    // 3. Cast to bytes for SQLite
    // Important: Use .buffer, .byteOffset, .byteLength to handle potential slice views
    const blob = new Uint8Array(normalized.buffer, normalized.byteOffset, normalized.byteLength);

    // 4. Insert
    db.run("INSERT INTO nodes (id, embedding) VALUES (?, ?)", [id, blob]);
    ```

### 2\. Deserialization (Loading Strategy)

**Question:** Are you pulling the whole table into RAM on `init`, or doing it just-in-time?
**Recommendation:** **Pull everything into RAM on `init`.**

  * **The Math:** Even with 10,000 nodes (a huge project), the vector index is only \~15MB.
      * $10,000 \text{ nodes} \times 384 \text{ dims} \times 4 \text{ bytes} \approx 15.3 \text{ MB}$.
  * **The Physics:** Loading 15MB from SQLite into RAM takes milliseconds on an M-series chip.
  * **The Benefit:** Once in RAM, you avoid the overhead of crossing the C++/JS bridge 10,000 times per query. You iterate purely in JavaScript, which V8/JSC can optimize heavily (SIMD).
  * **Workflow:**
      * On `resonance serve` (or MCP start), run `SELECT id, embedding FROM nodes WHERE embedding IS NOT NULL`.
      * Hydrate a `Cache` object: `Array<{ id: string, vec: Float32Array }>`.

### 3\. The Math (Calculation)

**Question:** Helper in TS or UDF?
**Recommendation:** **Pure TypeScript Helper.**

  * **Why not UDF?** Defining a custom SQL function (`db.function("cosine", ...)`) forces SQLite to call back into JavaScript for *every single row comparison*. This context switching is expensive for a full table scan.
  * **Why TS:** A simple `for` loop over TypedArrays is incredibly fast in modern JS engines.
  * **The Optimization:** Since we **normalized** the vectors during Serialization (Step 1), we don't need the complex Cosine Similarity formula ($\frac{A \cdot B}{\|A\| \|B\|}$). We only need the **Dot Product** ($A \cdot B$), because the magnitudes are already $1$.

**The "Math" Artifact (`src/lib/vector.ts`):**

```typescript
// Efficient Dot Product (for Normalized Vectors)
export function dotProduct(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  // Unrolling the loop slightly can help, but modern engines are good at this
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

// The Search Function
export function vectorSearch(
  queryVec: Float32Array, 
  index: Array<{ id: string, vec: Float32Array }>, 
  topK: number = 5
) {
  // 1. Compute scores
  const scores = index.map(item => ({
    id: item.id,
    score: dotProduct(queryVec, item.vec)
  }));

  // 2. Sort descending (Higher dot product = closer)
  // Use a min-heap for true optimization, but native sort is fine for <10k items
  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, topK);
}
```

### Summary of the "Manual" Engine

1.  **Write:** `Float32Array` $\to$ Normalize $\to$ `Uint8Array` $\to$ SQLite BLOB.
2.  **Load:** SQLite BLOB $\to$ `Uint8Array` $\to$ `Float32Array` $\to$ RAM Cache.
3.  **Search:** Query $\to$ Normalize $\to$ Loop (Dot Product) $\to$ Sort.

This is robust, portable, and requires zero external dependencies.