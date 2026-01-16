#!/usr/bin/env bun

/**
 * Compare Reranking Results
 * Analyzes and compares results from different reranking modes
 */

import { join } from "node:path";
import { AMALFA_DIRS } from "../../src/config/defaults";

interface ComparisonMetrics {
	mode: string;
	avg_latency: number;
	avg_reranker_latency?: number;
	rank_correlation?: number;
	top_5_overlap?: number;
}

async function compareResults() {
	console.log("📊 Reranking Results Comparison\n");
	console.log("=" .repeat(80));

	// Load baseline
	const baselinePath = join(AMALFA_DIRS.cache, "baseline-results.json");
	const baselineData = await Bun.file(baselinePath).json();

	console.log(`\nBaseline (None):`);
	console.log(`  Total queries: ${baselineData.total_queries}`);
	console.log(
		`  Avg latency: ${Math.round(baselineData.results.reduce((s: number, r: any) => s + r.latency_ms, 0) / baselineData.total_queries)}ms`,
	);

	// Try to load BGE-M3 results
	const bgePath = join(AMALFA_DIRS.cache, "reranking-results-bge-m3.json");
	try {
		const bgeData = await Bun.file(bgePath).json();
		console.log(`\nBGE-M3 Reranking:`);
		console.log(`  Total queries: ${bgeData.total_queries}`);
		const avgLatency = Math.round(
			bgeData.results.reduce((s: number, r: any) => s + r.latency_ms, 0) /
				bgeData.total_queries,
		);
		const resultsWithReranker = bgeData.results.filter(
			(r: any) => r.metadata.reranker_latency_ms,
		);
		const avgRerankerLatency =
			resultsWithReranker.length > 0
				? Math.round(
						resultsWithReranker.reduce(
							(s: number, r: any) => s + r.metadata.reranker_latency_ms,
							0,
						) / resultsWithReranker.length,
					)
				: 0;

		console.log(`  Avg total latency: ${avgLatency}ms`);
		console.log(`  Avg reranker latency: ${avgRerankerLatency}ms`);

		// Compare top results
		console.log(`\n${"Query".padEnd(50)} | Baseline Top | BGE-M3 Top`);
		console.log("-".repeat(100));

		for (let i = 0; i < baselineData.results.length; i++) {
			const baseline = baselineData.results[i];
			const bge = bgeData.results[i];

			const baselineTop = baseline.results[0]?.title || baseline.results[0]?.id;
			const bgeTop = bge.results[0]?.title || bge.results[0]?.id;

			const match = baselineTop === bgeTop ? "✓" : "✗";
			console.log(
				`${baseline.query.slice(0, 48).padEnd(50)} | ${baselineTop?.slice(0, 20).padEnd(20)} | ${bgeTop?.slice(0, 20).padEnd(20)} ${match}`,
			);
		}
	} catch (e) {
		console.log(`\n⚠️  BGE-M3 results not found. Run: bun run scripts/lab/benchmark-reranking-comparison.ts bge-m3`);
	}

	console.log("\n" + "=".repeat(80));
}

compareResults().catch(console.error);
