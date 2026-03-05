/**
 * CDA/CL Subgraph Analysis
 * Isolates nodes and edges in the 'lexicon' domain for analysis
 */

import { SemanticDB } from "@src/resonance/SemanticDB";
import { join } from "node:path";

async function main() {
  const semanticDb = new SemanticDB(join(process.cwd(), ".amalfa/runtime/semantic.db"));
  const raw = semanticDb.getRawDb();

  console.log("\n🏛️  CDA/CL SUBGRAPH ANALYSIS\n");

  // 1. Node counts by type in lexicon domain
  const nodeStats = raw.query(`
    SELECT type, COUNT(*) as count 
    FROM nodes 
    WHERE domain = 'lexicon' 
    GROUP BY type
  `).all() as any[];

  console.log("📊 Node Distribution (Lexicon Domain):");
  nodeStats.forEach(s => console.log(`  - ${s.type.padEnd(12)}: ${s.count}`));

  // 2. Edge counts in lexicon domain
  const edgeCount = raw.query(`
    SELECT COUNT(*) as count 
    FROM edges e
    JOIN nodes n ON e.source = n.id
    WHERE n.domain = 'lexicon'
  `).get() as { count: number };

  console.log(`\n🔗 Total Semantic Edges from Lexicon: ${edgeCount.count}`);

  // 3. Predicate distribution
  const predicateStats = raw.query(`
    SELECT e.type as predicate, COUNT(*) as count 
    FROM edges e
    JOIN nodes n ON e.source = n.id
    WHERE n.domain = 'lexicon'
    GROUP BY e.type
    ORDER BY count DESC
  `).all() as any[];

  console.log("\n🧬 Predicate Distribution (Lexicon):");
  predicateStats.forEach(s => console.log(`  - ${s.predicate.padEnd(15)}: ${s.count}`));

  // 4. Sample High-Degree Nodes
  const gravityNodes = raw.query(`
    SELECT n.id, n.title, COUNT(e.target) as degree
    FROM nodes n
    JOIN edges e ON n.id = e.source
    WHERE n.domain = 'lexicon'
    GROUP BY n.id
    ORDER BY degree DESC
    LIMIT 10
  `).all() as any[];

  console.log("\n🪐 Top Gravity Nodes (High Centrality):");
  gravityNodes.forEach(n => console.log(`  - ${n.id.padEnd(25)}: ${n.degree} connections (${n.title})`));

  // 5. Cross-Domain Bridge Edges
  const crossDomain = raw.query(`
    SELECT e.source, e.target, e.type, t.domain as target_domain
    FROM edges e
    JOIN nodes s ON e.source = s.id
    JOIN nodes t ON e.target = t.id
    WHERE s.domain = 'lexicon' AND t.domain != 'lexicon'
    LIMIT 10
  `).all() as any[];

  console.log(`\n🌐 Bridge Edges (Lexicon -> Docs):`);
  crossDomain.forEach(e => console.log(`  - ${e.source} --[${e.type}]--> ${e.target} (${e.target_domain})`));

  semanticDb.close();
}

main().catch(console.error);
