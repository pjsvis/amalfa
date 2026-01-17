#!/usr/bin/env bun
/**
 * Test script for HfBgeReranker (using @huggingface/transformers)
 * Usage: bun run scripts/test-reranker-hf.ts
 */

import { HfBgeReranker } from "@src/services/reranker-hf";

async function testReranker() {
	console.log("🔧 Testing HfBgeReranker (Transformers.js - no sharp!)...\n");

	// Test query about vector databases
	const query = "vector database implementation";
	const docs = [
		"SQLite schema with vector columns and FAFCAS protocol for semantic search",
		"React component styling with CSS modules and Tailwind classes",
		"FastEmbed integration for semantic search with BGE embeddings",
		"Authentication middleware for Express routes using JWT tokens",
		"Database migrations with Drizzle ORM and schema versioning",
	];

	console.log(`Query: "${query}"\n`);
	console.log("Original document order:");
	docs.forEach((doc, i) => {
		console.log(`  ${i + 1}. ${doc}`);
	});
	console.log();

	try {
		// Initialize reranker (loads model)
		console.log("Loading model...");
		const startLoad = Date.now();
		const reranker = await HfBgeReranker.getInstance();
		const loadTime = Date.now() - startLoad;
		console.log(`✅ Model loaded in ${loadTime}ms\n`);

		// Rerank documents
		console.log("Reranking documents...");
		const startRerank = Date.now();
		const results = await reranker.rerank(query, docs);
		const rerankTime = Date.now() - startRerank;
		console.log(`✅ Reranked in ${rerankTime}ms\n`);

		// Display results
		console.log("Reranked results (by relevance):");
		results.forEach((r, i) => {
			const scoreBar = "█".repeat(Math.floor(r.score * 20));
			console.log(
				`  ${i + 1}. [${r.score.toFixed(3)}] ${scoreBar} (was #${r.originalIndex + 1})`,
			);
			console.log(`     ${r.text.slice(0, 80)}...`);
		});
		console.log();

		// Verify sanity
		const topScore = results[0]?.score || 0;
		const bottomScore = results[results.length - 1]?.score || 0;

		console.log("Validation:");
		console.log(`  ✅ Returned ${results.length} results`);
		console.log(
			`  ✅ Scores range: ${bottomScore.toFixed(3)} - ${topScore.toFixed(3)}`,
		);

		if (topScore > bottomScore) {
			console.log("  ✅ Results are properly sorted");
		} else {
			console.log("  ⚠️  Warning: Results may not be properly sorted");
		}

		// Check if relevant docs scored higher
		const vectorDbIndices = [0, 2, 4]; // Docs about databases/tech
		const vectorDbScores = results
			.filter((r) => vectorDbIndices.includes(r.originalIndex))
			.map((r) => r.score);
		const avgVectorDb =
			vectorDbScores.reduce((a, b) => a + b, 0) / vectorDbScores.length;

		const irrelevantIndices = [1, 3]; // React/auth docs
		const irrelevantScores = results
			.filter((r) => irrelevantIndices.includes(r.originalIndex))
			.map((r) => r.score);
		const avgIrrelevant =
			irrelevantScores.reduce((a, b) => a + b, 0) / irrelevantScores.length;

		console.log(
			`  Avg relevant score: ${avgVectorDb.toFixed(3)} | Avg irrelevant: ${avgIrrelevant.toFixed(3)}`,
		);
		if (avgVectorDb > avgIrrelevant) {
			console.log("  ✅ Relevant docs scored higher than irrelevant");
		} else {
			console.log(
				"  ⚠️  Warning: Relevant docs did not score significantly higher",
			);
		}

		console.log("\n✅ HfBgeReranker test PASSED");
		console.log("\n💡 This version uses @huggingface/transformers (no sharp dependency!)");
		process.exit(0);
	} catch (error) {
		console.error("\n❌ HfBgeReranker test FAILED:");
		console.error(error);
		process.exit(1);
	}
}

testReranker();
