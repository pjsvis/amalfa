import { join } from "node:path";
import { ResonanceDB } from "../../src/resonance/db";
import { VectorEngine } from "../../src/core/VectorEngine";
import { loadConfig } from "../../src/config/defaults";

console.log("🧊 LAB: MCP (Reader) Starting...");
const config = await loadConfig();
const dbPath = join(process.cwd(), config.database);
const db = new ResonanceDB(dbPath);
const vectorEngine = new VectorEngine(db.getRawDb());

let count = 0;
const _interval = setInterval(async () => {
	try {
		count++;
		// Heavy Vector Search
		// We search for "Excalibur" each time.
		const results = await vectorEngine.search("Excalibur", 1);

		if (count % 10 === 0) {
            process.stdout.write(`V(${results.length}) `);
            if (results.length > 0) {
                console.log(`\nFound: ${results[0].title} (Score: ${results[0].score.toFixed(3)})`);
            }
        }

	} catch (err) {
		const e = err as Error;
		console.error("\n❌ READER ERROR:", e.message);
		// If it's the I/O error, we found our reproduction!
		if (e.message.includes("disk I/O error")) {
			console.error(
				"🚨 REPRODUCTION CONFIRMED: Disk I/O Error during Vector Search.",
			);
			process.exit(1);
		}
	}
}, 200); // Slightly slower to allow for embedding time

// ... (existing code)

process.on("SIGINT", () => {
	console.log("\n🛑 Reader Stopping...");
	process.exit(0);
});
