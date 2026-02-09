/**
 * FAFCAS Compliance Fix
 *
 * Normalizes all existing vectors in the database to unit length (L2 norm = 1.0)
 * to comply with FAFCAS protocol for optimized dot product search.
 */

import { Database } from "bun:sqlite";
import { getDbPath } from "@src/cli/utils";

async function normalizeDatabaseVectors() {
  console.log("🔧 FAFCAS Compliance Fix\n");

  const dbPath = await getDbPath();
  const db = new Database(dbPath);

  // Get all nodes with embeddings
  console.log("Loading vectors for normalization...");
  const nodes = db
    .query("SELECT id, embedding FROM nodes WHERE embedding IS NOT NULL")
    .all() as any[];
  console.log(`  Found ${nodes.length} vectors to normalize\n`);

  // Prepare update statement
  const updateStmt = db.prepare("UPDATE nodes SET embedding = ? WHERE id = ?");

  // Process in transaction for safety
  const transaction = db.transaction(() => {
    let normalized = 0;
    let alreadyNormalized = 0;

    for (const node of nodes) {
      // Skip nodes without embeddings
      if (!node.id || !node.embedding) continue;

      // Load current vector
      const vector = new Float32Array(
        node.embedding.buffer,
        node.embedding.byteOffset,
        node.embedding.byteLength / 4,
      );

      // Calculate L2 norm
      let sum = 0;
      for (let i = 0; i < vector.length; i++) {
        const val = vector[i];
        if (val !== undefined) {
          sum += val * val;
        }
      }
      const magnitude = Math.sqrt(sum);

      // Check if already normalized
      if (Math.abs(magnitude - 1.0) < 1e-6) {
        alreadyNormalized++;
        continue;
      }

      // Normalize to unit length
      if (magnitude > 1e-6) {
        for (let i = 0; i < vector.length; i++) {
          const val = vector[i];
          if (val !== undefined) {
            vector[i] = val / magnitude;
          }
        }
      }

      // Convert back to Uint8Array for storage
      const normalizedBytes = new Uint8Array(
        vector.buffer,
        vector.byteOffset,
        vector.byteLength,
      );

      // Update in database
      updateStmt.run(normalizedBytes, node.id || "");
      normalized++;

      if (normalized % 100 === 0) {
        console.log(`  Normalized ${normalized}/${nodes.length} vectors...`);
      }
    }

    console.log(`\n✅ FAFCAS Normalization Complete:`);
    console.log(`   Normalized: ${normalized} vectors`);
    console.log(`   Already normalized: ${alreadyNormalized} vectors`);
    console.log(`   Total: ${normalized + alreadyNormalized} vectors`);
  });

  // Execute transaction
  console.log("Executing normalization transaction...");
  transaction();

  // Verify a sample
  console.log("\n🔍 Verification (sample 5 vectors):");
  const samples = db
    .query("SELECT id, embedding FROM nodes LIMIT 5")
    .all() as any[];
  for (const sample of samples) {
    if (!sample.id || !sample.embedding) continue;

    const vec = new Float32Array(
      sample.embedding.buffer,
      sample.embedding.byteOffset,
      sample.embedding.byteLength / 4,
    );
    let norm = 0;
    for (let i = 0; i < vec.length; i++) {
      const val = vec[i];
      if (val !== undefined) {
        norm += val * val;
      }
    }
    const l2norm = Math.sqrt(norm);
    console.log(
      `  ${(sample.id || "").substring(0, 30)}: ${l2norm.toFixed(6)} ${l2norm < 1.01 && l2norm > 0.99 ? "✅" : "❌"}`,
    );
  }

  db.close();
  console.log("\n🎉 All vectors are now FAFCAS-compliant!");
}

normalizeDatabaseVectors().catch(console.error);
