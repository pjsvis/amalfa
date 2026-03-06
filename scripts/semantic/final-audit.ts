/**
 * Final Persona Audit
 * Lists ALL directives by type to confirm visibility.
 */

import { SemanticDB } from "@src/resonance/SemanticDB";
import { join } from "node:path";

async function main() {
  const semanticDb = new SemanticDB(join(process.cwd(), ".amalfa/runtime/semantic.db"));
  const raw = semanticDb.getRawDb();

  console.log("\n🏛️  FINAL PERSONA SUBGRAPH AUDIT\n");

  const directives = raw.query(`
    SELECT id, title 
    FROM nodes 
    WHERE domain = 'persona' 
    AND type = 'directive'
    ORDER BY id
  `).all() as any[];

  console.log(`\nTotal Directives Found: ${directives.length}`);
  directives.forEach(d => console.log(`  - ${d.id}`));

  const concepts = raw.query("SELECT COUNT(*) as c FROM nodes WHERE domain = 'persona' AND type = 'concept'").get() as { c: number };
  console.log(`\nCONCEPTS: ${concepts.c}`);

  semanticDb.close();
}

main().catch(console.error);
