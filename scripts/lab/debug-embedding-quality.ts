#!/usr/bin/env bun
import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";

const db = new ResonanceDB(".amalfa/resonance.db");
const vectors = new VectorEngine(db.getRawDb());

console.log("🔬 Embedding Quality Analysis\n");

const TARGET_ID = "2026-01-13-scratchpad-protocol";
const QUERIES = [
	"scratchpad caching",
	"caching large outputs",
	"MCP tool caching",
	"4KB threshold caching",
];

const targetNode = db.getNode(TARGET_ID);
if (!targetNode?.embedding) {
	console.log(`❌ ${TARGET_ID} has no embedding`);
	process.exit(1);
}

console.log(`📄 Target Document: ${TARGET_ID}`);
console.log(`   Embedding dims: ${targetNode.embedding.length}`);
console.log(`   L2 norm: ${Math.sqrt(targetNode.embedding.reduce((sum, v) => sum + v * v, 0)).toFixed(6)}`);

console.log(`\n🔍 Testing Query Similarities:\n`);

for (const query of QUERIES) {
	const queryEmb = await vectors.embed(query);
	if (!queryEmb) {
		console.log(`   ❌ "${query}": Failed to generate embedding`);
		continue;
	}

	const queryFloats = new Float32Array(
		queryEmb.buffer,
		queryEmb.byteOffset,
		queryEmb.byteLength / 4,
	);

	let dotProd = 0;
	for (let i = 0; i < queryFloats.length; i++) {
		dotProd += queryFloats[i] * targetNode.embedding[i];
	}

	console.log(`   "${query}"`);
	console.log(`      Dot product: ${dotProd.toFixed(6)}`);
}

console.log(`\n📊 Actual Document Content Sample:\n`);
const content = await Bun.file(`debriefs/${TARGET_ID}.md`).text();
console.log(content.slice(0, 500));

console.log(`\n🎯 Re-embedding Document Content:\n`);
const freshEmb = await vectors.embed(content.slice(0, 2000));
if (freshEmb) {
	const freshFloats = new Float32Array(
		freshEmb.buffer,
		freshEmb.byteOffset,
		freshEmb.byteLength / 4,
	);

	let dotProd = 0;
	for (let i = 0; i < freshFloats.length; i++) {
		dotProd += freshFloats[i] * targetNode.embedding[i];
	}

	console.log(`   Fresh embedding vs stored embedding similarity: ${dotProd.toFixed(6)}`);
	console.log(`   (Should be ~1.0 if stored embedding is correct)`);
}
