/**
 * src/services/reranker-hf.ts
 * Implements BGE reranker using @huggingface/transformers (no sharp dependency)
 *
 * Uses Hugging Face's Transformers.js which runs ONNX models via WASM/WebGPU
 * without requiring native dependencies like sharp.
 */

import {
	AutoModelForSequenceClassification,
	AutoTokenizer,
	type PreTrainedModel,
	type PreTrainedTokenizer,
} from "@huggingface/transformers";

export interface RerankResult {
	text: string;
	score: number;
	originalIndex: number;
}

export class HfBgeReranker {
	private static instance: HfBgeReranker;
	private tokenizer: PreTrainedTokenizer | null = null;
	private model: PreTrainedModel | null = null;

	// Using BGE reranker base model (ONNX quantized)
	private modelId = "Xenova/bge-reranker-base";

	private constructor() {}

	/**
	 * Singleton accessor. Ensures the heavy model is only loaded once per process.
	 */
	public static async getInstance(): Promise<HfBgeReranker> {
		if (!HfBgeReranker.instance) {
			HfBgeReranker.instance = new HfBgeReranker();
			await HfBgeReranker.instance.init();
		}
		return HfBgeReranker.instance;
	}

	/**
	 * Loads the reranker model and tokenizer
	 */
	private async init() {
		console.log(
			`[Reranker] Initializing ${this.modelId} (ONNX via Transformers.js)...`,
		);
		try {
			// Load tokenizer and model directly (not pipeline) to access raw logits
			this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId);
			this.model = await AutoModelForSequenceClassification.from_pretrained(
				this.modelId,
				{
					dtype: "q8", // 8-bit quantization
				},
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

		try {
			// Create query-document pairs for cross-encoder
			// Format: "query [SEP] document"
			const pairs = documents.map((doc) => `${query} [SEP] ${doc}`);

			// Tokenize all pairs
			const inputs = await this.tokenizer(pairs, {
				padding: true,
				truncation: true,
				return_tensors: "pt",
			});

			// Run inference to get raw logits
			const { logits } = await this.model(inputs);

			// Extract logits (shape: [batch_size, 1])
			// BGE reranker outputs single logit per pair (regression, not classification)
			const logitValues = Array.from(logits.data as Float32Array);

			// Transform to our format
			// Higher logit = more relevant (don't need sigmoid, raw logits work fine)
			const scored = documents.map((doc, index) => {
				const logit = logitValues[index] ?? 0;
				// Apply sigmoid to normalize to [0, 1] range
				const score = 1 / (1 + Math.exp(-logit));

				return {
					text: doc,
					score,
					originalIndex: index,
				};
			});

			// Filter by threshold and sort by score
			const filtered = scored
				.filter((r) => r.score >= threshold)
				.sort((a, b) => b.score - a.score);

			// Apply topK limit if specified
			return topK ? filtered.slice(0, topK) : filtered;
		} catch (error) {
			console.error("[Reranker] Reranking failed:", error);
			throw error;
		}
	}
}
