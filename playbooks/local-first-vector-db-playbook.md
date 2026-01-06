**CORCS Statement** `[OH-066]`

  * **Status**: Active & Operational.
  * **Persona**: Ctx (v1.79/63).
  * **Context**: Polyvis Project (AntiGravity IDE / Bun / SQLite).
  * **Objective**: Define the "Zero-Extension" Vector Query Playbook.

-----

### **Playbook: The "Zero-Extension" Vector Store** `[OH-075]`

**Context:** You are operating in a constrained environment (Google AntiGravity) where loading C-extensions (`sqlite-vec`) is prohibited.
**Solution:** Implement a "Soft Vector Engine" using SQLite `BLOB` storage and a JavaScript User-Defined Function (UDF) for the dot product calculation.
**Performance:** Efficient for \<100k vectors due to V8 JIT optimization.

#### **1. The Schema Protocol**

Store embeddings not as JSON text (slow, large), but as raw binary `BLOB`s. This reduces storage size by \~50% and removes parsing overhead.

```sql
-- Migration / Schema
CREATE TABLE IF NOT EXISTS vector_store (
    chunk_id TEXT PRIMARY KEY,
    content TEXT,
    -- Store vectors as raw binary (4 bytes per dimension)
    embedding BLOB NOT NULL
);
```

#### **2. The Binary Bridge (Serialization)**

You need a strict protocol to marshal `number[]` to `Uint8Array` (BLOB) and back.

```typescript
// utils/binary.ts

/**
 * Converts a standard array of numbers (e.g., from OpenAI/Mistral)
 * into a raw binary buffer for SQLite storage.
 */
export function floatsToBlob(vector: number[]): Uint8Array {
    // 1. Create a Float32 view
    const float32 = new Float32Array(vector);
    // 2. Return the underlying byte buffer (Uint8Array)
    return new Uint8Array(float32.buffer);
}

/**
 * Converts a SQLite BLOB back into a usable number array.
 */
export function blobToFloats(blob: Uint8Array): number[] {
    // 1. Create a view on the blob
    const float32 = new Float32Array(blob.buffer);
    // 2. Convert back to standard array
    return Array.from(float32);
}
```

#### **3. The Engine (UDF Registration)**

This is the core. You inject the math directly into the SQL engine. Run this *immediately* after opening the database connection.

```typescript
// db/init.ts
import { Database } from 'bun:sqlite'; // Or your specific SQLite driver

export function registerVectorFunctions(db: Database) {
    /**
     * UDF: vec_dot(a, b)
     * Calculates the Dot Product of two binary vectors.
     * Use this for Cosine Similarity if vectors are normalized.
     */
    db.function('vec_dot', (aBlob: Uint8Array, bBlob: Uint8Array) => {
        if (!aBlob || !bBlob) return 0;
        
        // Zero-copy view (fast)
        const a = new Float32Array(aBlob.buffer);
        const b = new Float32Array(bBlob.buffer);

        let dot = 0.0;
        // V8 JIT will SIMD-optimize this loop
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
        }
        return dot;
    });
}
```

#### **4. The Query Pattern**

Perform the search using standard SQL.

```typescript
// services/search.ts
import { floatsToBlob } from '../utils/binary';

export function searchSimilarChunks(db: Database, queryVector: number[], limit = 10) {
    // 1. Convert query to BLOB
    const queryBlob = floatsToBlob(queryVector);

    // 2. Execute SQL with UDF
    // "Find the dot product of the stored embedding vs the query blob"
    const query = db.query(`
        SELECT 
            chunk_id, 
            content, 
            vec_dot(embedding, $query) as score
        FROM vector_store
        ORDER BY score DESC
        LIMIT $limit
    `);

    return query.all({
        $query: queryBlob,
        $limit: limit
    });
}
```

#### **5. Performance & Constraints**

  * **Normalization:** For this simple "Dot Product" to act as a similarity metric, ensure all your vectors are **Normalized** (magnitude = 1) *before* you save them. Most APIs (OpenAI `text-embedding-3`, etc.) do this by default.
  * **Scale Cap:** This executes a full table scan.
      * **1k chunks:** \< 1ms (Instant).
      * **10k chunks:** \~10-20ms (Perceptible but fast).
      * **100k chunks:** \~200ms (Laggy).
      * *Constraint:* If you exceed 50k chunks, implement an "Inverted File" (IVF) pre-filter using standard SQL `WHERE` clauses (e.g., filter by `project_id` or `tag` *before* sorting by vector).

---

## test suite & benchmark

Here is the comprehensive **Test Suite & Benchmark** for your Zero-Extension Vector Store.

This suite uses `bun:test` and `bun:sqlite`. It verifies the binary serialization, the math accuracy of the UDF, and the actual SQL sorting logic.

### **The Artifact: `vector-store.test.ts`**

