import { join } from "node:path";
import { Embedder } from "../../resonance/services/embedder";
import { JsonlUtils } from "../../utils/JsonlUtils";
import { PipelineClient } from "./lib/client";

const client = new PipelineClient("embed");

const INPUT_FILE = join(process.cwd(), ".amalfa/golden-lexicon-enriched.jsonl");
// We don't overwrite final-nodes.jsonl with vectors inside.
// We keep nodes clean, and separate vectors.
// But wait, 06-ingest expects final-nodes to have vectors?
// We will output `lexicon-vectors.jsonl`.
const VECTORS_FILE = join(process.cwd(), ".amalfa/lexicon-vectors.jsonl");

async function embed() {
	await client.start();
	try {
		const embedder = Embedder.getInstance();
		await client.log("Initializing Embedder...");
		// Warmup (forces model download if needed)
		await embedder.embed("warmup", true);
		// Actually, if Daemon is running (serving GPU?), let's use it?
		// But for bulk, Local might be faster if Daemon is just on same CPU.
		// Let's stick to default fallback logic.

		await client.log("Starting Embedding Generation...");
		await Bun.write(VECTORS_FILE, "");

		let count = 0;
		let total = 0;

		await JsonlUtils.process<any>(INPUT_FILE, async (node) => {
			total++;

			// Text to embed: Label + Summary
			// If summary is missing (hollow), just use label.
			const text = `${node.label}: ${node.summary || node.label}`;

			try {
				const vector = await embedder.embed(text);
				const embeddingArray = Array.from(vector);

				const vectorEntry = {
					id: node.id,
					embedding: embeddingArray,
					model: "fast-bge-small-en-v1.5",
					timestamp: new Date().toISOString(),
				};

				await JsonlUtils.appendAsync(VECTORS_FILE, vectorEntry);
				count++;
			} catch (e) {
				await client.error(`Failed to embed ${node.id}: ${e}`);
				// Write without embedding? No, fail.
			}

			if (total % 50 === 0) await client.update({ processed: total });
		});

		await client.complete({ generated: count });
	} catch (e) {
		await client.error(String(e));
		process.exit(1);
	}
}

embed();
