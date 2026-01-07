#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const VERSION = "1.0.1";

// Database path loaded from config (lazy loaded per command)
let DB_PATH: string | null = null;

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
	console.log(`
AMALFA v${VERSION} - A Memory Layer For Agents

Usage:
  amalfa <command> [options]

Commands:
  init [--force]     Initialize database from markdown files
  serve              Start MCP server (stdio transport)
  stats              Show database statistics
  doctor             Check installation and configuration
  setup-mcp          Generate MCP configuration JSON
  daemon <action>    Manage file watcher (start|stop|status|restart)

Options:
  --force            Override pre-flight warnings (errors still block)
  --version, -v      Show version number
  --help, -h         Show this help message

Examples:
  amalfa init        # Initialize with pre-flight validation
  amalfa init --force # Override warnings (use with caution)
  amalfa serve       # Start MCP server for Claude Desktop
  amalfa stats       # Show knowledge graph statistics
  amalfa doctor      # Verify installation

Documentation: https://github.com/pjsvis/amalfa
`);
}

function showVersion() {
	console.log(`amalfa v${VERSION}`);
}

async function getDbPath(): Promise<string> {
	if (DB_PATH) return DB_PATH;
	
	// Load from config
	const { loadConfig } = await import("./config/defaults");
	const config = await loadConfig();
	DB_PATH = join(process.cwd(), config.database);
	return DB_PATH;
}

async function checkDatabase(): Promise<boolean> {
	const dbPath = await getDbPath();
	if (!existsSync(dbPath)) {
		console.error(`
❌ Database not found at: ${dbPath}

To initialize AMALFA:
1. Create markdown files in ./docs/ (or your preferred location)
2. Run: amalfa init (coming soon in Phase 5)

For now, you can manually create the .amalfa/ directory and database.
`);
		return false;
	}
	return true;
}

async function cmdServe() {
	// Check database exists
	if (!(await checkDatabase())) {
		process.exit(1);
	}

	const dbPath = await getDbPath();
	console.error("🚀 Starting AMALFA MCP Server...");
	console.error(`📊 Database: ${dbPath}`);
	console.error("");

	// Run MCP server (it handles stdio transport)
	const serverPath = join(import.meta.dir, "mcp/index.ts");
	const proc = spawn("bun", ["run", serverPath, "serve"], {
		stdio: "inherit",
		cwd: process.cwd(),
	});

	proc.on("exit", (code) => {
		process.exit(code ?? 0);
	});
}

async function cmdStats() {
	// Check database exists
	if (!(await checkDatabase())) {
		process.exit(1);
	}

	// Import database wrapper
	const dbPath = await getDbPath();
	const { ResonanceDB } = await import("./resonance/db");
	const db = new ResonanceDB(dbPath);

	try {
		const stats = db.getStats();
		const fileSize = statSync(dbPath).size;
		const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

	console.log(`
📊 AMALFA Database Statistics

Database: ${dbPath}
Size: ${fileSizeMB} MB

Nodes: ${stats.nodes.toLocaleString()}
Edges: ${stats.edges.toLocaleString()}
Embeddings: ${stats.vectors.toLocaleString()} (384-dim)

Source: ./docs (markdown files)
Last modified: ${new Date(statSync(dbPath).mtime).toISOString()}

🔍 To search: Use with Claude Desktop or other MCP client
📝 To update: Run 'amalfa daemon start' (coming soon)
`);
	} catch (error) {
		console.error("❌ Failed to read database statistics:", error);
		process.exit(1);
	} finally {
		db.close();
	}
}

