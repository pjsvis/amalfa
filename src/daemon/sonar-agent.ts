#!/usr/bin/env bun
/**
 * AMALFA Sonar Multi-Purpose Sub-Agent
 * Daemon for search intelligence, metadata enhancement, and interactive chat
 */

import { join } from "path";
import { loadConfig, AMALFA_DIRS } from "@src/config/defaults";
import { getLogger } from "@src/utils/Logger";
import { ServiceLifecycle } from "@src/utils/ServiceLifecycle";
import {
	checkOllamaHealth,
	discoverOllamaCapabilities,
} from "@src/utils/ollama-discovery";

const args = process.argv.slice(2);
const command = args[0] || "serve";
const log = getLogger("SonarAgent");

// Database initialization
import { ResonanceDB } from "@src/resonance/db";
let DB_PATH: string;

// Service lifecycle management
const lifecycle = new ServiceLifecycle({
	name: "SonarAgent",
	pidFile: join(AMALFA_DIRS.runtime, "sonar.pid"),
	logFile: join(AMALFA_DIRS.logs, "sonar.log"),
	entryPoint: "src/daemon/sonar-agent.ts",
});

// Global state
// Global state
let server: Bun.Server<unknown> | null = null;
let ollamaAvailable = false;
let ollamaModel = "phi3:latest";

// Chat Session Management
const chatSessions = new Map<string, ChatSession>();

interface ChatSession {
	id: string;
	messages: Message[];
	startedAt: Date;
}

/**
 * Message interface for chat API
 */
interface Message {
	role: "system" | "user" | "assistant";
	content: string;
}

/**
 * Request options for Ollama API
 */
interface RequestOptions {
	temperature?: number;
	num_predict?: number;
	stream?: boolean;
	format?: "json"; // Enable GBNF-constrained JSON output
}

/**
 * Call Ollama HTTP API for inference
 * This is the preferred method for inference (faster, supports streaming)
 */
