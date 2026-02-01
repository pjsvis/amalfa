/**
 * Forensic Investigation: FAFCAS Embedding Corruption
 * 
 * Tests storage/retrieval pathways to identify where normalization breaks
 */

import { Database } from "bun:sqlite";
import { EmbeddingModel, FlagEmbedding } from "fastembed";
import { toFafcas } from "@src/resonance/db";
import { Embedder } from "@src/resonance/services/embedder";
import { VectorEngine } from "@src/core/VectorEngine";
import { getDbPath } from "@src/cli/utils";

const FORENSIC_DB = ":memory:";

interface ForensicResult {
	test: string;
	originalNorm: number;
	storedNorm: number;
	retrievedNorm: number;
	corruption: string;
}

async function runForensicTests(): Promise<ForensicResult[]> {
	console.log("🔬 FORENSIC INVESTIGATION: FAFCAS Corruption\n");
	
	const results: ForensicResult[] = [];
	const db = new Database(FORENSIC_DB);
	
	// Create test table matching production schema
	db.run(`CREATE TABLE nodes (
		id TEXT PRIMARY KEY,
		embedding BLOB
	)`);
	
	// Test vector - same across all tests for consistency
	const testText = "database performance optimization";
	console.log(`Test text: "${testText}"\n`);
	
	// === TEST 1: Raw FastEmbed Output ===
	console.log("🧪 Test 1: Raw FastEmbed Output");
	const model = await FlagEmbedding.init({ model: EmbeddingModel.BGESmallENV15 });
	const embeddings = model.embed([testText]);
	let rawVector: Float32Array | undefined;
	
	for await (const batch of embeddings) {
		if (batch && batch.length > 0) {
			rawVector = new Float32Array(batch[0]);
			break;
		}
	}
	
	if (rawVector) {
		const rawNorm = Math.sqrt(rawVector.reduce((s, v) => s + v*v, 0));
		console.log(`  Raw FastEmbed norm: ${rawNorm.toFixed(6)}`);
		console.log(`  Vector length: ${rawVector.length}`);
		
		// Store raw (no normalization)
		db.prepare("INSERT INTO nodes VALUES (?, ?)").run("test1_raw", rawVector);
		const retrieved1 = new Float32Array(db.query("SELECT embedding FROM nodes WHERE id = ?").get("test1_raw")!.embedding);
		const retrievedNorm1 = Math.sqrt(retrieved1.reduce((s, v) => s + v*v, 0));
		
		results.push({
			test: "Raw FastEmbed",
			originalNorm: rawNorm,
			storedNorm: rawNorm,
			retrievedNorm: retrievedNorm1,
			corruption: rawNorm === retrievedNorm1 ? "None" : "Storage corruption"
		});
		console.log(`  After storage/retrieval: ${retrievedNorm1.toFixed(6)} ${rawNorm === retrievedNorm1 ? '✅' : '❌'}\n`);
	}
	
	// === TEST 2: Manual toFafcas Normalization ===
	console.log("🧪 Test 2: Manual toFafcas() Normalization");
	if (rawVector) {
		const testVector = new Float32Array(rawVector); // Copy
		const normalized = toFafcas(testVector);
		const normalizedFloat = new Float32Array(normalized.buffer);
		const normalizedNorm = Math.sqrt(normalizedFloat.reduce((s, v) => s + v*v, 0));
		
		console.log(`  After toFafcas(): ${normalizedNorm.toFixed(6)}`);
		
		// Store normalized Uint8Array
		db.prepare("INSERT INTO nodes VALUES (?, ?)").run("test2_uint8", normalized);
		const retrieved2raw = db.query("SELECT embedding FROM nodes WHERE id = ?").get("test2_uint8")!.embedding;
		const retrieved2 = new Float32Array(retrieved2raw);
		const retrievedNorm2 = Math.sqrt(retrieved2.reduce((s, v) => s + v*v, 0));
		
		results.push({
			test: "toFafcas() Uint8Array",
			originalNorm: rawNorm!,
			storedNorm: normalizedNorm,
			retrievedNorm: retrievedNorm2,
			corruption: Math.abs(retrievedNorm2 - 1.0) < 0.01 ? "None" : "Storage corruption"
		});
		console.log(`  After storage/retrieval: ${retrievedNorm2.toFixed(6)} ${Math.abs(retrievedNorm2 - 1.0) < 0.01 ? '✅' : '❌'}\n`);
	}
	
	// === TEST 3: Embedder Service Path ===
	console.log("🧪 Test 3: Embedder Service Path");
	const embedder = Embedder.getInstance();
	const embedderResult = await embedder.embed(testText);
	const embedderNorm = Math.sqrt(embedderResult.reduce((s, v) => s + v*v, 0));
	
	console.log(`  Embedder output norm: ${embedderNorm.toFixed(6)}`);
	
	// Store Embedder result
	db.prepare("INSERT INTO nodes VALUES (?, ?)").run("test3_embedder", embedderResult);
	const retrieved3 = new Float32Array(db.query("SELECT embedding FROM nodes WHERE id = ?").get("test3_embedder")!.embedding);
	const retrievedNorm3 = Math.sqrt(retrieved3.reduce((s, v) => s + v*v, 0));
	
	results.push({
		test: "Embedder Service",
		originalNorm: rawNorm!,
		storedNorm: embedderNorm,
		retrievedNorm: retrievedNorm3,
		corruption: Math.abs(retrievedNorm3 - 1.0) < 0.01 ? "None" : "Service or storage corruption"
	});
	console.log(`  After storage/retrieval: ${retrievedNorm3.toFixed(6)} ${Math.abs(retrievedNorm3 - 1.0) < 0.01 ? '✅' : '❌'}\n`);
	
	// === TEST 4: Current Database Sample ===
	console.log("🧪 Test 4: Current Production Database Sample");
	const prodDb = new Database(await getDbPath());
	const prodSample = prodDb.query("SELECT id, embedding FROM nodes LIMIT 3").all() as any[];
	
	for (const row of prodSample) {
		const vec = new Float32Array(row.embedding);
		const norm = Math.sqrt(vec.reduce((s, v) => s + v*v, 0));
		console.log(`  ${row.id.substring(0, 30)}: ${norm.toFixed(6)}`);
	}
	prodDb.close();
	
	db.close();
	return results;
}

