import { join } from "node:path";
import { AMALFA_DIRS } from "../../config/defaults";
import { LexiconHarvester } from "../../core/LexiconHarvester";
import { PipelineClient } from "./lib/client";

const client = new PipelineClient("harvest");

async function main() {
	await client.start();
	try {
		const harvester = new LexiconHarvester({
			cacheDir: join(AMALFA_DIRS.cache, "lang-extract"),
			stopListPath: join(process.cwd(), "lexicon-stoplist.json"),
			outputPath: join(process.cwd(), ".amalfa/lexicon-candidates.jsonl"),
		});

		await client.log("Initializing Harvester...");

		// Capture console.log to client log?
		const originalLog = console.log;
		console.log = (...args) => {
			originalLog(...args);
			client.log(args.map((a) => String(a)).join(" "));
		};

		await harvester.harvest();

		// Restore
		console.log = originalLog;

		// Report Stats
		const file = Bun.file(
			join(process.cwd(), ".amalfa/lexicon-candidates.jsonl"),
		);
		if (await file.exists()) {
			const text = await file.text();
			const count = text.trim().split("\n").filter(Boolean).length;
			await client.complete({ candidates: count });
		} else {
			await client.error("Output file empty");
		}
	} catch (e) {
		await client.error(String(e));
		process.exit(1);
	}
}

main();
