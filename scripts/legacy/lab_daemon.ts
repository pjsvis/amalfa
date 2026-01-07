import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
import settings from "@/polyvis.settings.json";

console.log("🔥 LAB: Daemon (Writer) Starting...");
const dbPath = settings.paths.database.resonance;
const db = DatabaseFactory.connect(dbPath);

// Setup Table
db.run(
	"CREATE TABLE IF NOT EXISTS _stress (id INTEGER PRIMARY KEY, payload TEXT, timestamp INTEGER)",
);

let id = 0;
const interval = setInterval(() => {
	try {
		id++;
		const payload = `STRESS_TEST_${id}_${Math.random()}`;
		db.run("INSERT INTO _stress (payload, timestamp) VALUES (?, ?)", [
			payload,
			Date.now(),
		]);

		if (id % 10 === 0) process.stdout.write(`W${id} `); // Visual heartbeat
	} catch (e) {
		console.error("\n❌ WRITER ERROR:", e);
		clearInterval(interval);
		process.exit(1);
	}
}, 100);

process.on("SIGINT", () => {
	console.log("\n🛑 Writer Stopping...");
	process.exit(0);
});
