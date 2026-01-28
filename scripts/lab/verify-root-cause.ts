import { ResonanceDB } from "@src/resonance/db";
import { toRootRelative } from "@src/utils/projectRoot";

console.log("=== Root Cause Verification ===\n");

const db = new ResonanceDB(".amalfa/resonance.db");

const sidecarPath = "src/core/GraphEngine.ts.ember.json";
const relativePath = toRootRelative(sidecarPath);

console.log("Current (broken) logic:");
const brokenParentPath = relativePath.replace(/\.json$/, "");
const brokenId = db.generateId(brokenParentPath);
const brokenNode = db.getNode(brokenId);

console.log(`  Sidecar:     ${relativePath}`);
console.log(`  Parent path: ${brokenParentPath}`);
console.log(`  Generated ID: ${brokenId}`);
console.log(`  Node found:  ${brokenNode ? "✅ YES" : "❌ NO"}\n`);

console.log("Fixed logic:");
const fixedParentPath = relativePath.replace(/\.ember\.json$/, "");
const fixedId = db.generateId(fixedParentPath);
const fixedNode = db.getNode(fixedId);

console.log(`  Sidecar:     ${relativePath}`);
console.log(`  Parent path: ${fixedParentPath}`);
console.log(`  Generated ID: ${fixedId}`);
console.log(`  Node found:  ${fixedNode ? "✅ YES" : "❌ NO"}\n`);

console.log("VERDICT:");
if (!brokenNode && fixedNode) {
	console.log("✅ ROOT CAUSE CONFIRMED");
	console.log("   Issue: Regex pattern /\\.json$/ should be /\\.ember\\.json$/");
	console.log("   Impact: Broken pattern creates wrong parent path");
	console.log(`   Wrong:  "${brokenParentPath}" → ID "${brokenId}"`);
	console.log(`   Right:  "${fixedParentPath}" → ID "${fixedId}"`);
} else {
	console.log("❌ Different issue - needs more investigation");
}

db.close();
