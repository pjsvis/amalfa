import { loadSettings } from "@src/config/defaults";
import { SidecarSquasher } from "@src/core/SidecarSquasher";
import { ResonanceDB } from "@src/resonance/db";
import { getLogger } from "@src/utils/Logger";
import { defineCommand } from "citty";

export const squashCommand = defineCommand({
  meta: {
    name: "squash",
    description: "Ingest sidecar JSON files into the graph",
  },
  args: {
    pattern: {
      type: "string",
      description: "Glob pattern for sidecar files",
      default: "**/*.json",
      alias: "p",
    },
  },
  async run({ args }) {
    const log = getLogger("CLI:Squash");

    try {
      log.info({ pattern: args.pattern }, "Initializing squash routine...");
      const config = loadSettings();
      const db = ResonanceDB.init(config.database);

      const squasher = new SidecarSquasher(db);
      const stats = await squasher.squash(args.pattern);

      console.log("");
      console.log("Squash Complete:");
      console.log(`  Files Processed: ${stats.files}`);
      console.log(`  Nodes Created/Updated: ${stats.nodes}`);
      console.log(`  Edges Created: ${stats.edges}`);
      console.log("");
    } catch (e) {
      log.error({ err: e }, "Squash failed");
      process.exit(1);
    }
  },
});

// Legacy export
export async function cmdSquash(args: string[]) {
  if (squashCommand.run) {
    // Parse pattern from legacy args
    let pattern = "**/*.json";
    const patternIdx = args.indexOf("--pattern");
    if (patternIdx !== -1 && args[patternIdx + 1]) {
      pattern = args[patternIdx + 1] ?? "**/*.json";
    }

    return squashCommand.run({
      rawArgs: args,
      args: { _: args, pattern, p: pattern } as any,
      cmd: squashCommand,
      data: {},
    });
  }
}
