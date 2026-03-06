import { defineCommand, runMain } from "citty";

// Import command modules
import { labCommand } from "./commands/lab";
import { statsCommand } from "./commands/stats";

const main = defineCommand({
  meta: {
    name: "amalfa",
    version: "1.5.1",
    description:
      "Amalfa CLI - Tools for the Local-first knowledge graph engine",
  },
  subCommands: {
    lab: labCommand,
    stats: statsCommand,
  },
});

runMain(main);