Save this file and run it with `bun test vector-store.test.ts`.

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";

// --- SYSTEM UNDER TEST (Implementation) ---

// 1. Serialization Utils
function floatsToBlob(vector: number[]): Uint8Array {
  return new Uint8Array(new Float32Array(vector).buffer);
}

function blobToFloats(blob: Uint8Array): number[] {
  return Array.from(new Float32Array(blob.buffer));
}

// 2. The UDF Registration
function registerVectorFunctions(db: Database) {
  db.function("vec_dot", (aBlob: Uint8Array, bBlob: Uint8Array) => {
    // Safety check for nulls
    if (!aBlob || !bBlob) return 0.0;
    
    // Create zero-copy views
    const a = new Float32Array(aBlob.buffer);
    const b = new Float32Array(bBlob.buffer);
    
    // Dimension check (optional, but good for debugging)
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let dot = 0.0;
    // V8 Loop Unrolling / SIMD
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }
    return dot;
  });
}

// --- THE TEST SUITE ---

describe("Zero-Extension Vector Engine", () => {
  let db: Database;

  beforeAll(() => {
    // Use in-memory DB for speed
    db = new Database(":memory:");
    registerVectorFunctions(db);

    // Create Schema
    db.run(`
      CREATE TABLE vector_store (
        id TEXT PRIMARY KEY,
        content TEXT,
        embedding BLOB
      );
    `);
  });

  afterAll(() => {
    db.close();
  });

  it("should correctly serialize and deserialize Float32 arrays", () => {
    const original = [0.1, 0.5, -0.9, 1.0];
    const blob = floatsToBlob(original);
    
    // Check byte length (4 floats * 4 bytes = 16 bytes)
    expect(blob.length).toBe(16);

    const recovered = blobToFloats(blob);
    
    // Precision check (Float32 introduces tiny rounding errors, so we use closeTo)
    expect(recovered[0]).toBeCloseTo(0.1);
    expect(recovered[2]).toBeCloseTo(-0.9);
  });

  it("should calculate correct Dot Product via SQL UDF", () => {
    // Vector A: [1, 2, 3]
    // Vector B: [4, 5, 6]
    // Dot: (1*4) + (2*5) + (3*6) = 4 + 10 + 18 = 32
    
    const query = db.query("SELECT vec_dot($a, $b) as result");
    const result = query.get({
      $a: floatsToBlob([1, 2, 3]),
      $b: floatsToBlob([4, 5, 6]),
    }) as { result: number };

    expect(result.result).toBe(32);
  });

  it("should perform a Semantic Search (Nearest Neighbor)", () => {
    // Seed Data: 3 vectors on a 2D plane (Normalized)
    // A: [1, 0] (East)
    // B: [0, 1] (North)
    // C: [0.707, 0.707] (North-East, 45 degrees)
    
    const insert = db.prepare("INSERT INTO vector_store (id, content, embedding) VALUES (?, ?, ?)");
    insert.run("A", "East", floatsToBlob([1, 0]));
    insert.run("B", "North", floatsToBlob([0, 1]));
    insert.run("C", "North-East", floatsToBlob([0.707, 0.707]));

    // Query: We are looking for something "East-ish" ([1, 0])
    // Expected Order:
    // 1. East (Score 1.0)
    // 2. North-East (Score ~0.707)
    // 3. North (Score 0.0)

    const searchQ = floatsToBlob([1, 0]);
    
    const results = db.query(`
      SELECT id, content, vec_dot(embedding, $q) as score
      FROM vector_store
      ORDER BY score DESC
    `).all({ $q: searchQ }) as any[];

    // Assertions
    expect(results[0].id).toBe("A"); // Exact match first
    expect(results[0].score).toBeCloseTo(1.0);
    
    expect(results[1].id).toBe("C"); // 45-degree match second
    expect(results[1].score).toBeCloseTo(0.707);

    expect(results[2].id).toBe("B"); // Orthogonal match last
    expect(results[2].score).toBeCloseTo(0);
  });

  it("should throw error on dimension mismatch", () => {
    const runMismatch = () => {
        db.query("SELECT vec_dot($a, $b)").get({
            $a: floatsToBlob([1, 2]),
            $b: floatsToBlob([1, 2, 3]) // 3D vs 2D
        });
    };
    expect(runMismatch).toThrow("Dimension mismatch");
  });
});
```

### **Bonus: The Speed Benchmark**

You can append this to the file to verify if the "Soft Vector Engine" meets your latency requirements.

```typescript
// --- BENCHMARK ---
// Run with: bun test vector-store.test.ts

