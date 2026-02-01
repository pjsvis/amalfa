#!/usr/bin/env bun

/**
 * scripts/test-reranker.ts
 * Standalone verification of the BGE-M3 integration.
 * Run with: bun run scripts/test-reranker.ts
 */
import { HfBgeReranker } from "../src/services/reranker-hf";

async function main() {
	const query = "What is the primary function of Mentation?";

	const candidates = [
		"Mentation is the internal cognitive processing of stuff into things.", // High Relevance
		"Entropy is the measure of disorder in a system.", // Low Relevance
		"The weather in Scotland is often rainy.", // Noise
		"Mentation requires a Conceptual Lexicon to function effectively.", // Medium/High Relevance
	];

	console.log(`Query: "${query}"`);
	console.log(`Candidates: ${candidates.length}\n`);

	const reranker = await HfBgeReranker.getInstance();

	// Measure latency
	const start = performance.now();
	const results = await reranker.rerank(query, candidates);
	const end = performance.now();

	console.log(`\n--- Results (Inference: ${(end - start).toFixed(2)}ms) ---`);
	for (const [i, r] of results.entries()) {
		console.log(`${i + 1}. [Score: ${r.score.toFixed(4)}] ${r.text}`);
	}
}

main();
