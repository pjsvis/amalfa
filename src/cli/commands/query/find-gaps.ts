import { Database } from "bun:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineCommand } from "citty";
import { getDbPath } from "../../utils";

interface GapCandidate {
  source_id: string;
  target_id: string;
  similarity?: number;
  reason?: string;
  suggested_link_type?: string;
}

export const findGapsCommand = defineCommand({
  meta: {
    name: "find-gaps",
    description:
      "Identify potential missing connections in the knowledge graph",
  },
  args: {
    limit: {
      type: "string",
      description: "Max gaps to return",
      default: "10",
      alias: "l",
    },
    threshold: {
      type: "string",
      description: "Similarity threshold (0.0 - 1.0)",
      default: "0.8",
      alias: "t",
    },
  },
  async run({ args }) {
    const dbPath = await getDbPath();
    const db = new Database(dbPath);

    try {
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

      const threshold = Number.parseFloat(args.threshold);
      const limit = Number.parseInt(args.limit, 10);
      const gaps = gapsQuery.all(threshold, limit) as GapCandidate[];

      // Display results
      console.log(`\n🔍 Found ${gaps.length} potential gaps:\n`);

      if (gaps.length === 0) {
        console.log("  No gaps found above threshold.");
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
    } finally {
      db.close();
    }
  },
});

// Legacy export
export async function cmdFindGaps(args: string[]) {
  if (findGapsCommand.run) {
    let limit = "10";
    let threshold = "0.8";

    const limitIdx = args.findIndex((a) => a.startsWith("--limit="));
    if (limitIdx !== -1) limit = args[limitIdx]?.split("=")[1] ?? "10";

    const thresholdIdx = args.findIndex((a) => a.startsWith("--threshold="));
    if (thresholdIdx !== -1)
      threshold = args[thresholdIdx]?.split("=")[1] ?? "0.8";

    return findGapsCommand.run({
      rawArgs: args,
      args: { _: args, limit, l: limit, threshold, t: threshold } as any,
      cmd: findGapsCommand,
      data: {},
    });
  }
}
