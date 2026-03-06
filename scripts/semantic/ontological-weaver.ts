/**
 * Ontological Weaver
 * Performs N x N comparison to densify the persona graph.
 * Identifies hidden 'myo-fascial' pathways between principles.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURES = {
  lexicon: "scripts/fixtures/semantic-lexicon.jsonl",
  cda: "scripts/fixtures/semantic-cda.jsonl",
  bestiary: "scripts/fixtures/semantic-bestiary.jsonl"
};

interface PersonaNode {
  id: string;
  title: string;
  text: string; // Combined description/definition
  origin: string;
  raw: any;
}

async function main() {
  console.log("🕸️  STARTING ONTOLOGICAL WEAVING (Densification Phase)\n");

  const nodes: PersonaNode[] = [];
  
  // 1. Load All Nodes into Memory
  for (const [key, path] of Object.entries(FIXTURES)) {
    const lines = readFileSync(path, "utf-8").split("\n").filter(l => l.trim());
    for (const line of lines) {
      const data = JSON.parse(line);
      const title = data.title || data.term || data.id;
      nodes.push({
        id: slugify(title),
        title: title,
        text: (data.description || data.definition || "").toLowerCase(),
        origin: path,
        raw: data
      });
    }
  }

  console.log(`📡 Loaded ${nodes.length} nodes for comparison.`);

  let newEdges = 0;
  const updatedFixtures: Record<string, any[]> = {
    [FIXTURES.lexicon]: [],
    [FIXTURES.cda]: [],
    [FIXTURES.bestiary]: []
  };

  // 2. Perform N x N Comparison
  for (const subject of nodes) {
    const findings: string[] = [];
    
    for (const target of nodes) {
      if (subject.id === target.id) continue;

      // Check for Title or ID mentions
      const term = target.title.toLowerCase();
      const idPattern = new RegExp(`\\b${target.raw.id ? target.raw.id.toLowerCase() : '____NONE____'}\\b`, 'i');
      const termPattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

      if (term.length > 4 && termPattern.test(subject.text) || idPattern.test(subject.text)) {
        findings.push(target.id);
      }
    }

    // 3. Inject RDF Triples into the raw record
    if (findings.length > 0) {
      if (!subject.raw.triples) subject.raw.triples = [];
      
      for (const targetId of findings) {
        // Only add if not already present
        const exists = subject.raw.triples.some((t: any) => t.o === targetId);
        if (!exists) {
          subject.raw.triples.push({
            s: subject.id,
            p: "ctx:mentions",
            o: targetId,
            method: "lexical-weave"
          });
          newEdges++;
        }
      }
    }
    updatedFixtures[subject.origin].push(subject.raw);
  }

  // 4. Save Updated Fixtures
  for (const [path, records] of Object.entries(updatedFixtures)) {
    const content = records.map(r => JSON.stringify(r)).join("\n") + "\n";
    writeFileSync(path, content);
  }

  console.log(`\n✅ WEAVING COMPLETE`);
  console.log(`- New 'Fascial' Edges Created: ${newEdges}`);
  console.log(`- Updated JSONL fixtures with embedded RDF triples.`);
}

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-");
}

main().catch(console.error);
