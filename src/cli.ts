#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import pkg from "../package.json" with { type: "json" };
import { cmdDoctor } from "./cli/commands/config/doctor";
import { cmdInjectTags } from "./cli/commands/config/inject-tags";
import { cmdScripts } from "./cli/commands/config/list-scripts";
import { cmdListSources } from "./cli/commands/config/list-sources";
import { cmdSetupMcp } from "./cli/commands/config/setup-mcp";
import { cmdSetupPython } from "./cli/commands/config/setup-python";
import { cmdValidate } from "./cli/commands/config/validate";
import { cmdVerify } from "./cli/commands/config/verify";
import { cmdHarvest } from "./cli/commands/ingest/harvest";
import { cmdHarvestLexicon } from "./cli/commands/ingest/harvest-lexicon";
import { cmdSquash } from "./cli/commands/ingest/squash";
import { cmdInit } from "./cli/commands/init";
import { cmdExplore } from "./cli/commands/query/explore";
import { cmdFindGaps } from "./cli/commands/query/find-gaps";
import { cmdRead } from "./cli/commands/query/read";
import { cmdSearch } from "./cli/commands/query/search";
import { cmdDashboard } from "./cli/commands/service/dashboard";
import { cmdEmber } from "./cli/commands/service/ember";
import { cmdEnhance } from "./cli/commands/service/enhance";
import { cmdReranker } from "./cli/commands/service/reranker";
import { cmdServe } from "./cli/commands/service/serve";
import { cmdServers } from "./cli/commands/service/servers";
import { cmdSonar } from "./cli/commands/service/sonar";
import { cmdSsrDocs } from "./cli/commands/service/ssr-docs";
import { cmdStopAll } from "./cli/commands/service/stop-all";
import { cmdVector } from "./cli/commands/service/vector";
import { cmdWatcher } from "./cli/commands/service/watcher";
import { cmdStats } from "./cli/commands/stats";

const VERSION = pkg.version;

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// FIX: If running from system root (common in some MCP clients), try to find project root
if (process.cwd() === "/") {
  // Try to find package.json relative to this script
  // src/cli.ts -> .. -> project root
  const scriptBasedRoot = resolve(import.meta.dir, "..");
  if (existsSync(join(scriptBasedRoot, "package.json"))) {
    try {
      console.error(
        `⚠️  Detected CWD as system root. Switching to: ${scriptBasedRoot}`,
      );
      process.chdir(scriptBasedRoot);
    } catch (e) {
      console.error("Failed to switch CWD:", e);
    }
  }
}

function showHelp() {
  console.log(`
AMALFA v${VERSION} - A Memory Layer For Agents

Usage:
  amalfa <command> [options]

Commands:
  init [--force]     Initialize database from markdown files
  serve              Start MCP server (stdio transport)
  search <query>     Search knowledge graph [--limit N] [--json]
  read <node-id>     Read document content [--json]
  explore <node-id>  Show related documents [--relation type] [--json]
  list-sources       Show configured source directories [--json]
  find-gaps          Discover similar but unlinked documents [--limit N] [--threshold T] [--json]
  inject-tags <path> Add metadata tags to markdown file <tag1> [tag2...] [--json]
  stats              Show database statistics
  validate           Validate database health (pre-publish gate)
  verify             Run end-to-end round-trip verification
  doctor             Check installation and configuration
  setup-mcp          Generate MCP configuration JSON
  setup-python       Initialize Python sidecar environment
  watcher <action>   Manage file watcher (start|stop|status|restart)
  vector <action>    Manage vector daemon (start|stop|status|restart)
  reranker <action>  Manage reranker daemon (start|stop|status|restart)
  sonar <action>     Manage Sonar AI agent (start|stop|status|restart)
  ember <action>     Manage Ember enrichment service (scan|squash)
  squash             Ingest sidecar JSON files into the graph
  scripts list       List available scripts and their descriptions
  servers [--dot]    Show status of all AMALFA services (--dot for graph)
  stop-all (kill)    Stop all running AMALFA services
  ssr-docs <action>  Manage SSR documentation server (start|stop|status|restart)

Options:
  --force            Override pre-flight warnings (errors still block)
  --version, -v      Show version number
  --help, -h         Show this help message

Examples:
  amalfa init        # Initialize with pre-flight validation
  amalfa init --force # Override warnings (use with caution)
  amalfa serve       # Start MCP server for Claude Desktop
  amalfa search "oauth patterns"  # Search knowledge graph
  amalfa read docs/README.md      # Read document content
  amalfa explore docs/README.md   # Show related documents
  amalfa list-sources             # Show source directories
  amalfa stats       # Show knowledge graph statistics
  amalfa doctor      # Verify installation
  amalfa sonar start # Start Sonar AI agent for enhanced search
  amalfa watcher start # Start file watcher for real-time updates

Documentation: https://github.com/pjsvis/amalfa
`);
}

function showVersion() {
  console.log(`amalfa v${VERSION}`);
}

// Main command dispatcher
async function main() {
  switch (command) {
    case "serve":
      await cmdServe(args);
      break;

    case "search":
      await cmdSearch(args.slice(1));
      break;

    case "read":
      await cmdRead(args.slice(1));
      break;

    case "explore":
      await cmdExplore(args.slice(1));
      break;

    case "list-sources":
      await cmdListSources(args.slice(1));
      break;

    case "find-gaps":
      await cmdFindGaps(args.slice(1));
      break;

    case "inject-tags":
      await cmdInjectTags(args.slice(1));
      break;

    case "stats":
      await cmdStats(args);
      break;

    case "doctor":
      await cmdDoctor(args);
      break;

    case "validate":
      await cmdValidate(args);
      break;

    case "verify":
      await cmdVerify(args);
      break;

    case "init":
      await cmdInit(args);
      break;

    case "watcher":
      await cmdWatcher(args);

      break;

    case "vector":
      await cmdVector(args);
      break;

    case "reranker":
      await cmdReranker(args);
      break;

    case "setup-mcp":
      await cmdSetupMcp(args);
      break;

    case "setup-python":
      await cmdSetupPython();
      break;

    case "servers":
      await cmdServers(args);
      break;

    case "stop-all":
    case "kill":
      await cmdStopAll(args);
      break;

    case "sonar":
      await cmdSonar(args);
      break;

    case "ember":
      await cmdEmber(args);
      break;

    case "squash":
      await cmdSquash(args.slice(1));
      break;

    case "harvest":
      await cmdHarvest(args.slice(1));
      break;

    case "harvest-lexicon":
      await cmdHarvestLexicon(args.slice(1));
      break;

    case "dashboard":
      await cmdDashboard(args.slice(1));
      break;

    case "scripts":
      await cmdScripts();
      break;

    case "enhance":
      await cmdEnhance(args);
      break;

    case "ssr-docs":
      await cmdSsrDocs(args);
      break;

    case "version":
    case "--version":
    case "-v":
      showVersion();
      break;

    case "help":
    case "--help":
    case "-h":
    case undefined:
      showHelp();
      break;

    default:
      console.error(`❌ Unknown command: ${command}\n`);
      showHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
