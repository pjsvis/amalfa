#!/usr/bin/env bun
/**
 * Query script to verify file path updates after docs reorganization
 */

import { ResonanceDB } from "../src/resonance/db";
import { join } from "path";

const dbPath = join(process.cwd(), ".amalfa/resonance.db");
const db = new ResonanceDB(dbPath);

console.log("🔍 Checking file paths in database after reorganization\n");

// Query nodes that should have moved to subdirectories
const movedDocs = [
  "MCP_SETUP.md",
  "CONFIG_VALIDATION.md", 
  "2026-01-07-CODEBASE-AUDIT.md",
  "hardened-sqlite.md"
];

console.log("📁 Checking paths for reorganized files:\n");

for (const filename of movedDocs) {
  const query = db.db.query(`
    SELECT id, title, meta 
    FROM nodes 
    WHERE id LIKE ?
  `);
  
  const results = query.all(`%${filename}%`) as any[];
  
  if (results.length > 0) {
    for (const node of results) {
      const meta = JSON.parse(node.meta || "{}");
      const expectedPaths = {
        "MCP_SETUP.md": "docs/setup/",
        "CONFIG_VALIDATION.md": "docs/config/",
        "2026-01-07-CODEBASE-AUDIT.md": "docs/audits/",
        "hardened-sqlite.md": "docs/references/"
      };
      
      const expectedPath = expectedPaths[filename as keyof typeof expectedPaths];
      const actualPath = meta.filePath || "NO PATH";
      const isCorrect = actualPath.includes(expectedPath);
      
      console.log(`${isCorrect ? "✅" : "❌"} ${filename}`);
      console.log(`   ID: ${node.id}`);
      console.log(`   Path: ${actualPath}`);
      console.log(`   Expected: ${expectedPath}`);
      console.log();
    }
  } else {
    console.log(`❌ ${filename} - NOT FOUND IN DATABASE`);
    console.log();
  }
}

// Show summary of all paths by category
console.log("\n📊 Path Distribution Summary:\n");

const pathQuery = db.db.query(`
  SELECT 
    CASE 
      WHEN meta LIKE '%"filePath":"%/setup/%' THEN 'setup'
      WHEN meta LIKE '%"filePath":"%/config/%' THEN 'config'
      WHEN meta LIKE '%"filePath":"%/audits/%' THEN 'audits'
      WHEN meta LIKE '%"filePath":"%/references/%' THEN 'references'
      WHEN meta LIKE '%"filePath":"%/architecture/%' THEN 'architecture'
      WHEN meta LIKE '%"filePath":"%/archive/%' THEN 'archive'
      WHEN meta LIKE '%"filePath":"docs/%' THEN 'docs-root'
      WHEN meta LIKE '%"filePath":"playbooks/%' THEN 'playbooks'
      WHEN meta LIKE '%"filePath":"debriefs/%' THEN 'debriefs'
      ELSE 'other'
    END as category,
    COUNT(*) as count
  FROM nodes
  WHERE meta IS NOT NULL
  GROUP BY category
  ORDER BY count DESC
`);

const distribution = pathQuery.all() as any[];
for (const row of distribution) {
  console.log(`  ${row.category.padEnd(15)} ${row.count} nodes`);
}

console.log(`\n📝 Database: ${dbPath}`);
console.log(`📊 Total nodes: ${db.getStats().nodes}`);
