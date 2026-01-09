#!/usr/bin/env bun
/**
 * Test script to verify unified config system end-to-end
 * Tests: config loading, database access, vector search
 */

import { join } from "node:path";
import { loadConfig } from "@src/config/defaults";
import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";

async function testConfigSearch() {
	console.log("\n🧪 Testing Unified Config System\n");
	console.log("=".repeat(60));

	// 1. Load config
	console.log("\n1️⃣  Loading configuration...");
	const config = await loadConfig();
	console.log(`   ✅ Config loaded`);
	console.log(`   📁 Sources: ${config.sources?.join(", ")}`);
	console.log(`   💾 Database: ${config.database}`);
	console.log(`   🧠 Model: ${config.embeddings.model}`);

	// 2. Open database
	console.log("\n2️⃣  Opening database...");
	const dbPath = join(process.cwd(), config.database);
	const db = new ResonanceDB(dbPath);
	console.log(`   ✅ Database opened: ${dbPath}`);

	// 3. Check stats
	const stats = db.getStats();
	console.log(`   📊 Nodes: ${stats.nodes}`);
	console.log(`   📊 Embeddings: ${stats.vectors}`);

	// 4. Test vector search
	console.log("\n3️⃣  Testing vector search...");
	const vectorEngine = new VectorEngine(db.getRawDb());

	const testQueries = [
		"configuration migration strategy",
		"TypeScript compilation errors",
		"database path validation",
	];

	for (const query of testQueries) {
		console.log(`\n   Query: "${query}"`);
		const results = await vectorEngine.search(query, 3);

		if (results.length === 0) {
			console.log("   ⚠️  No results found");
			continue;
		}

		for (let i = 0; i < results.length; i++) {
			const r = results[i];
			if (!r) continue;
			const score = (r.score * 100).toFixed(1);
			console.log(`   ${i + 1}. [${score}%] ${r.title || r.id}`);
		}
	}

	// 5. Search for our test document
	console.log("\n4️⃣  Searching for test document...");
	const testResults = await vectorEngine.search(
		"config unification test document clean-slate migration",
		5,
	);

	if (testResults.length > 0) {
		console.log(`   ✅ Found ${testResults.length} results`);
		const best = testResults[0];
		if (best) {
			console.log(`   🎯 Best match: ${best.title || best.id}`);
			console.log(`   📊 Score: ${(best.score * 100).toFixed(1)}%`);
			if (best.id.includes("config-unification-test")) {
				console.log("   ✅ TEST DOCUMENT INDEXED SUCCESSFULLY!");
			}
		}
	} else {
		console.log("   ⚠️  Test document not found in search results");
	}

	db.close();

	console.log(`\n${"=".repeat(60)}`);
	console.log("✅ Config system validation complete!\n");
}

// Run test
await testConfigSearch();
