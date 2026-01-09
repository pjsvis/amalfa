import { loadConfig } from "@src/config/defaults";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { inferenceState } from "./sonar-inference";
import {
	handleChat,
	handleContextExtraction,
	handleMetadataEnhancement,
	handleResultReranking,
	handleSearchAnalysis,
	type SonarContext,
} from "./sonar-logic";
import type {
	ChatRequest,
	MetadataEnhanceRequest,
	SearchAnalyzeRequest,
	SearchContextRequest,
	SearchRerankRequest,
} from "./sonar-types";

/**
 * Creates the Hono application for the Sonar Agent
 */
export function createSonarApp(context: SonarContext) {
	const app = new Hono();

	// Global Middleware
	app.use(
		"*",
		cors({
			origin: "*",
			allowMethods: ["GET", "POST", "OPTIONS"],
			allowHeaders: ["Content-Type"],
		}),
	);

	/**
	 * Health Check
	 */
	app.get("/health", async (c) => {
		const cfg = await loadConfig();
		const provider = cfg.sonar.cloud?.enabled ? "cloud" : "local";
		const model = cfg.sonar.cloud?.enabled
			? cfg.sonar.cloud.model
			: inferenceState.ollamaModel || cfg.sonar.model;

		return c.json({
			status: "ok",
			ollama: inferenceState.ollamaAvailable,
			provider,
			model,
		});
	});

	/**
	 * Chat Interface
	 */
	app.post("/chat", async (c) => {
		try {
			const body = await c.req.json<ChatRequest>();
			const { sessionId, message, model } = body;
			const result = await handleChat(sessionId, message, context, model);
			return c.json(result);
		} catch (error) {
			return c.json({ error: String(error) }, 500);
		}
	});

	/**
	 * Metadata Enhancement
	 */
	app.post("/metadata/enhance", async (c) => {
		try {
			const body = await c.req.json<MetadataEnhanceRequest>();
			const { docId } = body;
			await handleMetadataEnhancement(docId, context);
			return c.json({ status: "success" });
		} catch (error) {
			return c.json({ error: String(error) }, 500);
		}
	});

	/**
	 * Graph Stats
	 */
	app.get("/graph/stats", (c) => {
		return c.json(context.graphEngine.getStats());
	});

	/**
	 * Search: Query Analysis
	 */
	app.post("/search/analyze", async (c) => {
		try {
			const body = await c.req.json<SearchAnalyzeRequest>();
			const { query } = body;
			const result = await handleSearchAnalysis(query, context);
			return c.json(result);
		} catch (error) {
			return c.json({ error: String(error) }, 500);
		}
	});

	/**
	 * Search: Reranking
	 */
	app.post("/search/rerank", async (c) => {
		try {
			const body = await c.req.json<SearchRerankRequest>();
			const { results, query, intent } = body;
			const result = await handleResultReranking(results, query, intent);
			return c.json(result);
		} catch (error) {
			return c.json({ error: String(error) }, 500);
		}
	});

	/**
	 * Search: Context Extraction
	 */
	app.post("/search/context", async (c) => {
		try {
			const body = await c.req.json<SearchContextRequest>();
			const { result, query } = body;
			const contextResult = await handleContextExtraction(result, query);
			return c.json(contextResult);
		} catch (error) {
			return c.json({ error: String(error) }, 500);
		}
	});

	return app;
}
