#!/usr/bin/env bun

/**
 * Baseline Search Benchmark
 * Captures current search behavior BEFORE BGE-M3 reranking integration
 * 
 * This script tests a range of query difficulties:
 * - Easy: Exact matches, acronyms
 * - Medium: Semantic/conceptual queries
 * - Hard: Multi-hop reasoning, abstract concepts
 * - Edge: Niche technical features
 * 
 * Results are saved to .amalfa/cache/baseline-results.json for comparison
 */

import { join } from "node:path";
import { AMALFA_DIRS, loadConfig } from "../../src/config/defaults";
import { VectorEngine } from "../../src/core/VectorEngine";
import { ResonanceDB } from "../../src/resonance/db";
import { getLogger } from "../../src/utils/Logger";

const log = getLogger("Benchmark");

// Test queries organized by difficulty
const TEST_QUERIES = {
	easy: [
		"What is Mentation?",
		"FAFCAS protocol",
	],
	medium: [
		"How does Amalfa store knowledge?",
		"Difference between Sonar and Vector Daemon",
		"What is the opinion/proceed pattern?",
	],
	hard: [
		"Why use BGE embeddings instead of OpenAI?",
		"How can I optimize vector search latency?",
		"What is the relationship between hollow nodes and FAFCAS?",
	],
	edge: [
		"zombie process defense",
		"How do I debug disk I/O errors?",
	],
};

interface BenchmarkResult {
	query: string;
	difficulty: string;
	timestamp: string;
	latency_ms: number;
	results: Array<{
		id: string;
		score: number;
		title?: string;
		rank: number;
	}>;
	metadata: {
		total_candidates: number;
		reranking: "none";
	};
}

async function runBaseline() {
	log.info("🔍 Starting Baseline Search Benchmark");
	
	// Load config and connect to database
	const config = await loadConfig();
	const dbPath = join(process.cwd(), config.database);
	const db = new ResonanceDB(dbPath);
	const vectorEngine = new VectorEngine(db.getRawDb());
	
	const allResults: BenchmarkResult[] = [];
	
	// Test each difficulty level
	for (const [difficulty, queries] of Object.entries(TEST_QUERIES)) {
		log.info({ difficulty, count: queries.length }, `📊 Testing ${difficulty} queries`);
		
		for (const query of queries) {
			log.info({ query }, "Running query...");
			
			const startTime = performance.now();
			const results = await vectorEngine.search(query, 20);
			const endTime = performance.now();
			
			const benchmarkResult: BenchmarkResult = {
				query,
				difficulty,
				timestamp: new Date().toISOString(),
				latency_ms: Math.round(endTime - startTime),
				results: results.map((r: any, idx: number) => ({
					id: r.id,
					score: r.score,
					title: r.title,
					rank: idx + 1,
				})),
				metadata: {
					total_candidates: results.length,
					reranking: "none",
				},
			};
			
			allResults.push(benchmarkResult);
			
			log.info(
				{
					latency: benchmarkResult.latency_ms,
					top_result: results[0]?.title || results[0]?.id,
					top_score: results[0]?.score,
				},
				"✅ Query completed",
			);
		}
	}
	
	// Save results
	const outputPath = join(AMALFA_DIRS.cache, "baseline-results.json");
	await Bun.write(
		outputPath,
		JSON.stringify(
			{
				benchmark_type: "baseline",
				timestamp: new Date().toISOString(),
				total_queries: allResults.length,
				results: allResults,
			},
			null,
			2,
		),
	);
	
	log.info({ output: outputPath }, "💾 Baseline results saved");
	
	// Summary statistics
	const avgLatency =
		allResults.reduce((sum, r) => sum + r.latency_ms, 0) / allResults.length;
	const byDifficulty = Object.keys(TEST_QUERIES).map((diff) => {
		const diffResults = allResults.filter((r) => r.difficulty === diff);
		return {
			difficulty: diff,
			count: diffResults.length,
			avg_latency: Math.round(
				diffResults.reduce((sum, r) => sum + r.latency_ms, 0) /
					diffResults.length,
			),
		};
	});
	
	log.info(
		{
			total_queries: allResults.length,
			avg_latency_ms: Math.round(avgLatency),
			by_difficulty: byDifficulty,
		},
		"📈 Baseline Benchmark Complete",
	);
	
	db.close();
}

runBaseline().catch((err) => {
	log.error({ err }, "❌ Benchmark failed");
	process.exit(1);
});
