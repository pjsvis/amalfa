#!/usr/bin/env bun

/**
 * AMALFA Sonar Multi-Purpose Sub-Agent
 * Daemon for search intelligence, metadata enhancement, and interactive chat
 */

import {
	existsSync,
	mkdirSync,
	readdirSync,
	renameSync,
	writeFileSync,
} from "node:fs";
import { AMALFA_DIRS, loadConfig } from "@src/config/defaults";
import { getLogger } from "@src/utils/Logger";
import { sendNotification } from "@src/utils/Notifications";
import {
	checkOllamaHealth,
	discoverOllamaCapabilities,
} from "@src/utils/ollama-discovery";
import { ServiceLifecycle } from "@src/utils/ServiceLifecycle";
import { join } from "path";

const args = process.argv.slice(2);
const command = args[0] || "serve";
const log = getLogger("SonarAgent");

import { GraphEngine } from "@src/core/GraphEngine";
import { GraphGardener } from "@src/core/GraphGardener";
import { VectorEngine } from "@src/core/VectorEngine";
// Database and Graph initialization
import { ResonanceDB } from "@src/resonance/db";
import { TagInjector } from "@src/utils/TagInjector";

let DB_PATH: string;
let db: ResonanceDB;
const graphEngine = new GraphEngine();
let gardener: GraphGardener;

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
 * Task definitions for the Sonar Agent
 */
interface SonarTask {
	type:
		| "synthesis"
		| "timeline"
		| "enhance_batch"
		| "garden"
		| "research"
		| "chat";
	minSize?: number;
	limit?: number;
	autoApply?: boolean;
	notify?: boolean;
	query?: string;
	model?: string;
	sessionId?: string;
	message?: string;
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
	model?: string; // Override model for this specific call (tiered strategy)
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
	const hostArgs = config.sonar;

	// Cloud toggle: dev-cloud/prod-local strategy
	const cloudConfig = hostArgs.cloud;
	const useCloud = cloudConfig?.enabled === true;
	const provider = useCloud ? cloudConfig.provider || "ollama" : "ollama";

	// Tiered model strategy: options.model > cloud.model > discovered > config > default
	const { format, model: overrideModel, ...modelOptions } = options;
	const model =
		overrideModel ||
		(useCloud ? cloudConfig.model : null) ||
		ollamaModel ||
		hostArgs.model ||
		"qwen2.5:1.5b";

	// Build headers
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	// API key: prefer env var (OPENROUTER_API_KEY) over config
	const apiKey = process.env.OPENROUTER_API_KEY || cloudConfig?.apiKey;
	if (useCloud && apiKey) {
		headers["Authorization"] = `Bearer ${apiKey}`;
		log.info(
			{ provider, hasKey: !!apiKey, keyLength: apiKey?.length },
			"Cloud request with API key",
		);
	} else if (useCloud) {
		log.warn("Cloud enabled but no API key found in env or config!");
	}
	// OpenRouter requires site headers for tracking
	if (provider === "openrouter") {
		headers["HTTP-Referer"] = "https://github.com/pjsvis/amalfa";
		headers["X-Title"] = "AMALFA Knowledge Graph";
	}

	// Determine endpoint and request format based on provider
	let endpoint: string;
	let body: string;

	if (provider === "openrouter") {
		// OpenRouter uses OpenAI-compatible format at openrouter.ai/api/v1
		endpoint = "https://openrouter.ai/api/v1/chat/completions";
		body = JSON.stringify({
			model,
			messages,
			stream: false,
			temperature: modelOptions.temperature ?? 0.1,
			max_tokens: modelOptions.num_predict ?? 500,
		});
	} else {
		// Ollama format (local or cloud Ollama server)
		const host = useCloud
			? cloudConfig.host
			: hostArgs.host || "localhost:11434";
		endpoint = `http://${host}/api/chat`;
		body = JSON.stringify({
			model,
			messages,
			stream: false,
			format, // Pass format (e.g. "json") for GBNF grammar
			options: {
				temperature: 0.1,
				num_predict: 200,
				...modelOptions,
			},
		});
	}

	const response = await fetch(endpoint, {
		method: "POST",
		headers,
		body,
	});

