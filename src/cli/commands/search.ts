import { GraphEngine } from "@src/core/GraphEngine";
import { GraphGardener } from "@src/core/GraphGardener";
import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";
import { ContentHydrator } from "@src/utils/ContentHydrator";
import { rerankDocuments } from "@src/utils/reranker-client";
import { checkDatabase, getDbPath } from "../utils";

interface SearchResult {
	id: string;
	score: number;
	title?: string;
	rerankScore?: number;
}

export async function cmdSearch(args: string[]) {
	// Parse arguments
	const query = args.find((arg) => !arg.startsWith("--"));

	// Handle both --limit=N and --limit N formats
	let limit = 20;
	const limitEqIdx = args.findIndex((arg) => arg.startsWith("--limit="));
	const limitSpaceIdx = args.indexOf("--limit");

	if (limitEqIdx !== -1) {
		limit = Number.parseInt(args[limitEqIdx]?.split("=")[1] || "20", 10);
	} else if (limitSpaceIdx !== -1 && args[limitSpaceIdx + 1]) {
		limit = Number.parseInt(args[limitSpaceIdx + 1] || "20", 10);
	}

	const jsonOutput = args.includes("--json");
	const useReranker = args.includes("--rerank");

	// Validate
	if (!query) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: "Missing query argument",
					usage: "amalfa search <query> [--limit N] [--rerank] [--json]",
				}),
			);
		} else {
			console.error("❌ Error: Missing query argument");
			console.error(
				"\nUsage: amalfa search <query> [--limit N] [--rerank] [--json]",
			);
			console.error("\nExamples:");
			console.error('  amalfa search "oauth patterns"');
			console.error('  amalfa search "database migrations" --limit 5');
			console.error('  amalfa search "context" --rerank');
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
	const graphEngine = new GraphEngine(); // Needed for Gardener
	// Lightweight load for Gardener (it just needs the structure sometimes, but Hydrator uses direct DB usually)
	// Actually Gardener constructor requires GraphEngine.
	await graphEngine.load(db.getRawDb());
	const gardener = new GraphGardener(db, graphEngine, vectorEngine);
	const hydrator = new ContentHydrator(gardener);

	try {
		// Execute search
		// If reranking, fetch more candidates (3x limit) to allow reranker to reorder
		const fetchLimit = useReranker ? Math.min(limit * 3, 50) : limit;
		let results: SearchResult[] = await vectorEngine.search(query, fetchLimit);

		if (useReranker) {
			if (!jsonOutput) console.log("🔄 Reranking results...");

			// Hydrate content
			const hydrated = await hydrator.hydrateMany(
				results.map((r) => ({ ...r, content: "" })),
			);

			// Rerank
			const reranked = await rerankDocuments(
				query,
				hydrated as Array<{ id: string; content: string; score: number }>,
				limit, // Return requested limit
			);

			// Map back to SearchResult
			results = reranked.map((r) => ({
				id: r.id,
				score: r.score,
				title: results.find((res) => res.id === r.id)?.title || r.id,
				rerankScore: r.rerankScore,
			}));
		}

		// Format output
		if (jsonOutput) {
			// Machine-readable JSON output
			const jsonResults = results.map((r) => ({
				id: r.id,
				score: Number.parseFloat(r.score.toFixed(4)),
				preview: r.title || r.id,
				reranked: useReranker,
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
				console.log(
					`\n🔍 Found ${results.length} result(s) for "${query}"${useReranker ? " (Reranked)" : ""}:\n`,
				);
				for (let i = 0; i < results.length; i++) {
					const r = results[i] as SearchResult;
					const index = i + 1;
					const score = r.score.toFixed(useReranker ? 4 : 3);
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
