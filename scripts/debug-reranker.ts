#!/usr/bin/env bun
/**
 * Debug script to inspect raw reranker output
 */

import { pipeline } from "@huggingface/transformers";

async function debug() {
	console.log("Loading model...");
	const pipe = await pipeline("text-classification", "Xenova/bge-reranker-base", {
		device: "cpu",
		dtype: "q8",
	});

	const query = "database implementation";
	const docs = [
		"SQLite database with vectors", // Highly relevant
		"CSS styling guide",             // Not relevant
	];

	console.log("\nQuery:", query);
	console.log("\nDocuments:");
	docs.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));

	// Try different formats
	console.log("\n=== Test 1: Query [SEP] Doc format ===");
	const pairs = docs.map(doc => `${query} [SEP] ${doc}`);
	const result1 = await pipe(pairs);
	console.log("Raw output:", JSON.stringify(result1, null, 2));

	console.log("\n=== Test 2: With top_k option ===");
	const result2 = await pipe(pairs, { top_k: null });
	console.log("Raw output:", JSON.stringify(result2, null, 2));

	console.log("\n=== Test 3: Single pair ===");
	const result3 = await pipe(pairs[0]);
	console.log("Raw output:", JSON.stringify(result3, null, 2));
}

debug();
