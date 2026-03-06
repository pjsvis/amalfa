/**
 * STL Audit Script
 * Verifies the Saliency & Trust Layer initialization.
 */

import { SemanticDB } from "@src/resonance/SemanticDB";
import { join } from "node:path";

async function main() {
  const semanticDb = new SemanticDB(join(process.cwd(), ".amalfa/runtime/semantic.db"));
  const raw = semanticDb.getRawDb();

  console.log("\n🧬  SALIENCY & TRUST LAYER (STL) AUDIT\n");

  // 1. Check Node Initialization
  const nodeStats = raw.query(`
    SELECT 
      AVG(confidence_score) as avg_conf,
      AVG(saliency_score) as avg_sal,
      COUNT(*) as count
    FROM nodes
    WHERE domain = 'persona'
  `).get() as any;

  console.log("📊 Node STL Averages:");
  console.log(`  - Total Nodes      : ${nodeStats.count}`);
  console.log(`  - Avg Confidence   : ${nodeStats.avg_conf.toFixed(2)}`);
  console.log(`  - Avg Saliency     : ${nodeStats.avg_sal.toFixed(2)}`);

  // 2. Check Edge Initialization
  const edgeStats = raw.query(`
    SELECT 
      AVG(saliency_score) as avg_sal,
      COUNT(*) as count
    FROM edges
  `).get() as any;

  console.log("\n🔗 Edge STL Averages:");
  console.log(`  - Total Edges      : ${edgeStats.count}`);
  console.log(`  - Avg Saliency     : ${edgeStats.avg_sal.toFixed(2)}`);

  // 3. High Saliency Sample (The Soul)
  const soul = raw.query(`
    SELECT id, title, saliency_score
    FROM nodes
    WHERE layer = 'philosophical'
    LIMIT 5
  `).all() as any[];

  console.log("\n🔥 The Soul (High Saliency Samples):");
  soul.forEach(n => console.log(`  - [${n.saliency_score.toFixed(1)}] ${n.title} (${n.id})`));

  // 4. Cool Nodes (Substrate)
  const tendencies = raw.query(`
    SELECT id, title, saliency_score
    FROM nodes
    WHERE layer = 'substrate' AND type = 'tendency'
    LIMIT 5
  `).all() as any[];

  console.log("\n❄️  The Shield (Cool Tendency Samples):");
  tendencies.forEach(n => console.log(`  - [${n.saliency_score.toFixed(1)}] ${n.title} (${n.id})`));

  semanticDb.close();
}

main().catch(console.error);
