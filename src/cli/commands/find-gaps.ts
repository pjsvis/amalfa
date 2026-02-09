/**
 * Find Gaps Tool
 *
 * Identifies potential missing connections in the knowledge graph
 * using similarity thresholds and graph traversal.
 */

import { Database } from "bun:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getDbPath } from "@src/cli/utils";

interface GapCandidate {
  source_id: string;
  target_id: string;
  similarity?: number;
  reason?: string;
  suggested_link_type?: string;
}

async function findGaps(options: { limit?: number; threshold?: number }) {
  const dbPath = await getDbPath();
  const db = new Database(dbPath);

  // Find similar but unlinked nodes
  const gapsQuery = db.prepare(`
    WITH similar_pairs AS (
      SELECT
        n1.id as source_id,
        n2.id as target_id,
        n1.title as source_title,
        n2.title as target_title,
        (
          SELECT COUNT(*) FROM nodes n3
          WHERE n3.domain = n1.domain
          AND (n3.embedding <=> n1.embedding) > ?
        ) as similarity_count
      FROM nodes n1
      JOIN nodes n2 ON n1.id < n2.id
      WHERE n1.domain = n2.domain
      AND n1.id NOT IN (SELECT source FROM edges WHERE target = n2.id)
      AND n2.id NOT IN (SELECT source FROM edges WHERE target = n1.id)
      ORDER BY similarity_count DESC
      LIMIT ?
    )
    SELECT * FROM similar_pairs
  `);

  const threshold = options.threshold ?? 0.8;
  const limit = options.limit ?? 10;
  const gaps = gapsQuery.all(threshold, limit) as GapCandidate[];

  // Display results
  console.log(`\n🔍 Found ${gaps.length} potential gaps:\n`);

  if (gaps.length === 0) {
    console.log("  No gaps found above threshold.");
    db.close();
    return;
  }

  for (let i = 0; i < gaps.length; i++) {
    const gap = gaps[i] as unknown as GapCandidate;
    console.log(`${i + 1}. ${gap.source_id} ↔ ${gap.target_id}`);
    console.log(`   Similarity: ${gap.similarity?.toFixed(3) || "N/A"}`);
    if (gap.reason) {
      console.log(`   Reason: ${gap.reason}`);
    }
    if (gap.suggested_link_type) {
      console.log(`   Suggested: ${gap.suggested_link_type}`);
    }
    console.log();
  }

  // Export to JSON for further analysis
  const exportPath = join(dbPath, "..", "gaps.json");
  const exportDir = join(dbPath, "..");
  mkdirSync(exportDir, { recursive: true });
  writeFileSync(exportPath, JSON.stringify(gaps, null, 2));
  console.log(`📁 Gaps exported to: ${exportPath}`);

  db.close();
}

export async function cmdFindGaps(args: string[]) {
  const options = {
    limit:
      Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1]) ?? 10,
    threshold:
      Number(args.find((a) => a.startsWith("--threshold="))?.split("=")[1]) ??
      0.8,
  };
  await findGaps(options);
}

// Run if executed directly
if (require.main === module) {
  cmdFindGaps(process.argv.slice(2)).catch(console.error);
}
