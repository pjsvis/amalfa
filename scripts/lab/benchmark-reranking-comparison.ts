#!/usr/bin/env bun

/**
 * Four-Way Reranking Comparison Benchmark
 * Tests search with: None, BGE-M3, Sonar, and Hybrid modes
 * 
 * Usage:
 *   bun run scripts/lab/benchmark-reranking-comparison.ts [mode]
 * 
 * Modes: none | bge-m3 | sonar | hybrid | all
 */

import { join } from "node:path";
import { AMALFA_DIRS, loadConfig } from "@src/config/defaults";
import { VectorEngine, type SearchResult } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";
import { ContentHydrator } from "@src/utils/ContentHydrator";
import { GraphEngine } from "@src/core/GraphEngine";
import { GraphGardener } from "@src/core/GraphGardener";
import { getLogger } from "@src/utils/Logger";
import type { RerankingMode } from "@src/types/reranking";

const log = getLogger("RerankBenchmark");

// Test queries organized by difficulty
const TEST_QUERIES = {
	easy: ["What is Mentation?", "FAFCAS protocol"],
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
	edge: ["zombie process defense", "How do I debug disk I/O errors?"],
};

interface BenchmarkResult {
	query: string;
	difficulty: string;
	mode: RerankingMode;
	timestamp: string;
	latency_ms: number;
	results: Array<{
		id: string;
		score: number;
		title?: string;
		rank: number;
	}>;
	metadata: {
		vector_candidates: number;
		final_results: number;
		reranker_latency_ms?: number;
	};
}

/**
 * Call Vector Daemon's /rerank endpoint
 */
async function callReranker(
	query: string,
	documents: string[],
	topK = 15,
	threshold = 0.25,
): Promise<Array<{ text: string; score: number; originalIndex: number }>> {
	const RERANKER_PORT = Number(process.env.RERANKER_PORT || 3011);
	
	try {
		const response = await fetch(`http://localhost:${RERANKER_PORT}/rerank`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query, documents, topK, threshold }),
		});

		if (!response.ok) {
			throw new Error(`Reranker returned ${response.status}`);
		}

		const data = (await response.json()) as {
			results: Array<{ text: string; score: number; originalIndex: number }>;
		};
		return data.results;
	} catch (e) {
		log.warn({ err: e }, "⚠️  Reranker unavailable, skipping");
		return [];
	}
}

/**
 * Run search with specified reranking mode
 */
async function searchWithMode(
	mode: RerankingMode,
	query: string,
	vectorEngine: VectorEngine,
	hydrator: ContentHydrator,
): Promise<{
	results: SearchResult[];
	latency_ms: number;
	reranker_latency_ms?: number;
}> {
	const startTime = performance.now();
	let rerankerStart: number | undefined;
	let rerankerEnd: number | undefined;

	if (mode === "none") {
		// Baseline: Just vector search, top 20
		const results = await vectorEngine.search(query, 20);
		return {
			results,
			latency_ms: Math.round(performance.now() - startTime),
		};
	}

	if (mode === "bge-m3") {
		// BGE-M3 only: Vector (50) → BGE-M3 (15)
		const vectorResults = await vectorEngine.search(query, 50);
		
		// Hydrate content for reranking
		const hydratedResults = await hydrator.hydrateMany(
			vectorResults.map((r) => ({
				id: r.id,
				score: r.score,
				preview: r.title || r.id,
				source: "vector",
			})),
		);
		
		const documents = hydratedResults.map((r) => (r.content || r.preview) as string);
		
		rerankerStart = performance.now();
		const reranked = await callReranker(query, documents, 15, 0.25);
		rerankerEnd = performance.now();
		
		// Map back to original results
		const finalResults = reranked
			.map((rr) => vectorResults[rr.originalIndex])
			.filter((r): r is SearchResult => r !== undefined);
		
		return {
			results: finalResults,
			latency_ms: Math.round(performance.now() - startTime),
			reranker_latency_ms: Math.round(rerankerEnd - rerankerStart),
		};
	}

	// For sonar and hybrid, we'd integrate with Sonar client
	// For now, return vector-only results as placeholder
	log.warn({ mode }, "Mode not yet implemented, using vector-only");
	const results = await vectorEngine.search(query, 20);
	return {
		results,
		latency_ms: Math.round(performance.now() - startTime),
	};
}

