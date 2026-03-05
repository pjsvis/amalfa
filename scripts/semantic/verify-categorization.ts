/**
 * Semantic Categorization Auditor
 * Verifies that nodes in semantic.db are correctly tagged for the Sigma frontend.
 */

import { SemanticDB } from "@src/resonance/SemanticDB";
import { join } from "node:path";

async function main() {
  const semanticDb = new SemanticDB(join(process.cwd(), ".amalfa/runtime/semantic.db"));
  const raw = semanticDb.getRawDb();

  console.log("\n🕵️  SEMANTIC CATEGORIZATION AUDIT\n");

  const nodes = raw.query("SELECT id, domain, type, meta FROM nodes").all() as any[];
  
  const stats = {
    total: nodes.length,
    persona: 0,
    knowledge: 0,
    briefs: 0,
    debriefs: 0,
    playbooks: 0,
    misc: 0,
    malformedMeta: 0
  };

  const knownFolders = ["playbooks", "debriefs", "briefs", "shards", "knowledge"];

  for (const node of nodes) {
    let subGraph = "misc";
    
    if (node.domain === "persona") {
      subGraph = "persona";
    } else if (node.meta) {
      try {
        const meta = JSON.parse(node.meta);
        if (meta.source) {
          for (const folder of knownFolders) {
            if (meta.source.includes(folder)) {
              subGraph = folder;
              break;
            }
          }
        }
      } catch (e) {
        stats.malformedMeta++;
      }
    }

    if (stats[subGraph] !== undefined) {
      stats[subGraph]++;
    } else {
      stats.misc++;
    }
  }

  console.log(`Total Nodes: ${stats.total}`);
  console.log("---------------------------------------");
  console.log(`🎭 Persona (CL/CDA) : ${stats.persona}`);
  console.log(`📚 Knowledge        : ${stats.knowledge}`);
  console.log(`📝 Briefs           : ${stats.briefs}`);
  console.log(`✅ Debriefs         : ${stats.debriefs}`);
  console.log(`📖 Playbooks        : ${stats.playbooks}`);
  console.log(`❓ Misc (Shadowed)  : ${stats.misc}`);
  console.log(`⚠️  Malformed Meta  : ${stats.malformedMeta}`);

  if (stats.misc > 0) {
    console.log("\n🛑 Sample Misc Nodes (Not mapped to a known cluster):");
    const miscNodes = nodes.filter(n => {
        if (n.domain === 'persona') return false;
        if (!n.meta) return true;
        const meta = JSON.parse(n.meta);
        return !knownFolders.some(f => meta.source?.includes(f));
    }).slice(0, 5);
    
    miscNodes.forEach(n => console.log(`  - ${n.id} (Source: ${JSON.parse(n.meta).source})`));
  }

  semanticDb.close();
}

main().catch(console.error);
