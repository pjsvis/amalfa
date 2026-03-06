import { statSync } from "node:fs";
import { loadConfig } from "@src/config/defaults";
import { ResonanceDB } from "@src/resonance/db";
import { StatsTracker } from "@src/utils/StatsTracker";
import { defineCommand } from "citty";
import pkg from "../../../../package.json" with { type: "json" };
import { checkDatabase, getDbPath } from "../../utils";

const VERSION = pkg.version;

export const validateCommand = defineCommand({
  meta: {
    name: "validate",
    description: "Validate database health and integrity",
  },
  args: {
    graph: {
      type: "boolean",
      description: "Perform deep graph integrity checks",
      alias: "g",
    },
  },
  async run({ args }) {
    console.log("🛡️  AMALFA Database Validation\n");

    // Check database exists
    if (!(await checkDatabase())) {
      console.error("\n❌ Validation failed: Database not found");
      process.exit(1);
    }

    const dbPath = await getDbPath();
    const db = new ResonanceDB(dbPath);
    const tracker = new StatsTracker();
    const config = await loadConfig();

    try {
      // Get current stats
      const stats = db.getStats();
      const fileSize = statSync(dbPath).size;
      const dbSizeMB = fileSize / 1024 / 1024;

      const currentSnapshot = {
        timestamp: new Date().toISOString(),
        nodes: stats.nodes,
        edges: stats.edges,
        embeddings: stats.vectors,
        dbSizeMB,
        version: VERSION,
      };

      // Validate against history
      const validation = tracker.validate(currentSnapshot);

      if (args.graph) {
        console.log("🔍 Checking Graph Integrity...");

        const dangling = db
          .getRawDb()
          .query(`
          SELECT COUNT(*) as c FROM edges e
          LEFT JOIN nodes s ON e.source = s.id
          LEFT JOIN nodes t ON e.target = t.id
          WHERE s.id IS NULL OR t.id IS NULL
        `)
          .get() as { c: number };

        if (dangling.c > 0) {
          validation.errors.push(
            `Graph integrity compromised: Found ${dangling.c} dangling edges`,
          );
        }

        const selfLoops = db
          .getRawDb()
          .query(`
          SELECT COUNT(*) as c FROM edges WHERE source = target
        `)
          .get() as { c: number };

        if (selfLoops.c > 0) {
          validation.warnings.push(`Graph contains ${selfLoops.c} self-loops`);
        }

        const threshold =
          config.graph?.tuning?.louvain?.superNodeThreshold || 50;
        const superNodes = db
          .getRawDb()
          .query(`
          SELECT id, (SELECT COUNT(*) FROM edges WHERE source = nodes.id OR target = nodes.id) as degree
          FROM nodes
          WHERE degree > ?
          ORDER BY degree DESC
          LIMIT 5
        `)
          .all(threshold) as { id: string; degree: number }[];

        if (superNodes.length > 0) {
          validation.warnings.push(
            `Graph contains Super Nodes (potential hairballs)`,
          );
        }
      }

      console.log("📊 Current State:");
      console.log(`  Nodes: ${stats.nodes}`);
      console.log(`  Edges: ${stats.edges}`);
      console.log(`  Embeddings: ${stats.vectors}`);
      console.log(`  Database size: ${dbSizeMB.toFixed(2)} MB\n`);

      if (validation.errors.length > 0) {
        console.error("❌ ERRORS (Must Fix):");
        for (const error of validation.errors) {
          console.error(`  - ${error}`);
        }
        console.error("");
      }

      if (validation.warnings.length > 0) {
        console.warn("⚠️  WARNINGS:");
        for (const warning of validation.warnings) {
          console.warn(`  - ${warning}`);
        }
        console.warn("");
      }

      // Show historical trend
      const snapshots = tracker.getAllSnapshots();
      if (snapshots.length > 1) {
        console.log(tracker.getSummary());
        console.log("");
      }

      if (validation.valid) {
        console.log("✅ Validation passed! Database is healthy.");
      } else {
        console.error("❌ Validation failed! Database has critical issues.");
        process.exit(1);
      }
    } finally {
      db.close();
    }
  },
});

// Legacy export
export async function cmdValidate(args: string[]) {
  if (validateCommand.run) {
    return validateCommand.run({
      rawArgs: args,
      args: {
        _: args,
        graph: args.includes("--graph"),
        g: args.includes("--graph"),
      } as any,
      cmd: validateCommand,
      data: {},
    });
  }
}