async function callOllama(
	messages: Message[],
	options: RequestOptions = {},
): Promise<{ message: Message }> {
	const config = await loadConfig();
	// @ts-ignore
	const hostArgs = config.sonar || config.phi3 || {};
	const host = hostArgs.host || "localhost:11434";
	// Use discovered model if available, otherwise config or default
	const model = ollamaModel || hostArgs.model || "phi3:latest";

	// Extract format from options to put at root level of request
	const { format, ...modelOptions } = options;

	const response = await fetch(`http://${host}/api/chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model,
			messages,
			stream: false,
			format, // Pass format (e.g. "json") to enable GBNF grammar
			options: {
				temperature: 0.1,
				num_predict: 200,
				...modelOptions,
			},
		}),
	});

	if (!response.ok) {
		throw new Error(`Ollama API error: ${response.statusText}`);
	}

	return (await response.json()) as { message: Message };
}

/**
 * Handle search analysis task
 * Analyzes query intent, entities, and technical level
 */
async function handleSearchAnalysis(query: string): Promise<unknown> {
	if (!ollamaAvailable) {
		throw new Error("Sonar is not available");
	}

	try {
		const response = await callOllama(
			[
				{
					role: "system",
					content: "You are a search query analyzer. Return JSON only.",
				},
				{
					role: "user",
					content: `Analyze this query: "${query}"

    Return JSON:
    {
      "intent": "implementation|conceptual|example",
      "entities": ["term1", "term2"],
      "technical_level": "high|medium|low",
      "suggested_queries": ["query1", "query2"]
    }`,
				},
			],
			{
				temperature: 0.1,
				num_predict: 200,
				format: "json", // Force valid JSON output
			},
		);

		// Parse JSON response
		const content = response.message.content;
		try {
			return JSON.parse(content);
		} catch {
			// Fallback if not JSON
			return {
				intent: "unknown",
				entities: [],
				technical_level: "medium",
				suggested_queries: [],
			};
		}
	} catch (error) {
		log.error({ error, query }, "Search analysis failed");
		throw error;
	}
}

/**
 * Handle metadata enhancement task
 * Comprehensive document analysis for enhanced metadata
 */
async function handleMetadataEnhancement(docId: string): Promise<unknown> {
	if (!ollamaAvailable) {
		throw new Error("Sonar is not available");
	}

	try {
		// Connect to DB and fetch node source path
		const db = new ResonanceDB(DB_PATH);
		const node = db.getNode(docId);
		if (!node) {
			throw new Error(`Node not found: ${docId}`);
		}

		const meta = node.meta || {};
		const sourcePath = meta.source as string | undefined;
		if (!sourcePath) {
			throw new Error(`No source file for node: ${docId}`);
		}

		// Read content from filesystem
		const file = Bun.file(sourcePath);
		if (!(await file.exists())) {
			throw new Error(`File not found: ${sourcePath}`);
		}
		const content = await file.text();

		const response = await callOllama(
			[
				{
					role: "system",
					content:
						"You are a document analyzer. Extract comprehensive metadata.",
				},
				{
					role: "user",
					content: `Analyze this document comprehensively:

    Content: ${content}

    Return JSON:
    {
      "themes": ["theme1", "theme2"],
      "code_patterns": ["pattern1", "pattern2"],
      "summary": "2-3 sentence summary",
      "doc_type": "implementation|conceptual|architecture|reference",
      "technical_depth": "deep|medium|shallow",
      "audience": "developer|user|architect",
      "related_docs": ["doc1", "doc2"]
    }`,
				},
			],
			{
				temperature: 0.2,
				num_predict: 500,
				format: "json", // Force valid JSON output
			},
		);

		// Save enhanced metadata back to DB
		const contentStr = response.message.content;
		let enhancedMeta: Record<string, unknown>;
		try {
			enhancedMeta = JSON.parse(contentStr);
		} catch {
			enhancedMeta = {
				themes: [],
				code_patterns: [],
				summary: "",
				doc_type: "unknown",
				technical_depth: "medium",
				audience: "developer",
				related_docs: [],
			};
		}

		// Update node metadata
		const newMeta = {
			...node.meta,
			sonar_enhanced: true,
			sonar_enhanced_at: new Date().toISOString(),
			...enhancedMeta,
		};

		db.updateNodeMeta(docId, newMeta);
		return enhancedMeta;
	} catch (error) {
		log.error({ error, docId }, "Metadata enhancement failed");
		throw error;
	}
}

/**
 * Handle batch enhancement task
 * Processes multiple documents for metadata enhancement
 */
async function handleBatchEnhancement(limit = 50): Promise<{
	successful: number;
	failed: number;
	total: number;
}> {
	if (!ollamaAvailable) {
		throw new Error("Sonar is not available");
	}

	const db = new ResonanceDB(DB_PATH);

	// Find unenhanced nodes
	// Note: We need to query nodes that don't have 'sonar_enhanced' in meta
	const allNodes = db.getRawDb().query("SELECT id, meta FROM nodes").all() as {
		id: string;
		meta: string;
	}[];

	const unenhanced = allNodes
		.filter((row) => {
			try {
				const meta = JSON.parse(row.meta);
				// Check for sonar_enhanced OR phi3_enhanced (migration)
				return !meta.sonar_enhanced && !meta.phi3_enhanced;
			} catch {
				return false;
			}
		})
		.map((row) => ({ id: row.id }));

	const batch = unenhanced.slice(0, limit);

	log.info(`🔄 Enhancing ${batch.length} docs with Sonar...`);

	const results = await Promise.allSettled(
		batch.map((node) => handleMetadataEnhancement(node.id)),
	);

	const successful = results.filter((r) => r.status === "fulfilled").length;
	const failed = results.filter((r) => r.status === "rejected").length;

	log.info(`✅ Enhanced: ${successful}, ❌ Failed: ${failed}`);

	return { successful, failed, total: batch.length };
}

/**
 * Handle result re-ranking
 * Re-ranks search results based on query intent and context
 */
async function handleResultReranking(
	results: Array<{ id: string; content: string; score: number }>,
	query: string,
	intent?: string,
): Promise<
	Array<{ id: string; content: string; score: number; relevance_score: number }>
> {
	if (!ollamaAvailable) {
		throw new Error("Sonar is not available");
	}

	try {
		const response = await callOllama(
			[
				{
					role: "system",
					content:
						"You are a search result re-ranker. Analyze relevance and provide scores.",
				},
				{
					role: "user",
					content: `Re-rank these search results for query: "${query}"${
						intent ? `\nQuery intent: ${intent}` : ""
					}

Results:
${results.map((r, i) => `${i + 1}. ${r.content.slice(0, 200)}`).join("\n")}

Return JSON array with relevance scores (0.0 to 1.0):
[
  {"index": 1, "relevance": 0.95, "reason": "Direct match"},
  {"index": 2, "relevance": 0.7, "reason": "Related concept"}
]`,
				},
			],
			{
				temperature: 0.2,
				num_predict: 300,
				format: "json", // Force valid JSON output
			},
		);

		const content = response.message.content;
		try {
			const rankings = JSON.parse(content);

			// Apply rankings to results
			return results.map((result, idx) => {
				const ranking = rankings.find(
					(r: { index: number }) => r.index === idx + 1,
				);
				return {
					...result,
					relevance_score: ranking?.relevance || 0.5,
				};
			});
		} catch {
			// Fallback: return original scores
			return results.map((r) => ({ ...r, relevance_score: r.score }));
		}
	} catch (error) {
		log.error({ error, query }, "Result re-ranking failed");
		throw error;
	}
}

/**
 * Handle chat request
 * Maintains session context and converses with user
 */
async function handleChat(
	sessionId: string,
	userMessage: string,
): Promise<{ message: Message; sessionId: string }> {
	if (!ollamaAvailable) {
		throw new Error("Sonar is not available");
	}

	// Get or create session
	let session = chatSessions.get(sessionId);
	if (!session) {
		session = {
			id: sessionId,
			messages: [
				{
					role: "system",
					content: `You are AMALFA Corpus Assistant. Help users understand and explore their knowledge base.
Current Date: ${new Date().toISOString().split("T")[0]}

User can ask you about:
1. Corpus structure and themes
2. What you're currently working on
3. Search for documents by theme/type
4. Guide enhancement process
5. Natural language queries to knowledge base`,
				},
			],
			startedAt: new Date(),
		};
		chatSessions.set(sessionId, session);
	}

	// Add user message
	session.messages.push({ role: "user", content: userMessage });

	// Maintain context window (keep system msg + last 10 messages)
	const contextMessages = [
		session.messages[0],
		...session.messages.slice(-10),
	].filter((m): m is Message => m !== undefined);

	try {
		// NOTE: No format: "json" for chat! We want natural language.
		const response = await callOllama(contextMessages, {
			temperature: 0.7,
			num_predict: 500,
		});

		// Add assistant response to history
		session.messages.push(response.message);

		return {
			message: response.message,
			sessionId: session.id,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		log.error({ err: error, sessionId, errorMessage }, "Chat request failed");
		throw error;
	}
}

/**
 * Handle context extraction
 * Generates smart snippets with context awareness
 */
async function handleContextExtraction(
	result: { id: string; content: string },
	query: string,
): Promise<{ snippet: string; context: string; confidence: number }> {
	if (!ollamaAvailable) {
		throw new Error("Sonar is not available");
	}

	try {
		const response = await callOllama(
			[
				{
					role: "system",
					content:
						"You are a context extractor. Provide relevant snippets with context.",
				},
				{
					role: "user",
					content: `Extract relevant context for query: "${query}"

Content:
${result.content}

Return JSON:
{
  "snippet": "Most relevant 2-3 sentences",
  "context": "Brief explanation of relevance",
  "confidence": 0.9
}`,
				},
			],
			{
				temperature: 0.1,
				num_predict: 200,
				format: "json", // Force valid JSON output
			},
		);

		const content = response.message.content;
		try {
			return JSON.parse(content);
		} catch {
			// Fallback: return simple snippet
			const words = result.content.split(" ");
			const snippet = words.slice(0, 50).join(" ");
			return {
				snippet,
				context: "Full content available",
				confidence: 0.5,
			};
		}
	} catch (error) {
		log.error({ error, resultId: result.id }, "Context extraction failed");
		throw error;
	}
}

/**
 * Main daemon logic
 */
async function main() {
	const config = await loadConfig();
	DB_PATH = join(process.cwd(), config.database);

	// @ts-ignore
	const isEnabled = config.sonar?.enabled ?? config.phi3?.enabled;

	if (!isEnabled) {
		log.warn("⚠️  Sonar is disabled in configuration. Exiting.");
		process.exit(0);
	}

	log.info("🚀 Sonar Agent starting...");

	// Check Ollama availability
	log.info("🔍 Checking Ollama availability...");
	const capabilities = await discoverOllamaCapabilities();
	ollamaAvailable = capabilities.available;

	if (ollamaAvailable) {
		log.info("✅ Ollama is available and healthy");
		// Use discovered preferred model (e.g., tinydolphin) unless overridden in config
		// @ts-ignore
		ollamaModel =
			config.sonar?.model ||
			config.phi3?.model ||
			capabilities.model ||
			"phi3:latest";
		log.info(`✅ Using model: ${ollamaModel}`);
	} else {
		log.warn("⚠️  Ollama is not available");
		log.warn("   Sonar features will be disabled");
		log.info("   Install: curl -fsSL https://ollama.ai/install.sh | sh");
		log.info("   Then run: ollama pull phi3:latest (or minidolphin)");
	}

	log.info("✅ Sonar Agent ready");

	// Register signal handlers for graceful shutdown
	const shutdown = async (signal: string) => {
		log.info(`🛑 Received ${signal}, shutting down...`);
		if (server) {
			server.stop();
			server = null;
		}
		process.exit(0);
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));

	// Start HTTP server
	// @ts-ignore
	const port = (config.sonar || config.phi3)?.port || 3012;

	log.info(`🚀 Starting HTTP server on port ${port}`);
	log.info("📋 Available endpoints:");
	log.info("   POST /search/analyze - Query analysis");
	log.info("   POST /search/rerank  - Result re-ranking");
	log.info("   POST /search/context - Smart snippet generation");
	log.info("   GET  /health        - Health check");

	server = Bun.serve({
		port,
		async fetch(req) {
			const url = new URL(req.url);

			// CORS headers
			const corsHeaders = {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			};

			// Handle preflight requests
			if (req.method === "OPTIONS") {
				return new Response(null, { headers: corsHeaders });
			}

			// Health check endpoint
			if (url.pathname === "/health") {
				const healthy = await checkOllamaHealth();
				return Response.json(
					{
						status: healthy ? "healthy" : "unhealthy",
						ollama_available: ollamaAvailable,
						model: ollamaModel,
					},
					{ headers: corsHeaders },
				);
			}

			// Search analysis endpoint
			if (url.pathname === "/search/analyze" && req.method === "POST") {
				try {
					const body = (await req.json()) as { query: unknown };
					const { query } = body;

					if (!query || typeof query !== "string") {
						return Response.json(
							{ error: "Missing or invalid 'query' parameter" },
							{ status: 400, headers: corsHeaders },
						);
					}

					const analysis = await handleSearchAnalysis(query);
					return Response.json(analysis, { headers: corsHeaders });
				} catch (error) {
					log.error({ error }, "Search analysis failed");
					return Response.json(
						{ error: error instanceof Error ? error.message : "Unknown error" },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			// Result re-ranking endpoint
			if (url.pathname === "/search/rerank" && req.method === "POST") {
				try {
					const body = (await req.json()) as {
						results: unknown;
						query: unknown;
						intent: unknown;
					};
					const { results, query, intent } = body;

					if (
						!results ||
						!Array.isArray(results) ||
						!query ||
						typeof query !== "string"
					) {
						return Response.json(
							{ error: "Missing or invalid 'results' parameter" },
							{ status: 400, headers: corsHeaders },
						);
					}

					const ranked = await handleResultReranking(
						results as { id: string; content: string; score: number }[],
						query,
						intent as string | undefined,
					);
					return Response.json(ranked, { headers: corsHeaders });
				} catch (error) {
					log.error({ error }, "Result re-ranking failed");
					return Response.json(
						{ error: error instanceof Error ? error.message : "Unknown error" },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			// Context extraction endpoint
			if (url.pathname === "/search/context" && req.method === "POST") {
				try {
					const body = (await req.json()) as {
						result: unknown;
						query: unknown;
					};
					const { result, query } = body;

					if (!result || !query || typeof query !== "string") {
						return Response.json(
							{ error: "Missing 'result' or 'query' parameter" },
							{ status: 400, headers: corsHeaders },
						);
					}

					const context = await handleContextExtraction(
						result as { id: string; content: string },
						query,
					);
					return Response.json(context, { headers: corsHeaders });
				} catch (error) {
					log.error({ error }, "Context extraction failed");
					return Response.json(
						{ error: error instanceof Error ? error.message : "Unknown error" },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			// Metadata enhancement endpoint
			if (url.pathname === "/metadata/enhance" && req.method === "POST") {
				try {
					const body = (await req.json()) as { docId: unknown };
					const { docId } = body;

					if (!docId || typeof docId !== "string") {
						return Response.json(
							{ error: "Missing 'docId' parameter" },
							{ status: 400, headers: corsHeaders },
						);
					}

					const enhancement = await handleMetadataEnhancement(docId);
					return Response.json(enhancement, { headers: corsHeaders });
				} catch (error) {
					log.error({ error }, "Metadata enhancement endpoint failed");
					return Response.json(
						{ error: error instanceof Error ? error.message : "Unknown error" },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			// Batch enhancement endpoint
			if (url.pathname === "/metadata/batch" && req.method === "POST") {
				try {
					const body = (await req.json()) as { limit: unknown };
					const limit = typeof body.limit === "number" ? body.limit : 50;

					const result = await handleBatchEnhancement(limit);
					return Response.json(result, { headers: corsHeaders });
				} catch (error) {
					log.error({ error }, "Batch enhancement endpoint failed");
					return Response.json(
						{ error: error instanceof Error ? error.message : "Unknown error" },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			// Chat endpoint
			if (url.pathname === "/chat" && req.method === "POST") {
				try {
					const body = (await req.json()) as {
						sessionId?: unknown;
						message: unknown;
					};
					const sessionId =
						typeof body.sessionId === "string"
							? body.sessionId
							: crypto.randomUUID();
					const message = body.message;

					if (!message || typeof message !== "string") {
						return Response.json(
							{ error: "Missing 'message' parameter" },
							{ status: 400, headers: corsHeaders },
						);
					}

					const response = await handleChat(sessionId, message);
					return Response.json(response, { headers: corsHeaders });
				} catch (error) {
					log.error({ error }, "Chat endpoint failed");
					return Response.json(
						{ error: error instanceof Error ? error.message : "Unknown error" },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			// 404 for unknown endpoints
			return Response.json(
				{ error: "Not found" },
				{ status: 404, headers: corsHeaders },
			);
		},
	});

	log.info(`✅ HTTP server listening on port ${port}`);
	log.info("⏳ Daemon ready to handle requests");
}

// Run service lifecycle dispatcher
await lifecycle.run(command, main);
