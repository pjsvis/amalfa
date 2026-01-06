import { basename, join } from "node:path";
import type { IngestionArtifact } from "@src/types/artifact";
import { Glob } from "bun";
import settings from "@/polyvis.settings.json";

const artifacts: IngestionArtifact[] = [];
const root = process.cwd();

// --- Helpers ---
function extractTitle(content: string, filename: string): string {
	const match = content.match(/^#\s+(.+)$/m);
	return match?.[1] ? match[1].trim() : filename;
}

// --- Transformation Loop ---
let orderCounter = 0;

for (const source of settings.paths.sources.experience) {
	const sourceDirRelative = source.path;
	const sourceDir = join(root, sourceDirRelative);
	console.log(`Scanning ${sourceDir}...`);

	const glob = new Glob("*.md");
	// Sort logic is implicit in file system usually, but better to be explicit
	// Array.from(glob.scanSync) gives unsorted?
	const files = Array.from(glob.scanSync(sourceDir)).sort();

	for (const file of files) {
		const fullPath = join(sourceDir, file);
		const content = await Bun.file(fullPath).text();
		const id = basename(file, ".md");
		const type: "playbook" | "debrief" = sourceDirRelative.includes("playbooks")
			? "playbook"
			: "debrief";

		artifacts.push({
			id,
			type,
			order_index: orderCounter++,
			payload: {
				title: extractTitle(content, id),
				content: content,
				domain: "knowledge",
				layer: "experience",
				metadata: { path: fullPath },
			},
		});
	}
}

// --- Output ---
const outDir = join(root, ".resonance", "artifacts");
if (!require("node:fs").existsSync(outDir)) {
	require("node:fs").mkdirSync(outDir, { recursive: true });
}

const outFile = join(outDir, "docs.json");
await Bun.write(outFile, JSON.stringify(artifacts, null, 2));

console.log(`✅ Transformed ${artifacts.length} docs to ${outFile}`);
