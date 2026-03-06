import { defineCommand } from "citty";
import { doctorCommand } from "./doctor";
import { injectTagsCommand } from "./inject-tags";
import { listScriptsCommand } from "./list-scripts";
import { listSourcesCommand } from "./list-sources";
import { setupMcpCommand } from "./setup-mcp";
import { setupPythonCommand } from "./setup-python";
import { validateCommand } from "./validate";
import { verifyCommand } from "./verify";

export const configCommand = defineCommand({
  meta: {
    name: "config",
    description: "Configuration and diagnostic tools",
  },
  subCommands: {
    doctor: doctorCommand,
    "inject-tags": injectTagsCommand,
    "list-scripts": listScriptsCommand,
    "list-sources": listSourcesCommand,
    "setup-mcp": setupMcpCommand,
    "setup-python": setupPythonCommand,
    validate: validateCommand,
    verify: verifyCommand,
  },
});
