import { defineCommand } from "citty";
import { exploreCommand } from "./explore";
import { findGapsCommand } from "./find-gaps";
import { readCommand } from "./read";
import { searchCommand } from "./search";

export const queryCommand = defineCommand({
  meta: {
    name: "query",
    description: "Query and explore the knowledge graph",
  },
  subCommands: {
    search: searchCommand,
    read: readCommand,
    explore: exploreCommand,
    "find-gaps": findGapsCommand,
  },
});
