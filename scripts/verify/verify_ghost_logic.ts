import { dotProduct } from "@src/js/utils/math.js";
import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

// Verify alias usage (as requested)
// Note: This script uses relative import for math.js because it's a JS file in src.
// Ideally we'd use @src/js/utils/math.js if aliases are set up.

console.log("🧪 Testing Ghost Graph SQL Logic...");

const db = DatabaseFactory.connectToResonance({ readonly: true });

// 1. Fetch nodes directly (no UDF)
const nodes = db
	.query("SELECT id, embedding FROM nodes WHERE embedding IS NOT NULL")
	.all() as { id: string; embedding: Uint8Array }[];

if (nodes.length < 2) {
	console.error("❌ Need at least 2 nodes with embeddings.");
	process.exit(0);
}

const source = nodes[0];
if (!source) throw new Error("Unexpected error: Source node is undefined");
console.log(`🎯 Source: [${source.id}]`);

// 2. Compute similarity in JS (Simulating UDF)
// This verifies that dotProduct handles the Uint8Array buffers correctly.
const results = nodes
	.filter((n) => n.id !== source.id)
	.map((n) => {
		const score = dotProduct(source.embedding, n.embedding);
		return { id: n.id, score };
	})
	.sort((a, b) => b.score - a.score)
	.slice(0, 5);

console.log(`👻 Top 5 Neighbors (JS Verified):`);
results.forEach((r) => {
	console.log(`   - [${r.score.toFixed(3)}] (${r.id})`);
});

if (results.length > 0 && results[0]?.score && results[0].score > 0) {
	console.log("✅ Math logic verified (Buffers -> Float32Array).");
} else {
	console.warn("⚠️ No similar nodes found.");
}
