import assert from "node:assert";
import { join } from "node:path";
import type { IngestionArtifact } from "@src/types/artifact.js";
import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

console.log("Starting Round-Trip Verification...");

// 1. Read Original Artifacts
const artifactPath = join(
	process.cwd(),
	".resonance",
	"artifacts",
	"docs.json",
);
const originals: IngestionArtifact[] = await Bun.file(artifactPath).json();

// 2. Read from DB
const db = DatabaseFactory.connectToResonance(undefined, { readonly: true });

const rows = db
	.query(`
    SELECT id, type, title, content, domain, layer, metadata 
    FROM nodes 
    WHERE type IN ('playbook', 'debrief')
    ORDER BY id ASC
`)
	.all() as {
	id: string;
	type: "playbook" | "debrief";
	title: string;
	content: string;
	domain: string;
	layer: string;
	metadata: string;
}[];

// 3. Reconstruct
const recovered: IngestionArtifact[] = rows.map((row) => ({
	id: row.id,
	type: row.type,
	order_index: 0, // Fallback for recovered artifacts
	// order_index: row.order_index, // deprecated
	payload: {
		title: row.title,
		content: row.content,
		domain: row.domain,
		layer: row.layer,
		metadata: JSON.parse(row.metadata || "{}"),
	},
}));

// 4. Compare
console.log(`Originals: ${originals.length}, Recovered: ${recovered.length}`);

try {
	assert.deepStrictEqual(recovered, originals);
	console.log(
		"✅ VERIFICATION SUCCESS: Database perfectly matches Intermediate Artifacts.",
	);
} catch (_e) {
	console.error("❌ VERIFICATION FAILED: Data mismatch.");
	// Simple diff
	for (let i = 0; i < originals.length; i++) {
		if (JSON.stringify(originals[i]) !== JSON.stringify(recovered[i])) {
			console.log(`Mismatch at index ${i} (ID: ${originals[i]?.id})`);
			// console.log("Expected:", originals[i]);
			// console.log("Got:     ", recovered[i]);
			break;
		}
	}
	process.exit(1);
}

db.close();
