#!/usr/bin/env bun
import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";

const db = new ResonanceDB(".amalfa/resonance.db");
const vectors = new VectorEngine(db.getRawDb());

console.log("🔍 Vector Recall Debug Session\n");
console.log("=" .repeat(60));

const TARGET_DOCS = [
	"2026-01-13-scratchpad-protocol",
	"typescript-patterns-playbook",
];

const TEST_QUERIES = [
	"caching large MCP tool outputs over 4KB",
	"TypeScript regex capture group type handling",
	"scratchpad protocol",
	"typescript patterns",
];

console.log("\n📊 Step 1: Verify Target Documents Exist\n");
for (const docId of TARGET_DOCS) {
	const node = db.getNode(docId);
	if (!node) {
		console.log(`   ❌ ${docId}: NOT FOUND`);
		continue;
	}

	const embSize = node.embedding
		? node.embedding.length * Float32Array.BYTES_PER_ELEMENT
		: 0;
	console.log(`   ✅ ${docId}`);
	console.log(`      Embedding: ${embSize} bytes (${node.embedding?.length || 0} dims)`);
	console.log(`      Title: ${node.label}`);
	console.log(`      Date: ${node.date || "none"}`);

	if (node.embedding && node.embedding.length > 0) {
		const emb = node.embedding;
		let sum = 0;
		for (let i = 0; i < emb.length; i++) {
			sum += emb[i] * emb[i];
		}
		const magnitude = Math.sqrt(sum);
		console.log(`      L2 Norm: ${magnitude.toFixed(6)} (should be ~1.0 for FAFCAS)`);
	}
}

console.log("\n📊 Step 2: Test Queries Against Target Documents\n");

for (const query of TEST_QUERIES) {
	console.log(`\n🔍 Query: "${query}"`);

	const results = await vectors.search(query, 20);

	const targetPositions = TARGET_DOCS.map((docId) => {
		const idx = results.findIndex((r) => r.id === docId);
		const score = idx >= 0 ? results[idx]?.score : undefined;
		return { docId, position: idx, score };
	});

	console.log(`   Top 5 results:`);
	results.slice(0, 5).forEach((r, i) => {
		const isTarget = TARGET_DOCS.includes(r.id) ? " ⭐" : "";
		console.log(`      ${i + 1}. ${r.id} (${r.score.toFixed(3)})${isTarget}`);
	});

	console.log(`\n   Target document positions:`);
	for (const { docId, position, score } of targetPositions) {
		if (position === -1) {
			console.log(`      ❌ ${docId}: NOT IN TOP 20`);
		} else {
			const scoreStr = score !== undefined ? score.toFixed(3) : "N/A";
			console.log(
				`      ${position < 5 ? "✅" : "⚠️"} ${docId}: #${position + 1} (score: ${scoreStr})`,
			);
		}
	}
}

console.log("\n📊 Step 3: Manual Similarity Calculation\n");

const queryText = "scratchpad caching protocol";
console.log(`Testing query: "${queryText}"`);

const queryEmb = await vectors.embed(queryText);
if (!queryEmb) {
	console.log("❌ Failed to generate query embedding");
	process.exit(1);
}

const queryFloats = new Float32Array(
	queryEmb.buffer,
	queryEmb.byteOffset,
	queryEmb.byteLength / 4,
);

const targetNode = db.getNode("2026-01-13-scratchpad-protocol");
if (!targetNode?.embedding) {
	console.log("❌ Target document has no embedding");
	process.exit(1);
}

function dotProduct(a: Float32Array, b: Float32Array): number {
	let sum = 0;
	for (let i = 0; i < a.length; i++) {
		sum += a[i] * b[i];
	}
	return sum;
}

const manualScore = dotProduct(queryFloats, targetNode.embedding);
console.log(`\n   Manual dot product score: ${manualScore.toFixed(6)}`);
console.log(`   (Scores > 0.5 are typically relevant)`);

console.log("\n📊 Step 4: Check Top Scoring Documents\n");

const allNodes = db.getNodes();
const scored: Array<{ id: string; score: number }> = [];

console.log(`   Processing ${allNodes.length} nodes...`);

for (const node of allNodes) {
	if (!node.embedding) {
		console.log(`      Skipping ${node.id} (no embedding)`);
		continue;
	}
	const score = dotProduct(queryFloats, node.embedding);
	scored.push({ id: node.id, score });
	
	if (TARGET_DOCS.includes(node.id)) {
		console.log(`      ⭐ Found target: ${node.id} (score: ${score.toFixed(3)})`);
	}
}

console.log(`   Scored: ${scored.length} nodes\n`);

scored.sort((a, b) => b.score - a.score);

console.log("   Top 10 by manual calculation:");
scored.slice(0, 10).forEach((item, i) => {
	const isTarget = TARGET_DOCS.includes(item.id) ? " ⭐" : "";
	console.log(`      ${i + 1}. ${item.id} (${item.score.toFixed(3)})${isTarget}`);
});

const scratchpadIdx = scored.findIndex((s) => s.id === "2026-01-13-scratchpad-protocol");
const scratchpadRank = scratchpadIdx >= 0 ? scratchpadIdx + 1 : "NOT FOUND";
const scratchpadScore = scratchpadIdx >= 0 ? scored[scratchpadIdx].score.toFixed(3) : "N/A";
console.log(`\n   2026-01-13-scratchpad-protocol: #${scratchpadRank}/${scored.length} (score: ${scratchpadScore})`);

console.log("\n" + "=" .repeat(60));
console.log("✅ Debug session complete\n");
