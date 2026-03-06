/**
 * CDA/CL Source Validator
 * Rigorous audit of the core persona fixtures.
 */

import { readFileSync } from "node:fs";

const FIXTURES = {
  lexicon: "scripts/fixtures/conceptual-lexicon-ref-v1.79.json",
  cda: "scripts/fixtures/cda-ref-v63.json"
};

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-");
}

async function main() {
  console.log("\n🔍 AUDITING PERSONA SOURCE MATERIAL\n");

  const registry = new Map<string, { source: string, title: string }>();
  const collisions: any[] = [];
  const orphans: any[] = [];

  // 1. Audit Lexicon
  const lexicon = JSON.parse(readFileSync(FIXTURES.lexicon, "utf-8"));
  lexicon.forEach((entry: any, index: number) => {
    const title = entry.title || "";
    const id = slugify(title);
    
    if (!title) orphans.push({ fixture: "CL", index });
    if (registry.has(id)) {
      collisions.push({ id, title, existing: registry.get(id), fixture: "CL" });
    } else {
      registry.set(id, { source: "CL", title });
    }
  });

  // 2. Audit CDA
  const cda = JSON.parse(readFileSync(FIXTURES.cda, "utf-8"));
  cda.directives.forEach((section: any) => {
    section.entries.forEach((entry: any, index: number) => {
      const entryId = entry.id || "";
      const title = entry.title || entry.term || "";
      
      // We check for both ID-based slugs and Title-based slugs
      const idByRef = slugify(entryId);
      const idByTitle = slugify(`${entryId} ${title}`);
      
      // Use the one the pipeline actually uses
      const finalId = entryId.match(/^(oh|phi|cog|adv|cip|opm|qhd|iep)-/i) 
        ? idByTitle 
        : idByRef || slugify(title);

      if (!finalId) orphans.push({ fixture: "CDA", section: section.section, index });
      
      if (registry.has(finalId)) {
        collisions.push({ id: finalId, title, existing: registry.get(finalId), fixture: "CDA" });
      } else {
        registry.set(finalId, { source: "CDA", title });
      }
    });
  });

  console.log(`- Total Unique Identities: ${registry.size}`);
  console.log(`- Collisions Detected:    ${collisions.length}`);
  console.log(`- Empty/Orphan Nodes:     ${orphans.length}\n`);

  if (collisions.length > 0) {
    console.log("🛑 COLLISION REPORT:");
    collisions.forEach(c => {
      console.log(`  [${c.id}]`);
      console.log(`    New:      "${c.title}" (${c.fixture})`);
      console.log(`    Existing: "${c.existing.title}" (${c.existing.source})`);
      console.log("");
    });
  }

  if (orphans.length > 0) {
    console.log("⚠️  ORPHAN REPORT:");
    console.log(orphans);
  }
}

main().catch(console.error);
