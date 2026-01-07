#!/usr/bin/env bun
/**
 * Query node IDs to verify path updates after docs reorganization
 */

import { ResonanceDB } from "../src/resonance/db";
import { join } from "path";

const dbPath = join(process.cwd(), ".amalfa/resonance.db");
const db = new ResonanceDB(dbPath);

console.log("🔍 Checking node IDs after docs reorganization\n");

// Query all nodes and show their IDs
const query = db.db.query(`
  SELECT id, title, type
  FROM nodes
  WHERE id LIKE 'docs/%'
  ORDER BY id
  LIMIT 20
`);

const results = query.all() as any[];

console.log(`📊 Found ${results.length} nodes with 'docs/' prefix:\n`);

for (const node of results) {
  const hasSubdir = node.id.match(/docs\/([^\/]+)\//)?.[1];
  const icon = hasSubdir ? "✅" : "⚠️ ";
  console.log(`${icon} ${node.id}`);
  if (node.title !== node.id) {
    console.log(`   Title: ${node.title}`);
  }
}

// Check for specific reorganized files
console.log("\n\n🎯 Checking for specific reorganized files:\n");

const testFiles = [
  { old: "docs/MCP_SETUP.md", new: "docs/setup/MCP_SETUP.md" },
  { old: "docs/CONFIG_VALIDATION.md", new: "docs/config/CONFIG_VALIDATION.md" },
  { old: "docs/2026-01-07-CODEBASE-AUDIT.md", new: "docs/audits/2026-01-07-CODEBASE-AUDIT.md" },
  { old: "docs/hardened-sqlite.md", new: "docs/references/hardened-sqlite.md" }
];

for (const test of testFiles) {
  const oldExists = db.db.query("SELECT 1 FROM nodes WHERE id = ?").get(test.old);
  const newExists = db.db.query("SELECT 1 FROM nodes WHERE id = ?").get(test.new);
  
  if (newExists) {
    console.log(`✅ ${test.new} - FOUND (correctly updated!)`);
  } else if (oldExists) {
    console.log(`❌ ${test.old} - Still at OLD path`);
  } else {
    console.log(`⚠️  Neither old nor new path found for: ${test.old.split('/').pop()}`);
  }
}

// Summary by category
console.log("\n\n📁 Node distribution by directory:\n");

const categories = ["setup", "config", "audits", "references", "architecture", "archive"];
for (const cat of categories) {
  const count = db.db.query(`
    SELECT COUNT(*) as count FROM nodes WHERE id LIKE ?
  `).get(`docs/${cat}/%`) as any;
  
  console.log(`  docs/${cat.padEnd(12)} ${count.count} nodes`);
}

const rootCount = db.db.query(`
  SELECT COUNT(*) as count FROM nodes 
  WHERE id LIKE 'docs/%' 
  AND id NOT LIKE 'docs/%/%'
`).get() as any;

console.log(`  docs/ (root)     ${rootCount.count} nodes`);

console.log(`\n📊 Total nodes: ${db.getStats().nodes}`);
console.log(`📝 Database modified: ${new Date(db.getStats().lastModified).toISOString()}`);
