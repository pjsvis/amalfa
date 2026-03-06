import { defineCommand } from "citty";
import { dashboardCommand } from "./dashboard";
import { emberCommand } from "./ember";
import { enhanceCommand } from "./enhance";
import { rerankerCommand } from "./reranker";
import { serveCommand } from "./serve";
import { serversCommand } from "./servers";
import { sonarCommand } from "./sonar";
import { ssrDocsCommand } from "./ssr-docs";
import { stopAllCommand } from "./stop-all";
import { vectorCommand } from "./vector";
import { watcherCommand } from "./watcher";

export const serviceCommand = defineCommand({
  meta: {
    name: "service",
    description: "Manage AMALFA background services and daemons",
  },
  subCommands: {
    serve: serveCommand,
    servers: serversCommand,
    "stop-all": stopAllCommand,
    watcher: watcherCommand,
    vector: vectorCommand,
    reranker: rerankerCommand,
    sonar: sonarCommand,
    ember: emberCommand,
    "ssr-docs": ssrDocsCommand,
    dashboard: dashboardCommand,
    enhance: enhanceCommand,
  },
});
