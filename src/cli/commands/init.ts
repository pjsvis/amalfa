import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "@src/config/defaults";
import { AmalfaIngestor } from "@src/pipeline/AmalfaIngestor";
import { PreFlightAnalyzer } from "@src/pipeline/PreFlightAnalyzer";
import { ResonanceDB } from "@src/resonance/db";
import { StatsTracker } from "@src/utils/StatsTracker";
import pkg from "../../../package.json" with { type: "json" };

const VERSION = pkg.version;

export async function cmdInit(args: string[]) {
	console.log("🚀 AMALFA Initialization\n");

	// Check for --force flag
	const forceMode = args.includes("--force");

	// Load configuration
	const config = await loadConfig();

	const sources = config.sources || ["./docs"];
	console.log(`📁 Sources: ${sources.join(", ")}`);
	console.log(`💾 Database: ${config.database}`);
	console.log(`🧠 Model: ${config.embeddings.model}\n`);

	// Run pre-flight analysis
	console.log("🔍 Running pre-flight analysis...\n");
	const analyzer = new PreFlightAnalyzer(config);
	const report = await analyzer.analyze();

	// Display summary
	console.log("📊 Pre-Flight Summary:");
	console.log(`  Total files: ${report.totalFiles}`);
	console.log(`  Valid files: ${report.validFiles}`);
	console.log(`  Skipped files: ${report.skippedFiles}`);
	console.log(
		`  Total size: ${(report.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`,
	);
	console.log(`  Estimated nodes: ${report.estimatedNodes}\n`);

	if (report.hasErrors) {
		console.error("❌ Pre-flight check failed with errors\n");
		console.error("Errors detected:");
		for (const issue of report.issues.filter((i) => i.severity === "error")) {
			console.error(`  - ${issue.path}: ${issue.details}`);
		}
		console.error(
			"\nSee .amalfa/logs/pre-flight.log for details and recommendations",
		);
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
		mkdirSync(amalfaDir, { recursive: true });
	}

	// Initialize database
	const dbPath = join(process.cwd(), config.database);
	console.log(`🗄️  Initializing database: ${dbPath}\n`);

	try {
		// Create/open database
		const db = new ResonanceDB(dbPath);

		// Run ingestion
		const ingestor = new AmalfaIngestor(config, db);
		const result = await ingestor.ingest();

		db.close();

		if (result.success) {
			// Record database snapshot for tracking
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