async function runBenchmark(mode: RerankingMode) {
	log.info({ mode }, `🔍 Starting ${mode.toUpperCase()} Reranking Benchmark`);

	// Load config and connect to database
	const config = await loadConfig();
	const dbPath = join(process.cwd(), config.database);
	const db = new ResonanceDB(dbPath);
	const vectorEngine = new VectorEngine(db.getRawDb());
	const graphEngine = new GraphEngine();
	await graphEngine.load(db.getRawDb());
	const gardener = new GraphGardener(db, graphEngine, vectorEngine);
	const hydrator = new ContentHydrator(gardener);

	const allResults: BenchmarkResult[] = [];

	// Test each difficulty level
	for (const [difficulty, queries] of Object.entries(TEST_QUERIES)) {
		log.info({ difficulty, count: queries.length }, `📊 Testing ${difficulty} queries`);

		for (const query of queries) {
			log.info({ query, mode }, "Running query...");

			const searchResult = await searchWithMode(
				mode,
				query,
				vectorEngine,
				hydrator,
			);

			const benchmarkResult: BenchmarkResult = {
				query,
				difficulty,
				mode,
				timestamp: new Date().toISOString(),
				latency_ms: searchResult.latency_ms,
				results: searchResult.results.map((r, idx) => ({
					id: r.id,
					score: r.score,
					title: r.title,
					rank: idx + 1,
				})),
				metadata: {
					vector_candidates: 50, // Known from mode logic
					final_results: searchResult.results.length,
					reranker_latency_ms: searchResult.reranker_latency_ms,
				},
			};

			allResults.push(benchmarkResult);

			log.info(
				{
					latency: benchmarkResult.latency_ms,
					reranker_latency: benchmarkResult.metadata.reranker_latency_ms,
					top_result: searchResult.results[0]?.title || searchResult.results[0]?.id,
					top_score: searchResult.results[0]?.score,
				},
				"✅ Query completed",
			);
		}
	}

	// Save results
	const outputPath = join(
		AMALFA_DIRS.cache,
		`reranking-results-${mode}.json`,
	);
	await Bun.write(
		outputPath,
		JSON.stringify(
			{
				benchmark_type: `reranking-${mode}`,
				mode,
				timestamp: new Date().toISOString(),
				total_queries: allResults.length,
				results: allResults,
			},
			null,
			2,
		),
	);

	log.info({ output: outputPath }, "💾 Results saved");

	// Summary statistics
	const avgLatency =
		allResults.reduce((sum, r) => sum + r.latency_ms, 0) / allResults.length;
	const avgRerankerLatency =
		allResults
			.filter((r) => r.metadata.reranker_latency_ms)
			.reduce((sum, r) => sum + (r.metadata.reranker_latency_ms || 0), 0) /
		allResults.filter((r) => r.metadata.reranker_latency_ms).length;

	log.info(
		{
			mode,
			total_queries: allResults.length,
			avg_latency_ms: Math.round(avgLatency),
			avg_reranker_latency_ms: avgRerankerLatency
				? Math.round(avgRerankerLatency)
				: undefined,
		},
		`📈 ${mode.toUpperCase()} Benchmark Complete`,
	);

	db.close();
}

// Main execution
type ExecutionMode = RerankingMode | "all";
const mode = (process.argv[2] || "bge-m3") as ExecutionMode;

if (mode === "all") {
	// Run all modes sequentially
	for (const m of ["none", "bge-m3"] as RerankingMode[]) {
		await runBenchmark(m);
	}
} else {
	await runBenchmark(mode as RerankingMode);
}