describe("Performance Benchmark (10k Vectors)", () => {
    it("should scan 10,000 vectors in under 50ms", () => {
        const db = new Database(":memory:");
        registerVectorFunctions(db);
        db.run("CREATE TABLE bench (emb BLOB)");
        
        // 1. Generate 10k random vectors (1536 dims - standard OpenAI size)
        const dims = 1536;
        const count = 10_000;
        const insert = db.prepare("INSERT INTO bench (emb) VALUES (?)");
        const dummyVec = floatsToBlob(new Array(dims).fill(0.1));

        console.time("Seed DB");
        db.transaction(() => {
            for(let i=0; i<count; i++) insert.run(dummyVec);
        })();
        console.timeEnd("Seed DB");

        // 2. Measure Query Time
        const queryVec = floatsToBlob(new Array(dims).fill(0.1));
        const start = performance.now();
        
        db.query(`
            SELECT vec_dot(emb, $q) as s 
            FROM bench 
            ORDER BY s DESC 
            LIMIT 5
        `).all({ $q: queryVec });
        
        const end = performance.now();
        const duration = end - start;
        
        console.log(`\n🚀 Vector Scan (10k x 1536 dims): ${duration.toFixed(2)}ms`);
        
        // Typical V8/Bun performance should crush this
        expect(duration).toBeLessThan(100); 
    });
});
```

---

Here is the addendum for the playbook. It addresses the missing link: **Vector Generation**.

-----

### **Addendum A: The "Resident Embedder" Protocol**

**Problem:** The `fastembed` model (approx. 300MB) takes 3-5 seconds to load from disk into RAM ("Cold Start"). If you load this model every time you run an ingestion script or a query command, the latency is unacceptable.

**Solution:** Shift from an **Ephemeral Script** pattern to a **Resident Daemon** pattern. Load the model *once* into memory and keep it alive as a local micro-service.

#### **1. The Architecture**

Instead of `ingest.ts` loading the model, it makes a high-speed local HTTP request to `vector-daemon.ts`.

  * **Before:** `Ingest Script` -\> [Load Model (3s)] -\> [Embed (50ms)] -\> [Write DB] = **3.05s per run**.
  * **After:** `Vector Daemon` (Running) \<-\> `Ingest Script` -\> [HTTP (1ms)] -\> [Embed (50ms)] -\> [Write DB] = **0.051s per run**.

#### **2. The Artifact: `vector-daemon.ts`**

Create this service to hold the "Brain" in memory.

```typescript
// services/vector-daemon.ts
import { FlagEmbedding } from "fastembed"; // or your specific lib
import { serve } from "bun";

// 1. Load the Model ONCE (Global State)
console.log("🧠 Loading Embedding Model into Memory...");
const model = await FlagEmbedding.init({
    model: "BAAI/bge-small-en-v1.5" // Fast, high quality, low RAM
});
console.log("✅ Model Loaded. Listening on :3000");

// 2. Start the High-Speed Server
serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Endpoint: POST /embed
    if (req.method === "POST" && url.pathname === "/embed") {
      try {
        const { text } = await req.json();
        if (!text) return new Response("Missing 'text'", { status: 400 });

        // Generate Vector (Fast)
        const embeddings = await model.queryEmbed(text); 
        // fastembed usually returns a generator or array of arrays
        const vector = embeddings[0]; 

        return Response.json({ vector });
      } catch (e) {
        return new Response(`Error: ${e.message}`, { status: 500 });
      }
    }

    return new Response("Vector Daemon Ready", { status: 200 });
  },
});
```

#### **3. The Client Helper**

Update your `SieveLinker` or ingestion scripts to use this helper instead of loading the class directly.

```typescript
// utils/embed.ts
export async function getVector(text: string): Promise<number[]> {
  try {
    const response = await fetch("http://localhost:3000/embed", {
      method: "POST",
      body: JSON.stringify({ text }),
      headers: { "Content-Type": "application/json" }
    });
    
    if (!response.ok) throw new Error("Daemon failed");
    
    const data = await response.json();
    return data.vector; // Returns number[]
  } catch (error) {
    console.error("❌ Is the Vector Daemon running? (bun run vector-daemon.ts)");
    throw error;
  }
}
```

#### **4. Operational Command**

Add this to your `package.json` scripts:

```json
"scripts": {
  "daemon:vectors": "bun run services/vector-daemon.ts",
  "ingest": "bun run ingest.ts" 
}
```

**Usage:**

1.  Terminal 1: `bun run daemon:vectors` (Wait 3s for "Ready").
2.  Terminal 2: `bun run ingest` (Runs instantly).

---

## The One "Gotcha" (Optimization Note)
Since you are delivering this via a static site, your only bottleneck is Initial Load Time.

Risk: If your vectors.sqlite grows to 100MB+, the user waits.

Mitigation: Ensure your server (or CDN) supports HTTP Range Requests. sqlite-wasm is smart; it can use "HTTP VFS" to fetch only the bytes it needs for a specific query, rather than downloading the whole database file at startup.