/**
 * Ingestion Benchmark Script
 * Measures performance of full ingestion pipeline with detailed metrics
 */

import { existsSync, rmSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { Ingestor } from "../src/pipeline/Ingestor";
import { ResonanceDB } from "../src/resonance/db";

interface BenchmarkMetrics {
	run: number;
	startTime: string;
	totalDuration: number; // seconds
	personaDuration: number;
	experienceDuration: number;
	validationDuration: number;
	memoryBefore: NodeJS.MemoryUsage;
	memoryPeak: NodeJS.MemoryUsage;
	memoryAfter: NodeJS.MemoryUsage;
	nodeCount: number;
	edgeCount: number;
	vectorCount: number;
	dbSizeBytes: number;
}

async function getMemoryUsage(): Promise<NodeJS.MemoryUsage> {
	// Force GC if available
	if (global.gc) {
		global.gc();
	}
	return process.memoryUsage();
}

async function getDbStats(db: ResonanceDB) {
	const stats = db.getStats();
	return {
		nodes: stats.nodes,
		edges: stats.edges,
		vectors: stats.vectors,
		dbSize: stats.db_size_bytes,
	};
}

async function runBenchmark(runNumber: number): Promise<BenchmarkMetrics> {
	console.log(`\n${"=".repeat(80)}`);
	console.log(`🏃 BENCHMARK RUN #${runNumber}`);
	console.log(`${"=".repeat(80)}\n`);

	const startTime = new Date().toISOString();
	const memoryBefore = await getMemoryUsage();
	let memoryPeak = memoryBefore;

	// Monitor memory throughout
	const memMonitor = setInterval(async () => {
		const current = process.memoryUsage();
		if (current.heapUsed > memoryPeak.heapUsed) {
			memoryPeak = current;
		}
	}, 100);

	// Start total timer
	const t0 = performance.now();

	// Phase 1: Persona (Lexicon + CDA)
	console.log("📚 Phase 1: Persona Ingestion (Lexicon + CDA)...");
	const t1 = performance.now();
	const ingestor = new Ingestor();
	// Init returns the raw sqliteDb connection used for validation later
	const sqliteDb = await ingestor.init({});
	const lexicon = await ingestor.runPersona();
	const t2 = performance.now();
	const personaDuration = (t2 - t1) / 1000;
	console.log(`✅ Persona complete in ${personaDuration.toFixed(2)}s`);

	// Phase 2: Experience (Documents)
	console.log("\n📝 Phase 2: Experience Ingestion (Documents)...");
	const t3 = performance.now();
	await ingestor.runExperience({}, lexicon, sqliteDb);
	const t4 = performance.now();
	const experienceDuration = (t4 - t3) / 1000;
	console.log(`✅ Experience complete in ${experienceDuration.toFixed(2)}s`);

	// Cleanup
	ingestor.cleanup(sqliteDb);

	// Phase 3: Validation
	console.log("\n✅ Phase 3: Validation...");
	const t5 = performance.now();
	const db = ResonanceDB.init();
	const stats = await getDbStats(db);
	db.close();
	const t6 = performance.now();
	const validationDuration = (t6 - t5) / 1000;

	// End total timer
	const totalDuration = (performance.now() - t0) / 1000;

	// Stop memory monitoring
	clearInterval(memMonitor);
	const memoryAfter = await getMemoryUsage();

	// Get database file size
	const dbPath = "public/resonance.db";
	const dbStats = existsSync(dbPath)
		? (await Bun.file(dbPath).arrayBuffer()).byteLength
		: 0;

	const metrics: BenchmarkMetrics = {
		run: runNumber,
		startTime,
		totalDuration,
		personaDuration,
		experienceDuration,
		validationDuration,
		memoryBefore,
		memoryPeak,
		memoryAfter,
		nodeCount: stats.nodes,
		edgeCount: stats.edges,
		vectorCount: stats.vectors,
		dbSizeBytes: dbStats,
	};

	// Print summary
	console.log(`\n${"─".repeat(80)}`);
	console.log("📊 RUN SUMMARY");
	console.log("─".repeat(80));
	console.log(`Total Duration:      ${totalDuration.toFixed(2)}s`);
	console.log(`  Persona Phase:     ${personaDuration.toFixed(2)}s`);
	console.log(`  Experience Phase:  ${experienceDuration.toFixed(2)}s`);
	console.log(`  Validation Phase:  ${validationDuration.toFixed(2)}s`);
	console.log(`\nGraph Statistics:`);
	console.log(`  Nodes:             ${stats.nodes.toLocaleString()}`);
	console.log(`  Edges:             ${stats.edges.toLocaleString()}`);
	console.log(`  Vectors:           ${stats.vectors.toLocaleString()}`);
	console.log(`  DB Size:           ${(dbStats / 1024 / 1024).toFixed(2)} MB`);
	console.log(`\nMemory Usage:`);
	console.log(
		`  Before:            ${(memoryBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`,
	);
	console.log(
		`  Peak:              ${(memoryPeak.heapUsed / 1024 / 1024).toFixed(2)} MB`,
	);
	console.log(
		`  After:             ${(memoryAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`,
	);
	console.log(
		`  Delta:             ${((memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024).toFixed(2)} MB`,
	);

	return metrics;
}

async function main() {
	console.log("\n");
	console.log(`╔${"═".repeat(78)}╗`);
	console.log(`║${" ".repeat(20)}INGESTION BENCHMARK SUITE${" ".repeat(33)}║`);
	console.log(`╚${"═".repeat(78)}╝`);
	console.log("\n📋 Configuration:");
	console.log("   - Runs: 3");
	console.log("   - Database: public/resonance.db");
	console.log("   - Transaction Mode: ENABLED (P0-2 fix)");
	console.log("   - Model Cache: Preserved (.resonance/cache/)");
	console.log("\n");

	const allMetrics: BenchmarkMetrics[] = [];

	for (let i = 1; i <= 3; i++) {
		// Clean database before each run
		const dbPath = "public/resonance.db";
		if (existsSync(dbPath)) {
			console.log(`🗑️  Deleting existing database: ${dbPath}`);
			rmSync(dbPath, { force: true });
		}
		if (existsSync(`${dbPath}-shm`)) rmSync(`${dbPath}-shm`, { force: true });
		if (existsSync(`${dbPath}-wal`)) rmSync(`${dbPath}-wal`, { force: true });

		// Run benchmark
		const metrics = await runBenchmark(i);
		allMetrics.push(metrics);

		// Small delay between runs
		if (i < 3) {
			console.log("\n⏸️  Cooling down for 2 seconds...\n");
			await new Promise((r) => setTimeout(r, 2000));
		}
	}

	// Print aggregate statistics
	console.log("\n\n");
	console.log(`╔${"═".repeat(78)}╗`);
	console.log(`║${" ".repeat(25)}AGGREGATE RESULTS${" ".repeat(36)}║`);
	console.log(`╚${"═".repeat(78)}╝`);

	const avgTotal =
		allMetrics.reduce((sum, m) => sum + m.totalDuration, 0) / allMetrics.length;
	const avgPersona =
		allMetrics.reduce((sum, m) => sum + m.personaDuration, 0) /
		allMetrics.length;
	const avgExperience =
		allMetrics.reduce((sum, m) => sum + m.experienceDuration, 0) /
		allMetrics.length;
	const avgMemoryPeak =
		allMetrics.reduce((sum, m) => sum + m.memoryPeak.heapUsed, 0) /
		allMetrics.length;

	console.log("\n📊 Average Timings (3 runs):");
	console.log(`   Total:           ${avgTotal.toFixed(2)}s`);
	console.log(`   Persona:         ${avgPersona.toFixed(2)}s`);
	console.log(`   Experience:      ${avgExperience.toFixed(2)}s`);
	console.log(
		`   Peak Memory:     ${(avgMemoryPeak / 1024 / 1024).toFixed(2)} MB`,
	);

	console.log("\n📈 Per-Run Breakdown:");
	for (const m of allMetrics) {
		console.log(
			`   Run ${m.run}: ${m.totalDuration.toFixed(2)}s (Persona: ${m.personaDuration.toFixed(2)}s, Experience: ${m.experienceDuration.toFixed(2)}s)`,
		);
	}

	console.log("\n📝 Final Graph State:");
	const lastMetrics = allMetrics[allMetrics.length - 1];
	if (!lastMetrics) throw new Error("No metrics available");
	console.log(`   Nodes:           ${lastMetrics.nodeCount.toLocaleString()}`);
	console.log(`   Edges:           ${lastMetrics.edgeCount.toLocaleString()}`);
	console.log(
		`   Vectors:         ${lastMetrics.vectorCount.toLocaleString()}`,
	);
	console.log(
		`   DB Size:         ${(lastMetrics.dbSizeBytes / 1024 / 1024).toFixed(2)} MB`,
	);

	// Calculate variance
	const totalTimes = allMetrics.map((m) => m.totalDuration);
	const variance =
		totalTimes.reduce((sum, t) => sum + (t - avgTotal) ** 2, 0) /
		totalTimes.length;
	const stdDev = Math.sqrt(variance);

	console.log("\n📉 Consistency:");
	console.log(`   Std Deviation:   ${stdDev.toFixed(3)}s`);
	console.log(`   Variance:        ${((stdDev / avgTotal) * 100).toFixed(2)}%`);

	console.log("\n✅ Benchmark Complete!\n");

	// Export to JSON for analysis
	const results = {
		timestamp: new Date().toISOString(),
		configuration: {
			runs: 3,
			transactionMode: "enabled",
			modelCachePreserved: true,
		},
		summary: {
			avgTotal,
			avgPersona,
			avgExperience,
			avgMemoryPeak: avgMemoryPeak / 1024 / 1024,
			stdDev,
			variance: (stdDev / avgTotal) * 100,
		},
		runs: allMetrics,
	};

	await Bun.write("benchmark-results.json", JSON.stringify(results, null, 2));
	console.log("📄 Results exported to: benchmark-results.json\n");
}

main().catch((e) => {
	console.error("❌ Benchmark failed:", e);
	process.exit(1);
});
