import { existsSync } from "node:fs";
import { loadConfig } from "@src/config/defaults";
import { EmberService } from "@src/ember/index";
import { ResonanceDB } from "@src/resonance/db";
import { defineCommand } from "citty";
import { getDbPath } from "../../utils";

export const emberCommand = defineCommand({
  meta: {
    name: "ember",
    description: "Automated Enrichment Service (sidecar management)",
  },
  args: {
    action: {
      type: "positional",
      description: "Action to perform (scan|squash|status)",
      required: true,
    },
    dryRun: {
      type: "boolean",
      description: "Run scan without generating files",
      alias: "d",
    },
  },
  async run({ args }) {
    const { action, dryRun } = args;

    // Check DB
    const dbPath = await getDbPath();
    if (!existsSync(dbPath)) {
      console.error("❌ Database not found. Run 'amalfa init' first.");
      process.exit(1);
    }

    const db = new ResonanceDB(dbPath);
    const appConfig = await loadConfig();

    const emberConfig = {
      enabled: true,
      sources: appConfig.sources || ["./docs"],
      minConfidence: 0.7,
      backupDir: ".amalfa/backups",
      excludePatterns: appConfig.excludePatterns || [],
    };

    const ember = new EmberService(db, emberConfig);

    try {
      if (action === "scan") {
        await ember.runFullSweep(dryRun);
      } else if (action === "squash") {
        await ember.squashAll();
      } else if (action === "status") {
        console.log("Checking pending sidecars... (Not yet implemented)");
      } else {
        console.error(`❌ Unknown action: ${action}`);
        process.exit(1);
      }
    } catch (e) {
      console.error("❌ Ember command failed:", e);
      process.exit(1);
    } finally {
      db.close();
    }
  },
});

// Legacy export
export async function cmdEmber(args: string[]) {
  if (emberCommand.run) {
    return emberCommand.run({
      rawArgs: args,
      args: {
        _: args,
        action: args[1] || "help",
        dryRun: args.includes("--dry-run"),
        d: args.includes("--dry-run"),
      } as any,
      cmd: emberCommand,
      data: {},
    });
  }
}
