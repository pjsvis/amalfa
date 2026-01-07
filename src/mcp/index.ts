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
import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";
import { DaemonManager } from "../utils/DaemonManager";
import { getLogger } from "../utils/Logger";
import { ServiceLifecycle } from "../utils/ServiceLifecycle";

const args = process.argv.slice(2);
const command = args[0] || "serve";
const log = getLogger("MCP");

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

// Helper function to create fresh database connection per request
function createConnection() {
	const db = new ResonanceDB(DB_PATH);
	const vectorEngine = new VectorEngine(db.getRawDb());
	return { db, vectorEngine };
}

async function runServer() {
	// 0. Load configuration
	const config = await loadConfig();
	DB_PATH = join(process.cwd(), config.database);
	log.info({ database: DB_PATH }, "📁 Database path loaded from config");

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

	// 1. Setup Server
	const server = new Server(
		{ name: "amalfa-mcp", version: "1.0.0" },
		{ capabilities: { tools: {}, resources: {} } },
	);

	// 2. Define Constants
	const TOOLS = {
		SEARCH: "search_documents",
		READ: "read_node_content",
		EXPLORE: "explore_links",
		LIST: "list_directory_structure",
		GARDEN: "inject_tags",
	};

	// 3. Register Handlers
	server.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: [
				{
					name: TOOLS.SEARCH,
					description:
						"Search the Knowledge Graph using Vector (semantic) search.",
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
					description: "Read the full markdown content of a specific node.",
					inputSchema: {
						type: "object",
						properties: { id: { type: "string" } },
						required: ["id"],
					},
				},
				{
					name: TOOLS.EXPLORE,
					description: "Find related nodes (Graph Traversal).",
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
					description: "List the directory structure of the document set.",
					inputSchema: { type: "object", properties: {} },
				},
				{
					name: TOOLS.GARDEN,
					description:
						"Inject semantic tags into a source file (Gardener Agent).",
					inputSchema: {
						type: "object",
						properties: {
							file_path: { type: "string" },
							tags: { type: "array", items: { type: "string" } },
						},
						required: ["file_path", "tags"],
					},
				},
			],
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const { name, arguments: args } = request.params;
		try {
			if (name === TOOLS.SEARCH) {
				// Create fresh connection for this request
				const { db, vectorEngine } = createConnection();
				try {
					const query = String(args?.query);
					const limit = Number(args?.limit || 20);
					const candidates = new Map<
						string,
						{ id: string; score: number; preview: string; source: string }
					>();
					const errors: string[] = [];

					// Vector Search only (FTS removed in Hollow Node migration)
					try {
						const vectorResults = await vectorEngine.search(query, limit);
						for (const r of vectorResults) {
							// Handle hollow nodes: content may be placeholder text
							const preview = r.content
								? r.content.slice(0, 200).replace(/\n/g, " ")
								: "[No preview available]";
							candidates.set(r.id, {
								id: r.id,
								score: r.score,
								preview: preview,
								source: "vector",
							});
						}
					} catch (e: unknown) {
						const msg = e instanceof Error ? e.message : String(e);
						log.error({ err: e }, "Vector Search Error");
						errors.push(msg);
					}

					const results = Array.from(candidates.values())
						.sort((a, b) => b.score - a.score)
						.slice(0, limit)
						.map((r) => ({ ...r, score: r.score.toFixed(3) }));

					if (results.length === 0 && errors.length > 0) {
						return {
							content: [
								{ type: "text", text: `Search Error: ${errors.join(", ")}` },
							],
							isError: true,
						};
					}
					return {
						content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
					};
				} finally {
					// Cleanup connection
					db.close();
				}
			}

			if (name === TOOLS.READ) {
				// Hollow Node: Read content from filesystem via meta.source
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

					// Read content from filesystem
					try {
						const content = await Bun.file(sourcePath).text();
						return { content: [{ type: "text", text: content }] };
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
					content: [{ type: "text", text: JSON.stringify(structure, null, 2) }],
				};
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

			return {
				content: [{ type: "text", text: `Tool ${name} not found.` }],
				isError: true,
			};
		} catch (error) {
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

await lifecycle.run(command, runServer, false);
