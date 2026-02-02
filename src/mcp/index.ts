import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AMALFA_DIRS, loadConfig } from "@src/config/defaults";
import { GraphEngine } from "@src/core/GraphEngine";
import { GraphGardener } from "@src/core/GraphGardener";
import { GrepEngine } from "@src/core/GrepEngine";
import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";
import { registerAllTools } from "../tools";
import { ContentHydrator } from "../utils/ContentHydrator";
import { DaemonManager } from "../utils/DaemonManager";
import { getHistorian } from "../utils/Historian";
import { getLogger } from "../utils/Logger";
import { rerankDocuments } from "../utils/reranker-client";
import { getScratchpad } from "../utils/Scratchpad";
import { ServiceLifecycle } from "../utils/ServiceLifecycle";
import { createSonarClient, type SonarClient } from "../utils/sonar-client";
import { toolRegistry } from "../utils/ToolRegistry";

const args = process.argv.slice(2);
const command = args[0] || "serve";
const log = getLogger("MCP");

const sonarClient: SonarClient = await createSonarClient();
const historian = getHistorian();

// --- Service Lifecycle ---

const lifecycle = new ServiceLifecycle({
	name: "MCP",
	pidFile: join(AMALFA_DIRS.runtime, "mcp.pid"),
	logFile: join(AMALFA_DIRS.logs, "mcp.log"),
	entryPoint: "src/mcp/index.ts",
});

// --- Server Logic ---

// Database path from config (loaded once at startup)
let DB_PATH: string;

function createConnection() {
	const db = new ResonanceDB(DB_PATH);
	const vectorEngine = new VectorEngine(db.getRawDb());
	const grepEngine = new GrepEngine();
	grepEngine.setDb(db.getRawDb());
	return { db, vectorEngine, grepEngine };
}

type ToolResponse = {
	content: { type: string; text: string }[];
	isError?: boolean;
};

