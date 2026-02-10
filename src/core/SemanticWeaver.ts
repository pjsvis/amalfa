import type { ResonanceDB } from "@src/resonance/db";

export const SemanticWeaver = {
  weave(db: ResonanceDB) {
    console.log("🧠 SemanticWeaver: Initializing Orphan Rescue...");

    // 1. Identify Orphans (Nodes with no edges AND available embedding)
    // Query: ID not in source AND not in target
    // Note: This matches the verification script logic but optimized for DB operation
    const orphans = db
      .getRawDb()
      .query(`
            SELECT n.id, n.embedding, n.title
            FROM nodes n
            LEFT JOIN edges e1 ON n.id = e1.source
            LEFT JOIN edges e2 ON n.id = e2.target
            WHERE e1.source IS NULL 
              AND e2.target IS NULL
              AND n.embedding IS NOT NULL -- Must have vector
              AND n.type != 'root'
              AND n.type != 'domain'
        `)
      .all() as { id: string; embedding: Uint8Array; title: string }[];

    if (orphans.length === 0) {
      console.log("🧠 SemanticWeaver: No orphans found to rescue.");
      return;
    }

    console.log(
      `🧠 SemanticWeaver: Found ${orphans.length} orphans with embeddings.`,
    );

    let rescuedCount = 0;

    // 2. Rescue Mission
    for (const orphan of orphans) {
      // Convert BLOB to Float32Array (ResonanceDB already has logic, but we need raw access or re-use findSimilar)
      // Problem: db.findSimilar expects Float32Array query.
      // orphan.embedding is returned as a Buffer/Uint8Array from SQLite.

      const raw = orphan.embedding;
      const vec = new Float32Array(
        raw.buffer,
        raw.byteOffset,
        raw.byteLength / 4,
      );

      // 3. Search for "Experience" (Content Clustering)
      // Manual Vector Search since db.findSimilar is deprecated.
      // Ideally we use VectorEngine, but for this maintenance task, raw DB access is fine.
      const candidates = db
        .getRawDb()
        .query(`
                SELECT id, embedding FROM nodes 
                WHERE (layer = 'experience' OR type = 'note')
                AND embedding IS NOT NULL
            `)
        .all() as { id: string; embedding: Uint8Array }[];

      let bestMatch: { id: string; score: number } | null = null;

      // Import dotProduct from db utility or define local
      // We can import it from db.ts since it is an export function
      const { dotProduct } = require("@src/resonance/db");

      for (const candidate of candidates) {
        if (candidate.id === orphan.id) continue;

        const candidateVec = new Float32Array(
          candidate.embedding.buffer,
          candidate.embedding.byteOffset,
          candidate.embedding.byteLength / 4,
        );

        const score = dotProduct(vec, candidateVec);
        if (score > 0.85) {
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { id: candidate.id, score };
          }
        }
      }

      if (bestMatch) {
        // Edge: Orphan RELATED_TO Best Match
        db.insertEdge(orphan.id, bestMatch.id, "RELATED_TO");
        rescuedCount++;
      } else {
        // Debug: Log near misses
        // console.log(`   - Missed '${orphan.title}': No match > 0.85`);
      }
    }

    console.log(`🧠 SemanticWeaver: Rescued ${rescuedCount} orphans.`);
  },
};