async function testSearchQuality() {
	console.log("\n🎯 SEARCH QUALITY IMPACT ANALYSIS\n");
	
	const dbPath = await getDbPath();
	const db = new Database(dbPath);
	
	// Test queries that should have clear semantic matches
	const testQueries = [
		"database performance",
		"vector embeddings", 
		"FAFCAS protocol",
		"pipeline ingestion"
	];
	
	console.log("Testing search quality with current (corrupted) embeddings...\n");
	
	for (const query of testQueries) {
		console.log(`Query: "${query}"`);
		
		// Get query embedding (this will be normalized correctly)
		const embedder = Embedder.getInstance();
		const queryVec = await embedder.embed(query);
		const queryNorm = Math.sqrt(queryVec.reduce((s, v) => s + v*v, 0));
		console.log(`  Query embedding norm: ${queryNorm.toFixed(6)}`);
		
		// Get top 3 results using corrupted database embeddings
		const nodes = db.query("SELECT id, title, embedding FROM nodes LIMIT 100").all() as any[];
		const scores = [];
		
		for (const node of nodes) {
			const nodeVec = new Float32Array(node.embedding);
			
			// Calculate similarity (this will be wrong due to norm mismatch)
			let dotProduct = 0;
			for (let i = 0; i < queryVec.length; i++) {
				dotProduct += queryVec[i] * nodeVec[i];
			}
			
			scores.push({
				id: node.id,
				title: node.title?.substring(0, 50),
				score: dotProduct,
				nodeNorm: Math.sqrt(nodeVec.reduce((s, v) => s + v*v, 0))
			});
		}
		
		scores.sort((a, b) => b.score - a.score);
		console.log("  Top 3 results:");
		for (let i = 0; i < 3; i++) {
			const result = scores[i];
			console.log(`    ${i+1}. ${result.id.substring(0, 40)} (score: ${result.score.toFixed(3)}, norm: ${result.nodeNorm.toFixed(0)})`);
		}
		console.log("");
	}
	
	db.close();
}

// Run investigation
runForensicTests().then(results => {
	console.log("\n📊 FORENSIC RESULTS SUMMARY");
	console.log("=" .repeat(50));
	for (const result of results) {
		console.log(`${result.test}:`);
		console.log(`  Original → Stored → Retrieved: ${result.originalNorm.toFixed(3)} → ${result.storedNorm.toFixed(3)} → ${result.retrievedNorm.toFixed(3)}`);
		console.log(`  Status: ${result.corruption}`);
		console.log("");
	}
	
	// Run search quality test
	return testSearchQuality();
}).catch(console.error);