async function runServer() {
	// 0. Load configuration
	const config = await loadConfig();
	DB_PATH = join(process.cwd(), config.database);
	log.info({ database: DB_PATH }, "📁 Database path loaded from config");

	// Create scratchpad instance with config settings (NFB-01: SSOT from schema)
	const scratchpad = getScratchpad(config.scratchpad);
	log.info(
		{ scratchpad: config.scratchpad },
		"📝 Scratchpad initialized from config",
	);

	// Helper to wrap responses with scratchpad caching
	function wrapWithScratchpad(
		toolName: string,
		response: ToolResponse,
	): ToolResponse {
		if (response.isError || response.content.length === 0) {
			return response;
		}

		const text = response.content[0]?.text;
		if (!text) return response;

		const cachedText = scratchpad.maybeCache(toolName, text);
		return {
			...response,
			content: [{ type: "text", text: cachedText }],
		};
	}

	// 1. Start daemons if needed
	const daemonManager = new DaemonManager();

	// Check file watcher status
	if (config.watch?.enabled) {
		const watcherStatus = await daemonManager.checkFileWatcher();
		if (!watcherStatus.running) {
			log.info("🔄 Starting file watcher daemon...");
			try {
				await daemonManager.startFileWatcher();
				log.info("✅ File watcher daemon started");
			} catch (e) {
				log.warn(
					{ err: e },
					"⚠️  Failed to start file watcher, continuing without it",
				);
			}
		} else {
			log.info(
				{ pid: watcherStatus.pid },
				"✅ File watcher daemon already running",
			);
		}
	} else {
		log.info("ℹ️  File watching disabled in config");
	}

	// Start vector daemon for fast embeddings
	const vectorStatus = await daemonManager.checkVectorDaemon();
	if (!vectorStatus.running) {
		log.info("🔄 Starting vector daemon...");
		try {
			await daemonManager.startVectorDaemon();
			log.info("✅ Vector daemon started");
		} catch (e) {
			log.warn(
				{ err: e },
				"⚠️  Failed to start vector daemon, searches will be slower",
			);
		}
	} else {
		log.info(
			{ pid: vectorStatus.pid, port: vectorStatus.port },
			"✅ Vector daemon already running",
		);
	}

	log.info("🚀 AMALFA MCP Server Initializing...");

	// 0. Register Dynamic Tools
	registerAllTools();

	// 1. Setup Server
	const server = new Server(
		{ name: "amalfa-mcp", version: "1.0.0" },
		{ capabilities: { tools: {}, resources: {} } },
	);

	const TOOLS = {
		SEARCH: "search_documents",
		READ: "read_node_content",
		EXPLORE: "explore_links",
		LIST: "list_directory_structure",
		GARDEN: "inject_tags",
		GAPS: "find_gaps",
		SCRATCHPAD_READ: "scratchpad_read",
		SCRATCHPAD_LIST: "scratchpad_list",
	};

	// 3. Register Handlers
	server.setRequestHandler(ListToolsRequestSchema, async () => {
		// 1. Get legacy hardcoded tools
		const legacyTools = [
			{
				name: TOOLS.SEARCH,
				description:
					"Search knowledge graph for past learnings & solutions. Use when user asks 'what did we learn about X' or needs context from previous work. Returns ranked results by semantic relevance.",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string" },
						limit: { type: "number", default: 20 },
					},
					required: ["query"],
				},
			},
			{
				name: TOOLS.READ,
				description:
					"Read full markdown content of a document. Use after search to get complete details. Returns entire document including metadata and links.",
				inputSchema: {
					type: "object",
					properties: { id: { type: "string" } },
					required: ["id"],
				},
			},
			{
				name: TOOLS.EXPLORE,
				description:
					"Find related documents via graph links. Use to follow chains of thought, trace decision evolution, or find implementation from spec. Returns connected nodes.",
				inputSchema: {
					type: "object",
					properties: {
						id: { type: "string" },
						relation: { type: "string" },
					},
					required: ["id"],
				},
			},
			{
				name: TOOLS.LIST,
				description:
					"List document directory structure. Use to discover what knowledge exists or orient in the knowledge graph. Returns tree of all documents.",
				inputSchema: { type: "object", properties: {} },
			},
			{
				name: TOOLS.GAPS,
				description:
					"Find similar but unlinked documents. Use for knowledge graph cleanup, discovering missing connections, or identifying documentation gaps. Returns candidate pairs.",
				inputSchema: {
					type: "object",
					properties: {
						limit: { type: "number", default: 10 },
						threshold: { type: "number", default: 0.8 },
					},
				},
			},
			{
				name: TOOLS.SCRATCHPAD_READ,
				description:
					"Read cached large output. Use when previous tool said 'Output cached' with an ID. Retrieves full content that was too large for direct return.",
				inputSchema: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "The scratchpad entry ID (12-char hash)",
						},
					},
					required: ["id"],
				},
			},
			{
				name: TOOLS.SCRATCHPAD_LIST,
				description:
					"List all cached outputs with metadata. Use to see what large outputs are available or manage cache. Returns cache inventory with timestamps.",
				inputSchema: { type: "object", properties: {} },
			},
		];

		// 2. Get dynamic tools from registry
		// biome-ignore lint/suspicious/noExplicitAny: mcp sdk typing issue
		const dynamicTools = toolRegistry.list() as any[];

		return {
			tools: [...legacyTools, ...dynamicTools],
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const { name, arguments: args } = request.params;
		const callId = historian.recordCall(name, args);
		const start = Date.now();

		try {
			const result = await (async () => {
				// 0. Check Dynamic Registry First
				const dynamicTool = toolRegistry.get(name);
				if (dynamicTool) {
					const output = await dynamicTool.handler(args);
					// Normalize output structure if needed, but registry tools return standard format
					return output;
				}

				if (name === TOOLS.SEARCH) {
					// Create fresh connection for this request
					const { db, vectorEngine, grepEngine } = createConnection();
					const graphEngine = new GraphEngine();
					await graphEngine.load(db.getRawDb());
					const gardener = new GraphGardener(db, graphEngine, vectorEngine);
					const hydrator = new ContentHydrator(gardener);

					try {
						const query = String(args?.query);
						const limit = Number(args?.limit || 20);
						const candidates = new Map<
							string,
							{
								id: string;
								score: number;
								preview: string;
								source: string;
							}
						>();
						const errors: string[] = [];

						// Step 1: Analyze query with Sonar (if available)
						const sonarAvailable = await sonarClient.isAvailable();
						let queryAnalysis: Awaited<
							ReturnType<typeof sonarClient.analyzeQuery>
						> | null = null;
						let queryIntent: string | undefined;

						if (sonarAvailable) {
							log.info({ query }, "🔍 Analyzing query with Sonar");
							queryAnalysis = await sonarClient.analyzeQuery(query);
							if (queryAnalysis) {
								queryIntent = queryAnalysis.intent;
								log.info(
									{
										intent: queryAnalysis.intent,
										entities: queryAnalysis.entities.join(", "),
										level: queryAnalysis.technical_level,
									},
									"✅ Query analysis complete",
								);
							}
						}

						// Step 2: Late-Fusion Retrieval (Vector + Grep)
						log.info("🧠 Executing Bicameral Search (Vector + Grep)...");

						// Run both engines in parallel
						const [vectorResults, grepResults] = await Promise.all([
							vectorEngine.search(query, limit).catch((err: unknown) => {
								log.error({ err }, "Vector Search Error");
								errors.push(
									`Vector: ${err instanceof Error ? err.message : String(err)}`,
								);
								return [];
							}),
							grepEngine.search(query, limit).catch((err: unknown) => {
								log.error({ err }, "Grep Search Error");
								errors.push(
									`Grep: ${err instanceof Error ? err.message : String(err)}`,
								);
								return [];
							}),
						]);

						// Merge Vector results (Right Brain)
						for (const r of vectorResults) {
							candidates.set(r.id, {
								id: r.id,
								score: r.score,
								preview: r.title || r.id,
								source: "vector",
							});
						}

						// Merge Grep results (Left Brain)
						for (const r of grepResults) {
							const existing = candidates.get(r.id);
							if (existing) {
								// If already found by vector, mark as hybrid and boost score slightly
								existing.source = "hybrid";
								// We don't overwrite the vector score because reranker will decide,
								// but knowing it's a keyword hit is useful metadata.
								existing.preview = `[Match: ${r.content.substring(0, 50)}...] ${existing.preview}`;
							} else {
								candidates.set(r.id, {
									id: r.id,
									score: 0.5, // Arbitrary middle score, reranker will fix
									preview: `[Match] ${r.content.substring(0, 60)}...`,
									source: "grep",
								});
							}
						}

						log.info(
							{
								vectorCount: vectorResults.length,
								grepCount: grepResults.length,
								uniqueCandidates: candidates.size,
							},
							"✅ Retrieval Complete",
						);

						// Step 3: Cross-encoder reranking (BGE reranker)
						let rankedResults = Array.from(candidates.values())
							// Sort by preliminary score just to pick top candidates for reranker if we have too many
							// Vector scores (0.7-0.8) vs Grep default (0.5).
							.sort((a, b) => b.score - a.score)
							.slice(0, Math.min(limit * 3, 60));

						// Hydrate content for reranking
						log.info("💧 Hydrating content for reranking");
						const hydratedResults = await hydrator.hydrateMany(rankedResults);

						// Apply cross-encoder reranking
						log.info("🔄 Reranking with BGE cross-encoder");
						const reranked = await rerankDocuments(
							query,
							// biome-ignore lint/suspicious/noExplicitAny: legacy typing
							hydratedResults as any,
							Math.min(limit * 2, 30), // Keep top results after reranking
						);

						// Update ranked results with reranked scores
						rankedResults = reranked.slice(0, limit).map((rr) => {
							const candidate = candidates.get(rr.id);
							return {
								id: rr.id,
								score: rr.score,
								preview: candidate?.preview || rr.id,
								source: `${candidate?.source}+rerank`,
								content: rr.content,
							};
						});

						// Step 4: LLM reranking with Sonar (optional, for intent understanding)
						if (sonarAvailable && queryAnalysis) {
							// Content already hydrated in step 3
							log.info("🔄 Re-ranking with Sonar LLM");
							const reRanked = await sonarClient.rerankResults(
								// biome-ignore lint/suspicious/noExplicitAny: legacy typing
								rankedResults as any as Array<{
									id: string;
									content: string;
									score: number;
								}>,
								query,
								queryIntent,
							);

							rankedResults = reRanked.map((rr) => ({
								id: rr.id,
								score: rr.relevance_score,
								preview: candidates.get(rr.id)?.preview || rr.id,
								source: "vector",
								content: rr.content,
							}));
							log.info("✅ Results re-ranked");
						}

						// Step 4: Extract context with Sonar for top results (if available)
						let finalResults: Array<{
							id: string;
							score: number | string;
							snippet?: string;
							content?: string;
							preview?: string;
							source?: string;
						}> = rankedResults;

						if (sonarAvailable) {
							log.info("📝 Extracting context with Sonar");
							const contextResults = await Promise.all(
								rankedResults.slice(0, 5).map(async (r) => {
									const withContent =
										"content" in r
											? r
											: await hydrator.hydrate(
													r as { id: string; score: number },
												);
									const context = await sonarClient.extractContext(
										withContent as { id: string; content: string },
										query,
									);
									return {
										...r,
										score: r.score.toFixed(3),
										snippet: context?.snippet || r.preview,
										context: context?.context || "No additional context",
										confidence: context?.confidence || 0.5,
									};
								}),
							);
							finalResults = [
								...contextResults,
								...rankedResults
									.slice(5)
									.map((r) => ({ ...r, score: r.score.toFixed(3) })),
							];
							log.info("✅ Context extraction complete");
						} else {
							finalResults = rankedResults.map((r) => ({
								...r,
								score: r.score.toFixed(3),
							}));
						}

						if (finalResults.length === 0 && errors.length > 0) {
							return {
								content: [
									{ type: "text", text: `Search Error: ${errors.join(", ")}` },
								],
								isError: true,
							};
						}

						// Add Sonar metadata to response
						const searchMetadata = {
							query,
							sonar_enabled: sonarAvailable,
							intent: queryIntent,
							analysis: queryAnalysis,
						};

						return wrapWithScratchpad(name, {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{
											results: finalResults,
											metadata: searchMetadata,
										},
										null,
										2,
									),
								},
							],
						});
					} finally {
						db.close();
					}
				}

				if (name === TOOLS.READ) {
					const { db } = createConnection();
					try {
						const id = String(args?.id);
						const row = db
							.getRawDb()
							.query("SELECT meta FROM nodes WHERE id = ?")
							.get(id) as { meta: string | null } | null;

						if (!row) {
							return { content: [{ type: "text", text: "Node not found." }] };
						}

						const meta = row.meta ? JSON.parse(row.meta) : {};
						const sourcePath = meta.source;

						if (!sourcePath) {
							return {
								content: [
									{ type: "text", text: `No source file for node: ${id}` },
								],
							};
						}

						try {
							const content = await Bun.file(sourcePath).text();
							return wrapWithScratchpad(name, {
								content: [{ type: "text", text: content }],
							});
						} catch {
							return {
								content: [
									{ type: "text", text: `File not found: ${sourcePath}` },
								],
							};
						}
					} finally {
						db.close();
					}
				}

				if (name === TOOLS.EXPLORE) {
					// Create fresh connection for this request
					const { db } = createConnection();
					try {
						const id = String(args?.id);
						const relation = args?.relation ? String(args.relation) : undefined;
						let sql = "SELECT target, type FROM edges WHERE source = ?";
						const params = [id];
						if (relation) {
							sql += " AND type = ?";
							params.push(relation);
						}
						const rows = db
							.getRawDb()
							.query(sql)
							.all(...params) as Record<string, unknown>[];
						return {
							content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
						};
					} finally {
						db.close();
					}
				}

				if (name === TOOLS.LIST) {
					// TODO: Make this configurable via amalfa.config.ts
					const structure = ["docs/", "notes/"];
					return {
						content: [
							{ type: "text", text: JSON.stringify(structure, null, 2) },
						],
					};
				}

				if (name === TOOLS.GAPS) {
					const limit = Number(args?.limit || 10);
					try {
						const gaps = await sonarClient.getGaps(limit);
						return wrapWithScratchpad(name, {
							content: [{ type: "text", text: JSON.stringify(gaps, null, 2) }],
						});
					} catch (e) {
						return {
							content: [{ type: "text", text: `Failed to fetch gaps: ${e}` }],
							isError: true,
						};
					}
				}

				if (name === TOOLS.GARDEN) {
					const filePath = String(args?.file_path);
					const tags = args?.tags as string[];
					let content = await Bun.file(filePath).text();

					// Check for existing tag block and merge/replace
					const tagPattern = /<!-- tags: ([^>]+) -->\s*$/;
					const match = content.match(tagPattern);

					let operation = "injected";
					if (match?.[1]) {
						// Merge with existing tags
						const existingTags = match[1]
							.split(",")
							.map((t) => t.trim())
							.filter(Boolean);
						const mergedTags = [...new Set([...existingTags, ...tags])]; // deduplicate
						const tagBlock = `<!-- tags: ${mergedTags.join(", ")} -->`;
						content = content.replace(tagPattern, `${tagBlock}\n`);
						operation = "merged";
					} else {
						// Append new tag block
						const tagBlock = `<!-- tags: ${tags.join(", ")} -->`;
						content = content.endsWith("\n")
							? `${content}\n${tagBlock}\n`
							: `${content}\n\n${tagBlock}\n`;
					}

					await Bun.write(filePath, content);
					return {
						content: [
							{
								type: "text",
								text: `Successfully ${operation} ${tags.length} tags into ${filePath}`,
							},
						],
					};
				}

				if (name === TOOLS.SCRATCHPAD_READ) {
					const id = String(args?.id);
					const entry = scratchpad.read(id);
					if (!entry) {
						return {
							content: [
								{ type: "text", text: `Scratchpad entry not found: ${id}` },
							],
							isError: true,
						};
					}
					return {
						content: [{ type: "text", text: entry.content }],
					};
				}

				if (name === TOOLS.SCRATCHPAD_LIST) {
					const entries = scratchpad.list();
					const stats = scratchpad.stats();
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({ entries, stats }, null, 2),
							},
						],
					};
				}

				return {
					content: [{ type: "text", text: `Tool ${name} not found.` }],
					isError: true,
				};
			})();
			historian.recordResult(callId, name, result, Date.now() - start);
			return result;
		} catch (error) {
			historian.recordError(callId, name, error, Date.now() - start);
			log.error({ err: error, tool: name }, "Tool execution failed");
			return {
				content: [{ type: "text", text: `Error: ${error}` }],
				isError: true,
			};
		}
	});

	server.setRequestHandler(ListResourcesRequestSchema, async () => {
		return {
			resources: [
				{
					uri: "amalfa://stats/summary",
					name: "System Stats",
					mimeType: "text/plain",
				},
			],
		};
	});

	server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
		if (request.params.uri === "amalfa://stats/summary") {
			// Create fresh connection for this request
			const { db } = createConnection();
			try {
				const stats = db.getStats();
				const text = `Nodes: ${stats.nodes}\nEdges: ${stats.edges}\nVectors: ${stats.vectors}\nSize: ${(stats.db_size_bytes / 1024 / 1024).toFixed(2)} MB`;
				return {
					contents: [{ uri: request.params.uri, mimeType: "text/plain", text }],
				};
			} finally {
				db.close();
			}
		}
		throw new Error("Resource not found");
	});

	// 4. Connect Transport
	const transport = new StdioServerTransport();
	await server.connect(transport);
	log.info("✅ AMALFA MCP Server Running (Per-Request Connections)");
}

// --- Global Error Handling ---

process.on("uncaughtException", (error) => {
	log.fatal({ err: error }, "UNKNOWN MCP ERROR");
	// Original crash log logic preserved for safety? Or redundant?
	// Let's keep specific crash log as backup for now, but log via pino too
	const msg = `[${new Date().toISOString()}] UNKNOWN MCP ERROR: ${error instanceof Error ? error.stack : error}\n`;
	try {
		appendFileSync(".mcp.crash.log", msg);
	} catch {}
});

process.on("unhandledRejection", (reason) => {
	log.fatal({ err: reason }, "UNHANDLED REJECTION");
	const msg = `[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason}\n`;
	try {
		appendFileSync(".mcp.crash.log", msg);
	} catch {}
});

// --- Dispatch ---

await lifecycle.run(command, runServer);
