import { ResonanceDB } from "@src/resonance/db";
import { toRootRelative } from "@src/utils/projectRoot";

console.log("=== Test 1: generateId() Path-Aware Logic ===\n");

const db = new ResonanceDB(".amalfa/resonance.db");

const testCases = [
	{ input: "GraphEngine.ts", expected: "graphengine" },
	{ input: "src/core/GraphEngine.ts", expected: "src-core-graphengine" },
	{ input: "./docs/README.md", expected: "docs-readme" },
	{ input: "scripts/lab/test.ts", expected: "scripts-lab-test" },
	{ input: "../outside.md", expected: "outside" },
];

console.log("Testing generateId() implementation:\n");

for (const test of testCases) {
	const result = db.generateId(test.input);
	const status = result === test.expected ? "✅" : "❌";
	console.log(`${status} Input: "${test.input}"`);
	console.log(`   Expected: "${test.expected}"`);
	console.log(`   Got:      "${result}"\n`);
}

console.log("\n=== Test 2: Sidecar Path Resolution ===\n");

const sidecarPath = "src/core/GraphEngine.ts.ember.json";
const relativePath = toRootRelative(sidecarPath);
const parentPath = relativePath.replace(/\.ember\.json$/, "");
const parentId = db.generateId(parentPath);

console.log(`Sidecar:      "${sidecarPath}"`);
console.log(`Relative:     "${relativePath}"`);
console.log(`Parent path:  "${parentPath}"`);
console.log(`Generated ID: "${parentId}"`);

const parentNode = db.getNode(parentId);
console.log(`Parent found: ${parentNode ? "✅ YES" : "❌ NO"}`);

if (parentNode) {
	console.log(`Parent data:  id="${parentNode.id}", title="${parentNode.label}"`);
}

console.log("\n=== Test 3: Database Node Lookup ===\n");

const lookupTests = [
	"graphengine",
	"src-core-graphengine",
	"readme",
	"src-readme",
];

for (const id of lookupTests) {
	const node = db.getNode(id);
	const status = node ? "✅" : "❌";
	console.log(`${status} Lookup: "${id}" → ${node ? `"${node.label}"` : "NOT FOUND"}`);
}

db.close();
