/**
 * Test Lexicon Re-ingestion with Small Subset
 */

import { Database } from "bun:sqlite";
import { writeFileSync, readFileSync } from "node:fs";

async function testSmallReingestion() {
	console.log("🧪 SMALL RE-INGESTION TEST\n");
	
	// Create test database
	const testDb = new Database(":memory:");
	testDb.run(`CREATE TABLE nodes (
		id TEXT PRIMARY KEY,
		type TEXT,
		title TEXT,
		domain TEXT,
		layer TEXT,
		embedding BLOB,
		hash TEXT,
		meta TEXT,
		date TEXT,
		summary TEXT
	)`);
	
	console.log("📄 Step 1: Create Test JSONL (3 vectors)");
	
	// Create minimal test JSONL with 3 vectors from our good data
	const originalFile = readFileSync(".amalfa/lexicon-vectors.jsonl", "utf8");
	const originalLines = originalFile.trim().split("\n").filter(l => l.trim());
	
	// Take first 3 entries
	const testEntries = originalLines.slice(0, 3).map(line => JSON.parse(line));
	
	console.log("Test entries:");
	for (const entry of testEntries) {
		console.log(`  ${entry.id}: ${entry.embedding.length} dimensions, norm = ${Math.sqrt(entry.embedding.reduce((s, v) => s + v*v, 0)).toFixed(6)}`);
	}
	
	// Write test file
	const testJsonl = testEntries.map(e => JSON.stringify(e)).join("\n") + "\n";
	writeFileSync(".amalfa/test-vectors.jsonl", testJsonl);
	
	console.log("\n💾 Step 2: Simulate 06-ingest.ts Logic");
	
	// Replicate exact 06-ingest logic
	const vectorMap = new Map();
	for (const entry of testEntries) {
		vectorMap.set(entry.id, entry.embedding);
	}
	console.log(`  Vector map size: ${vectorMap.size}`);
	
	// Simulate node processing
	const nodes = [];
	for (const entry of testEntries) {
		const vec = vectorMap.get(entry.id);
		const node = {
			id: entry.id,
			type: "entity",
			domain: "lexicon",
			embedding: vec ? new Float32Array(vec) : null
		};
		
		if (node.embedding) {
			console.log(`  ${node.id}: Created Float32Array(${node.embedding.length}), buffer=${node.embedding.buffer.byteLength}bytes`);
		}
		
		nodes.push(node);
	}
	
	console.log("\n🗄️ Step 3: Simulate insertNode Logic");
	
	// Replicate ResonanceDB.insertNode logic exactly
	const stmt = testDb.prepare("INSERT INTO nodes (id, type, domain, embedding) VALUES (?, ?, ?, ?)");
	
	for (const node of nodes) {
		if (node.embedding) {
			// Exact insertNode blob creation logic
			const blob = new Uint8Array(
				node.embedding.buffer,
				node.embedding.byteOffset,
				node.embedding.byteLength
			);
			
			console.log(`  ${node.id}: Storing blob of ${blob.length} bytes`);
			stmt.run(node.id, node.type, node.domain, blob);
		}
	}
	
	console.log("\n🔍 Step 4: Verify Storage Integrity");
	
	for (const entry of testEntries) {
		const row = testDb.query("SELECT id, embedding FROM nodes WHERE id = ?").get(entry.id) as any;
		
		if (row) {
			console.log(`\n  ${entry.id}:`);
			console.log(`    Original JSONL: ${entry.embedding.length} dims`);
			console.log(`    Database buffer: ${row.embedding.byteLength} bytes`);
			
			// Test retrieval patterns
			const directCast = new Float32Array(row.embedding);
			const bufferCast = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 4);
			
			console.log(`    Direct cast: ${directCast.length} dims`);
			console.log(`    Buffer+offset: ${bufferCast.length} dims`);
			
			// Check value preservation
			const originalNorm = Math.sqrt(entry.embedding.reduce((s, v) => s + v*v, 0));
			const retrievedNorm = Math.sqrt(bufferCast.reduce((s, v) => s + v*v, 0));
			
			console.log(`    Norm: ${originalNorm.toFixed(6)} → ${retrievedNorm.toFixed(6)} ${Math.abs(originalNorm - retrievedNorm) < 0.01 ? '✅' : '❌'}`);
			
			// Check first few values
			const valuesMatch = Math.abs(entry.embedding[0] - bufferCast[0]) < 1e-6;
			console.log(`    First value: ${entry.embedding[0].toFixed(6)} → ${bufferCast[0].toFixed(6)} ${valuesMatch ? '✅' : '❌'}`);
		}
	}
	
	testDb.close();
	console.log("\n🎯 Test complete!");
}

testSmallReingestion().catch(console.error);