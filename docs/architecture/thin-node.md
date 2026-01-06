Here is the TypeScript implementation of the **Thin Node Protocol (v2)**. This code bridges your **FAFCAS** embedding strategy with the **FTS** lookup requirement, ensuring the database remains a lightweight map while the disk holds the territory.

### 1\. The Data Structures (Interfaces)

These interfaces enforce the separation between "Identity" (RAM/DB) and "Content" (Disk).

```typescript
/**
 * 1. THE THIN NODE (Main DB Table)
 * The immutable identity and semantic signature.
 * Keeps the DB small (< 100MB) even with thousands of nodes.
 */
export interface ThinNode {
  id: string;               // UUID or Hash
  filePath: string;         // The Pointer to Truth (Disk)
  summary: string;          // Lead Summary (500 chars)
  
  // FAFCAS SPEC
  // Runtime: Float32Array for math.
  // Storage: Serialized as BLOB (Uint8Array) via toFafcas().
  vector: Float32Array;      
  
  metadata: Record<string, any>; // Flexible tags/timestamps
}

/**
 * 2. THE FTS INDEX (Virtual Table)
 * Derived structure. Exists ONLY for lexical lookup.
 * Can be rebuilt from disk if deleted.
 */
export interface FTSDocument {
  nodeId: string;           // Foreign Key to ThinNode
  content: string;          // Full text content (indexed, not stored permanently if using 'content=' external content option in SQLite, or stored just for indexing)
}

/**
 * 3. THE HYBRID RESULT
 * What the Voice/LLM actually consumes.
 * Content is lazy-loaded from disk only when this object is constructed.
 */
export interface HydratedContext {
  id: string;
  score: number;            // 0.0 to 1.0 (Combined Semantic + Lexical score)
  summary: string;
  fullContent: string;      // LOADED FROM DISK
  matchType: 'semantic' | 'lexical' | 'hybrid';
}
```

-----

### 2\. The Implementation (The Pincer Movement)

This allows you to query using both mathematical similarity (FAFCAS) and keyword exactness (FTS), merging them into a single reliable result set.

```typescript
import * as fs from 'fs/promises';

// The FAFCAS Hot Loop
function dotProduct(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export class HybridGraph {
  private nodes: Map<string, ThinNode> = new Map(); // In-Memory Cache

  /**
   * The "Pincer Movement" Search
   * Combines FAFCAS (Semantic) and FTS (Lexical)
   */
  async search(queryVec: Float32Array, queryText: string, limit = 5): Promise<HydratedContext[]> {
    
    // 1. LEFT FLANK: Semantic Search (FAFCAS)
    // "Fast As F***" Brute Force in RAM
    const semanticHits = Array.from(this.nodes.values())
      .map(node => ({
        node,
        score: dotProduct(queryVec, node.vector), // Pure Dot Product
        type: 'semantic' as const
      }))
      .filter(hit => hit.score > 0.4) // Minimum relevance threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 2. RIGHT FLANK: Lexical Search (FTS)
    // Pseudo-code: Assume adapter connects to SQLite FTS5
    // const lexicalIds = await db.fts.match(queryText); 
    const lexicalHits: any[] = []; // Placeholder for FTS results

    // 3. MERGE & HYDRATE (Local-First)
    // We only go to disk here, at the very end.
    const results: HydratedContext[] = [];
    
    for (const hit of [...semanticHits, ...lexicalHits]) {
      // Deduplicate if needed
      if (results.find(r => r.id === hit.node.id)) continue;

      // Lazy Load from Disk
      // We do NOT pull this from the DB. We read the source file.
      const rawContent = await fs.readFile(hit.node.filePath, 'utf-8');

      results.push({
        id: hit.node.id,
        score: hit.score,
        summary: hit.node.summary,
        fullContent: rawContent, // The Truth
        matchType: hit.type
      });
    }

    return results.slice(0, limit);
  }
}
```

### 3\. Why this fits the Brief

  * **FTS as Lookup:** The `FTSDocument` interface exists solely to map keywords to a `nodeId`. The actual massive text content doesn't bloat your main `ThinNode` table.
  * **FAFCAS Compliant:** The `vector` in `ThinNode` expects a normalized `Float32Array`, ready for the `dotProduct` math without normalization overhead during search.
  * **Thin Node Protocol:** The `ThinNode` only holds a `summary`. The heavy `fullContent` is only resolved in `HydratedContext` by reading `filePath`, keeping the memory footprint minimal.