import { defineCommand } from "citty";
import { harvestCommand } from "./harvest";
import { harvestLexiconCommand } from "./harvest-lexicon";
import { squashCommand } from "./squash";

export const ingestCommand = defineCommand({
  meta: {
    name: "ingest",
    description: "Ingestion workflows: harvest, squash, and compile",
  },
  subCommands: {
    harvest: harvestCommand,
    "harvest-lexicon": harvestLexiconCommand,
    squash: squashCommand,
  },
});
