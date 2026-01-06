import { VectorEngine } from "@src/core/VectorEngine";

console.log("🕵️‍♀️ Debugging MCP Readonly Connection...");

import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
import settings from "@/polyvis.settings.json";

console.log("🕵️‍♀️ Debugging MCP Readonly Connection...");

try {
	// Standardized connection (ReadWrite by default to satisfy WAL)
	const db = DatabaseFactory.connect(settings.paths.database.resonance);
	console.log(`📂 Opening DB`);

	// Check Pragmas
	const journal = db.query("PRAGMA journal_mode;").get();
	console.log(`⚙️  Journal Mode: ${JSON.stringify(journal)}`);

	console.log("🔍 Attempting Vector Search Query (The Failing Step)...");
	const vectorEngine = new VectorEngine(db);

	// Simulate search
	const results = await vectorEngine.search("Excalibur", 1);
	console.log("✅ Query Success!", results);
	db.close();
} catch (e) {
	console.error("❌ CRITICAL FAILURE:", e);
}
