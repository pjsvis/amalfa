import { loadSettings } from "@src/config/defaults";
import { SidecarSquasher } from "@src/core/SidecarSquasher";
import { ResonanceDB } from "@src/resonance/db";
import { getLogger } from "@src/utils/Logger";

export async function cmdSquash(args: string[]) {
  // Parse arguments
  let pattern = "**/*.json";
  const patternIdx = args.indexOf("--pattern");
  if (patternIdx !== -1 && args[patternIdx + 1]) {
    // biome-ignore lint/style/noNonNullAssertion: checked existence
    pattern = args[patternIdx + 1]!;
  }
  const log = getLogger("CLI:Squash");

  try {
    log.info({ pattern }, "Initializing squash routine...");
    const config = loadSettings();
    const db = ResonanceDB.init(config.database);

    const squasher = new SidecarSquasher(db);
    const stats = await squasher.squash(pattern);

    console.log("");
    console.log("Squash Complete:");
    console.log(`  Files Processed: ${stats.files}`);
    console.log(`  Nodes Created/Updated: ${stats.nodes}`);
    console.log(`  Edges Created: ${stats.edges}`);
    console.log("");
  } catch (e) {
    log.error({ err: e }, "Squash failed");
    process.exit(1);
  } finally {
    // Clean exit
    process.exit(0);
  }
}
