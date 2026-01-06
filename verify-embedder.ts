import { Embedder } from "./src/resonance/services/embedder.js";

/**
 * Verification Script for Embedder Refactor
 * Usage:
 * 1. Default (BGE Small): npx tsx verify-embedder.ts
 * 2. Custom Model: EMBEDDING_MODEL=allminilml6v2 npx tsx verify-embedder.ts
 */

async function verify() {
	console.log("🔍 Starting Embedder Verification Protocol...");

	// 1. Inspect Environment
	const envModel = process.env.EMBEDDING_MODEL || "(Not Set - using default)";
	console.log(`📋 Configuration: EMBEDDING_MODEL=${envModel}`);

	try {
		// 2. Initialize Embedder
		// We force local usage to ensure we are testing the library, not the daemon
		const embedder = Embedder.getInstance();

		const testPhrase =
			"The Scottish Enlightenment was a period of intellectual outpouring.";
		console.log(`🧪 Embedding phrase: "${testPhrase.substring(0, 25)}..."`);

		const start = performance.now();
		// Force local=true to bypass daemon and test the actual fastembed integration
		const vector = await embedder.embed(testPhrase, true);
		const duration = (performance.now() - start).toFixed(2);

		// 3. Validate Output
		console.log(`✅ Embedding generated in ${duration}ms`);
		console.log(`📏 Vector Dimensions: ${vector.length}`);

		// 4. Model Specific Validation
		// BGE-Small and AllMiniLM are both 384, but we verify we got a valid vector
		if (vector.length === 384) {
			console.log(
				"✨ SUCCESS: Dimension matches expected 384 for BGE-Small/MiniLM.",
			);
		} else {
			console.warn(
				`⚠️ WARNING: Unexpected dimension ${vector.length}. Check model configuration.`,
			);
		}

		console.log("\n[Verification Complete]");
	} catch (error) {
		console.error("❌ FAILURE:", error);
		process.exit(1);
	}
}

verify();
