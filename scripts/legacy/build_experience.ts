import { Database } from "bun:sqlite";
import { parseArgs } from "node:util";
import { Ingestor } from "@src/pipeline/Ingestor";
import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
import settings from "@/polyvis.settings.json";

/**
 * PHASE 2: EXPERIENCE
 * Ingests Documents, Playbooks, and Debriefs.
 */
async function main() {
	console.log("\n\n📚 [BUILD: EXPERIENCE] Starting...\n");

	// Check if we are in "Update Mode" (via args) or Full Rebuild
	// For simplicity, we just run the ingestor logic which is idempotent-ish
	const { values } = parseArgs({
		args: Bun.argv,
		options: {
			file: { type: "string" },
			dir: { type: "string" },
			db: { type: "string" },
		},
		strict: false,
	});

	// Use Factory for default path logic or overridden path if provided (though Factory strictly handles Resonance DB)
	// If 'db' arg is provided, we might be testing elsewhere, but for now standardizing on factory for default.
	const dbPath = values.db
		? String(values.db)
		: settings.paths.database.resonance;
	const ingestor = new Ingestor(dbPath);

	// Use factory for the validation connection if using default path
	const sqliteDb = values.db
		? new Database(dbPath)
		: DatabaseFactory.connectToResonance();

	// Ensure Embedder is ready
	const embedder = ingestor.getEmbedder();
	await embedder.embed("init");

	await ingestor.runExperience(
		{
			file: values.file ? String(values.file) : undefined,
			dir: values.dir ? String(values.dir) : undefined,
		},
		[],
		sqliteDb,
	);

	sqliteDb.close(); // Clean up the local connection
	// ingestor.cleanup() is private? The CLI script should handle process exit which cleans up.

	console.log("\n📚 [BUILD: EXPERIENCE] Complete.\n");
	process.exit(0);
}

if (import.meta.main) {
	main().catch((e) => {
		console.error("❌ Experience Build Failed:", e);
		process.exit(1);
	});
}
