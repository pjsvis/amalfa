import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
import settings from "@/polyvis.settings.json";

console.log("🔍 DIAGNOSTICS: Database Health Check");

const dbPath = settings.paths.database.resonance;
console.log(`📂 Target: ${dbPath}`);

try {
	const db = DatabaseFactory.connect(dbPath, { readonly: true });

	// Check Pragmas
	const journal = db.query("PRAGMA journal_mode;").get();
	const busy = db.query("PRAGMA busy_timeout;").get();
	const mmap = db.query("PRAGMA mmap_size;").get();
	const sync = db.query("PRAGMA synchronous;").get();

	console.log("⚙️  Active Configuration:");
	console.log(JSON.stringify({ journal, busy, mmap, sync }, null, 2));

	// Check Integrity
	console.log("🩺 Running Integrity Check (Quick)...");
	const integrity = db.query("PRAGMA quick_check;").get();
	console.log(`💪 Integrity: ${JSON.stringify(integrity)}`);

	// Simple Read
	const count = db.query("SELECT count(*) as c FROM nodes").get();
	console.log(`📊 Node Count: ${JSON.stringify(count)}`);

	db.close();
	console.log("✅ Diagnostics Complete.");
} catch (e) {
	console.error("❌ CRTICAL ERROR:", e);
}
