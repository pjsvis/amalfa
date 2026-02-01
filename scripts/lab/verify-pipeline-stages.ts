/**
 * Stage-by-Stage Pipeline Verification
 * 
 * Tests vector dimensions and quality at each pipeline stage
 */

import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { getDbPath } from "@src/cli/utils";

async function verifyPipelineStages() {
	console.log("🔬 PIPELINE STAGE VERIFICATION\n");
	
	const dbPath = await getDbPath();
	const db = new Database(dbPath);
	
	// === Stage 1: JSONL Artifacts ===
	console.log("📄 Stage 1: JSONL Artifacts");
	
	// Check lexicon-vectors.jsonl (output of 04-embed.ts)
	const vectorsFile = readFileSync(".amalfa/lexicon-vectors.jsonl", "utf8");
	const vectorLines = vectorsFile.trim().split("\n").filter(l => l.trim());
	const firstVector = JSON.parse(vectorLines[0]);
	
	console.log(`  lexicon-vectors.jsonl:`);
	console.log(`    Total entries: ${vectorLines.length}`);
	console.log(`    First vector ID: ${firstVector.id}`);
	console.log(`    Embedding dimensions: ${firstVector.embedding.length}`);
	console.log(`    Model: ${firstVector.model}`);
	
	// Calculate norm of first vector
	const jsonlVector = new Float32Array(firstVector.embedding);
	const jsonlNorm = Math.sqrt(jsonlVector.reduce((s, v) => s + v*v, 0));
	console.log(`    Vector norm: ${jsonlNorm.toFixed(6)} ${Math.abs(jsonlNorm - 1.0) < 0.01 ? '✅' : '❌'}`);
	
	// === Stage 2: Database Storage ===
	console.log(`\n💾 Stage 2: Database Storage`);
	
	// Check same vector in database
	const dbVector = db.query("SELECT id, embedding FROM nodes WHERE id = ?").get(firstVector.id) as any;
	
	if (dbVector) {
		console.log(`  Database entry: ${dbVector.id}`);
		console.log(`    Buffer size: ${dbVector.embedding.byteLength} bytes`);
		console.log(`    Expected for 384 floats: ${384 * 4} bytes`);
		console.log(`    Size ratio: ${dbVector.embedding.byteLength / (384 * 4)}x`);
		
		// Test both retrieval patterns
		const directCast = new Float32Array(dbVector.embedding);
		const bufferCast = new Float32Array(
			dbVector.embedding.buffer,
			dbVector.embedding.byteOffset, 
			dbVector.embedding.byteLength / 4
		);
		
		console.log(`    Direct cast dimensions: ${directCast.length}`);
		console.log(`    Buffer+offset dimensions: ${bufferCast.length}`);
		
		const correctNorm = Math.sqrt(bufferCast.reduce((s, v) => s + v*v, 0));
		console.log(`    Correct retrieval norm: ${correctNorm.toFixed(6)} ${Math.abs(correctNorm - 1.0) < 0.01 ? '✅' : '❌'}`);
		
		// === Stage 3: Round-Trip Verification ===
		console.log(`\n🔄 Stage 3: Round-Trip Verification`);
		
		// Compare first 10 values
		const jsonlValues = firstVector.embedding.slice(0, 10);
		const dbValues = Array.from(bufferCast.slice(0, 10));
		
		console.log("    First 10 values comparison:");
		let matches = 0;
		for (let i = 0; i < 10; i++) {
			const match = Math.abs(jsonlValues[i] - dbValues[i]) < 1e-6;
			console.log(`      [${i}] JSONL: ${jsonlValues[i].toFixed(6)} | DB: ${dbValues[i].toFixed(6)} ${match ? '✅' : '❌'}`);
			if (match) matches++;
		}
		
		console.log(`    Match rate: ${matches}/10 ${matches === 10 ? '✅' : '❌'}`);
		
	} else {
		console.log(`    ❌ Vector not found in database: ${firstVector.id}`);
	}
	
	// === Stage 4: Search Quality Test ===
	console.log(`\n🎯 Stage 4: Search Quality Test`);
	
	// Test similarity between related vectors
	const dbEntry = "resonancedb";
	const relatedEntry = "databasefactory"; 
	
	const vec1 = db.query("SELECT embedding FROM nodes WHERE id = ?").get(dbEntry) as any;
	const vec2 = db.query("SELECT embedding FROM nodes WHERE id = ?").get(relatedEntry) as any;
	
	if (vec1 && vec2) {
		const array1 = new Float32Array(vec1.embedding.buffer, vec1.embedding.byteOffset, vec1.embedding.byteLength / 4);
		const array2 = new Float32Array(vec2.embedding.buffer, vec2.embedding.byteOffset, vec2.embedding.byteLength / 4);
		
		let similarity = 0;
		for (let i = 0; i < array1.length; i++) {
			similarity += array1[i] * array2[i];
		}
		
		console.log(`    Similarity "${dbEntry}" ↔ "${relatedEntry}": ${similarity.toFixed(6)}`);
		console.log(`    Should be high (>0.6): ${similarity > 0.6 ? '✅' : '❌'}`);
	}
	
	db.close();
}

verifyPipelineStages().catch(console.error);