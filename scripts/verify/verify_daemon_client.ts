import { Embedder } from "@src/resonance/services/embedder";

// This script expects the Daemon to be running on port 3010
console.log("🧪 Testing Hybrid Embedder Client...");

const embedder = Embedder.getInstance();
const start = performance.now();
const vector = await embedder.embed("test hybrid client");
const end = performance.now();

console.log(`⏱️ Embedding took: ${(end - start).toFixed(2)}ms`);
console.log(`📏 Vector length: ${vector.length}`);

if (vector.length === 384) {
	console.log("✅ Vector dimension correct.");
} else {
	console.error("❌ Vector dimension incorrect.");
	process.exit(1);
}

// Heuristic check for speed: if it took < 50ms, it likely hit the daemon (or cache).
// Loading the model takes ~1000ms+
if (end - start < 200) {
	console.log("🚀 Fast response detected (Daemon Active).");
} else {
	console.warn("🐌 Slow response detected (Local Fallback?).");
}
