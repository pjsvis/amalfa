/**
 * Ground Truth Audit
 * Scans source JSON fixtures to establish expected node counts.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURES = {
  lexicon: "scripts/fixtures/conceptual-lexicon-ref-v1.79.json",
  cda: "scripts/fixtures/cda-ref-v63.json"
};

async function main() {
  console.log("\n📊 ESTABLISHING GROUND TRUTH FROM FIXTURES\n");

  const uniqueIds = new Set<string>();
  const results: Record<string, string[]> = {
    OH: [],   // Operational Heuristics
    PHI: [],  // Philosophical Directives
    COG: [],  // Cognitive Directives
    ADV: [],  // Advisory/Safety
    OPM: [],  // Operational Protocols
    QHD: [],  // Quality/Heuristic
    IEP: [],  // Integrity/Escalation
    CIP: [],  // Core Integrity Protocols
    CONCEPT: [] // Generic terms
  };

  // 1. Audit Lexicon
  const lexicon = JSON.parse(readFileSync(FIXTURES.lexicon, "utf-8"));
  console.log(`Checking CL: ${lexicon.length} entries`);
  for (const entry of lexicon) {
    const title = entry.title || "";
    const id = title.toLowerCase().replace(/\s+/g, "-");
    categorize(id, title, results, uniqueIds);
  }

  // 2. Audit CDA
  const cda = JSON.parse(readFileSync(FIXTURES.cda, "utf-8"));
  let cdaCount = 0;
  for (const section of cda.directives) {
    for (const entry of section.entries) {
      cdaCount++;
      const id = entry.id.toLowerCase();
      const title = entry.title || entry.term || id;
      categorize(id, title, results, uniqueIds);
    }
  }
  console.log(`Checking CDA: ${cdaCount} entries`);

  console.log("\n📈 EXPECTED COUNTS BY CATEGORY:");
  console.log("---------------------------------------");
  let totalFormal = 0;
  for (const [cat, items] of Object.entries(results)) {
    if (cat === "CONCEPT") continue;
    console.log(`${cat.padEnd(10)}: ${items.length}`);
    totalFormal += items.length;
  }
  console.log("---------------------------------------");
  console.log(`TOTAL FORMAL: ${totalFormal}`);
  console.log(`CONCEPTS    : ${results.CONCEPT.length}`);
  console.log(`GRAND TOTAL : ${totalFormal + results.CONCEPT.length}`);

  // Save artifact
  const artifactPath = "docs/temp-semantic-artifacts/ground-truth.json";
  await Bun.write(artifactPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Ground truth artifact saved to: ${artifactPath}`);
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

function categorize(id: string, title: string, results: any, uniqueIds: Set<string>) {
  const isDirective = id.match(/^(oh|cip|phi|cog|adv|opm|qhd|iep)-/i) || 
                      title.match(/^(oh|cip|phi|cog|adv|opm|qhd|iep)-/i);
  
  const finalId = isDirective ? slugify(`${id} ${title}`) : id.toLowerCase();
  
  if (uniqueIds.has(finalId)) return;
  uniqueIds.add(finalId);

  const fullStr = `${id} ${title}`.toUpperCase();
  if (fullStr.includes("OH-")) results.OH.push(finalId);
  else if (fullStr.includes("PHI-")) results.PHI.push(finalId);
  else if (fullStr.includes("COG-")) results.COG.push(finalId);
  else if (fullStr.includes("ADV-")) results.ADV.push(finalId);
  else if (fullStr.includes("OPM-")) results.OPM.push(finalId);
  else if (fullStr.includes("QHD-")) results.QHD.push(finalId);
  else if (fullStr.includes("IEP-")) results.IEP.push(finalId);
  else if (fullStr.includes("CIP-")) results.CIP.push(finalId);
  else results.CONCEPT.push(finalId);
}

main().catch(console.error);
