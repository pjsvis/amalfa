/**
 * Louvain Community Naming Utility
 * Clusters the persona graph and infers a thematic name for each group.
 */

import { SemanticDB } from "@src/resonance/SemanticDB";
import { GraphEngine } from "@src/core/GraphEngine";
import { join } from "node:path";

async function main() {
  const semanticDb = new SemanticDB(join(process.cwd(), ".amalfa/runtime/semantic.db"));
  const graphEngine = new GraphEngine();
  
  console.log("\n🌍 INFERRING LOUVAIN COMMUNITY THEMES\n");

  await graphEngine.load(semanticDb.getRawDb());
  
  const stats = graphEngine.getStats();
  console.log(`📡 Loaded ${stats.nodes} nodes and ${stats.edges} edges.`);

  const communities = graphEngine.detectCommunities();
  const groups: Record<number, string[]> = {};

  // Group node titles by community ID
  for (const [nodeId, communityId] of Object.entries(communities)) {
    const node = semanticDb.getNode(nodeId);
    if (node && node.domain === 'persona') {
        if (!groups[communityId]) groups[communityId] = [];
        groups[communityId].push(node.label || node.id);
    }
  }

  // Filter out tiny communities for clarity
  const sortedGroups = Object.entries(groups)
    .filter(([_, nodes]) => nodes.length > 2)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`Found ${sortedGroups.length} significant clusters:\n`);

  sortedGroups.forEach(([id, nodes], index) => {
    const label = String.fromCharCode(65 + index);
    const theme = inferTheme(nodes);
    
    console.log(`📦 Group ${label} [${theme}] (${nodes.length} nodes)`);
    console.log(`   Members: ${nodes.slice(0, 5).join(", ")}${nodes.length > 5 ? "..." : ""}`);
    console.log("");
  });

  semanticDb.close();
}

/**
 * Heuristic theme inference based on member keywords.
 */
function inferTheme(nodes: string[]): string {
  const text = nodes.join(" ").toUpperCase();
  
  if (text.includes("SSIP") || text.includes("INITIALIZATION") || text.includes("START")) return "Session Orchestration";
  if (text.includes("MUPPET") || text.includes("DISENGAGE") || text.includes("SAFETY")) return "Substrate Containment";
  if (text.includes("JSON") || text.includes("MARKDOWN") || text.includes("FORMAT")) return "Output Hardening";
  if (text.includes("PHILOSOPHY") || text.includes("ENTROPY") || text.includes("PRINCIPLE")) return "Philosophical Core";
  if (text.includes("VALIDATION") || text.includes("VERIFY") || text.includes("TEST")) return "Empirical Governance";
  if (text.includes("MENTATION") || text.includes("COGNITIVE")) return "Cognitive Processing";
  if (text.includes("MAP") || text.includes("TERRITORY") || text.includes("SEMANTICS")) return "General Semantics";
  if (text.includes("CDA") || text.includes("CL") || text.includes("FACTORY")) return "Ontological Registry";
  
  return "Operational Skillset";
}

main().catch(console.error);
