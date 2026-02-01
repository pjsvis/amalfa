#!/usr/bin/env bun

/**
 * Vector Daemon - HTTP server for fast embedding generation
 * Keeps FastEmbed model loaded in memory for <100ms embedding lookups
 */

import { join } from "node:path";
import { AMALFA_DIRS } from "@src/config/defaults";
import { toFafcas } from "@src/resonance/db";
import { HfBgeReranker } from "@src/services/reranker-hf";
import { getLogger } from "@src/utils/Logger";
import { ServiceLifecycle } from "@src/utils/ServiceLifecycle";
import { serve } from "bun";
import { EmbeddingModel, FlagEmbedding } from "fastembed";

const log = getLogger("VectorDaemon");
const PORT = Number(process.env.VECTOR_PORT || 3010);

// Service lifecycle management
const lifecycle = new ServiceLifecycle({
	name: "Vector-Daemon",
	pidFile: join(AMALFA_DIRS.runtime, "vector-daemon.pid"),
	logFile: join(AMALFA_DIRS.logs, "vector-daemon.log"),
	entryPoint: "src/resonance/services/vector-daemon.ts",
});

// Keep model loaded in memory
let embedder: FlagEmbedding | null = null;
let reranker: HfBgeReranker | null = null;
const currentModel = EmbeddingModel.BGESmallENV15;

/**
 * Initialize embedding model (called once at startup)
 */
async function initEmbedder() {
	if (!embedder) {
		log.info({ model: currentModel }, "🔄 Initializing embedding model...");

		// Ensure cache directory exists
		const cacheDir = ".amalfa/cache";
		const { mkdir } = await import("node:fs/promises");
		try {
			await mkdir(cacheDir, { recursive: true });
		} catch (_e) {
			// Directory might already exist, that's fine
		}

		embedder = await FlagEmbedding.init({
			model: currentModel,
			cacheDir,
			showDownloadProgress: true,
		});
		log.info("✅ Embedding model loaded and ready");
	}
}

/**
 * Initialize reranker model (lazy loaded on first request)
 */
async function initReranker() {
	if (!reranker) {
		log.info("🔄 Initializing BGE-M3 reranker model...");
		reranker = await HfBgeReranker.getInstance();
		log.info("✅ Reranker model loaded and ready");
	}
}

/**
 * Main server logic
 */
async function runServer() {
	// Initialize model before accepting requests
	await initEmbedder();

	// Start HTTP server
	const _server = serve({
		port: PORT,
		async fetch(req) {
			const url = new URL(req.url);

			// Health check endpoint
			if (url.pathname === "/health") {
				return new Response(
					JSON.stringify({
						status: "ok",
						model: currentModel,
						ready: embedder !== null,
						reranker_ready: reranker !== null,
					}),
					{
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Rerank endpoint
			if (url.pathname === "/rerank" && req.method === "POST") {
				try {
					const body = (await req.json()) as {
						query?: string;
						documents?: string[];
						topK?: number;
						threshold?: number;
					};
					const { query, documents, topK, threshold } = body;

					if (!query || !documents || !Array.isArray(documents)) {
						return new Response(
							JSON.stringify({
								error: "Missing or invalid query/documents parameters",
							}),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					// Lazy load reranker on first request
					await initReranker();

					if (!reranker) {
						throw new Error("Reranker not initialized");
					}

					// Rerank documents
					const results = await reranker.rerank(
						query,
						documents,
						topK,
						threshold || 0,
					);

					return new Response(
						JSON.stringify({
							results: results.map((r) => ({
								text: r.text,
								score: r.score,
								originalIndex: r.originalIndex,
							})),
							count: results.length,
						}),
						{
							headers: { "Content-Type": "application/json" },
						},
					);
				} catch (e) {
					log.error({ err: e }, "❌ Reranking failed");
					return new Response(
						JSON.stringify({
							error: e instanceof Error ? e.message : String(e),
						}),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			}

			// Embed endpoint
			if (url.pathname === "/embed" && req.method === "POST") {
				try {
					const body = (await req.json()) as { text?: string; model?: string };
					const { text } = body;

					if (!text) {
						return new Response(
							JSON.stringify({ error: "Missing text parameter" }),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					// Generate embedding
					if (!embedder) {
						throw new Error("Embedder not initialized");
					}

					const gen = embedder.embed([text]);
					const result = await gen.next();
					const val = result.value?.[0];

					if (!val || val.length === 0) {
						throw new Error("Embedding generation returned empty result");
					}

					// Normalize using FAFCAS protocol
					const raw = new Float32Array(val);
					const normalized = toFafcas(raw);

					// Convert to plain array for JSON serialization
					const vector = Array.from(new Float32Array(normalized.buffer));

					return new Response(
						JSON.stringify({
							vector,
							dimensions: vector.length,
						}),
						{
							headers: { "Content-Type": "application/json" },
						},
					);
				} catch (e) {
					log.error({ err: e }, "❌ Embedding generation failed");
					return new Response(
						JSON.stringify({
							error: e instanceof Error ? e.message : String(e),
						}),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			}

			// 404 for unknown endpoints
			return new Response("Not Found", { status: 404 });
		},
	});

	log.info({ port: PORT, model: currentModel }, "🚀 Vector Daemon listening");

	// Keep server alive
	await new Promise(() => {});
}

// Run with lifecycle management
await lifecycle.run(process.argv[2] || "serve", runServer);
