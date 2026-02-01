import { Database } from "bun:sqlite";
import { EmbeddingModel, FlagEmbedding } from "fastembed";

interface ForensicResult {
	test: string;
	originalNorm: number;
	storedNorm: number;
	retrievedNorm: number;
	corruption: string;
}

async function runSimpleForensicTests(): Promise<void> {
	console.log("🔬 FORENSIC INVESTIGATION: FAFCAS Corruption\n");
	
	const db = new Database(":memory:");
	
	db.run(`CREATE TABLE nodes (id TEXT PRIMARY KEY, embedding BLOB)`);
	
	console.log("🧪 Test 1: Raw FastEmbed Storage/Retrieval");
	const model = await FlagEmbedding.init({ model: EmbeddingModel.BGESmallENV15 });
	const embeddings = model.embed(["test database performance"]);
	let rawVector: Float32Array | undefined;
	
	for await (const batch of embeddings) {
		if (batch && batch.length > 0) {
			rawVector = new Float32Array(batch[0]);
			break;
		}
	}
	
	if (rawVector) {
		const originalNorm = Math.sqrt(rawVector.reduce((s, v) => s + v*v, 0));
		console.log(`  Raw FastEmbed norm: ${originalNorm.toFixed(6)}`);
		console.log(`  Vector length: ${rawVector.length}`);
		
		// Store as Float32Array (current pipeline B method)
		db.prepare("INSERT INTO nodes VALUES (?, ?)").run("test1", rawVector);
		
		// Retrieve and check
		const row = db.query("SELECT embedding FROM nodes WHERE id = ?").get("test1") as any;
		const retrieved = new Float32Array(row.embedding);
		const retrievedNorm = Math.sqrt(retrieved.reduce((s, v) => s + v*v, 0));
		
		console.log(`  After storage: ${retrievedNorm.toFixed(6)} ${Math.abs(retrievedNorm - originalNorm) < 0.01 ? '✅' : '❌'}`);
		
		// Test with different retrieval patterns
		console.log("\\n  Testing different retrieval patterns:");
		
		// Pattern 1: Direct cast (what we're doing)
		const pattern1 = new Float32Array(row.embedding);
		const norm1 = Math.sqrt(pattern1.reduce((s, v) => s + v*v, 0));
		console.log(`    Direct cast: ${norm1.toFixed(6)}`);
		
		// Pattern 2: Buffer with offset/length (production pattern)
		const pattern2 = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 4);
		const norm2 = Math.sqrt(pattern2.reduce((s, v) => s + v*v, 0));
		console.log(`    Buffer+offset: ${norm2.toFixed(6)}`);
		
		// Pattern 3: Array.from conversion
		const pattern3 = new Float32Array(Array.from(row.embedding));
		const norm3 = Math.sqrt(pattern3.reduce((s, v) => s + v*v, 0));
		console.log(`    Array.from: ${norm3.toFixed(6)}`);
	}
	
	console.log("\\n🧪 Test 2: Current Database Samples");
	const prodDb = new Database(".amalfa/resonance.db");
	
	// Check both domains
	console.log("\\n  Knowledge domain (documents):");
	const docs = prodDb.query("SELECT id, embedding FROM nodes WHERE domain = 'knowledge' LIMIT 3").all() as any[];
	for (const row of docs) {
		const vec = new Float32Array(row.embedding);
		const norm = Math.sqrt(vec.reduce((s, v) => s + v*v, 0));
		console.log(`    ${row.id.substring(0, 30)}: ${norm.toFixed(3)}`);
	}
	
	console.log("\\n  Lexicon domain (entities):");
	const entities = prodDb.query("SELECT id, embedding FROM nodes WHERE domain = 'lexicon' LIMIT 3").all() as any[];
	for (const row of entities) {
		const vec = new Float32Array(row.embedding);
		const norm = Math.sqrt(vec.reduce((s, v) => s + v*v, 0));
		console.log(`    ${row.id.substring(0, 30)}: ${norm.toFixed(3)}`);
	}
	
	prodDb.close();
	db.close();
}

runSimpleForensicTests().catch(console.error);