	if (!response.ok) {
		// Try to get error details from response body
		let errorBody = "";
		try {
			errorBody = await response.text();
		} catch {}
		log.error(
			{
				status: response.status,
				statusText: response.statusText,
				body: errorBody,
			},
			"API request failed",
		);
		throw new Error(`${provider} API error: ${response.statusText}`);
	}

	const result = await response.json();

	// Normalize response format (OpenRouter uses OpenAI format)
	if (provider === "openrouter") {
		// OpenAI format: { choices: [{ message: { role, content } }] }
		const openaiResult = result as { choices: { message: Message }[] };
		return {
			message: openaiResult.choices[0]?.message || {
				role: "assistant",
				content: "",
			},
		};
	}

	// Ollama format: { message: { role, content } }
	return result as { message: Message };
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

	// Use the globally initialized db
	// const db = new ResonanceDB(DB_PATH); // This line is removed as db is global

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
	modelOverride?: string, // Optional: Use specific model (e.g., mistral-nemo for research)
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
	const vectors = new VectorEngine(db.getRawDb());
	try {
		// RAG: Perform Hybrid Search (Vector + Graph)
		const results = await vectors.search(userMessage, 3);
		const directNodeIds = new Set(results.map((r) => r.id));
		const relatedNodeIds = new Set<string>();

		// Graph Expansion: Find neighbors of direct hits
		for (const r of results) {
			const neighbors = graphEngine.getNeighbors(r.id);
			for (const neighborId of neighbors) {
				if (!directNodeIds.has(neighborId)) {
					relatedNodeIds.add(neighborId);
				}
			}
		}

		let augmentContext = "\n\nRELEVANT CONTEXT FROM KNOWLEDGE BASE:\n";

		if (results.length > 0) {
			augmentContext += `\n--- [DIRECT SEARCH RESULTS] ---\n`;
			results.forEach((r: { id: string; score: number }) => {
				const node = db.getNode(r.id);
				const content = node?.content ?? "";
				const snippet = content.slice(0, 800);
				augmentContext += `[Document: ${r.id}] (Similarity: ${r.score.toFixed(2)})\n${snippet}\n\n`;
			});

			if (relatedNodeIds.size > 0) {
				augmentContext += `\n--- [RELATED NEIGHBORS (GRAPH DISCOVERY)] ---\n`;
				const neighboursToInclude = Array.from(relatedNodeIds).slice(0, 5); // Limit to 5 neighbors
				neighboursToInclude.forEach((nrId) => {
					const node = db.getNode(nrId);
					const content = node?.content ?? "";
					const snippet = content.slice(0, 400); // Shorter snippet for neighbors
					augmentContext += `[Related: ${nrId}] (Via: ${node?.label || nrId})\n${snippet}\n\n`;
				});
			}

			augmentContext += `\nINSTRUCTIONS: Use the search results and related neighbors to provide a comprehensive answer. Cite document IDs.\n`;
		} else {
			augmentContext = "";
		}

		// Append context to user message
		session.messages.push({
			role: "user",
			content: userMessage + augmentContext,
		});
	} catch (e) {
		// Fallback to ignoring RAG on error
		log.warn({ err: e }, "RAG search failed, proceeding without context");
		session.messages.push({ role: "user", content: userMessage });
	}

	// Maintain context window (keep system msg + last 10 messages)
	const contextMessages = [
		session.messages[0],
		...session.messages.slice(-10),
	].filter((m): m is Message => m !== undefined);

