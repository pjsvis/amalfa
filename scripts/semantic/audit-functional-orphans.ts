/**
 * Functional Orphan Auditor
 * Identifies nodes that lack organic (non-root) connections.
 * Distinguishes between the 'Kirk' (core) and the 'Outer Ken' (periphery).
 */

import { SemanticDB } from "@src/resonance/SemanticDB";
import { join } from "node:path";

async function main() {
  const semanticDb = new SemanticDB(join(process.cwd(), ".amalfa/runtime/semantic.db"));
  const raw = semanticDb.getRawDb();

  console.log("\n🕵️  FUNCTIONAL ORPHAN AUDIT (The 'Outer Ken')\n");

  // Find nodes where ALL edges are to/from roots
  const orphans = raw.query(`
    SELECT n.id, n.title, n.layer, n.summary
    FROM nodes n
    WHERE n.domain = 'persona' 
    AND n.type != 'root'
    AND NOT EXISTS (
      SELECT 1 FROM edges e 
      WHERE (e.source = n.id OR e.target = n.id)
      AND e.type != 'ctx:governs'
    )
  `).all() as any[];

  console.log(`📊 Statistics:`);
  console.log(`  - Total Persona Nodes  : 202`);
  console.log(`  - Functional Orphans   : ${orphans.length} (${((orphans.length / 202) * 100).toFixed(1)}%)`);
  console.log(`  - Integrated Members   : ${202 - orphans.length}`);

  if (orphans.length > 0) {
    console.log("\n📽️  ORPHAN BREAKDOWN (Candidates for the Outer Ken):");
    
    const layers: Record<string, any[]> = {};
    orphans.forEach(o => {
      if (!layers[o.layer]) layers[o.layer] = [];
      layers[o.layer].push(o);
    });

    for (const [layer, nodes] of Object.entries(layers)) {
      console.log(`\n  [Layer: ${layer}] (${nodes.length} nodes)`);
      nodes.slice(0, 15).forEach(n => {
          console.log(`    - [${n.id.padEnd(30)}] ${n.title}`);
      });
      if (nodes.length > 15) console.log(`    ... and ${nodes.length - 15} more`);
    }
  }

  // Find "High-Signal Members" (The Body of the Kirk)
  const kirkMembers = raw.query(`
    SELECT n.id, n.title, COUNT(e.source) as connections
    FROM nodes n
    JOIN edges e ON (n.id = e.source OR n.id = e.target)
    WHERE n.domain = 'persona' 
    AND e.type != 'ctx:governs'
    GROUP BY n.id
    ORDER BY connections DESC
    LIMIT 10
  `).all() as any[];

  console.log("\n🏰 THE BODY OF THE KIRK (Top Interconnected Nodes):");
  kirkMembers.forEach(m => console.log(`  - ${m.connections} connections: ${m.title} (${m.id})`));

  semanticDb.close();
}

main().catch(console.error);
