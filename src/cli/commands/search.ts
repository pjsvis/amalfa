import { GraphEngine } from "@src/core/GraphEngine";
import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";
import { checkDatabase, getDbPath } from "../utils";

interface SearchResult {
	id: string;
	score: number;
	title: string;
}

export async function cmdSearch(args: string[]) {
	// Parse arguments
	const query = args.find((arg) => !arg.startsWith("--"));
	
	// Handle both --limit=N and --limit N formats
	let limit = 20;
	const limitEqIdx = args.findIndex((arg) => arg.startsWith("--limit="));
	const limitSpaceIdx = args.findIndex((arg) => arg === "--limit");
	
	if (limitEqIdx !== -1) {
		limit = Number.parseInt(args[limitEqIdx]?.split("=")[1] || "20", 10);
	} else if (limitSpaceIdx !== -1 && args[limitSpaceIdx + 1]) {
		limit = Number.parseInt(args[limitSpaceIdx + 1] || "20", 10);
	}
	
	const jsonOutput = args.includes("--json");

	// Validate
	if (!query) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: "Missing query argument",
					usage: "amalfa search <query> [--limit N] [--json]",
				}),
			);
		} else {
			console.error("❌ Error: Missing query argument");
			console.error("\nUsage: amalfa search <query> [--limit N] [--json]");
			console.error("\nExamples:");
			console.error('  amalfa search "oauth patterns"');
			console.error('  amalfa search "database migrations" --limit 5');
			console.error('  amalfa search "auth" --json');
		}
		process.exit(1);
	}

	// Check database
	if (!(await checkDatabase())) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: "Database not found",
					suggestion: "Run 'amalfa init' first",
				}),
			);
		} else {
			console.error("❌ Database not found. Run 'amalfa init' first.");
		}
		process.exit(1);
	}

	// Connect to database
	const dbPath = await getDbPath();
	const db = new ResonanceDB(dbPath);
	const vectorEngine = new VectorEngine(db.getRawDb());

	try {
		// Execute search
		const results = await vectorEngine.search(query, limit);

		// Format output
		if (jsonOutput) {
			// Machine-readable JSON output
			const jsonResults = results.map((r: SearchResult) => ({
				id: r.id,
				score: Number.parseFloat(r.score.toFixed(3)),
				preview: r.title || r.id,
			}));
			console.log(JSON.stringify(jsonResults, null, 2));
		} else {
			// Human-readable output
			if (results.length === 0) {
				console.log(`\n🔍 No results found for "${query}"\n`);
				console.log("Try:");
				console.log("  - Broader search terms");
				console.log("  - Checking if documents are indexed (amalfa stats)");
				console.log("  - Re-ingesting documents (amalfa init)\n");
			} else {
				console.log(`\n🔍 Found ${results.length} result(s) for "${query}":\n`);
				for (let i = 0; i < results.length; i++) {
					const r = results[i] as SearchResult;
					const index = i + 1;
					const score = r.score.toFixed(3);
					const preview = r.title || r.id;

					console.log(`${index}. ${r.id} (score: ${score})`);
					console.log(`   ${preview}\n`);
				}

				console.log(
					`💡 Tip: Use 'amalfa read <id>' to view full content of a result\n`,
				);
			}
		}
	} catch (error) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: error instanceof Error ? error.message : String(error),
				}),
			);
		} else {
			console.error(
				"❌ Search failed:",
				error instanceof Error ? error.message : error,
			);
		}
		process.exit(1);
	} finally {
		db.close();
	}
}
