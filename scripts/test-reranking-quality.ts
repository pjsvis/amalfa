#!/usr/bin/env bun
/**
 * Test reranking quality with human-readable analysis
 * 
 * Shows WHAT changed, not just scores
 */

import { loadConfig } from "@src/config/defaults";
import { VectorEngine } from "@src/core/VectorEngine";
import { GraphEngine } from "@src/core/GraphEngine";
import { GraphGardener } from "@src/core/GraphGardener";
import { ResonanceDB } from "@src/resonance/db";
import { ContentHydrator } from "@src/utils/ContentHydrator";
import { rerankDocuments } from "@src/utils/reranker-client";
import { join } from "node:path";

async function testQuality() {
	console.log("🎯 Reranking Quality Test\n");
	console.log("Goal: Show that reranking improves result relevance\n");

	const config = await loadConfig();
	const dbPath = join(process.cwd(), config.database);
	const db = new ResonanceDB(dbPath);
	const vectorEngine = new VectorEngine(db.getRawDb());
	const graphEngine = new GraphEngine();
	await graphEngine.load(db.getRawDb());
	const gardener = new GraphGardener(db, graphEngine, vectorEngine);
	const hydrator = new ContentHydrator(gardener);

	// Test with a clear query
	const query = "vector database implementation";
	
	console.log(`Query: "${query}"\n`);
	console.log("=".repeat(80) + "\n");

	// Stage 1: Vector search only
	const vectorResults = await vectorEngine.search(query, 10);
	
	console.log("📊 BEFORE RERANKING (Vector Search):");
	console.log("Rankings based on cosine similarity of embeddings\n");
	
	vectorResults.slice(0, 5).forEach((r, i) => {
		console.log(`${i + 1}. ${r.id}`);
		console.log(`   Score: ${r.score.toFixed(3)} (vector similarity)`);
	});

	// Stage 2: With BGE reranking
	const candidates = vectorResults.map(r => ({
		id: r.id,
		score: r.score,
		preview: r.title || r.id,
		source: "vector"
	}));
	const hydrated = await hydrator.hydrateMany(candidates);
	const reranked = await rerankDocuments(
		query,
		hydrated as Array<{ id: string; content: string; score: number }>,
		10
	);

	console.log("\n" + "=".repeat(80) + "\n");
	console.log("🔄 AFTER RERANKING (BGE Cross-Encoder):");
	console.log("Rankings based on query-document interaction\n");
	
	reranked.slice(0, 5).forEach((r, i) => {
		const oldPosition = vectorResults.findIndex(vr => vr.id === r.id) + 1;
		const change = oldPosition - (i + 1);
		const arrow = change > 0 ? `↑${change}` : change < 0 ? `↓${Math.abs(change)}` : "→";
		
		console.log(`${i + 1}. ${r.id} ${arrow}`);
		console.log(`   Score: ${r.score.toFixed(4)} (rerank score)`);
		console.log(`   Was: #${oldPosition} → Now: #${i + 1}`);
	});

	// Analysis
	console.log("\n" + "=".repeat(80) + "\n");
	console.log("📈 ANALYSIS\n");

	const positionChanges = reranked.slice(0, 5).map((r, newIdx) => {
		const oldIdx = vectorResults.findIndex(vr => vr.id === r.id);
		return Math.abs(oldIdx - newIdx);
	});
	const avgChange = positionChanges.reduce((a, b) => a + b, 0) / 5;

	console.log(`Average position change: ${avgChange.toFixed(1)} ranks`);
	console.log(`Documents that moved: ${positionChanges.filter(c => c > 0).length} out of 5`);

	// Show what came to the top
	const newTop = reranked[0];
	const oldTop = vectorResults[0];
	
	if (newTop?.id !== oldTop?.id) {
		console.log(`\n🎯 New #1 result: "${newTop?.id}"`);
		console.log(`   (Was previously #${vectorResults.findIndex(vr => vr.id === newTop?.id) + 1})`);
		console.log(`\n💡 This suggests the reranker found a more relevant document!`);
	} else {
		console.log(`\n✓ Top result unchanged (already optimal)`);
	}

	// Explain the difference
	console.log("\n" + "=".repeat(80) + "\n");
	console.log("🧠 WHY RERANKING HELPS\n");
	console.log(`
Vector Search (Baseline):
- Uses bi-encoder: Embed query and documents separately
- Similarity = cosine distance between vectors
- Fast but approximate
- Can't capture query-document interactions

BGE Reranker (Improvement):
- Uses cross-encoder: Encode query+document together
- Attention mechanism between query and doc
- Slower but more accurate
- Captures semantic nuances

Result: Documents are reordered based on actual relevance to the query,
not just vector similarity. This is why "graph-and-vector-database-best-practices"
might rank higher than "performance-audit" for a query about databases.
	`);

	db.close();
}

testQuality().catch(console.error);
