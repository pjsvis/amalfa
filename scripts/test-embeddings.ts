#!/usr/bin/env bun
/**
 * scripts/test-embeddings.ts
 *
 * Test the effectiveness of vector embeddings in the resonance database
 * Runs semantic search queries and analyzes result quality
 */

import { Database } from "bun:sqlite";
import { Embedder } from "@src/resonance/services/embedder";

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < a.length; i++) {
		const aVal = a[i];
		const bVal = b[i];
		if (aVal === undefined || bVal === undefined) continue;
		dotProduct += aVal * bVal;
		normA += aVal * aVal;
		normB += bVal * bVal;
	}

	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Convert blob to Float32Array
function blobToFloats(blob: Buffer): Float32Array {
	return new Float32Array(blob.buffer, blob.byteOffset, blob.byteLength / 4);
}

interface SearchResult {
	id: string;
	type: string;
	title: string | null;
	similarity: number;
}

async function testEmbeddingEffectiveness() {
	console.log("\n🔍 Testing Vector Embedding Effectiveness\n");

	// Load database path from config
	const { loadConfig } = await import("@src/config/defaults");
	const config = await loadConfig();
	const dbPath = Bun.resolveSync(config.database, process.cwd());

	console.log(`Database: ${dbPath}`);
	console.log("Model: BGE Small EN v1.5 (384 dimensions)\n");

	const db = new Database(dbPath, { readonly: true });
	const embedder = Embedder.getInstance();

	// Test queries covering different domains
	const testQueries = [
		"CSS styling and design patterns",
		"database schema migrations",
		"graph algorithms and metrics",
		"debugging and error handling",
		"build system and tooling",
	];

	console.log("Running", testQueries.length, "semantic search queries...\n");

	const allResults: Array<{
		query: string;
		results: SearchResult[];
		stats: {
			best: number;
			avg: number;
			worst: number;
			spread: number;
		};
	}> = [];

	for (const query of testQueries) {
		console.log("━".repeat(80));
		console.log("Query:", query);
		console.log("━".repeat(80));

		// Generate query embedding
		const queryEmbedding = await embedder.embed(query);

		// Get all nodes with embeddings
		const nodes = db
			.query(
				"SELECT id, type, title, embedding FROM nodes WHERE embedding IS NOT NULL",
			)
			.all() as Array<{
			id: string;
			type: string;
			title: string | null;
			embedding: Buffer;
		}>;

		// Calculate similarities
		const results: SearchResult[] = nodes.map((node) => ({
			id: node.id,
			type: node.type,
			title: node.title,
			similarity: cosineSimilarity(
				queryEmbedding,
				blobToFloats(node.embedding),
			),
		}));

		// Sort by similarity (best first)
		results.sort((a, b) => b.similarity - a.similarity);

		// Show top 5
		console.log("\nTop 5 matches:\n");
		for (let i = 0; i < Math.min(5, results.length); i++) {
			const r = results[i];
			if (!r) continue;
			const score = (r.similarity * 100).toFixed(1);
			const title = r.title || r.id;
			const truncated =
				title.length > 60 ? `${title.substring(0, 57)}...` : title;
			console.log(`  ${i + 1}. [${score}%] ${truncated}`);
			console.log(`     Type: ${r.type}, ID: ${r.id}`);
		}

		// Calculate statistics
		const avgSim =
			results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
		const firstResult = results[0];
		const lastResult = results[results.length - 1];
		if (!firstResult || !lastResult) throw new Error("No results");
		const maxSim = firstResult.similarity;
		const minSim = lastResult.similarity;
		const spread = maxSim - minSim;

		console.log("\n  Distribution:");
		console.log(`    Best:    ${(maxSim * 100).toFixed(1)}%`);
		console.log(`    Average: ${(avgSim * 100).toFixed(1)}%`);
		console.log(`    Worst:   ${(minSim * 100).toFixed(1)}%`);
		console.log(`    Spread:  ${(spread * 100).toFixed(1)}%`);
		console.log();

		allResults.push({
			query,
			results: results.slice(0, 5),
			stats: {
				best: maxSim,
				avg: avgSim,
				worst: minSim,
				spread,
			},
		});
	}

	// Overall analysis
	console.log("━".repeat(80));
	console.log("📊 Overall Effectiveness Analysis");
	console.log("━".repeat(80));
	console.log();

	const avgBest =
		allResults.reduce((sum, r) => sum + r.stats.best, 0) / allResults.length;
	const avgAvg =
		allResults.reduce((sum, r) => sum + r.stats.avg, 0) / allResults.length;
	const avgSpread =
		allResults.reduce((sum, r) => sum + r.stats.spread, 0) / allResults.length;

	console.log("Across all queries:");
	console.log(`  Average best match:     ${(avgBest * 100).toFixed(1)}%`);
	console.log(`  Average corpus score:   ${(avgAvg * 100).toFixed(1)}%`);
	console.log(`  Average spread:         ${(avgSpread * 100).toFixed(1)}%`);
	console.log();

	// Effectiveness assessment
	console.log("Assessment:");
	if (avgBest > 0.7) {
		console.log("  ✅ Excellent: Best matches are highly relevant (>70%)");
	} else if (avgBest > 0.5) {
		console.log("  ⚠️  Good: Best matches are somewhat relevant (50-70%)");
	} else {
		console.log("  ❌ Poor: Best matches have low relevance (<50%)");
	}

	if (avgSpread > 0.3) {
		console.log(
			"  ✅ Excellent: Strong differentiation between results (>30% spread)",
		);
	} else if (avgSpread > 0.15) {
		console.log("  ⚠️  Good: Moderate differentiation (15-30% spread)");
	} else {
		console.log("  ❌ Poor: Weak differentiation (<15% spread)");
	}

	if (avgAvg < 0.4) {
		console.log("  ✅ Good: Low baseline similarity (less noise)");
	} else if (avgAvg < 0.6) {
		console.log("  ⚠️  Fair: Moderate baseline similarity");
	} else {
		console.log("  ❌ Poor: High baseline similarity (too much noise)");
	}

	console.log();

	// Interpretation
	console.log("Interpretation:");
	console.log(
		"  • High best match % = Embeddings capture semantic meaning well",
	);
	console.log(
		"  • Large spread % = Clear distinction between relevant/irrelevant",
	);
	console.log(
		"  • Low average % = Corpus is diverse (not everything matches everything)",
	);
	console.log();

	db.close();
	console.log("✅ Effectiveness test complete\n");
}

// Run
await testEmbeddingEffectiveness();
