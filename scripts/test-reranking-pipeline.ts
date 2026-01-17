#!/usr/bin/env bun
/**
 * Test script to compare reranking stages
 * 
 * Compares 3 pipelines:
 * 1. Vector search only (baseline)
 * 2. Vector + BGE reranker
 * 3. Vector + BGE + Sonar LLM
 * 
 * Measures: quality (subjective), latency, score changes
 */

import { loadConfig } from "@src/config/defaults";
import { VectorEngine } from "@src/core/VectorEngine";
import { GraphEngine } from "@src/core/GraphEngine";
import { GraphGardener } from "@src/core/GraphGardener";
import { ResonanceDB } from "@src/resonance/db";
import { ContentHydrator } from "@src/utils/ContentHydrator";
import { rerankDocuments } from "@src/utils/reranker-client";
import { createSonarClient } from "@src/utils/sonar-client";
import { join } from "node:path";

async function testPipeline() {
	console.log("🧪 Testing Reranking Pipeline\n");

	// Load config and connect to database
	const config = await loadConfig();
	const dbPath = join(process.cwd(), config.database);
	const db = new ResonanceDB(dbPath);
	const vectorEngine = new VectorEngine(db.getRawDb());
	const graphEngine = new GraphEngine();
	await graphEngine.load(db.getRawDb());
	const gardener = new GraphGardener(db, graphEngine, vectorEngine);
	const hydrator = new ContentHydrator(gardener);
	const sonarClient = await createSonarClient();

	// Test queries
	const queries = [
		"How do I implement authentication?",
		"vector database implementation",
		"What did we learn about graph traversal?",
	];

	for (const query of queries) {
		console.log(`\n${"=".repeat(80)}`);
		console.log(`Query: "${query}"`);
		console.log("=".repeat(80));

		try {
			// Stage 1: Vector search only (baseline)
			console.log("\n📊 Stage 1: Vector Search (Baseline)");
			const t1Start = Date.now();
			const vectorResults = await vectorEngine.search(query, 10);
			const t1Time = Date.now() - t1Start;

			console.log(`⏱️  Time: ${t1Time}ms`);
			console.log("\nTop 5 results:");
			vectorResults.slice(0, 5).forEach((r, i) => {
				console.log(`  ${i + 1}. [${r.score.toFixed(3)}] ${r.id}`);
			});

			// Stage 2: Vector + BGE Reranker
			console.log("\n🔄 Stage 2: Vector + BGE Reranker");
			const t2Start = Date.now();

			// Hydrate content for reranking
			const candidates = vectorResults.map(r => ({
				id: r.id,
				score: r.score,
				preview: r.title || r.id,
				source: "vector"
			}));
			const hydrated = await hydrator.hydrateMany(candidates);

			// Apply BGE reranking
			const bgeReranked = await rerankDocuments(
				query,
				hydrated as Array<{ id: string; content: string; score: number }>,
				10
			);
			const t2Time = Date.now() - t2Start;

			console.log(`⏱️  Time: ${t2Time}ms (hydration + reranking)`);
			console.log("\nTop 5 results:");
			bgeReranked.slice(0, 5).forEach((r, i) => {
				console.log(`  ${i + 1}. [${r.score.toFixed(3)}] ${r.id}`);
			});

			// Calculate position changes
			const positionChanges = bgeReranked.slice(0, 5).map((r, newIdx) => {
				const oldIdx = vectorResults.findIndex(vr => vr.id === r.id);
				return { id: r.id, moved: oldIdx - newIdx };
			});
			const avgMove = positionChanges.reduce((sum, p) => sum + Math.abs(p.moved), 0) / 5;
			console.log(`\n📈 Avg position change: ${avgMove.toFixed(1)} ranks`);

			// Stage 3: Vector + BGE + Sonar LLM
			const sonarAvailable = await sonarClient.isAvailable();
			if (sonarAvailable) {
				console.log("\n🧠 Stage 3: Vector + BGE + Sonar LLM");
				const t3Start = Date.now();

				// Query analysis
				const analysis = await sonarClient.analyzeQuery(query);
				const intent = analysis?.intent;

				// Sonar reranking
				const sonarReranked = await sonarClient.rerankResults(
					bgeReranked as Array<{ id: string; content: string; score: number }>,
					query,
					intent
				);
				const t3Time = Date.now() - t3Start;

				console.log(`⏱️  Time: ${t3Time}ms (analysis + LLM reranking)`);
				console.log("\nTop 5 results:");
				sonarReranked.slice(0, 5).forEach((r, i) => {
					console.log(`  ${i + 1}. [${r.relevance_score.toFixed(3)}] ${r.id}`);
				});

				// Calculate position changes from BGE
				const sonarChanges = sonarReranked.slice(0, 5).map((r, newIdx) => {
					const oldIdx = bgeReranked.findIndex(br => br.id === r.id);
					return { id: r.id, moved: oldIdx - newIdx };
				});
				const avgSonarMove = sonarChanges.reduce((sum, p) => sum + Math.abs(p.moved), 0) / 5;
				console.log(`\n📈 Avg position change from BGE: ${avgSonarMove.toFixed(1)} ranks`);
			} else {
				console.log("\n⚠️  Stage 3: Sonar not available (start with: amalfa sonar start)");
			}

			// Summary
			console.log("\n📋 Summary:");
			console.log(`  Vector only:     ${t1Time}ms`);
			console.log(`  + BGE reranker:  ${t2Time}ms`);
			if (sonarAvailable) {
				console.log(`  + Sonar LLM:     estimated additional time`);
			}
			console.log(`  Total pipeline:  ~${t1Time + t2Time}ms${sonarAvailable ? " + Sonar" : ""}`);

		} catch (error) {
			console.error("❌ Test failed:", error);
		}
	}

	db.close();

	console.log("\n\n" + "=".repeat(80));
	console.log("🎯 Recommendations");
	console.log("=".repeat(80));
	console.log(`
Based on the results above:

1. **Vector search only** (baseline)
   - Fastest but potentially lower precision
   - Use when: Speed is critical, queries are simple

2. **Vector + BGE reranker** (recommended)
   - ~50ms overhead, significant quality improvement
   - Use when: Balanced speed/quality needed (most cases)

3. **Vector + BGE + Sonar** (optional)
   - ~2-5s overhead, best for complex intent
   - Use when: Understanding user intent is critical

**Default recommendation:** Enable BGE reranker, make Sonar optional.
	`);
}

testPipeline().catch(console.error);
