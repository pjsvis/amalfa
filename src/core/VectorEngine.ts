import { Database } from "bun:sqlite";
import { EmbeddingModel, FlagEmbedding } from "fastembed";

// Types
export interface SearchResult {
	id: string;
	score: number;
	content: string;
	title?: string;
	date?: string;
}

/**
 * FAFCAS Protocol: Normalizer
 * Calculates L2 Norm, normalizes to Unit Length, and returns Raw Bytes.
 */
function toFafcas(vector: Float32Array): Uint8Array {
	// 1. Calculate Magnitude (L2 Norm)
	let sum = 0;
	for (let i = 0; i < vector.length; i++) {
		const val = vector[i] || 0;
		sum += val * val;
	}
	const magnitude = Math.sqrt(sum);

	// 2. Normalize (Divide by Magnitude)
	// Optimization: If magnitude is 0, return zero vector (avoids NaN)
	if (magnitude > 1e-6) {
		for (let i = 0; i < vector.length; i++) {
			vector[i] = (vector[i] || 0) / magnitude;
		}
	}

	// 3. Serialize to Raw Bytes (FAFCAS Blob)
	// We return a view on the same buffer
	return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}

/**
 * Calculate magnitude (L2 norm) of a vector
 */
function magnitude(vec: Float32Array): number {
	let sum = 0;
	for (let i = 0; i < vec.length; i++) {
		const val = vec[i] || 0;
		sum += val * val;
	}
	return Math.sqrt(sum);
}

/**
 * FAFCAS Protocol: Search Engine
 * Pure Dot Product (since vectors are unit-length).
 *
 * Returns 0 for zero-magnitude vectors (failed embeddings) to prevent
 * false matches in search results.
 */
function dotProduct(a: Float32Array, b: Float32Array): number {
	// Check for zero vectors (failed embeddings)
	const magA = magnitude(a);
	const magB = magnitude(b);

	if (magA < 1e-6 || magB < 1e-6) {
		console.warn("⚠️  Zero vector detected in dot product, skipping comparison");
		return 0;
	}

	let sum = 0;
	// Modern JS engines SIMD-optimize this loop automatically
	for (let i = 0; i < a.length; i++) {
		sum += (a[i] || 0) * (b[i] || 0);
	}
	return sum;
}

export class VectorEngine {
	private db: Database;
	private modelPromise: Promise<FlagEmbedding>;

	/**
	 * @param dbOrPath - Database instance (recommended) or string path (deprecated)
	 * @deprecated String path constructor bypasses DatabaseFactory and will be removed in v2.0.
	 *             Use `new VectorEngine(db: Database)` instead.
	 */
	constructor(dbOrPath: Database | string) {
		if (typeof dbOrPath === "string") {
			// DEPRECATED: String path mode bypasses DatabaseFactory
			console.warn(
				"⚠️  DEPRECATED: VectorEngine string path constructor bypasses DatabaseFactory. Pass Database object instead. Will be removed in v2.0.",
			);
			this.db = new Database(dbOrPath);

			// Apply Safeguards if we created it
			this.db.run("PRAGMA journal_mode = WAL;");
			this.db.run("PRAGMA busy_timeout = 5000;");
			this.db.run("PRAGMA synchronous = NORMAL;");
			this.db.run("PRAGMA mmap_size = 268435456;"); // 256MB
			this.db.run("PRAGMA temp_store = memory;");
		} else {
			// RECOMMENDED: Database object from DatabaseFactory
			this.db = dbOrPath;
		}

		// Lazy load the model
		this.modelPromise = FlagEmbedding.init({
			model: EmbeddingModel.AllMiniLML6V2,
		});
	}

	/**
	 * Generate embedding using FastEmbed (In-Process)
	 * Returns FAFCAS-compliant Raw Bytes (Uint8Array)
	 */
	async embed(text: string): Promise<Uint8Array | null> {
		try {
			const model = await this.modelPromise;
			// fastembed returns a generator, we take the first item
			const embeddings = model.embed([text]);
			let vector: Float32Array | undefined;

			for await (const batch of embeddings) {
				if (batch && batch.length > 0) {
					// biome-ignore lint/style/noNonNullAssertion: Batch guaranteed by loop check
					vector = new Float32Array(batch[0]!);
				}
				break;
			}

			if (!vector) return null;

			// FAFCAS Protocol: Normalize to Unit Length
			// Note: FastEmbed output is usually normalized, but we enforce it for compliance
			return toFafcas(vector);
		} catch (e) {
			console.error("Failed to generate embedding:", e);
			return null;
		}
	}

	/**
	 * Save embedding to DB as BLOB
	 */
	saveEmbedding(id: string, embedding: Uint8Array) {
		// Bun SQLite stores TypedArrays as BLOBs automatically
		this.db
			.prepare("UPDATE nodes SET embedding = ? WHERE id = ?")
			.run(embedding, id);
	}

	/**
	 * FAFCAS Optimized Search
	 * Uses raw BLOBs and dot product for high-speed retrieval.
	 */
	/**
	 * Search using a raw vector (Float32Array).
	 * Useful for "More Like This" or when embedding is already computed.
	 */
	async searchByVector(
		queryFloats: Float32Array,
		limit = 5,
	): Promise<SearchResult[]> {
		// 2. SLIM SCAN: Load only ID and Embedding (No Content)
		// Optimization: drastic reduction in memory/IO
		const candidates = this.db
			.query("SELECT id, embedding FROM nodes WHERE embedding IS NOT NULL")
			.all() as { id: string; embedding: Uint8Array }[];

		// 3. Compute Scores (Hot Loop)
		const scored: { id: string; score: number }[] = [];

		for (const candidate of candidates) {
			// Zero-copy view on the candidate blob
			const candidateFloats = new Float32Array(
				candidate.embedding.buffer,
				candidate.embedding.byteOffset,
				candidate.embedding.byteLength / 4,
			);

			// FAFCAS: Dot Product is Cosine Similarity for Unit Vectors
			const score = dotProduct(queryFloats, candidateFloats);

			// Arbitrary threshold filter
			if (score > 0.0) {
				scored.push({ id: candidate.id, score });
			}
		}

		// 4. Sort & Limit
		const topK = scored.sort((a, b) => b.score - a.score).slice(0, limit);

		// 5. Hydrate Metadata (for top K only)
		const results: SearchResult[] = [];
		const metaStmt = this.db.prepare(
			"SELECT title, meta, date FROM nodes WHERE id = ?",
		);

		for (const item of topK) {
			const row = metaStmt.get(item.id) as {
				title: string;
				meta: string | null;
				date: string | null;
			};
			if (row) {
				let contentPlaceholder = "";
				if (row.meta) {
					try {
						const meta = JSON.parse(row.meta);
						contentPlaceholder = `[Hollow Node: ${meta.source || "no source"}]`;
					} catch {
						contentPlaceholder = "[Hollow Node: parse error]";
					}
				}
				results.push({
					id: item.id,
					score: item.score,
					title: row.title,
					content: contentPlaceholder,
					date: row.date || undefined,
				});
			}
		}

		return results;
	}

	async search(query: string, limit = 5): Promise<SearchResult[]> {
		// 1. Get Normalized Query Vector (Blob)
		const queryBlob = await this.embed(query);
		if (!queryBlob) return [];

		// Create Float32 view for calculation
		const queryFloats = new Float32Array(
			queryBlob.buffer,
			queryBlob.byteOffset,
			queryBlob.byteLength / 4,
		);

		return this.searchByVector(queryFloats, limit);
	}
}
