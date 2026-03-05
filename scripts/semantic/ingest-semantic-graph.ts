/**
 * Semantic Ingestion Script
 * Runs the SemanticIngestor and compares with main resonance.db
 */

import { join } from "node:path";
import { loadSettings } from "@src/config/defaults";
import { SemanticIngestor } from "@src/pipeline/SemanticIngestor";
import { SemanticDB } from "@src/resonance/SemanticDB";
import { ResonanceDB } from "@src/resonance/db";
import { getLogger } from "@src/utils/Logger";

async function main() {
  const log = getLogger("IngestSemantic");
  console.log("\n🧪 SEMANTIC INGESTION & COMPARISON\n");

  const config = loadSettings();
  const semanticDbPath = join(process.cwd(), ".amalfa/runtime/semantic.db");
  
  // 1. Initialize Semantic DB
  console.log(`📡 Target: ${semanticDbPath}`);
  const semanticDb = new SemanticDB(semanticDbPath);
  
  // 2. Run Ingestion
  const ingestor = new SemanticIngestor(config, semanticDb);
  console.log("🔄 Running semantic ingestion...");
  const result = await ingestor.ingest();

  if (!result.success) {
    console.error("❌ Ingestion failed.");
    process.exit(1);
  }

  // 3. Comparison Report
  console.log("\n" + "=".repeat(70));
  console.log("📊 COMPARISON REPORT");
  console.log("=".repeat(70));

  const resonanceDb = ResonanceDB.init();
  const resStats = resonanceDb.getStats();
  const semStats = semanticDb.getStats();

  const pad = (s: string, n: number) => s.padEnd(n);

  console.log(`Metric           | Resonance (Heuristic) | Semantic (LLM/Rules)`);
  console.log(`-----------------|-----------------------|----------------------`);
  console.log(`${pad("Nodes", 16)} | ${pad(resStats.nodes.toString(), 21)} | ${semStats.nodes}`);
  console.log(`${pad("Edges", 16)} | ${pad(resStats.edges.toString(), 21)} | ${semStats.edges}`);
  console.log(`${pad("Size (KB)", 16)} | ${pad((resStats.db_size_bytes / 1024).toFixed(1), 21)} | ${(semStats.db_size_bytes / 1024).toFixed(1)}`);
  
  // 4. Analysis
  console.log("\n📝 Observations:");
  if (semStats.edges > resStats.edges) {
    console.log(`- Semantic graph is DENSER (+${semStats.edges - resStats.edges} edges)`);
  } else {
    console.log(`- Resonance graph is DENSER (+${resStats.edges - semStats.edges} edges)`);
  }

  const overlap = await calculateOverlap(resonanceDb, semanticDb);
  console.log(`- Edge Overlap: ${overlap.count} shared triples (${overlap.percent.toFixed(1)}%)`);

  console.log("\n✅ Semantic Ingestion Complete\n");
}

async function calculateOverlap(db1: ResonanceDB, db2: SemanticDB) {
  const edges1 = db1.getRawDb().query("SELECT source, target, type FROM edges").all() as any[];
  const edges2 = db2.getRawDb().query("SELECT source, target, type FROM edges").all() as any[];
  
  const set1 = new Set(edges1.map(e => `${e.source}|${e.target}|${e.type.toLowerCase()}`));
  let count = 0;
  
  for (const e of edges2) {
    if (set1.has(`${e.source}|${e.target}|${e.type.toLowerCase()}`)) {
      count++;
    }
  }
  
  return {
    count,
    percent: edges1.length > 0 ? (count / edges1.length) * 100 : 0
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
