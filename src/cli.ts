#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import pkg from "../package.json" with { type: "json" };

const VERSION = pkg.version;

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
  validate           Validate database health (pre-publish gate)
  doctor             Check installation and configuration
  setup-mcp          Generate MCP configuration JSON
  daemon <action>    Manage file watcher (start|stop|status|restart)
  vector <action>    Manage vector daemon (start|stop|status|restart)
  servers [--dot]    Show status of all AMALFA services (--dot for graph)

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
2. Run: amalfa init
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
📝 To update: Run 'amalfa daemon start' to watch for file changes
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
			console.error("\nSee .amalfa/logs/pre-flight.log for details and recommendations");
		console.error("\nFix these issues and try again.");
		process.exit(1);
	}

	if (report.hasWarnings && !forceMode) {
		console.warn("⚠️  Pre-flight check completed with warnings\n");
		console.warn("Warnings detected:");
		for (const issue of report.issues.filter((i) => i.severity === "warning")) {
			console.warn(`  - ${issue.path}: ${issue.details}`);
		}
			console.warn("\nSee .amalfa/logs/pre-flight.log for recommendations");
		console.warn("\nTo proceed anyway, use: amalfa init --force");
		process.exit(1);
	}

	if (report.validFiles === 0) {
		console.error("\n❌ No valid markdown files found");
			console.error("See .amalfa/logs/pre-flight.log for details");
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
			// Record database snapshot for tracking
			const { StatsTracker } = await import("./utils/StatsTracker");
			const tracker = new StatsTracker();
			const fileSize = statSync(dbPath).size;
			const dbSizeMB = fileSize / 1024 / 1024;
			
			await tracker.recordSnapshot({
				timestamp: new Date().toISOString(),
				nodes: result.stats.nodes,
				edges: result.stats.edges,
				embeddings: result.stats.vectors,
				dbSizeMB,
				version: VERSION,
			});

			console.log("\n✅ Initialization complete!");
			console.log("\n📊 Summary:");
			console.log(`  Files processed: ${result.stats.files}`);
			console.log(`  Nodes created: ${result.stats.nodes}`);
			console.log(`  Edges created: ${result.stats.edges}`);
			console.log(`  Embeddings: ${result.stats.vectors}`);
			console.log(`  Duration: ${result.stats.durationSec.toFixed(2)}s\n`);
			console.log("📊 Snapshot saved to: .amalfa/stats-history.json\n");
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

async function cmdVector() {
	const action = args[1] || "status";
	const validActions = ["start", "stop", "status", "restart"];

	if (!validActions.includes(action)) {
		console.error(`❌ Invalid action: ${action}`);
		console.error("\nUsage: amalfa vector <start|stop|status|restart>");
		process.exit(1);
	}

	// Run vector daemon with the specified action
	const vectorPath = join(import.meta.dir, "resonance/services/vector-daemon.ts");
	const proc = spawn("bun", ["run", vectorPath, action], {
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

async function cmdServers() {
	const showDot = args.includes("--dot");
	const { AMALFA_DIRS } = await import("./config/defaults");
	
	const SERVICES = [
		{ name: "MCP Server", pidFile: join(AMALFA_DIRS.runtime, "mcp.pid"), port: "stdio", id: "mcp", cmd: "amalfa serve" },
		{ name: "Vector Daemon", pidFile: join(AMALFA_DIRS.runtime, "vector-daemon.pid"), port: "3010", id: "vector", cmd: "amalfa vector start" },
		{ name: "File Watcher", pidFile: join(AMALFA_DIRS.runtime, "daemon.pid"), port: "-", id: "watcher", cmd: "amalfa daemon start" },
	];

	async function isRunning(pid: number): Promise<boolean> {
		try {
			process.kill(pid, 0);
			return true;
		} catch {
			return false;
		}
	}
	
	if (showDot) {
		// Generate DOT diagram
		const statuses = new Map<string, { status: string; pid: string }>();
		
		for (const svc of SERVICES) {
			let status = "stopped";
			let pidStr = "-";
			
			if (existsSync(svc.pidFile)) {
				try {
					const { readFileSync } = await import("node:fs");
					const text = readFileSync(svc.pidFile, "utf-8");
					const pid = Number.parseInt(text.trim(), 10);
					
					if (!Number.isNaN(pid) && await isRunning(pid)) {
						status = "running";
						pidStr = pid.toString();
					} else {
						status = "stale";
						pidStr = `${pid}`;
					}
				} catch {
					// Ignore
				}
			}
			
			statuses.set(svc.id, { status, pid: pidStr });
		}
		
		console.log("digraph AMALFA {");
		console.log("  rankdir=LR;");
		console.log("  node [shape=box, style=filled];");
		console.log("");
		console.log("  // Nodes");
		
		for (const svc of SERVICES) {
			const st = statuses.get(svc.id);
			const color = st?.status === "running" ? "lightgreen" : st?.status === "stale" ? "orange" : "lightgray";
			const label = `${svc.name}\\nPort: ${svc.port}\\nPID: ${st?.pid || "-"}`;
			console.log(`  ${svc.id} [label="${label}", fillcolor=${color}];`);
		}
		
		console.log("");
		console.log("  // Database");
		console.log("  db [label=\"SQLite\\n.amalfa/resonance.db\", shape=cylinder, fillcolor=lightyellow];");
		console.log("");
		console.log("  // Connections");
		console.log("  mcp -> db [label=\"read/write\"];");
		console.log("  vector -> db [label=\"embeddings\"];");
		console.log("  watcher -> db [label=\"updates\"];");
		console.log("  mcp -> vector [label=\"query\", style=dashed];");
		console.log("}");
		console.log("");
		console.log("# Save to file: amalfa servers --dot > amalfa.dot");
		console.log("# Render: dot -Tpng amalfa.dot -o amalfa.png");
		return;
	}

	console.log("\n📡 AMALFA Service Status\n");
	console.log("─".repeat(95));
	console.log(
		"SERVICE".padEnd(18) +
		"COMMAND".padEnd(25) +
		"PORT".padEnd(12) +
		"STATUS".padEnd(15) +
		"PID".padEnd(10)
	);
	console.log("─".repeat(95));

	for (const svc of SERVICES) {
		const { readFileSync } = await import("node:fs");
		let status = "⚪️ STOPPED";
		let pidStr = "-";

		if (existsSync(svc.pidFile)) {
			try {
				const text = readFileSync(svc.pidFile, "utf-8");
				const pid = Number.parseInt(text.trim(), 10);

				if (!Number.isNaN(pid) && await isRunning(pid)) {
					status = "🟢 RUNNING";
					pidStr = pid.toString();
				} else {
					status = "🔴 STALE";
					pidStr = `${pid} (?)`;
				}
			} catch {
				// Ignore read errors
			}
		}

		console.log(
			svc.name.padEnd(18) +
			svc.cmd.padEnd(25) +
			svc.port.padEnd(12) +
			status.padEnd(15) +
			pidStr.padEnd(10)
		);
	}

	console.log("─".repeat(95));
	console.log("\n💡 Commands: amalfa serve | amalfa vector start | amalfa daemon start\n");
}

async function cmdValidate() {
	console.log("🛡️  AMALFA Database Validation\n");

	// Check database exists
	if (!(await checkDatabase())) {
		console.error("\n❌ Validation failed: Database not found");
		process.exit(1);
	}

	const dbPath = await getDbPath();
	const { ResonanceDB } = await import("./resonance/db");
	const { StatsTracker } = await import("./utils/StatsTracker");

	const db = new ResonanceDB(dbPath);
	const tracker = new StatsTracker();

	try {
		// Get current stats
		const stats = db.getStats();
		const fileSize = statSync(dbPath).size;
		const dbSizeMB = fileSize / 1024 / 1024;

		const currentSnapshot = {
			timestamp: new Date().toISOString(),
			nodes: stats.nodes,
			edges: stats.edges,
			embeddings: stats.vectors,
			dbSizeMB,
			version: VERSION,
		};

		// Validate against history
		const validation = tracker.validate(currentSnapshot);

		console.log("📊 Current State:");
		console.log(`  Nodes: ${stats.nodes}`);
		console.log(`  Edges: ${stats.edges}`);
		console.log(`  Embeddings: ${stats.vectors}`);
		console.log(`  Database size: ${dbSizeMB.toFixed(2)} MB\n`);

		if (validation.errors.length > 0) {
			console.error("❌ ERRORS (Must Fix):");
			for (const error of validation.errors) {
				console.error(`  - ${error}`);
			}
			console.error("");
		}

		if (validation.warnings.length > 0) {
			console.warn("⚠️  WARNINGS:");
			for (const warning of validation.warnings) {
				console.warn(`  - ${warning}`);
			}
			console.warn("");
		}

		// Show historical trend
		const snapshots = tracker.getAllSnapshots();
		if (snapshots.length > 1) {
			console.log(tracker.getSummary());
			console.log("");
		}

		if (validation.valid) {
			console.log("✅ Validation passed! Database is healthy.");
			if (validation.warnings.length > 0) {
				console.log("\n💡 Consider addressing warnings before publishing.");
			}
		} else {
			console.error("❌ Validation failed! Database has critical issues.");
			console.error("\nFix errors before publishing:");
			console.error("  - Run: amalfa init");
			db.close();
			process.exit(1);
		}

		db.close();
	} catch (error) {
		db.close();
		console.error("❌ Validation failed:", error);
		process.exit(1);
	}
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

	case "validate":
		await cmdValidate();
		break;

	case "init":
		await cmdInit();
		break;

	case "daemon":
		await cmdDaemon();
		break;

	case "vector":
		await cmdVector();
		break;

	case "setup-mcp":
		await cmdSetupMcp();
		break;

	case "servers":
		await cmdServers();
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
