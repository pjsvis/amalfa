/**
 * Node Link Comparison Diagnostic
 * Investigates why overlap is 0% by looking at a specific high-link file
 */

import { ResonanceDB } from "@src/resonance/db";
import { SemanticDB } from "@src/resonance/SemanticDB";
import { join } from "node:path";

async function main() {
  const resonanceDb = ResonanceDB.init();
  const semanticDb = new SemanticDB(join(process.cwd(), ".amalfa/runtime/semantic.db"));

  // Target a file we know has links
  const targetPath = "briefs/PLAN-RDF-IMPLEMENTATION.md";
  const resId = resonanceDb.generateId(targetPath);
  const semId = semanticDb.generateId(targetPath);

  console.log(`\n🔍 ANALYZING LINKS FOR: ${targetPath}`);
  console.log(`- Resonance ID: ${resId}`);
  console.log(`- Semantic ID:  ${semId}\n`);

  const resEdges = resonanceDb.getRawDb().query("SELECT target, type FROM edges WHERE source = ?").all(resId) as any[];
  const semEdges = semanticDb.getRawDb().query("SELECT target, type FROM edges WHERE source = ?").all(semId) as any[];

  console.log(`📊 Resonance Edges (${resEdges.length}):`);
  resEdges.slice(0, 10).forEach(e => console.log(`  -> [${e.type}] ${e.target}`));
  if (resEdges.length > 10) console.log("  ...");

  console.log(`\n📊 Semantic Edges (${semEdges.length}):`);
  semEdges.slice(0, 10).forEach(e => console.log(`  -> [${e.type}] ${e.target}`));
  if (semEdges.length > 10) console.log("  ...");

  // Try to find fuzzy overlap
  console.log("\n🕵️ Fuzzy Overlap (Target ID contains Target ID):");
  for (const se of semEdges) {
    for (const re of resEdges) {
      if (re.target.includes(se.target) || se.target.includes(re.target)) {
        console.log(`  ✅ MATCH: Semantic '${se.target}' <-> Resonance '${re.target}'`);
      }
    }
  }

  resonanceDb.close();
  semanticDb.close();
}

main().catch(console.error);
