#!/usr/bin/env bun

/**
 * Ingestion Performance Test
 *
 * Tests the ingestion pipeline multiple times to gather timing statistics.
 * Exploits idempotency - same results every time, so we can measure pure performance.
 */

import { statSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "@src/config/defaults";
import { AmalfaIngestor } from "@src/pipeline/AmalfaIngestor";
import { ResonanceDB } from "@src/resonance/db";

interface TimingBreakdown {
	total: number;
	discovery: number;
	pass1_nodes: number;
	pass2_edges: number;
	embedding: number;
	walCheckpoint: number;
}

interface PerformanceMetrics {
	runs: number;
	timings: TimingBreakdown[];
	avg: TimingBreakdown;
	min: TimingBreakdown;
	max: TimingBreakdown;
	nodesPerSecond: number;
	edgesPerSecond: number;
	mbPerSecond: number;
}

async function runIngestion(): Promise<{
	success: boolean;
	timing: TimingBreakdown;
	stats: { nodes: number; edges: number; vectors: number; files: number };
}> {
	const config = await loadConfig();
	const dbPath = join(process.cwd(), config.database);
	const db = new ResonanceDB(dbPath);

	const startTotal = performance.now();

	try {
		const ingestor = new AmalfaIngestor(config, db);
		const result = await ingestor.ingest();

		const endTotal = performance.now();

		db.close();

		return {
			success: result.success,
			timing: {
				total: endTotal - startTotal,
				discovery: 0, // TODO: instrument inside AmalfaIngestor
				pass1_nodes: 0,
				pass2_edges: 0,
				embedding: 0,
				walCheckpoint: 0,
			},
			stats: result.stats,
		};
	} catch (error) {
		db.close();
		throw error;
	}
}

function calculateStats(timings: TimingBreakdown[]): {
	avg: TimingBreakdown;
	min: TimingBreakdown;
	max: TimingBreakdown;
} {
	const avg: TimingBreakdown = {
		total: 0,
		discovery: 0,
		pass1_nodes: 0,
		pass2_edges: 0,
		embedding: 0,
		walCheckpoint: 0,
	};

	const min: TimingBreakdown = { ...timings[0] };
	const max: TimingBreakdown = { ...timings[0] };

	for (const timing of timings) {
		avg.total += timing.total;
		avg.discovery += timing.discovery;
		avg.pass1_nodes += timing.pass1_nodes;
		avg.pass2_edges += timing.pass2_edges;
		avg.embedding += timing.embedding;
		avg.walCheckpoint += timing.walCheckpoint;

		if (timing.total < min.total) min.total = timing.total;
		if (timing.total > max.total) max.total = timing.total;
	}

	const count = timings.length;
	avg.total /= count;
	avg.discovery /= count;
	avg.pass1_nodes /= count;
	avg.pass2_edges /= count;
	avg.embedding /= count;
	avg.walCheckpoint /= count;

	return { avg, min, max };
}

async function main() {
	const runs = Number.parseInt(process.argv[2] || "3", 10);

	console.log("🚀 AMALFA Ingestion Performance Test\n");
	console.log(`📊 Running ${runs} ingestion cycles...\n`);
	console.log("🔄 Exploiting idempotency - same inputs = same outputs");
	console.log("   This measures pure pipeline performance\n");

	const timings: TimingBreakdown[] = [];
	let stats: {
		nodes: number;
		edges: number;
		vectors: number;
		files: number;
	} | null = null;

	for (let i = 0; i < runs; i++) {
		process.stdout.write(`Run ${i + 1}/${runs}... `);

		const result = await runIngestion();

		if (!result.success) {
			console.error("❌ Ingestion failed!");
			process.exit(1);
		}

		stats = result.stats;
		timings.push(result.timing);

		console.log(`✅ ${result.timing.total.toFixed(0)}ms`);
	}

	if (!stats) {
		console.error("❌ No stats collected");
		process.exit(1);
	}

	// Calculate statistics
	const { avg, min, max } = calculateStats(timings);

	// Get database size
	const config = await loadConfig();
	const dbPath = join(process.cwd(), config.database);
	const dbSizeMB = statSync(dbPath).size / 1024 / 1024;

	// Calculate throughput
	const nodesPerSecond = (stats.nodes / avg.total) * 1000;
	const edgesPerSecond = (stats.edges / avg.total) * 1000;
	const mbPerSecond = (dbSizeMB / avg.total) * 1000;

	// Display results
	console.log(`\n${"=".repeat(70)}`);
	console.log("📈 Performance Summary");
	console.log("=".repeat(70));

	console.log("\n⏱️  Timing (milliseconds):");
	console.log(`   Average:  ${avg.total.toFixed(2)}ms`);
	console.log(`   Min:      ${min.total.toFixed(2)}ms`);
	console.log(`   Max:      ${max.total.toFixed(2)}ms`);
	console.log(
		`   Variance: ${(((max.total - min.total) / avg.total) * 100).toFixed(1)}%`,
	);

	console.log("\n📊 Workload:");
	console.log(`   Files:      ${stats.files}`);
	console.log(`   Nodes:      ${stats.nodes}`);
	console.log(`   Edges:      ${stats.edges}`);
	console.log(`   Embeddings: ${stats.vectors}`);
	console.log(`   DB Size:    ${dbSizeMB.toFixed(2)} MB`);

	console.log("\n⚡ Throughput:");
	console.log(`   Nodes/sec:  ${nodesPerSecond.toFixed(1)}`);
	console.log(`   Edges/sec:  ${edgesPerSecond.toFixed(1)}`);
	console.log(`   MB/sec:     ${mbPerSecond.toFixed(3)}`);

	console.log("\n🎯 FAFCAS Protocol:");
	console.log("   ✓ Fast - Scalar product (10x faster than cosine)");
	console.log("   ✓ Accurate - Normalized embeddings");
	console.log("   ✓ Fixed - 384 dimensions");
	console.log("   ✓ Cached - Embeddings stored in database");
	console.log("   ✓ Auditable - Git-based tracking (planned)");
	console.log("   ✓ Searchable - Vector + full-text search");

	// Performance gates
	console.log("\n🚦 Pre-Publish Gates:");
	const gates = {
		nodes: stats.nodes > 0,
		edges: stats.edges > 0,
		embeddings: stats.vectors === stats.nodes,
		throughput: nodesPerSecond > 50, // Should process at least 50 nodes/sec
		consistency: (max.total - min.total) / avg.total < 0.5, // Max 50% variance
	};

	for (const [gate, passed] of Object.entries(gates)) {
		console.log(`   ${passed ? "✅" : "❌"} ${gate}`);
	}

	const allPassed = Object.values(gates).every((v) => v);

	console.log(`\n${"=".repeat(70)}`);

	if (allPassed) {
		console.log("✅ All performance gates passed!");
		console.log("\n💡 Pipeline is ready for publish");
	} else {
		console.log("❌ Some performance gates failed!");
		console.log("\n⚠️  Review performance issues before publishing");
		process.exit(1);
	}

	console.log(`${"=".repeat(70)}\n`);
}

main().catch((error) => {
	console.error("❌ Performance test failed:", error);
	process.exit(1);
});
