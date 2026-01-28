---
tags:
  - extracted
  - test
---
/**
 * src/services/reranker.ts
 * Implements the BAAI/bge-reranker-v2-m3 Cross-Encoder.
 * Used to filter high-entropy search results into low-entropy context.
 */
import {
	AutoModelForSequenceClassification,
	AutoTokenizer,
	type PreTrainedModel,
	type PreTrainedTokenizer,
} from "@xenova/transformers";

// Helper: Sigmoid function to map raw logits to [0, 1] probability
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

export interface RerankResult {
	text: string;
	score: number;
	originalIndex: number;
}

export class BgeReranker {
	private static instance: BgeReranker;
	private tokenizer: PreTrainedTokenizer | null = null;
	private model: PreTrainedModel | null = null;

	// The quantized ONNX model optimized for CPU inference
	// Note: Using bge-reranker-base as v2-m3 may have access restrictions
	private modelId = "Xenova/bge-reranker-base";

	private constructor() {}

	/**
	 * Singleton accessor. Ensures the heavy model is only loaded once per process.
	 */
	public static async getInstance(): Promise<BgeReranker> {
		if (!BgeReranker.instance) {
			BgeReranker.instance = new BgeReranker();
			await BgeReranker.instance.init();
		}
		return BgeReranker.instance;
	}

	/**
	 * Loads the model and tokenizer from the local cache or HuggingFace Hub.
	 */
	private async init() {
		console.log(`[Reranker] Initializing ${this.modelId} (ONNX)...`);
		try {
			this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId);
			this.model = await AutoModelForSequenceClassification.from_pretrained(
				this.modelId,
			);
			console.log("[Reranker] Model operational.");
		} catch (err) {
			console.error("[Reranker] Initialization failed:", err);
			throw err;
		}
	}

	/**
	 * Re-ranks a list of candidate documents against a specific query.
	 * @param query The user's search intent.
	 * @param documents The raw candidate strings (from Vector or Graph search).
	 * @param topK (Optional) Number of results to return. Defaults to all.
	 * @param threshold (Optional) Minimum score (0-1) to include. Defaults to 0.
	 */
	public async rerank(
		query: string,
		documents: string[],
		topK?: number,
		threshold = 0,
	): Promise<RerankResult[]> {
		if (!this.tokenizer || !this.model)
			throw new Error("Reranker not initialized. Call getInstance() first.");
		if (documents.length === 0) return [];

		// 1. Tokenize Pairs: [CLS] query [SEP] doc [SEP]
		const features = await this.tokenizer(
			new Array(documents.length).fill(query),
			{
				text_pair: documents,
				padding: true,
				truncation: true,
				max_length: 512,
				return_tensors: "pt",
			},
		);

		// 2. Inference: Run the cross-encoder
		// output.logits shape: [batch_size, 1]
		const output = await this.model(features);

		// 3. Extract scores - logits.data is a typed array
		const scores: number[] = Array.from(output.logits.data as Float32Array);

		// 4. Map, Normalize, Sort
		const results = documents
			.map((doc, index) => ({
				text: doc,
				score: sigmoid(scores[index] ?? 0),
				originalIndex: index,
			}))
			.filter((r) => r.score >= threshold)
			.sort((a, b) => b.score - a.score);

		return topK ? results.slice(0, topK) : results;
	}
}
