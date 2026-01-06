import { parseArgs } from "node:util";
import { AutoTagger } from "@src/gardeners/AutoTagger";
import { ResonanceDB } from "@src/resonance/db";

// Parse Args
const { values } = parseArgs({
	args: Bun.argv,
	options: {
		agent: { type: "string" },
		limit: { type: "string" }, // parseArgs considers numbers as strings often? Safe to cast.
	},
	strict: true,
	allowPositionals: true,
});

const limit = values.limit ? parseInt(values.limit, 10) : 5;
const agentName = values.agent || "tag";

async function main() {
	console.log("🌿 PolyVis Garden CLI");

	// Load DB (Auto-configured by Factory)
	const db = ResonanceDB.init();

	if (agentName === "tag") {
		const gardener = new AutoTagger(db);
		await gardener.run(limit);
	} else {
		console.error(`Unknown agent: ${agentName}`);
	}
}

main();
