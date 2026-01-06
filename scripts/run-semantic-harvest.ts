/**
 * Run the Semantic Harvester pipeline end-to-end.
 *
 * Usage:
 *   bun run scripts/run-semantic-harvest.ts [target_dir]
 *   bun run scripts/run-semantic-harvest.ts briefs/local-first-classifier
 */

import { SemanticHarvester } from "@src/pipeline/SemanticHarvester";
import { getLogger } from "@src/utils/Logger";

const log = getLogger("RunSemanticHarvest");

async function main() {
	const target = process.argv[2];

	log.info("🌾 Semantic Harvester Pipeline");

	const harvester = new SemanticHarvester();

	// Check prerequisites
	const ready = await harvester.isReady();
	if (!ready) {
		log.error("❌ Pipeline not ready. See above for setup instructions.");
		process.exit(1);
	}

	log.info("✅ Prerequisites verified");

	// Run harvest
	log.info({ target: target || "(demo mode)" }, "📄 Harvesting...");
	const graph = await harvester.harvest(target);

	// Show stats
	const stats = harvester.getStats(graph);
	log.info(
		{
			nodes: stats.nodes,
			concepts: stats.concepts,
			documents: stats.documents,
			edges: stats.edges,
		},
		"📊 Harvest Statistics",
	);

	// Load into ResonanceDB
	if (stats.edges > 0) {
		log.info("💾 Loading into ResonanceDB...");
		const loaded = await harvester.loadIntoResonance(graph);
		log.info(
			{
				nodesLoaded: loaded.nodesLoaded,
				edgesLoaded: loaded.edgesLoaded,
			},
			"✅ Loaded into ResonanceDB",
		);
	} else {
		log.warn(
			"⚠️  No edges extracted - skipping database load. Tip: Run with Llama server for better extraction quality",
		);
	}

	// Verify
	log.info("🔍 Verifying database...");
	const { ResonanceDB } = await import("@src/resonance/db");
	const db = ResonanceDB.init();

	const dbStats = db.getStats();

	// Check for semantic edges with confidence < 1.0
	const semanticEdges = db
		.getRawDb()
		.query(`
		SELECT COUNT(*) as count FROM edges 
		WHERE confidence < 1.0 OR context_source IS NOT NULL
	`)
		.get() as { count: number };

	log.info(
		{
			totalNodes: dbStats.nodes,
			totalEdges: dbStats.edges,
			semanticEdges: semanticEdges.count,
		},
		"✅ Pipeline complete",
	);

	db.close();
}

main().catch((err) => {
	log.fatal({ err }, "Pipeline Crash");
});
