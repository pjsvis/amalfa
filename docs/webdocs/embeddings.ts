/**
 * Portable embeddings client for OpenAI embeddings and Ollama reranker helper.
 *
 * This file is intentionally self-contained and dependency-light so you can
 * lift-and-shift it into other projects (e.g., ctx-assimilation-mcp).
 *
 * Features:
 *  - `EmbeddingsClient` class exposing:
 *      - `embedWithOpenAI(texts)`           : batch embed texts via OpenAI HTTP API
 *      - `cosineSimilarity(a, b)`           : vector similarity helper
 *      - `rankCandidatesByEmbedding(...)`   : score & rank candidates by cosine similarity
 *      - `ollamaRerank(query, candidates)`  : ask a local Ollama model to re-rank candidates
 *      - `rerankWithHybrid(...)`            : choose OpenAI embeddings or Ollama reranker
 *
 * Notes:
 *  - Uses global `fetch` (available in Bun, recent Node, Deno). If your runtime
 *    doesn't expose fetch, provide a polyfill or replace calls.
 *  - OpenAI: requires `process.env.OPENAI_API_KEY`. Optional env: OPENAI_EMBEDDING_MODEL.
 *  - Ollama: requires `process.env.OLLAMA_BASE_URL` and optional `process.env.OLLAMA_MODEL`.
 *  - This module performs defensive validation (dimension checks, null handling).
 *
 * Usage (example):
 *  const client = new EmbeddingsClient();
 *  const vecs = await client.embedWithOpenAI(["hello world"]);
 *  const ranked = await client.rerankWithHybrid("Who is Ada Lovelace?", candidates, { topK: 10 });
 */

type FloatVector = number[];

/**
 * Candidate shape used for reranking flows.
 */
export interface Candidate {
	id: string;
	text?: string | null;
	metadata?: Record<string, any> | null;
	vector?: FloatVector | null;
	score?: number | null; // generic score (from model)
	similarity?: number | null; // cosine similarity when applicable
	raw?: any;
}

export interface RankOptions {
	topK?: number;
	// If true, will return full candidate objects; otherwise minimal {id,score,...}
	fullObjects?: boolean;
}

/**
 * Lightweight errors for the module
 */
export class EmbeddingsError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "EmbeddingsError";
	}
}

/**
 * EmbeddingsClient: single class to orchestrate embedding + rerank helpers.
 */
export class EmbeddingsClient {
	openaiKey: string | null;
	openaiModel: string;
	ollamaBaseUrl: string | null;
	ollamaModel: string | null;
	defaultTopK: number;

	constructor(opts?: {
		openaiKey?: string | null;
		openaiModel?: string;
		ollamaBaseUrl?: string | null;
		ollamaModel?: string | null;
		defaultTopK?: number;
	}) {
		this.openaiKey = opts?.openaiKey ?? process.env.OPENAI_API_KEY ?? null;
		this.openaiModel =
			opts?.openaiModel ??
			process.env.OPENAI_EMBEDDING_MODEL ??
			"text-embedding-3-small";
		this.ollamaBaseUrl =
			opts?.ollamaBaseUrl ?? process.env.OLLAMA_BASE_URL ?? null;
		this.ollamaModel = opts?.ollamaModel ?? process.env.OLLAMA_MODEL ?? null;
		this.defaultTopK = opts?.defaultTopK ?? 10;
	}

	/* ---------------------------
	 * Vector math helpers
	 * --------------------------- */

	/**
	 * Dot product of two vectors. Returns 0 for invalid inputs.
	 */
	static dot(
		a: FloatVector | null | undefined,
		b: FloatVector | null | undefined,
	): number {
		if (!a || !b) return 0;
		const n = Math.min(a.length, b.length);
		let s = 0;
		for (let i = 0; i < n; i++) {
			const valA = a[i];
			const valB = b[i];
			if (typeof valA === "number" && typeof valB === "number") {
				s += valA * valB;
			}
		}
		return s;
	}

	/**
	 * Euclidean norm of a vector. Returns 0 for invalid input.
	 */
	static norm(a: FloatVector | null | undefined): number {
		if (!a) return 0;
		return Math.sqrt(EmbeddingsClient.dot(a, a));
	}

