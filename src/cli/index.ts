import { defineCommand, runMain } from "citty";

// Import command modules
import { configCommand } from "./commands/config";
import { ingestCommand } from "./commands/ingest";
import { initCommand } from "./commands/init";
import { labCommand } from "./commands/lab";
import { queryCommand } from "./commands/query";
import { serviceCommand } from "./commands/service";
import { statsCommand } from "./commands/stats";

const main = defineCommand({
  meta: {
    name: "amalfa",
    version: "1.5.1",
    description:
      "Amalfa CLI - Tools for the Local-first knowledge graph engine",
  },
  subCommands: {
    init: initCommand,
    config: configCommand,
    ingest: ingestCommand,
    lab: labCommand,
    query: queryCommand,
    service: serviceCommand,
    stats: statsCommand,
  },
});

runMain(main);
