import { pipeline } from "@xenova/transformers";

async function analyzeText() {
	const text =
		"Apple Inc. is looking at buying U.K. startup for $1 billion. Tim Cook announced this in San Francisco.";

	console.log("=== NAMED ENTITY RECOGNITION ===");
	const ner = await pipeline("token-classification", "Xenova/bert-base-NER");
	const nerResults = await ner(text);

	nerResults.forEach((entity: any) => {
		console.log(
			`${entity.word.padEnd(20)} ${entity.entity.padEnd(15)} Score: ${entity.score.toFixed(3)}`,
		);
	});

	console.log("\n=== SENTIMENT ANALYSIS ===");
	const sentiment = await pipeline(
		"sentiment-analysis",
		"Xenova/distilbert-base-uncased-finetuned-sst-2-english",
	);
	const sentimentResult = await sentiment(text);
	console.log(sentimentResult);

	console.log("\n=== ZERO-SHOT CLASSIFICATION ===");
	const classifier = await pipeline(
		"zero-shot-classification",
		"Xenova/distilbert-base-uncased-mnli",
	);
	const classificationResult = await classifier(text, [
		"business",
		"technology",
		"politics",
		"sports",
	]);
	console.log(classificationResult);

	console.log("\n=== FEATURE EXTRACTION (EMBEDDINGS) ===");
	const extractor = await pipeline(
		"feature-extraction",
		"Xenova/all-MiniLM-L6-v2",
	);
	const embeddings = await extractor(text, {
		pooling: "mean",
		normalize: true,
	});
	console.log(`Embedding dimensions: ${embeddings.dims}`);
	console.log(`First 10 values:`, Array.from(embeddings.data.slice(0, 10)));
}

analyzeText();