	/**
	 * Cosine similarity between vectors a and b. Returns null if vectors are invalid.
	 */
	static cosineSimilarity(
		a: FloatVector | null | undefined,
		b: FloatVector | null | undefined,
	): number | null {
		if (!a || !b || a.length === 0 || b.length === 0) return null;
		const na = EmbeddingsClient.norm(a);
		const nb = EmbeddingsClient.norm(b);
		if (!na || !nb) return null;
		return EmbeddingsClient.dot(a, b) / (na * nb);
	}

	/* ---------------------------
	 * OpenAI Embeddings
	 * --------------------------- */

	/**
	 * Embed texts with OpenAI via the HTTP embeddings endpoint.
	 *
	 * Returns an array of vectors (FloatVector). Throws EmbeddingsError on failure.
	 */
	async embedWithOpenAI(
		texts: string[],
		options?: { model?: string; timeoutMs?: number },
	): Promise<FloatVector[]> {
		if (!Array.isArray(texts) || texts.length === 0) {
			throw new EmbeddingsError(
				"embedWithOpenAI requires a non-empty array of texts",
			);
		}
		const key = this.openaiKey;
		if (!key) {
			throw new EmbeddingsError(
				"OpenAI API key not configured (OPENAI_API_KEY)",
			);
		}
		const model = options?.model ?? this.openaiModel;

		// Prepare request
		const url = "https://api.openai.com/v1/embeddings";
		const body = JSON.stringify({
			model,
			input: texts,
		});

		const resp = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${key}`,
				"Content-Type": "application/json",
			},
			body,
		});

		if (!resp.ok) {
			const txt = await resp.text().catch(() => "<no body>");
			throw new EmbeddingsError(
				`OpenAI embeddings request failed: ${resp.status} ${resp.statusText} - ${txt}`,
			);
		}

		const json = await resp.json().catch(() => null);
		if (!json || !Array.isArray(json.data)) {
			throw new EmbeddingsError(
				"Unexpected OpenAI response shape for embeddings",
			);
		}

		// Defensive: ensure each item has embedding
		const vectors: FloatVector[] = [];
		for (const item of json.data) {
			if (!item || !Array.isArray(item.embedding)) {
				throw new EmbeddingsError("OpenAI returned a malformed embedding item");
			}
			vectors.push(item.embedding.map((n: any) => Number(n)));
		}
		return vectors;
	}

	/* ---------------------------
	 * Candidate ranking using embeddings
	 * --------------------------- */

	/**
	 * Score and rank candidates by cosine similarity against a single query vector.
	 * Candidates without vectors are given similarity=null and placed at the end.
	 */
	rankCandidatesByEmbedding(
		queryVec: FloatVector,
		candidates: Candidate[],
		topK?: number,
	): Candidate[] {
		const scored = candidates.map((c) => {
			const sim = EmbeddingsClient.cosineSimilarity(queryVec, c.vector ?? null);
			return {
				...c,
				similarity: sim,
			};
		});

		scored.sort((a, b) => {
			const aa = typeof a.similarity === "number" ? a.similarity : -Infinity;
			const bb = typeof b.similarity === "number" ? b.similarity : -Infinity;
			return bb - aa;
		});

		const k = topK ?? this.defaultTopK;
		return scored.slice(0, k);
	}

	/**
	 * Convenience wrapper: given a query string and candidate set, optionally
	 * compute a query embedding via OpenAI and return topK candidates by cosine similarity.
	 *
	 * If candidates already have vectors, you may skip computeQueryEmbedding.
	 */
	async rankWithOpenAI(
		query: string,
		candidates: Candidate[],
		opts?: {
			topK?: number;
			useExistingCandidateVectors?: boolean;
			model?: string;
		},
	): Promise<Candidate[]> {
		if (!query || typeof query !== "string")
			throw new EmbeddingsError("rankWithOpenAI requires a query string");

		// If candidates already have vectors and we trust them, compute cosine directly
		if (opts?.useExistingCandidateVectors) {
			// compute a query vec first
			const qvecs = await this.embedWithOpenAI([query], { model: opts?.model });
			const qvec = qvecs[0];
			if (!qvec || qvec.length === 0) {
				throw new EmbeddingsError("Failed to get query embedding");
			}
			return this.rankCandidatesByEmbedding(qvec, candidates, opts?.topK);
		}

		// Otherwise compute embedding then rank
		const qvecs = await this.embedWithOpenAI([query], { model: opts?.model });
		const qvec = qvecs[0];
		if (!qvec || qvec.length === 0) {
			throw new EmbeddingsError("Failed to get query embedding");
		}
		return this.rankCandidatesByEmbedding(qvec, candidates, opts?.topK);
	}

	/* ---------------------------
	 * Ollama reranker helper
	 * --------------------------- */

	/**
	 * Ask a local Ollama server to rerank a set of candidate excerpts.
	 *
	 * The function builds a compact prompt and instructs the model to return a JSON
	 * array of { id, score } where score is 0.0 - 1.0.
	 *
	 * Ollama runtimes may differ; this routine is intentionally tolerant and will
	 * attempt to extract the first JSON array substring from the model response.
	 *
	 * Returns the candidates array annotated with `score` (0-1) and sorted descending.
	 */
	async ollamaRerank(
		query: string,
		candidates: Candidate[],
		opts?: {
			ollamaModel?: string;
			topK?: number;
			maxPromptItems?: number;
			baseUrl?: string;
		},
	): Promise<Candidate[]> {
		const baseUrl = opts?.baseUrl ?? this.ollamaBaseUrl;
		if (!baseUrl) {
			throw new EmbeddingsError(
				"OLLAMA_BASE_URL not configured; cannot use Ollama reranker",
			);
		}

		const model = opts?.ollamaModel ?? this.ollamaModel ?? "gemma3:270m";
		const maxItems = opts?.maxPromptItems ?? 30;
		const topK = opts?.topK ?? this.defaultTopK;

		// Build compact candidate list (id: snippet)
		const promptItems = candidates.slice(0, maxItems).map((c, i) => {
			const snippet = (c.text ?? c.metadata?.excerpt ?? "")
				.replace(/\s+/g, " ")
				.trim()
				.slice(0, 400);
			const id = c.id ?? `candidate_${i}`;
			return `${id}: ${snippet}`;
		});

		const system = [
			"You are a precise numeric evaluator.",
			"For the query below you will score each candidate from 0.0 to 1.0.",
			'Return ONLY a JSON array of objects: [{ "id": "<id>", "score": 0.0 }, ...].',
			"Do NOT include any extra commentary.",
		].join("\n");

		const prompt = [
			system,
			`Query: ${query}`,
			`Candidates:\n${promptItems.join("\n")}`,
			"Return an array of {id, score}.",
		].join("\n\n");

		// Ollama REST: POST {model: "...", prompt: "..." } to `${baseUrl}/api/generate`
		// Some Ollama installations expect slightly different payloads; this is a common shape.
		const url = baseUrl.replace(/\/$/, "") + "/api/generate";

		const payload = {
			model,
			prompt,
			// Keep stream false to get a single response
			// For some Ollama versions the field may be 'input' or require a wrapper — adjust per deploy.
			input: prompt,
			// configuration hints (tempo/temperature) can be added if desired
		};

		const resp = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!resp.ok) {
			const txt = await resp.text().catch(() => "<no body>");
			throw new EmbeddingsError(
				`Ollama request failed: ${resp.status} ${resp.statusText} - ${txt}`,
			);
		}

		const txt = await resp.text().catch(() => "");
		if (!txt) throw new EmbeddingsError("Ollama returned empty response");

		// Try to extract the first JSON array substring (robust to model verbosity)
		const firstIdx = txt.indexOf("[");
		const lastIdx = txt.lastIndexOf("]");
		if (firstIdx === -1 || lastIdx === -1 || lastIdx <= firstIdx) {
			// as a fallback, attempt to parse the whole text as JSON
			try {
				const parsedWhole = JSON.parse(txt);
				if (Array.isArray(parsedWhole)) {
					return this._applyOllamaScoresToCandidates(
						parsedWhole,
						candidates,
						topK,
					);
				}
			} catch {
				throw new EmbeddingsError(
					"Failed to parse Ollama rerank output as JSON array",
				);
			}
		}

		const jsonSub = txt.slice(firstIdx, lastIdx + 1);
		let parsed: any;
		try {
			parsed = JSON.parse(jsonSub);
		} catch (err) {
			throw new EmbeddingsError(
				"Failed to parse JSON substring from Ollama response",
			);
		}

		if (!Array.isArray(parsed)) {
			throw new EmbeddingsError("Ollama rerank returned non-array JSON");
		}

		return this._applyOllamaScoresToCandidates(parsed, candidates, topK);
	}

	private _applyOllamaScoresToCandidates(
		parsedArray: Array<{ id: string; score: number }>,
		candidates: Candidate[],
		topK: number,
	): Candidate[] {
		// Build score map
		const scoreMap = new Map<string, number>();
		for (const p of parsedArray) {
			if (p && typeof p.id === "string" && typeof p.score === "number") {
				scoreMap.set(p.id, Math.max(0, Math.min(1, p.score)));
			}
		}

		// Annotate candidates and sort
		const annotated = candidates.map((c) => {
			const id = c.id ?? "";
			const score = scoreMap.get(id) ?? 0;
			return { ...c, score };
		});

		annotated.sort((a, b) => {
			const scoreA = typeof a.score === "number" ? a.score : 0;
			const scoreB = typeof b.score === "number" ? b.score : 0;
			return scoreB - scoreA;
		});
		return annotated.slice(0, topK);
	}

	/* ---------------------------
	 * Hybrid rerank API
	 * --------------------------- */

	/**
	 * Hybrid rerank: prefer OpenAI embeddings if API key is present; otherwise fall back to Ollama reranker.
	 *
	 * Behavior:
	 *  - If OpenAI key present:
	 *      - If candidates have vectors: compute query embedding and cosine similarity vs candidate vectors.
	 *      - If candidates lack vectors: compute embeddings for candidates (batch) then rank.
	 *  - If OpenAI key absent but Ollama configured: call ollamaRerank.
	 *
	 * Returns topK candidates sorted by relevance.
	 */
	async rerankWithHybrid(
		query: string,
		candidates: Candidate[],
		opts?: {
			topK?: number;
			forceOllama?: boolean;
			openaiModel?: string;
			ollamaModel?: string;
		},
	): Promise<Candidate[]> {
		const topK = opts?.topK ?? this.defaultTopK;

		// If forced to use Ollama
		if (opts?.forceOllama) {
			if (!this.ollamaBaseUrl)
				throw new EmbeddingsError("Ollama base URL not configured");
			return this.ollamaRerank(query, candidates, {
				topK,
				ollamaModel: opts?.ollamaModel,
			});
		}

		// Prefer OpenAI if key available
		if (this.openaiKey) {
			// If candidates already have vectors, compute query embedding and rank
			const candidatesHaveVectors = candidates.every(
				(c) => Array.isArray(c.vector) && c.vector.length > 0,
			);
			try {
				if (candidatesHaveVectors) {
					const qvecs = await this.embedWithOpenAI([query], {
						model: opts?.openaiModel,
					});
					const qvec = qvecs[0];
					if (!qvec || qvec.length === 0)
						throw new EmbeddingsError("Failed to get query embedding");
					return this.rankCandidatesByEmbedding(qvec, candidates, topK);
				} else {
					// Attempt to batch-embed candidate texts if present
					const textsToEmbed = candidates.map(
						(c) => c.text ?? c.metadata?.excerpt ?? "",
					);
					const candidateVecs = await this.embedWithOpenAI(textsToEmbed, {
						model: opts?.openaiModel,
					});
					// attach vectors defensively
					const attached = candidates.map((c, idx) => {
						const vec = candidateVecs[idx];
						return { ...c, vector: vec !== undefined ? vec : null };
					});
					const qvecs = await this.embedWithOpenAI([query], {
						model: opts?.openaiModel,
					});
					const qvec = qvecs[0];
					if (!qvec || qvec.length === 0)
						throw new EmbeddingsError("Failed to get query embedding");
					return this.rankCandidatesByEmbedding(qvec, attached, topK);
				}
			} catch (err) {
				// If OpenAI path fails for any reason, fallback to Ollama if available
				if (this.ollamaBaseUrl) {
					return this.ollamaRerank(query, candidates, {
						topK,
						ollamaModel: opts?.ollamaModel,
					});
				}
				throw err;
			}
		}

		// No OpenAI -> try Ollama
		if (this.ollamaBaseUrl) {
			return this.ollamaRerank(query, candidates, {
				topK,
				ollamaModel: opts?.ollamaModel,
			});
		}

		throw new EmbeddingsError(
			"No embedding provider configured (OPENAI_API_KEY or OLLAMA_BASE_URL required)",
		);
	}
}

/* ---------------------------
 * Export a default client instance (convenience)
 * --------------------------- */

const defaultClient = new EmbeddingsClient();
export default defaultClient;