async function cmdInit() {
	console.log("🚀 AMALFA Initialization\n");

	// Check for --force flag
	const forceMode = args.includes("--force");

	// Load configuration
	const { loadConfig } = await import("./config/defaults");
	const config = await loadConfig();

	const sources = config.sources || ["./docs"];
	console.log(`📁 Sources: ${sources.join(", ")}`);
	console.log(`💾 Database: ${config.database}`);
	console.log(`🧠 Model: ${config.embeddings.model}\n`);

	// Run pre-flight analysis
	console.log("🔍 Running pre-flight analysis...\n");
	const { PreFlightAnalyzer } = await import("./pipeline/PreFlightAnalyzer");
	const analyzer = new PreFlightAnalyzer(config);
	const report = await analyzer.analyze();

	// Display summary
	console.log("📊 Pre-Flight Summary:");
	console.log(`  Total files: ${report.totalFiles}`);
	console.log(`  Valid files: ${report.validFiles}`);
	console.log(`  Skipped files: ${report.skippedFiles}`);
	console.log(`  Total size: ${(report.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
	console.log(`  Estimated nodes: ${report.estimatedNodes}\n`);

	if (report.hasErrors) {
		console.error("❌ Pre-flight check failed with errors\n");
		console.error("Errors detected:");
		for (const issue of report.issues.filter((i) => i.severity === "error")) {
			console.error(`  - ${issue.path}: ${issue.details}`);
		}
		console.error("\nSee .amalfa-pre-flight.log for details and recommendations");
		console.error("\nFix these issues and try again.");
		process.exit(1);
	}

	if (report.hasWarnings && !forceMode) {
		console.warn("⚠️  Pre-flight check completed with warnings\n");
		console.warn("Warnings detected:");
		for (const issue of report.issues.filter((i) => i.severity === "warning")) {
			console.warn(`  - ${issue.path}: ${issue.details}`);
		}
		console.warn("\nSee .amalfa-pre-flight.log for recommendations");
		console.warn("\nTo proceed anyway, use: amalfa init --force");
		process.exit(1);
	}

	if (report.validFiles === 0) {
		console.error("\n❌ No valid markdown files found");
		console.error("See .amalfa-pre-flight.log for details");
		process.exit(1);
	}

	if (forceMode && report.hasWarnings) {
		console.warn("⚠️  Proceeding with --force despite warnings\n");
	}

	// Create .amalfa directory
	const amalfaDir = join(process.cwd(), ".amalfa");
	if (!existsSync(amalfaDir)) {
		console.log(`📂 Creating directory: ${amalfaDir}`);
		const { mkdirSync } = await import("node:fs");
		mkdirSync(amalfaDir, { recursive: true });
	}

	// Initialize database
	const dbPath = join(process.cwd(), config.database);
	console.log(`🗄️  Initializing database: ${dbPath}\n`);

	try {
		const { ResonanceDB } = await import("./resonance/db");
		const { AmalfaIngestor } = await import("./pipeline/AmalfaIngestor");

		// Create/open database
		const db = new ResonanceDB(dbPath);

		// Run ingestion
		const ingestor = new AmalfaIngestor(config, db);
		const result = await ingestor.ingest();

		db.close();

		if (result.success) {
			console.log("\n✅ Initialization complete!");
			console.log("\n📊 Summary:");
			console.log(`  Files processed: ${result.stats.files}`);
			console.log(`  Nodes created: ${result.stats.nodes}`);
			console.log(`  Edges created: ${result.stats.edges}`);
			console.log(`  Embeddings: ${result.stats.vectors}`);
			console.log(`  Duration: ${result.stats.durationSec.toFixed(2)}s\n`);
			console.log("Next steps:");
			console.log("  amalfa serve     # Start MCP server");
			console.log("  amalfa daemon    # Watch for file changes (coming soon)");
		} else {
			console.error("\n❌ Initialization failed");
			process.exit(1);
		}
	} catch (error) {
		console.error("\n❌ Initialization failed:", error);
		process.exit(1);
	}
}

async function cmdDaemon() {
	const action = args[1] || "status";
	const validActions = ["start", "stop", "status", "restart"];

	if (!validActions.includes(action)) {
		console.error(`❌ Invalid action: ${action}`);
		console.error("\nUsage: amalfa daemon <start|stop|status|restart>");
		process.exit(1);
	}

	// Run daemon with the specified action
	const daemonPath = join(import.meta.dir, "daemon/index.ts");
	const proc = spawn("bun", ["run", daemonPath, action], {
		stdio: "inherit",
		cwd: process.cwd(),
	});

	proc.on("exit", (code) => {
		process.exit(code ?? 0);
	});
}

async function cmdSetupMcp() {
	const { resolve } = await import("node:path");
	
	const cwd = resolve(process.cwd());
	const mcpScript = resolve(cwd, "src/mcp/index.ts");
	
	// Minimal PATH for MCP - only include essential directories
	const bunPath = process.execPath.replace(/\/bun$/, ''); // Directory containing bun
	const minimalPath = [
		bunPath,
		'/usr/local/bin',
		'/usr/bin',
		'/bin',
		'/usr/sbin',
		'/sbin',
		'/opt/homebrew/bin',  // Apple Silicon Homebrew
	].join(':');
	
	const config = {
		mcpServers: {
			amalfa: {
				command: "bun",
				args: ["run", mcpScript],
				env: {
					PATH: minimalPath,
				},
			},
		},
	};
	
	console.log("\n✅ AMALFA MCP Configuration");
	console.log("=".repeat(60));
	console.log(`📂 Installation: ${cwd}`);
	console.log("=".repeat(60));
	console.log("\n📋 Copy this JSON to your MCP client config:");
	console.log("   Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json");
	console.log("   Warp Preview: MCP settings\n");
	console.log("=".repeat(60));
	console.log();
	
	console.log(JSON.stringify(config, null, 2));
	
	console.log();
	console.log("=".repeat(60));
	console.log("💡 Tip: If you move this folder, run 'amalfa setup-mcp' again");
	console.log("=".repeat(60));
	console.log();
}

async function cmdDoctor() {
	console.log("🩺 AMALFA Health Check\n");

	let issues = 0;

	// Check Bun runtime
	console.log("✓ Bun runtime: OK");

	// Check config and database
	const dbPath = await getDbPath();
	if (existsSync(dbPath)) {
		const fileSizeMB = (statSync(dbPath).size / 1024 / 1024).toFixed(2);
		console.log(`✓ Database found: ${dbPath} (${fileSizeMB} MB)`);
	} else {
		console.log(`✗ Database not found: ${dbPath}`);
		console.log(`  Run: amalfa init`);
		issues++;
	}

	// Check .amalfa directory
	const amalfaDir = join(process.cwd(), ".amalfa");
	if (existsSync(amalfaDir)) {
		console.log(`✓ AMALFA directory: ${amalfaDir}`);
	} else {
		console.log(`✗ AMALFA directory not found: ${amalfaDir}`);
		issues++;
	}

	// Check source directories from config
	const { loadConfig } = await import("./config/defaults");
	const config = await loadConfig();
	const sources = config.sources || ["./docs"];
	let sourcesFound = 0;
	for (const source of sources) {
		const sourcePath = join(process.cwd(), source);
		if (existsSync(sourcePath)) {
			console.log(`✓ Source directory: ${sourcePath}`);
			sourcesFound++;
		} else {
			console.log(`✗ Source directory not found: ${sourcePath}`);
			issues++;
		}
	}
	if (sourcesFound === 0) {
		console.log(`  Configure sources in amalfa.config.json`);
	}

	// Check dependencies (FastEmbed)
	try {
		await import("fastembed");
		console.log("✓ FastEmbed: OK");
	} catch {
		console.log("✗ FastEmbed not found (run: bun install)");
		issues++;
	}

	// Check MCP SDK
	try {
		await import("@modelcontextprotocol/sdk/server/index.js");
		console.log("✓ MCP SDK: OK");
	} catch {
		console.log("✗ MCP SDK not found (run: bun install)");
		issues++;
	}

	console.log("");

	if (issues === 0) {
		console.log("✅ All checks passed! AMALFA is ready to use.");
		console.log("\nNext steps:");
		console.log("  amalfa serve    # Start MCP server");
		console.log("  amalfa stats    # View database statistics");
	} else {
		console.log(`❌ Found ${issues} issue(s). Please resolve them and try again.`);
		process.exit(1);
	}
}

// Main command dispatcher
async function main() {
	switch (command) {
		case "serve":
			await cmdServe();
			break;

		case "stats":
			await cmdStats();
			break;

	case "doctor":
		await cmdDoctor();
		break;

	case "init":
		await cmdInit();
		break;

	case "daemon":
		await cmdDaemon();
		break;

	case "setup-mcp":
		await cmdSetupMcp();
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
