import { existsSync } from "node:fs";
import { join } from "node:path";
import { JsonlUtils } from "../../utils/JsonlUtils";
import { PipelineClient } from "./lib/client";

const client = new PipelineClient("edges");

const ROOT = process.env.AMALFA_PIPE_ROOT || process.cwd();
const GOLDEN_FILE = join(ROOT, ".amalfa/golden-lexicon-enriched.jsonl"); // Using Enriched Nodes (Layer A)
const MANIFEST_FILE = join(ROOT, ".amalfa/cache/manifest.jsonl");
const CACHE_DIR = join(ROOT, ".amalfa/cache/lang-extract");
const OUTPUT_FILE = join(ROOT, ".amalfa/proposed-edges.jsonl");

const validNodeIds = new Set<string>();

// Helper
function generateId(input: string): string {
	const _withoutRelativePrefix = input.replace(/^.*\/|\\/, "");
	const lowercased = input.toLowerCase();
	const alphanumericWithSlashes = lowercased.replace(/[^a-z0-9/]/g, "-");
	const collapsed = alphanumericWithSlashes
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
	return collapsed;
}

// Sidecar Loader
const sidecarCache = new Map<string, any>();
async function getSidecar(hash: string) {
	if (sidecarCache.has(hash)) return sidecarCache.get(hash);
	const path = join(CACHE_DIR, `${hash}.json`);
	if (await Bun.file(path).exists()) {
		try {
			const data = await Bun.file(path).json();
			if (sidecarCache.size > 200) sidecarCache.clear();
			sidecarCache.set(hash, data);
			return data;
		} catch {
			return null;
		}
	}
	return null;
}

async function survey() {
	await client.start();
	try {
		await client.log("Loading Nodes for validation...");
		await JsonlUtils.process<any>(GOLDEN_FILE, async (node) => {
			if (node.id) validNodeIds.add(node.id);
		});
		await client.log(`Loaded ${validNodeIds.size} Valid Ids`);

		if (!existsSync(MANIFEST_FILE)) throw new Error("Manifest missing");

		await Bun.write(OUTPUT_FILE, "");

		let edgeCount = 0;
		let accepted = 0;
		let processedSidecars = 0;

		await JsonlUtils.process<any>(MANIFEST_FILE, async (entry) => {
			if (!entry.hash) return;
			const sidecar = await getSidecar(entry.hash);
			processedSidecars++;

			if (sidecar?.relationships) {
				for (const rel of sidecar.relationships) {
					edgeCount++;
					const srcId = generateId(rel.source);
					const tgtId = generateId(rel.target);

					if (validNodeIds.has(srcId) && validNodeIds.has(tgtId)) {
						if (srcId === tgtId) continue;
						const edge = {
							source: srcId,
							target: tgtId,
							type: rel.type || "RELATED",
							weight: 1.0,
							meta: { origin: entry.hash, desc: rel.description },
						};
						await JsonlUtils.appendAsync(OUTPUT_FILE, edge);
						accepted++;
					}
				}
			}
			if (processedSidecars % 50 === 0)
				await client.update({ sidecars: processedSidecars, edges: accepted });
		});

		await client.complete({
			scanned: processedSidecars,
			candidates: edgeCount,
			accepted,
		});
	} catch (e) {
		await client.error(String(e));
		process.exit(1);
	}
}

survey();
