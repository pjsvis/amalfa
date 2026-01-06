import { join } from "node:path";
import { AutoTagger } from "../../src/gardeners/AutoTagger";
import { ResonanceDB } from "../../src/resonance/db";

async function main() {
	const dbPath = join(process.cwd(), "public/resonance.db");
	const db = new ResonanceDB(dbPath);
	const gardener = new AutoTagger(db);

	console.log("Running Gardener Debug...");
	await gardener.run(1);
	console.log("Gardener Debug Complete.");
}

await main();
