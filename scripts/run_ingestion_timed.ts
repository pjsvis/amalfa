#!/usr/bin/env bun
/**
 * Simple timed ingestion runner
 * Avoids tar/minizlib issues by being minimal
 */

import { performance } from "node:perf_hooks";
import { Ingestor } from "../src/pipeline/Ingestor";
import { ResonanceDB } from "../src/resonance/db";

async function main() {
	const runNumber = process.argv[2] || "1";
	console.log(`\n${"=".repeat(60)}`);
	console.log(`RUN #${runNumber} - Ingestion Benchmark`);
	console.log(`${"=".repeat(60)}\n`);

	const memBefore = process.memoryUsage();
	console.log(
		`Memory before: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`,
	);

	const t0 = performance.now();

	try {
		const ingestor = new Ingestor();

		// Phase 1: Persona
		console.log("\n📚 Phase 1: Persona...");
		const t1 = performance.now();
		// Init returns the raw sqliteDb connection used for validation later
		const sqliteDb = await ingestor.init({});
		const lexicon = await ingestor.runPersona();
		const t2 = performance.now();
		console.log(`✅ Persona: ${((t2 - t1) / 1000).toFixed(2)}s`);

		// Phase 2: Experience
		console.log("\n📝 Phase 2: Experience...");
		const t3 = performance.now();
		await ingestor.runExperience({}, lexicon, sqliteDb);
		const t4 = performance.now();
		console.log(`✅ Experience: ${((t4 - t3) / 1000).toFixed(2)}s`);

		// Cleanup
		ingestor.cleanup(sqliteDb);

		// Get stats
		console.log("\n📊 Final Stats:");
		const db = ResonanceDB.init();
		const stats = db.getStats();
		db.close();

		console.log(`   Nodes: ${stats.nodes}`);
		console.log(`   Edges: ${stats.edges}`);
		console.log(`   Vectors: ${stats.vectors}`);
		console.log(
			`   DB Size: ${(stats.db_size_bytes / 1024 / 1024).toFixed(2)} MB`,
		);

		const totalTime = (performance.now() - t0) / 1000;
		const memAfter = process.memoryUsage();

		console.log(`\n⏱️  Total Time: ${totalTime.toFixed(2)}s`);
		console.log(
			`💾 Memory after: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`,
		);
		console.log(
			`📈 Memory delta: ${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2)} MB`,
		);

		// Write timing to file for aggregation
		const result = {
			run: Number.parseInt(runNumber, 10),
			totalTime,
			personaTime: (t2 - t1) / 1000,
			experienceTime: (t4 - t3) / 1000,
			nodes: stats.nodes,
			edges: stats.edges,
			vectors: stats.vectors,
			dbSizeMB: stats.db_size_bytes / 1024 / 1024,
			memoryUsedMB: (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024,
		};

		await Bun.write(
			`benchmark-run-${runNumber}.json`,
			JSON.stringify(result, null, 2),
		);
		console.log(`\n✅ Results saved to benchmark-run-${runNumber}.json`);
	} catch (e) {
		console.error("\n❌ Ingestion failed:", e);
		throw e;
	}
}

main();
