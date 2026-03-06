/**
 * Bestiary-to-JSONL Lifter
 * Parses docs/bestiary-of-substrate-tendencies.md into structured records.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = "docs/bestiary-of-substrate-tendencies.md";
const TARGET = "scripts/fixtures/semantic-bestiary.jsonl";

async function main() {
  console.log("🧬 EXTRACTING SUBSTRATE TENDENCIES (Markdown -> JSONL)\n");

  const content = readFileSync(SOURCE, "utf-8");
  const sections = content.split(/^##\s+/m).slice(1); // Skip header

  const records: any[] = [];

  for (const section of sections) {
    const lines = section.split("\n");
    const titleLine = lines[0].trim();
    // Match "1. Name" or just "Name"
    const titleMatch = titleLine.match(/^(?:\d+\\?\.?\s*)?(.+)$/);
    const title = titleMatch ? titleMatch[1].trim().replace(/\*/g, "").replace(/\\/g, "") : titleLine;
    
    const descriptionMatch = section.match(/- \*\*Description:\*\* ([^*]+)/i) || 
                             section.match(/\* \*\*Description:\*\* ([^*]+)/i) ||
                             section.match(/^\s*Description:\s*([^*]+)/im);
    const description = descriptionMatch ? descriptionMatch[1].trim() : "";

    const mitigationMatch = section.match(/- \*\*Ctx Mitigation:\*\* ([^*]+)/i) || 
                            section.match(/\* \*\*Ctx Mitigation:\*\* ([^*]+)/i) ||
                            section.match(/^\s*Ctx Mitigation:\s*([^*]+)/im);
    const mitigation = mitigationMatch ? mitigationMatch[1].trim() : "";

    records.push({
      title,
      description,
      mitigation,
      origin: "bestiary",
      layer: "substrate"
    });
  }

  const lines = records.map(r => JSON.stringify(r)).join("\n");
  writeFileSync(TARGET, lines + "\n");
  console.log(`✅ Extracted ${records.length} tendencies to ${TARGET}`);
}

main().catch(console.error);
