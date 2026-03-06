/**
 * JSON to JSONL Converter
 * Transforms nested semantic fixtures into deterministic record streams.
 */

import { readFileSync, writeFileSync } from "node:fs";

const SOURCES = {
  lexicon: "scripts/fixtures/semantic-lexicon.json",
  cda: "scripts/fixtures/semantic-cda.json"
};

const TARGETS = {
  lexicon: "scripts/fixtures/semantic-lexicon.jsonl",
  cda: "scripts/fixtures/semantic-cda.jsonl"
};

async function main() {
  console.log("🧬 TRANSFORMING STUFF INTO THINGS (JSON -> JSONL)\n");

  // 1. Process Lexicon
  const lexicon = JSON.parse(readFileSync(SOURCES.lexicon, "utf-8"));
  const lexiconLines = lexicon.map((entry: any) => JSON.stringify(entry)).join("\n");
  writeFileSync(TARGETS.lexicon, lexiconLines + "\n");
  console.log(`✅ Lexicon: ${lexicon.length} records -> ${TARGETS.lexicon}`);

  // 2. Process CDA
  const cda = JSON.parse(readFileSync(SOURCES.cda, "utf-8"));
  const cdaRecords: any[] = [];
  
  for (const section of cda.directives) {
    for (const entry of section.entries) {
      cdaRecords.push({
        ...entry,
        section: section.section,
        origin: "cda"
      });
    }
  }
  
  const cdaLines = cdaRecords.map((r: any) => JSON.stringify(r)).join("\n");
  writeFileSync(TARGETS.cda, cdaLines + "\n");
  console.log(`✅ CDA    : ${cdaRecords.length} records -> ${TARGETS.cda}`);

  console.log("\n📊 Verification:");
  console.log(`Lexicon count: ${lexicon.length}`);
  console.log(`CDA count:     ${cdaRecords.length}`);
  console.log(`Total Things:  ${lexicon.length + cdaRecords.length}`);
}

main().catch(console.error);
