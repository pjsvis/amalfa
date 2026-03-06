import { join } from "node:path";
import { AMALFA_DIRS } from "@src/config/defaults";
import { LexiconHarvester } from "@src/core/LexiconHarvester";
import { defineCommand } from "citty";

export const harvestLexiconCommand = defineCommand({
  meta: {
    name: "harvest-lexicon",
    description: "Harvest lexicon candidates from LangExtract cache",
  },
  args: {
    output: {
      type: "positional",
      description: "Output path for lexicon candidates",
      required: false,
    },
  },
  async run({ args }) {
    const outputPath =
      args.output || join(AMALFA_DIRS.base, "lexicon-candidates.jsonl");

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
  },
});

// Legacy export
export async function cmdHarvestLexicon(args: string[]) {
  if (harvestLexiconCommand.run) {
    return harvestLexiconCommand.run({
      rawArgs: args,
      args: { _: args, output: args[0] } as any,
      cmd: harvestLexiconCommand,
      data: {},
    });
  }
}
