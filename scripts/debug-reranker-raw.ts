#!/usr/bin/env bun
/**
 * Try accessing raw model logits instead of pipeline
 */

import { AutoTokenizer, AutoModelForSequenceClassification } from "@huggingface/transformers";

async function debug() {
	console.log("Loading model directly...");
	
	const model_id = "Xenova/bge-reranker-base";
	const tokenizer = await AutoTokenizer.from_pretrained(model_id);
	const model = await AutoModelForSequenceClassification.from_pretrained(model_id, {
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

	// Tokenize pairs
	const pairs = docs.map(doc => `${query} [SEP] ${doc}`);
	
	console.log("\n=== Tokenizing ===");
	const inputs = await tokenizer(pairs, {
		padding: true,
		truncation: true,
		return_tensors: "pt",
	});
	
	console.log("Input IDs shape:", inputs.input_ids.dims);

	console.log("\n=== Running inference ===");
	const { logits } = await model(inputs);
	
	console.log("Logits shape:", logits.dims);
	console.log("Logits data:", logits.data);
	
	// Apply sigmoid to get scores
	const scores = Array.from(logits.data as Float32Array).map(logit => 
		1 / (1 + Math.exp(-logit))
	);
	
	console.log("\n=== Results ===");
	docs.forEach((doc, i) => {
		console.log(`${i + 1}. [${scores[i]?.toFixed(4)}] ${doc}`);
	});
}

debug().catch(console.error);