	try {
		// NOTE: No format: "json" for chat! We want natural language.
		// Use modelOverride if provided (e.g., mistral-nemo for research)
		const response = await callOllama(contextMessages, {
			temperature: 0.7,
			num_predict: 500,
			model: modelOverride,
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
			const parsed = JSON.parse(content);
			if (!parsed.snippet && !parsed.context) {
				throw new Error("Missing snippet/context in JSON");
			}
			return parsed;
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
 * Strategy 1: The "Judge"
 * Verifies if two nodes should actually be linked and classifies the relationship.
 */
async function judgeRelationship(
	source: { id: string; content: string },
	target: { id: string; content: string },
): Promise<{ related: boolean; type?: string; reason?: string }> {
	if (!ollamaAvailable) return { related: false };

	try {
		const response = await callOllama(
			[
				{
					role: "system",
					content: `You are a Semantic Graph Architect. Analyze two markdown notes and determine if they share a direct, non-trivial logical relationship.
Possible Relationship Types:
- EXTENDS: One note provides more detail or a follow-up to the other.
- SUPPORTS: One note provides evidence or arguments for the other.
- CONTRADICTS: Notes present opposing views or conflict.
- REFERENCES: A general citation or mention without a strong logical link.
- DUPLICATE: Notes cover significantly the same information.

Guidelines:
- Return JSON.
- relate: boolean (true if a link is justified)
- type: string (the uppercase relation type)
- reason: string (brief explanation)

If the link is trivial (e.g. just common words), set relate: false.`,
				},
				{
					role: "user",
					content: `Node A (ID: ${source.id}):\n${source.content.slice(0, 1500)}\n\n---\n\nNode B (ID: ${target.id}):\n${target.content.slice(0, 1500)}`,
				},
			],
			{
				temperature: 0.1,
				format: "json",
			},
		);

		const result = JSON.parse(response.message.content);
		return {
			related: !!result.relate,
			type: result.type?.toUpperCase(),
			reason: result.reason,
		};
	} catch (error) {
		log.warn({ error }, "LLM Judging failed");
		return { related: false };
	}
}

/**
 * Strategy 2: Community Synthesis
 * Summarizes a group of related nodes.
 */
async function summarizeCommunity(
	nodes: { id: string; content: string }[],
): Promise<{ label: string; summary: string }> {
	if (!ollamaAvailable)
		return { label: "Synthesis", summary: "LLM Not available" };

	try {
		const response = await callOllama(
			[
				{
					role: "system",
					content: `You are a Knowledge Architect. Analyze a cluster of related documents and generate a canonical Label and a concise Synthesis (3 sentences max).
The Label should be a clear topic name (e.g. "MCP Authentication Protocols").
The Synthesis should explain the core theme connecting these documents.

Return JSON format: { "label": "string", "summary": "string" }`,
				},
				{
					role: "user",
					content: nodes
						.map((n) => `Node ${n.id}:\n${n.content.slice(0, 1000)}`)
						.join("\n\n---\n\n"),
				},
			],
			{
				temperature: 0.3,
				format: "json",
			},
		);

		const content = response.message.content;
		try {
			// Extract JSON if it's wrapped in code blocks
			const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || [
				null,
				content,
			];
			const jsonStr = jsonMatch[1] || content;
			return JSON.parse(jsonStr);
		} catch (error) {
			log.warn({ error, content }, "Failed to parse community summary JSON");
			throw error;
		}
	} catch (error) {
		log.warn(
			{ error: error instanceof Error ? error.message : String(error) },
			"Community summary failed",
		);
		return { label: "Untitled Cluster", summary: "Failed to generate summary" };
	}
}

/**
 * Strategy 3: Chronos
 * Extracts the primary temporal anchor from a document.
 */
async function extractDate(
	nodeId: string,
	content: string,
): Promise<string | null> {
	// First try regex for common patterns
	const dateMatch =
		content.match(/Date:\*\*\s*(\d{4}-\d{2}-\d{2})/i) ||
		content.match(/date:\s*(\d{4}-\d{2}-\d{2})/i) ||
		content.match(/#\s*(\d{4}-\d{2}-\d{2})/i);

	if (dateMatch) return dateMatch[1] || null;

	if (!ollamaAvailable) return null;

	try {
		const response = await callOllama(
			[
				{
					role: "system",
					content: `You are a Temporal Chronologist. Extract the primary creation or event date from the following markdown note. 
Return only the date in YYYY-MM-DD format. If no specific date is found, return "null".`,
				},
				{
					role: "user",
					content: `Node: ${nodeId}\nContent:\n${content.slice(0, 2000)}`,
				},
			],
			{ temperature: 0 },
		);

		const result = response.message.content.trim();
		log.info({ nodeId, result }, "LLM Chronos result");
		if (result === "null" || !/^\d{4}-\d{2}-\d{2}$/.test(result)) return null;
		return result;
	} catch {
		return null;
	}
}

/**
 * Main daemon logic
 */
async function main() {
	const config = await loadConfig();
	DB_PATH = join(process.cwd(), config.database);

	const isEnabled = config.sonar.enabled || config.phi3?.enabled;

	if (!isEnabled) {
		log.warn("⚠️  Sonar is disabled in configuration. Exiting.");
		process.exit(0);
	}

	log.info("🚀 Sonar Agent starting...");

	// Initialize database and graph
	db = new ResonanceDB(DB_PATH);
	await graphEngine.load(db.getRawDb());
	gardener = new GraphGardener(
		db,
		graphEngine,
		new VectorEngine(db.getRawDb()),
	);

	// Check Ollama availability
	log.info("🔍 Checking Ollama availability...");
	const capabilities = await discoverOllamaCapabilities();
	ollamaAvailable = capabilities.available;

	if (ollamaAvailable) {
		log.info("✅ Ollama is available and healthy");
		// Use discovered preferred model (e.g., tinydolphin) unless overridden in config
		ollamaModel =
			config.sonar.model ||
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
	const port = config.sonar.port || 3012;

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

			// Graph Stats endpoint
			if (url.pathname === "/graph/stats" && req.method === "GET") {
				return Response.json(graphEngine.getStats(), { headers: corsHeaders });
			}

			// Graph Neighbors endpoint
			if (url.pathname === "/graph/neighbors" && req.method === "POST") {
				try {
					const body = (await req.json()) as { nodeId: unknown };
					const { nodeId } = body;
					if (!nodeId || typeof nodeId !== "string") {
						return Response.json(
							{ error: "Missing 'nodeId' parameter" },
							{ status: 400, headers: corsHeaders },
						);
					}
					return Response.json(graphEngine.getNeighbors(nodeId), {
						headers: corsHeaders,
					});
				} catch (error) {
					return Response.json(
						{ error: error instanceof Error ? error.message : "Unknown error" },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			// Graph Path endpoint
			if (url.pathname === "/graph/path" && req.method === "POST") {
				try {
					const body = (await req.json()) as {
						sourceId: unknown;
						targetId: unknown;
					};
					const { sourceId, targetId } = body;
					if (
						!sourceId ||
						typeof sourceId !== "string" ||
						!targetId ||
						typeof targetId !== "string"
					) {
						return Response.json(
							{ error: "Missing 'sourceId' or 'targetId' parameter" },
							{ status: 400, headers: corsHeaders },
						);
					}
					const path = graphEngine.findShortestPath(sourceId, targetId);
					return Response.json({ path }, { headers: corsHeaders });
				} catch (error) {
					return Response.json(
						{ error: error instanceof Error ? error.message : "Unknown error" },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			// Graph Communities endpoint
			if (url.pathname === "/graph/communities" && req.method === "GET") {
				return Response.json(graphEngine.detectCommunities(), {
					headers: corsHeaders,
				});
			}

			// Graph Metrics endpoint
			if (url.pathname === "/graph/metrics" && req.method === "GET") {
				return Response.json(graphEngine.getMetrics(), {
					headers: corsHeaders,
				});
			}

			// Graph Explore/Garden endpoint
			if (url.pathname === "/graph/explore" && req.method === "GET") {
				try {
					const gaps = await gardener.findGaps(5);
					const communities = gardener.analyzeCommunities();
					const hubs = gardener.identifyHubs();
					return Response.json(
						{
							gaps,
							communities,
							hubs,
							stats: graphEngine.getStats(),
						},
						{ headers: corsHeaders },
					);
				} catch (error) {
					return Response.json(
						{
							error:
								error instanceof Error ? error.message : "Gardening failed",
						},
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

	// Task Watcher Loop
	log.info(`👀 Watching for tasks in ${AMALFA_DIRS.tasks.pending}`);

	// Check every 5 seconds
	setInterval(async () => {
		try {
			await processPendingTasks();
		} catch (error) {
			log.error({ error }, "Task processing error");
		}
	}, 5000);
}

/**
 * Scan and process pending tasks
 */
async function processPendingTasks() {
	if (!ollamaAvailable) return;

	const pendingDir = AMALFA_DIRS.tasks.pending;
	if (!existsSync(pendingDir)) return;

	const files = readdirSync(pendingDir);
	for (const file of files) {
		if (!file.endsWith(".json")) continue;

		const taskPath = join(pendingDir, file);
		const processingPath = join(AMALFA_DIRS.tasks.processing, file);

		try {
			// Move to processing
			renameSync(taskPath, processingPath);
			log.info({ file }, "🔄 Processing task...");

			const taskContent = await Bun.file(processingPath).json();
			const report = await executeTask(taskContent);

			// Save report
			const reportName = file.replace(".json", "-report.md");
			const reportPath = join(AMALFA_DIRS.tasks.completed, reportName);
			writeFileSync(reportPath, report);

			// Move original task to completed
			const completedPath = join(AMALFA_DIRS.tasks.completed, file);
			renameSync(processingPath, completedPath);

			log.info({ file }, "✅ Task completed");

			// Notification
			if (taskContent.notify !== false) {
				await sendNotification("Sonar Agent", `Task Complete: ${file}`);
			}
		} catch (error) {
			log.error({ file, error }, "❌ Task failed");
			// Move back to pending? Or to a failed dir? For now, leave in processing or move to failed could be better.
			// Let's create a failed report so user knows.
			const reportName = file.replace(".json", "-FAILED.md");
			const reportPath = join(AMALFA_DIRS.tasks.completed, reportName);
			writeFileSync(reportPath, `# Task Failed\n\nError: ${error}`);

			// Move to completed so we don't loop forever
			const completedPath = join(AMALFA_DIRS.tasks.completed, file);
			renameSync(processingPath, completedPath);
		}
	}
}

/**
 * Execute a specific task based on its type
 */
async function executeTask(task: SonarTask): Promise<string> {
	log.info({ type: task.type }, "🚀 Starting executeTask");
	const startTime = Date.now();
	let output = `# Task Report: ${task.type}\nDate: ${new Date().toISOString()}\n\n`;

	if (task.type === "synthesis") {
		const minSize = task.minSize || 5;
		output += `## Objective\nSynthesize conceptual communities (Min Cluster Size: ${minSize}).\n\n`;

		const insights = gardener.analyzeCommunities();
		const validClusters = insights.filter((c) => c.nodes.length >= minSize);

		output += `### Community Proposals\n\n`;
		if (validClusters.length === 0) {
			output += `No large communities found to synthesize.\n`;
		}

		for (const cluster of validClusters) {
			const reps = gardener.getClusterRepresentatives(cluster.nodes, 4);
			const nodeData = [];

			for (const id of reps) {
				const content = await gardener.getContent(id);
				if (content) nodeData.push({ id, content });
			}

			if (nodeData.length > 0) {
				const synthesis = await summarizeCommunity(nodeData);
				const slug = synthesis.label
					.toLowerCase()
					.replace(/[^a-z0-9]/g, "-")
					.replace(/-+/g, "-");
				const filename = `synthesis-${cluster.clusterId}-${slug}.md`;
				const synthDir = join(process.cwd(), "docs/synthesis");

				output += `#### Community: ${synthesis.label}\n`;
				output += `- **Members:** ${cluster.nodes.length} nodes\n`;
				output += `- **Summary:** ${synthesis.summary}\n`;

				if (task.autoApply) {
					// Ensure dir exists
					if (!existsSync(synthDir)) mkdirSync(synthDir, { recursive: true });
					const targetPath = join(synthDir, filename);

					const fileContent = `---
title: "${synthesis.label}"
type: synthesis
nodes: [${cluster.nodes.join(", ")}]
---

# ${synthesis.label}

${synthesis.summary}

## Cluster Members
${cluster.nodes.map((id) => `- [[${id}]]`).join("\n")}
`;
					writeFileSync(targetPath, fileContent);
					output += `- **Action:** 📝 Created synthesis node at \`${join("docs/synthesis", filename)}\`\n`;
				}
				output += "\n";
			}
		}
	} else if (task.type === "timeline") {
		const limit = task.limit || 50;
		output += `## Objective\nExtract temporal anchors for ${limit} documents.\n\n`;

		const nodes = db.getNodes({ limit, excludeContent: true });
		let updatedCount = 0;

		output += `### Chronological Updates\n\n`;
		for (const node of nodes) {
			// Skip if already has date
			if (node.date) continue;

			const content = await gardener.getContent(node.id);
			if (!content) continue;

			const date = await extractDate(node.id, content);
			if (date) {
				if (task.autoApply) {
					db.updateNodeDate(node.id, date);
					output += `- ✅ **${node.id}**: Anchored to ${date}\n`;
				} else {
					output += `- 🔍 **${node.id}**: Potential date ${date}\n`;
				}
				updatedCount++;
			}
		}

		output += `\n**Total Updated:** ${updatedCount} nodes\n`;
	} else if (task.type === "enhance_batch") {
		const limit = task.limit || 10;
		output += `## Objective\nEnhance ${limit} documents with metadata.\n\n`;

		const result = await handleBatchEnhancement(limit);

		output += `## Results\n`;
		output += `- Total: ${result.total}\n`;
		output += `- Successful: ${result.successful}\n`;
		output += `- Failed: ${result.failed}\n\n`;

		output += `Check daemon logs for detailed errors per document.\n`;
	} else if (task.type === "garden") {
		const limit = task.limit || 5;
		const autoApply = task.autoApply || false;
		output += `## Objective\nAnalyze graph for semantic gaps and optimize topology (Limit: ${limit}).\n\n`;

		const suggestions = await gardener.findGaps(limit);
		const temporal = gardener.weaveTimeline();

		output += `### Detected Gaps & Propositions\n\n`;
		if (suggestions.length === 0 && temporal.length === 0) {
			output += `No significant gaps or temporal sequences found.\n`;
		}

		for (const sug of suggestions) {
			output += `#### Gap: ${sug.sourceId} ↔ ${sug.targetId}\n`;
			output += `- **Vector Similarity:** ${sug.similarity.toFixed(4)}\n`;

			const sourceContent = await gardener.getContent(sug.sourceId);
			const targetContent = await gardener.getContent(sug.targetId);

			if (sourceContent && targetContent) {
				const judgment = await judgeRelationship(
					{ id: sug.sourceId, content: sourceContent },
					{ id: sug.targetId, content: targetContent },
				);

				if (judgment.related) {
					output += `- **LLM Judgment:** ✅ RELATED (${judgment.type})\n`;
					output += `- **Reason:** ${judgment.reason}\n`;

					const relType = judgment.type || "SEE_ALSO";
					const sourcePath = gardener.resolveSource(sug.sourceId);

					if (autoApply && sourcePath) {
						TagInjector.injectTag(sourcePath, relType, sug.targetId);
						output += `- **Action:** 💉 Injected semantic tag [${relType}: ${sug.targetId}]\n`;
					} else {
						output += `- **Proposed Action:** Add \`[${relType}: ${sug.targetId}]\` to \`${sug.sourceId}\`\n`;
					}
				} else {
					output += `- **LLM Judgment:** ❌ DISMISSED (Trivial or unrelated)\n`;
					if (judgment.reason) {
						output += `- **Reason:** ${judgment.reason}\n`;
					}
				}
			} else {
				output += `- **Error:** Could not retrieve content for judging.\n`;
			}
			output += "\n";
		}

		if (temporal.length > 0) {
			output += `### Temporal Sequences\n\n`;
			for (const sug of temporal) {
				output += `#### Sequence: ${sug.sourceId} → ${sug.targetId}\n`;
				output += `- **Reason:** ${sug.reason}\n`;

				const sourcePath = gardener.resolveSource(sug.sourceId);
				if (autoApply && sourcePath) {
					TagInjector.injectTag(sourcePath, "FOLLOWS", sug.targetId);
					output += `- **Action:** 💉 Injected temporal tag [FOLLOWS: ${sug.targetId}]\n`;
				} else {
					output += `- **Proposed Action:** Add \`[FOLLOWS: ${sug.targetId}]\` to \`${sug.sourceId}\`\n`;
				}
				output += "\n";
			}
		}
	} else if (task.type === "research") {
		output += `## Objective\nResearch Query: "${task.query}"\n\n`;

		try {
			const sessionId = `task-${Date.now()}`;
			// For research: use task.model if specified, otherwise let the cloud/local config decide
			// Don't hardcode mistral-nemo since it's not valid on OpenRouter
			const researchModel = task.model || undefined;
			const response = await handleChat(
				sessionId,
				task.query || "",
				researchModel,
			);

			output += `## Analysis\n${response.message.content}\n\n`;
			output += `(Model: ${researchModel || "default"})\n`;

			// Note: chat doesn't return structured sources yet
			output += `(Source citation not available in simple research task)\n`;
		} catch (e) {
			output += `## Error\nResearch failed: ${e instanceof Error ? e.message : String(e)}\n`;
		}
	} else {
		output += `Error: Unknown task type '${task.type}'\n`;
	}

	const duration = ((Date.now() - startTime) / 1000).toFixed(1);
	output += `\n---\n**Duration:** ${duration}s\n`;

	return output;
}

// Run service lifecycle dispatcher
await lifecycle.run(command, main);
