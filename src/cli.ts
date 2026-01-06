#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const VERSION = "1.0.0";
const DB_PATH = join(process.cwd(), ".amalfa/resonance.db");

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
	console.log(`
AMALFA v${VERSION} - A Memory Layer For Agents

Usage:
  amalfa <command> [options]

Commands:
  init               Initialize database from markdown files
  serve              Start MCP server (stdio transport)
  stats              Show database statistics
  doctor             Check installation and configuration
  daemon <action>    Manage file watcher (start|stop|status|restart)

Examples:
  amalfa init        # Initialize from ./docs markdown files
  amalfa serve       # Start MCP server for Claude Desktop
  amalfa stats       # Show knowledge graph statistics
  amalfa doctor      # Verify installation

Documentation: https://github.com/pjsvis/amalfa
`);
}

function showVersion() {
	console.log(`amalfa v${VERSION}`);
}

async function checkDatabase(): Promise<boolean> {
	if (!existsSync(DB_PATH)) {
		console.error(`
❌ Database not found at: ${DB_PATH}

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

	console.error("🚀 Starting AMALFA MCP Server...");
	console.error(`📊 Database: ${DB_PATH}`);
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
	const { ResonanceDB } = await import("./resonance/db");
	const db = new ResonanceDB(DB_PATH);

	try {
		const stats = db.getStats();
		const fileSize = statSync(DB_PATH).size;
		const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

		console.log(`
📊 AMALFA Database Statistics

Database: ${DB_PATH}
Size: ${fileSizeMB} MB

Nodes: ${stats.nodes.toLocaleString()}
Edges: ${stats.edges.toLocaleString()}
Embeddings: ${stats.vectors.toLocaleString()} (384-dim)

Source: ./docs (markdown files)
Last modified: ${new Date(statSync(DB_PATH).mtime).toISOString()}

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

	// Load configuration
	const { loadConfig } = await import("./config/defaults");
	const config = await loadConfig();

	const sources = config.sources || ["./docs"];
	console.log(`📁 Sources: ${sources.join(", ")}`);
	console.log(`💾 Database: ${config.database}`);
	console.log(`🧠 Model: ${config.embeddings.model}\n`);

	// Check if source directories exist
	let hasValidSource = false;
	for (const source of sources) {
		const sourcePath = join(process.cwd(), source);
		if (existsSync(sourcePath)) {
			hasValidSource = true;
		} else {
			console.warn(`Warning: Source directory not found: ${sourcePath}`);
		}
	}

	if (!hasValidSource) {
		console.error("\n❌ No valid source directories found");
		console.error("\nCreate at least one:");
		console.error(`  mkdir -p ${sources[0]}`);
		console.error("  # Add some markdown files");
		process.exit(1);
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

async function cmdDoctor() {
	console.log("🩺 AMALFA Health Check\n");

	let issues = 0;

	// Check Bun runtime
	console.log("✓ Bun runtime: OK");

	// Check database
	if (existsSync(DB_PATH)) {
		const fileSizeMB = (statSync(DB_PATH).size / 1024 / 1024).toFixed(2);
		console.log(`✓ Database found: ${DB_PATH} (${fileSizeMB} MB)`);
	} else {
		console.log(`✗ Database not found: ${DB_PATH}`);
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

	// Check source directories
	const docsDir = join(process.cwd(), "docs");
	if (existsSync(docsDir)) {
		console.log(`✓ Source directory: ${docsDir}`);
	} else {
		console.log(`⚠ Source directory not found: ${docsDir} (optional)`);
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
