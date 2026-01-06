import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

// Use Shared Factory
const db = DatabaseFactory.connectToResonance({ readonly: true });

try {
	console.log("Opening DB...");
	db.run("PRAGMA busy_timeout = 5000;");

	const journal = db.query("PRAGMA journal_mode;").get();
	console.log("Journal Mode:", journal);

	console.log("Running Query...");
	const count = db.query("SELECT COUNT(*) as c FROM nodes").get();
	console.log("Node Count:", count);

	console.log("Search Test...");
	const start = performance.now();
	const results = db.query("SELECT id, title FROM nodes LIMIT 5").all();
	const end = performance.now();
	console.log(`⏱️ Search Latency: ${(end - start).toFixed(2)}ms`);
	console.log("Results:", results);

	console.log("✅ Success");
} catch (e) {
	console.error("❌ Failed:", e);
}
db.close();
