import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
import settings from "@/polyvis.settings.json";

console.log("🌍 LAB: Web (Observer) Starting...");
const dbPath = settings.paths.database.resonance;
// Web MUST be ReadWrite for WAL to work (shared memory access)
const db = DatabaseFactory.connect(dbPath);

const _interval = setInterval(() => {
	try {
		const walSize = db.query("PRAGMA main.wal_checkpoint(PASSIVE)").get(); // Just peek
		const count = db.query("SELECT COUNT(*) as c FROM _stress").get() as {
			c: number;
		};
		console.log(
			`\n📊 [WEB] Rows: ${count.c} | WAL Checkpoint: ${JSON.stringify(walSize)}`,
		);
	} catch (e) {
		console.error("\n❌ OBSERVER ERROR:", e);
		// Don't exit, just report
	}
}, 1000);

process.on("SIGINT", () => {
	console.log("\n🛑 Observer Stopping...");
	process.exit(0);
});
