/**
 * Persona DNA Tabulator
 * Generates a clean list view of the persona's Soul and Skills.
 */

import { SemanticDB } from "@src/resonance/SemanticDB";
import { join } from "node:path";

async function main() {
  const semanticDb = new SemanticDB(join(process.cwd(), ".amalfa/runtime/semantic.db"));
  const raw = semanticDb.getRawDb();

  console.log("\n🧬  CTX PERSONA DNA: THE SOUL & THE SKILLS\n");

  const layers = ["philosophical", "operational", "substrate", "outlier"];
  
  for (const layer of layers) {
    const nodes = raw.query(`
      SELECT id, title, type 
      FROM nodes 
      WHERE layer = ? 
      ORDER BY type, id
    `).all(layer) as any[];

    const header = layer.toUpperCase();
    console.log(`\n=== ${header} LAYER (${nodes.length} items) ===`);
    console.log("".padEnd(header.length + 18, "-"));
    
    nodes.forEach(n => {
        let typeIcon = '🧠';
        if (n.type === 'Foundational Directive') typeIcon = '🏛️';
        if (n.type === 'Operational Heuristic') typeIcon = '📜';
        if (n.type === 'Substrate Tendency') typeIcon = '⚠️';
        if (n.type === 'Compressed Neologism') typeIcon = '💎';
        
        console.log(`${typeIcon} [${n.id.padEnd(45)}] ${n.title}`);
    });
  }

  console.log("\n📊 Summary:");
  const total = raw.query("SELECT COUNT(*) as c FROM nodes WHERE domain = 'persona'").get() as any;
  console.log(`- Total Persona Nodes: ${total.c}`);

  semanticDb.close();
}

main().catch(console.error);
