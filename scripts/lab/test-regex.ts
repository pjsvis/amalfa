import { toRootRelative } from "@src/utils/projectRoot";

console.log("=== Regex Test: .ember.json Replacement ===\n");

const testCases = [
	"src/core/GraphEngine.ts.json",
	"src/core/GraphEngine.ts.ember.json",
	"docs/README.md.json",
	"docs/README.md.ember.json",
];

for (const sidecarPath of testCases) {
	const relativePath = toRootRelative(sidecarPath);

	const oldPattern = relativePath.replace(/\.json$/, "");
	const newPattern = relativePath.replace(/\.ember\.json$/, "");

	console.log(`Input:        ${sidecarPath}`);
	console.log(`Relative:     ${relativePath}`);
	console.log(`Old (.json):  ${oldPattern}`);
	console.log(`New (.ember): ${newPattern}`);
	console.log(`Match: ${oldPattern === newPattern ? "⚠️  SAME" : "✅ DIFFERENT"}\n`);
}
