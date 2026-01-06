import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { Ingestor, type IngestorOptions } from "@src/pipeline/Ingestor";

async function main() {
	console.log("🐤 Starting Iron-Clad Persistence Canary...");
	const TEST_DB = "canary-persistence.db";

	if (existsSync(TEST_DB)) await unlink(TEST_DB);
	if (existsSync(`${TEST_DB}-shm`)) await unlink(`${TEST_DB}-shm`);
	if (existsSync(`${TEST_DB}-wal`)) await unlink(`${TEST_DB}-wal`);

	const ingestor = new Ingestor(TEST_DB);
	const options: IngestorOptions = {};
	const db = await ingestor.init(options);

	try {
		console.log("⚙️ Running Ingestion...");
		await ingestor.runExperience(options, [], db);

		// Pinch Check
		const size = Bun.file(TEST_DB).size;
		console.log("📏 Final DB Size:", size);

		if (size > 0) {
			console.log("✅ CANARY PASSED: Persistence verified.");
			process.exit(0);
		} else {
			console.error("❌ CANARY FAILED: Database size is 0.");
			process.exit(1);
		}
	} catch (e) {
		console.error("❌ CANARY CRASHED:", e);
		process.exit(1);
	} finally {
		ingestor.cleanup(db);
		// Cleanup artifacts
		if (existsSync(TEST_DB)) await unlink(TEST_DB);
		if (existsSync(`${TEST_DB}-shm`)) await unlink(`${TEST_DB}-shm`);
		if (existsSync(`${TEST_DB}-wal`)) await unlink(`${TEST_DB}-wal`);
	}
}

main();
