/**
 * Round-Trip Export Test
 * 
 * Exports database embeddings back to JSONL and compares to original input
 */

import { Database } from "bun:sqlite";
import { writeFileSync, readFileSync } from "node:fs";
import { getDbPath } from "@src/cli/utils";

async function roundTripTest() {
	console.log("🔄 ROUND-TRIP EXPORT TEST\n");
	
	const dbPath = await getDbPath();
	const db = new Database(dbPath);
	
	// === Export Phase ===
	console.log("📤 Exporting embeddings from database...");
	
	const lexiconNodes = db.query(
		"SELECT id, embedding FROM nodes WHERE domain = 'lexicon' ORDER BY id"
	).all() as any[];
	
	console.log(`  Found ${lexiconNodes.length} lexicon nodes in database`);
	
	const exportedVectors = [];
	for (const node of lexiconNodes) {
		// Use correct retrieval pattern
		const vector = new Float32Array(
			node.embedding.buffer,
			node.embedding.byteOffset,
			node.embedding.byteLength / 4
		);
		
		exportedVectors.push({
			id: node.id,
			embedding: Array.from(vector),
			exported_from: "database",
			timestamp: new Date().toISOString()
		});
	}
	
	// Write exported vectors
	const exportFile = ".amalfa/exported-vectors-roundtrip.jsonl";
	const exportLines = exportedVectors.map(v => JSON.stringify(v)).join("\n") + "\n";
	writeFileSync(exportFile, exportLines);
	console.log(`  Exported to: ${exportFile}`);
	
	// === Comparison Phase ===
	console.log(`\n🔍 Comparing exported vs original...`);
	
	// Load original vectors
	const originalFile = readFileSync(".amalfa/lexicon-vectors.jsonl", "utf8");
	const originalLines = originalFile.trim().split("\n").filter(l => l.trim());
	const originalVectors = originalLines.map(line => JSON.parse(line));
	
	console.log(`  Original vectors: ${originalVectors.length}`);
	console.log(`  Exported vectors: ${exportedVectors.length}`);
	
	// Create lookup maps
	const originalMap = new Map(originalVectors.map(v => [v.id, v]));
	const exportedMap = new Map(exportedVectors.map(v => [v.id, v]));
	
	// Compare dimensions and values
	let dimensionMatches = 0;
	let valueMatches = 0;
	let totalCompared = 0;
	
	console.log(`\n📊 Detailed Comparison (first 10 vectors):`);
	
	for (const original of originalVectors.slice(0, 10)) {
		const exported = exportedMap.get(original.id);
		if (!exported) {
			console.log(`  ❌ ${original.id}: Missing in export`);
			continue;
		}
		
		totalCompared++;
		
		// Check dimensions
		const dimMatch = original.embedding.length === exported.embedding.length;
		if (dimMatch) dimensionMatches++;
		
		// Check values (first 5)
		let valueMatchCount = 0;
		for (let i = 0; i < Math.min(5, original.embedding.length); i++) {
			if (Math.abs(original.embedding[i] - exported.embedding[i]) < 1e-6) {
				valueMatchCount++;
			}
		}
		const allValuesMatch = valueMatchCount === 5;
		if (allValuesMatch) valueMatches++;
		
		console.log(`  ${original.id}:`);
		console.log(`    Dimensions: ${original.embedding.length} → ${exported.embedding.length} ${dimMatch ? '✅' : '❌'}`);
		console.log(`    Values (5): ${valueMatchCount}/5 match ${allValuesMatch ? '✅' : '❌'}`);
	}
	
	console.log(`\n📈 Summary:`);
	console.log(`  Dimension matches: ${dimensionMatches}/${totalCompared} (${(dimensionMatches/totalCompared*100).toFixed(1)}%)`);
	console.log(`  Value matches: ${valueMatches}/${totalCompared} (${(valueMatches/totalCompared*100).toFixed(1)}%)`);
	console.log(`  Round-trip integrity: ${dimensionMatches === totalCompared && valueMatches === totalCompared ? '✅ PERFECT' : '❌ CORRUPTED'}`);
	
	db.close();
}

roundTripTest().catch(console.error);