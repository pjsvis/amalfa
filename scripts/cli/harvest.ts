import { parseArgs } from "node:util";
import { HarvesterPipeline } from "@src/pipeline/HarvesterPipeline";

/**
 * RESONANCE HARVESTER CLI
 */
async function main() {
	const { values } = parseArgs({
		args: Bun.argv,
		options: {
			target: { type: "string" },
		},
		strict: true,
		allowPositionals: true,
	});

	const pipeline = new HarvesterPipeline();
	await pipeline.run(values.target ? String(values.target) : undefined);
}

if (import.meta.main) {
	main().catch(console.error);
}
