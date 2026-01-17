#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import pkg from "../package.json" with { type: "json" };
import { cmdDoctor } from "./cli/commands/doctor";
import { cmdInit } from "./cli/commands/init";
import { cmdRead } from "./cli/commands/read";
import { cmdSearch } from "./cli/commands/search";
import { cmdServe, cmdServers, cmdStopAll } from "./cli/commands/server";
import {
	cmdDaemon,
	cmdEmber,
	cmdReranker,
	cmdSonar,
	cmdVector,
} from "./cli/commands/services";
import { cmdSetupMcp } from "./cli/commands/setup";
import { cmdStats } from "./cli/commands/stats";
import { cmdValidate } from "./cli/commands/validate";

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
  stats              Show database statistics
  validate           Validate database health (pre-publish gate)
  doctor             Check installation and configuration
  setup-mcp          Generate MCP configuration JSON
  daemon <action>    Manage file watcher (start|stop|status|restart)
  vector <action>    Manage vector daemon (start|stop|status|restart)
  reranker <action>  Manage reranker daemon (start|stop|status|restart)
  sonar <action>     Manage Sonar AI agent (start|stop|status|restart)
  ember <action>     Manage Ember enrichment service (scan|squash)
  scripts list       List available scripts and their descriptions
  servers [--dot]    Show status of all AMALFA services (--dot for graph)
  stop-all (kill)    Stop all running AMALFA services

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
  amalfa stats       # Show knowledge graph statistics
  amalfa doctor      # Verify installation
  amalfa sonar start # Start Sonar AI agent for enhanced search

Documentation: https://github.com/pjsvis/amalfa
`);
}

function showVersion() {
	console.log(`amalfa v${VERSION}`);
}

async function cmdScripts() {
	const action = args[1] || "list";

	if (action === "list") {
		// Dynamic import to avoid loading everything at startup
		await import("./cli/list-scripts");
		return;
	}

	console.error(`❌ Invalid action: ${action}`);
	console.error("Usage: amalfa scripts list");
	process.exit(1);
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

	case "stats":
		await cmdStats(args);
		break;

	case "doctor":
		await cmdDoctor(args);
		break;

		case "validate":
			await cmdValidate(args);
			break;

		case "init":
			await cmdInit(args);
			break;

		case "daemon":
			await cmdDaemon(args);
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

		case "scripts":
			await cmdScripts();
			break;

		case "enhance": {
			const { cmdEnhance } = await import("./cli/enhance-commands");
			await cmdEnhance(args);
			break;
		}

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
