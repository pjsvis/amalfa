/**
 * Tag-to-RDF Lifter
 * Converts legacy 'tags' arrays into formal RDF statements within the description text.
 */

import { readFileSync, writeFileSync } from "node:fs";

const SEMANTIC_FIXTURES = {
  lexicon: "scripts/fixtures/semantic-lexicon.json",
  cda: "scripts/fixtures/semantic-cda.json"
};

function liftTagsToRdf(definition: string, tags: string[]): string {
  if (!tags || tags.length === 0) return definition;

  let rdfBlock = "\n\n---\n";
  let hasContent = false;

  for (const tag of tags) {
    // Handle patterns like [Key: Value] or [Value]
    const match = tag.match(/\[?([^:\]]+):?\s*([^\]]*)\]?/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();

      if (value) {
        // Formal RDF Triple Statement
        rdfBlock += `Relates to [[${value}|${key.toLowerCase()}]].\n`;
        hasContent = true;
      } else {
        // Simple Mention
        rdfBlock += `Mentions [[${key}]].\n`;
        hasContent = true;
      }
    }
  }

  return hasContent ? definition + rdfBlock : definition;
}

async function main() {
  console.log("🚀 Lifting Tags to RDF Statements...\n");

  // 1. Process Lexicon
  const lexicon = JSON.parse(readFileSync(SEMANTIC_FIXTURES.lexicon, "utf-8"));
  const updatedLexicon = lexicon.map((entry: any) => ({
    ...entry,
    description: liftTagsToRdf(entry.description, entry.tags || []),
    tags: [] // Clear old tags to enforce the new standard
  }));
  writeFileSync(SEMANTIC_FIXTURES.lexicon, JSON.stringify(updatedLexicon, null, 2));
  console.log(`✅ Processed Lexicon: ${lexicon.length} entries`);

  // 2. Process CDA
  const cda = JSON.parse(readFileSync(SEMANTIC_FIXTURES.cda, "utf-8"));
  cda.directives.forEach((section: any) => {
    section.entries = section.entries.map((entry: any) => ({
      ...entry,
      definition: liftTagsToRdf(entry.definition, entry.tags || []),
      tags: []
    }));
  });
  writeFileSync(SEMANTIC_FIXTURES.cda, JSON.stringify(cda, null, 2));
  console.log(`✅ Processed CDA: ${cda.directives.reduce((acc: number, s: any) => acc + s.entries.length, 0)} entries`);

  console.log("\n✨ Refactoring Complete. Sources are now in RDF-embedded format.");
}

main().catch(console.error);
