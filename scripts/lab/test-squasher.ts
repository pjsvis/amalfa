import { SidecarSquasher } from "@src/core/SidecarSquasher";
import { ResonanceDB } from "@src/resonance/db";
import { toRootRelative } from "@src/utils/projectRoot";
import { readFileSync } from "fs";

console.log("=== Squasher Parent Lookup Test ===\n");

const db = new ResonanceDB(".amalfa/resonance.db");
const squasher = new SidecarSquasher(db);

const sidecarPath = "src/core/GraphEngine.ts.ember.json";

console.log("Step 1: Read sidecar file");
console.log(`Path: ${sidecarPath}\n`);

const content = readFileSync(sidecarPath, "utf-8");
const parsed = JSON.parse(content);

console.log("Step 2: Parse sidecar");
console.log(`Format detected: ${parsed.graphData ? "EmberSidecar" : "Unknown"}`);
console.log(`Has graphData: ${!!parsed.graphData}`);
console.log(
	`Entities count: ${parsed.graphData?.entities?.length || 0}\n`,
);

console.log("Step 3: Resolve parent node");
const relativePath = toRootRelative(sidecarPath);
const parentPath = relativePath.replace(/\.ember\.json$/, "");

console.log(`Sidecar path (input):  ${sidecarPath}`);
console.log(`Relative path:         ${relativePath}`);
console.log(`Parent path:           ${parentPath}`);

const pathAwareId = db.generateId(parentPath);
console.log(`\nPath-aware ID:         ${pathAwareId}`);

let parentNode = db.getNode(pathAwareId);
console.log(`Parent lookup result:  ${parentNode ? "✅ FOUND" : "❌ NOT FOUND"}`);

if (!parentNode) {
	console.log("\nStep 4: Try fallback (filename-only)");
	const filename = parentPath.split("/").pop() || "";
	const fallbackId = db.generateId(filename);
	console.log(`Filename:              ${filename}`);
	console.log(`Fallback ID:           ${fallbackId}`);

	parentNode = db.getNode(fallbackId);
	console.log(
		`Fallback lookup:       ${parentNode ? "✅ FOUND" : "❌ NOT FOUND"}`,
	);
}

if (parentNode) {
	console.log("\nStep 5: Parent node details");
	console.log(`ID:     ${parentNode.id}`);
	console.log(`Type:   ${parentNode.type}`);
	console.log(`Title:  ${parentNode.label}`);
	console.log(`Domain: ${parentNode.domain}`);
	console.log(`Layer:  ${parentNode.layer}`);
}

console.log("\n=== Squasher Execution Test ===\n");

const result = await squasher.squashFile(sidecarPath);

if (result) {
	console.log("✅ Squash SUCCESSFUL");
	console.log(`Nodes added: ${result.nodes}`);
	console.log(`Edges added: ${result.edges}`);
} else {
	console.log("❌ Squash FAILED (returned null)");
	console.log("\nPossible reasons:");
	console.log("  1. Sidecar has no graphData");
	console.log("  2. Parent node not found");
	console.log("  3. JSON parsing error");
	console.log("  4. Other validation failure");
}

db.close();
