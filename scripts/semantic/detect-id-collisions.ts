/**
 * Directive ID Collision Detector
 * Specifically looks for multiple entries sharing the same formal ID (e.g., OH-058)
 */

import { readFileSync } from "node:fs";

const FIXTURES = {
  lexicon: "scripts/fixtures/conceptual-lexicon-ref-v1.79.json",
  cda: "scripts/fixtures/cda-ref-v63.json"
};

async function main() {
  console.log("\n🔍 SEARCHING FOR DIRECTIVE ID COLLISIONS\n");

  const idMap = new Map<string, any[]>();

  // Regex to find things like OH-001, PHI-12, etc.
  const idPattern = /([A-Z]+-\d+)/i;

  // 1. Scan Lexicon
  const lexicon = JSON.parse(readFileSync(FIXTURES.lexicon, "utf-8"));
  for (const entry of lexicon) {
    const match = entry.title?.match(idPattern);
    if (match) {
      const id = match[1].toUpperCase();
      if (!idMap.has(id)) idMap.set(id, []);
      idMap.get(id)!.push({ source: "CL", title: entry.title, definition: entry.description });
    }
  }

  // 2. Scan CDA
  const cda = JSON.parse(readFileSync(FIXTURES.cda, "utf-8"));
  for (const section of cda.directives) {
    for (const entry of section.entries) {
      const entryId = entry.id || "";
      const match = entryId.match(idPattern);
      const id = match ? match[1].toUpperCase() : entryId.toUpperCase();
      
      if (id.match(/^[A-Z]+-\d+$/)) {
        if (!idMap.has(id)) idMap.set(id, []);
        idMap.get(id)!.push({ 
          source: "CDA", 
          title: entry.title || entry.term, 
          definition: entry.definition 
        });
      }
    }
  }

  // 3. Report
  let collisionCount = 0;
  for (const [id, occurrences] of idMap.entries()) {
    if (occurrences.length > 1) {
      collisionCount++;
      console.log(`🛑 COLLISION: ${id} (${occurrences.length} entries)`);
      occurrences.forEach(o => {
        console.log(`   - [${o.source}] ${o.title}`);
      });
      console.log("");
    }
  }

  if (collisionCount === 0) {
    console.log("✅ No Directive ID collisions found. Every OH/PHI/COG ID is unique.");
  } else {
    console.log(`❌ Found ${collisionCount} ID collisions.`);
  }
}

main().catch(console.error);
