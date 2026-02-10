import { join } from "node:path";
import { AMALFA_DIRS } from "../../config/defaults";
import { LexiconHarvester } from "../../core/LexiconHarvester";

export async function cmdHarvestLexicon(args: string[]) {
  // Optional argument for output path
  const outputPath =
    args[0] || join(AMALFA_DIRS.base, "lexicon-candidates.jsonl");

  // We assume sidecars are in the cache/lang-extract dir for now,
  // or maybe the root cache if that's where they are.
  // Based on user interaction, they are in .amalfa/cache/lang-extract
  const cacheDir = join(AMALFA_DIRS.cache, "lang-extract");
  const stopListPath = join(process.cwd(), "stop-list.json");

  console.log(`🔧 Configuring Harvester:`);
  console.log(`   Cache: ${cacheDir}`);
  console.log(`   StopList: ${stopListPath}`);
  console.log(`   Output: ${outputPath}\n`);

  const harvester = new LexiconHarvester({
    cacheDir,
    stopListPath,
    outputPath,
  });

  await harvester.harvest();
}
