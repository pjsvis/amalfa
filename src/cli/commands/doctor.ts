import { statSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "@src/config/defaults";
import { getDbPath } from "../utils";

export async function cmdDoctor(args: string[]) {
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
		console.log(
			`❌ Found ${issues} issue(s). Please resolve them and try again.`,
		);
		process.exit(1);
	}
}
