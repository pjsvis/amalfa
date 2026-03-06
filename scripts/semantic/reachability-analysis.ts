/**
 * Semantic Reachability Analysis
 * Identifies orphaned nodes and disconnected subgraphs in the persona governance layer.
 */

import { SemanticDB } from "@src/resonance/SemanticDB";
import { join } from "node:path";

async function main() {
  const semanticDb = new SemanticDB(join(process.cwd(), ".amalfa/runtime/semantic.db"));
  const raw = semanticDb.getRawDb();

  console.log("\n📈 SEMANTIC REACHABILITY REPORT\n");

  // 1. Absolute Orphans (No incoming or outgoing edges)
  const absoluteOrphans = raw.query(`
    SELECT n.id, n.title, n.layer
    FROM nodes n
    LEFT JOIN edges e1 ON n.id = e1.source
    LEFT JOIN edges e2 ON n.id = e2.target
    WHERE e1.source IS NULL AND e2.target IS NULL
    AND n.domain = 'persona'
  `).all() as any[];

  // 2. Incoming Orphans (Roots - No incoming edges)
  const roots = raw.query(`
    SELECT n.id, n.title, n.layer
    FROM nodes n
    LEFT JOIN edges e ON n.id = e.target
    WHERE e.target IS NULL
    AND n.domain = 'persona'
    AND EXISTS (SELECT 1 FROM edges WHERE source = n.id)
  `).all() as any[];

  // 3. Outgoing Orphans (Leaves - No outgoing edges)
  const leaves = raw.query(`
    SELECT n.id, n.title, n.layer
    FROM nodes n
    LEFT JOIN edges e ON n.id = e.source
    WHERE e.source IS NULL
    AND n.domain = 'persona'
    AND EXISTS (SELECT 1 FROM edges WHERE target = n.id)
  `).all() as any[];

  console.log("📊 Connectivity Summary:");
  console.log(`  - Total Persona Nodes : ${absoluteOrphans.length + roots.length + leaves.length + 
    (raw.query("SELECT COUNT(*) as c FROM nodes WHERE domain = 'persona'").get() as any).c - (absoluteOrphans.length + roots.length + leaves.length)}`);
  console.log(`  - Absolute Orphans    : ${absoluteOrphans.length} (Disconnected from everything)`);
  console.log(`  - Root Nodes          : ${roots.length} (Governance starts here)`);
  console.log(`  - Leaf Nodes          : ${leaves.length} (Terminal points)`);

  if (absoluteOrphans.length > 0) {
    console.log("\n🛑 DISCONNECTED PRINCIPLES (Action Required):");
    // Group by layer
    const byLayer: Record<string, any[]> = {};
    absoluteOrphans.forEach(o => {
      if (!byLayer[o.layer]) byLayer[o.layer] = [];
      byLayer[o.layer].push(o);
    });

    for (const [layer, nodes] of Object.entries(byLayer)) {
      console.log(`\n  [Layer: ${layer}] (${nodes.length} nodes)`);
      nodes.slice(0, 10).forEach(n => console.log(`    - ${n.id} (${n.title})`));
      if (nodes.length > 10) console.log(`    ... and ${nodes.length - 10} more`);
    }
  }

  console.log("\n🪐 HIGH-SIGNAL PATHS (Sample Roots):");
  roots.slice(0, 5).forEach(r => console.log(`  - ${r.id} (${r.title})`));

  semanticDb.close();
}

main().catch(console.error);
