#!/usr/bin/env bun

/**
 * Reranker Daemon - Dedicated BGE-M3 reranking service
 * Port 3011 - No FastEmbed dependency, pure reranking only
 */

import { join } from "node:path";
import { AMALFA_DIRS } from "@src/config/defaults";
import { BgeReranker } from "@src/services/reranker";
import { getLogger } from "@src/utils/Logger";
import { ServiceLifecycle } from "@src/utils/ServiceLifecycle";
import { serve } from "bun";

const log = getLogger("RerankerDaemon");
const PORT = Number(process.env.RERANKER_PORT || 3011);

// Service lifecycle management
const lifecycle = new ServiceLifecycle({
	name: "Reranker-Daemon",
	pidFile: join(AMALFA_DIRS.runtime, "reranker-daemon.pid"),
	logFile: join(AMALFA_DIRS.logs, "reranker-daemon.log"),
	entryPoint: "src/resonance/services/reranker-daemon.ts",
});

// Keep reranker loaded in memory
let reranker: BgeReranker | null = null;

/**
 * Initialize reranker model (called once at startup or on first request)
 */
async function initReranker() {
	if (!reranker) {
		log.info("🔄 Initializing BGE reranker model...");
		reranker = await BgeReranker.getInstance();
		log.info("✅ Reranker model loaded and ready");
	}
}

/**
 * Main server logic
 */
async function runServer() {
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
						model: "bge-reranker-base",
						ready: reranker !== null,
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

			// 404 for unknown endpoints
			return new Response("Not Found", { status: 404 });
		},
	});

	log.info(
		{ port: PORT, model: "bge-reranker-base" },
		"🚀 Reranker Daemon listening",
	);

	// Keep server alive
	await new Promise(() => {});
}

// Run with lifecycle management
await lifecycle.run(process.argv[2] || "serve", runServer);
