#!/usr/bin/env bun

/**
 * AMALFA Sonar Multi-Purpose Sub-Agent
 * Main Entry Point & Daemon Controller
 */

import { existsSync, mkdirSync } from "node:fs";
import { readdir, rename } from "node:fs/promises";

import { join } from "node:path";
import { AMALFA_DIRS, loadConfig } from "@src/config/defaults";
import { GraphEngine } from "@src/core/GraphEngine";
import { GraphGardener } from "@src/core/GraphGardener";
import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";
import { getLogger } from "@src/utils/Logger";
import { sendNotification } from "@src/utils/Notifications";
import {
	checkOllamaHealth,
	discoverOllamaCapabilities,
} from "@src/utils/ollama-discovery";
import { ServiceLifecycle } from "@src/utils/ServiceLifecycle";
import { inferenceState } from "./sonar-inference";
import {
	handleBatchEnhancement,
	handleChat,
	handleContextExtraction,
	handleGardenTask,
	handleMetadataEnhancement,
	handleResearchTask,
	handleResultReranking,
	handleSearchAnalysis,
	handleSynthesisTask,
	handleTimelineTask,
	type SonarContext,
} from "./sonar-logic";
import { getTaskModel } from "./sonar-strategies";
import type {
	ChatRequest,
	ChatSession,
	MetadataEnhanceRequest,
	SearchAnalyzeRequest,
	SearchContextRequest,
	SearchRerankRequest,
	SonarTask,
} from "./sonar-types";

const args = process.argv.slice(2);
const command = args[0] || "serve";
const log = getLogger("SonarAgent");

let DB_PATH: string;
let db: ResonanceDB;
const graphEngine = new GraphEngine();
let gardener: GraphGardener;
let vectorEngine: VectorEngine;

// Global state
const chatSessions = new Map<string, ChatSession>();

// Service lifecycle management
const lifecycle = new ServiceLifecycle({
	name: "SonarAgent",
	pidFile: join(AMALFA_DIRS.runtime, "sonar.pid"),
	logFile: join(AMALFA_DIRS.logs, "sonar.log"),
	entryPoint: "src/daemon/sonar-agent.ts",
});

/**
 * Main logical loop for the Sonar Agent
 */
async function main() {
	const config = await loadConfig();
	if (!config.sonar.enabled) {
		log.info("Sonar Agent is disabled in config. Exiting.");
		return;
	}

	DB_PATH = config.database;
	db = new ResonanceDB(DB_PATH);
	vectorEngine = new VectorEngine(db.getRawDb());
	gardener = new GraphGardener(db, graphEngine, vectorEngine);

	// Ensure task directories exist
	[
		AMALFA_DIRS.tasks.pending,
		AMALFA_DIRS.tasks.processing,
		AMALFA_DIRS.tasks.completed,
	].forEach((dir) => {
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	});

	// Initial health check
	inferenceState.ollamaAvailable = await checkOllamaHealth();

	if (inferenceState.ollamaAvailable) {
		const capabilities = await discoverOllamaCapabilities();
		const firstModel = capabilities.allModels?.[0];
		if (capabilities.available && firstModel) {
			inferenceState.ollamaModel = config.sonar.model || firstModel.name;
			log.info({ model: inferenceState.ollamaModel }, "Sonar Agent ready");
		}
	} else if (config.sonar.cloud?.enabled) {
		log.info("Local Ollama not found, but Cloud is enabled. Proceeding.");
		inferenceState.ollamaAvailable = true;
	} else {
		log.warn("Sonar Agent limited: Ollama unreachable and Cloud disabled.");
	}

	// Initial graph load
	await graphEngine.load(db.getRawDb());

	// Start HTTP API if serve mode
	if (command === "serve") {
		startServer(config.sonar.port || 3030);
	}

	// Task Watcher Loop
	log.info(
		"Watcher started: Listening for tasks in .amalfa/agent/tasks/pending",
	);
	while (true) {
		// Reload graph to pick up new edges before processing tasks
		await graphEngine.load(db.getRawDb());
		await processPendingTasks();
		await new Promise((resolve) => setTimeout(resolve, 5000));
	}
}

/**
 * Start Bun HTTP Server
 */
function startServer(port: number) {
	const corsHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};

	const context: SonarContext = { db, graphEngine, gardener, chatSessions };

	Bun.serve({
		port,
		async fetch(req) {
			if (req.method === "OPTIONS")
				return new Response(null, { headers: corsHeaders });
			const url = new URL(req.url);

			// Health check
			if (url.pathname === "/health") {
				const cfg = await loadConfig();
				const provider = cfg.sonar.cloud?.enabled ? "cloud" : "local";
				const model = cfg.sonar.cloud?.enabled
					? cfg.sonar.cloud.model
					: inferenceState.ollamaModel || cfg.sonar.model;
				return Response.json(
					{
						status: "ok",
						ollama: inferenceState.ollamaAvailable,
						provider,
						model,
					},
					{ headers: corsHeaders },
				);
			}

			// Chat endpoint
			if (url.pathname === "/chat" && req.method === "POST") {
				try {
					const body = (await req.json()) as ChatRequest;
					const { sessionId, message, model } = body;
					const result = await handleChat(sessionId, message, context, model);
					return Response.json(result, { headers: corsHeaders });
				} catch (error) {
					return Response.json(
						{ error: String(error) },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			// Metadata enhancement endpoint
			if (url.pathname === "/metadata/enhance" && req.method === "POST") {
				try {
					const body = (await req.json()) as MetadataEnhanceRequest;
					const { docId } = body;
					await handleMetadataEnhancement(docId, context);
					return Response.json({ status: "success" }, { headers: corsHeaders });
				} catch (error) {
					return Response.json(
						{ error: String(error) },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			// Graph Stats endpoint
			if (url.pathname === "/graph/stats" && req.method === "GET") {
				return Response.json(graphEngine.getStats(), { headers: corsHeaders });
			}

			// Search endpoints (analysis, rerank, context)
			if (url.pathname === "/search/analyze" && req.method === "POST") {
				try {
					const body = (await req.json()) as SearchAnalyzeRequest;
					const { query } = body;
					const result = await handleSearchAnalysis(query, context);
					return Response.json(result, { headers: corsHeaders });
				} catch (error) {
					return Response.json(
						{ error: String(error) },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			if (url.pathname === "/search/rerank" && req.method === "POST") {
				try {
					const body = (await req.json()) as SearchRerankRequest;
					const { results, query, intent } = body;
					const result = await handleResultReranking(results, query, intent);
					return Response.json(result, { headers: corsHeaders });
				} catch (error) {
					return Response.json(
						{ error: String(error) },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			if (url.pathname === "/search/context" && req.method === "POST") {
				try {
					const body = (await req.json()) as SearchContextRequest;
					const { result, query } = body;
					const contextResult = await handleContextExtraction(result, query);
					return Response.json(contextResult, { headers: corsHeaders });
				} catch (error) {
					return Response.json(
						{ error: String(error) },
						{ status: 500, headers: corsHeaders },
					);
				}
			}

			return new Response("Not Found", { status: 404, headers: corsHeaders });
		},
	});

	log.info(`Server started on port ${port}`);
}

/**
 * Process tasks from the pending directory
 */
async function processPendingTasks() {
	const pendingDir = AMALFA_DIRS.tasks.pending;
	if (!existsSync(pendingDir)) return;

	const files = (await readdir(pendingDir)).filter((f: string) =>
		f.endsWith(".json"),
	);

	for (const file of files) {
		const pendingPath = join(pendingDir, file);
		const processingPath = join(AMALFA_DIRS.tasks.processing, file);

		try {
			await rename(pendingPath, processingPath);
			const taskContent = JSON.parse(
				await Bun.file(processingPath).text(),
			) as SonarTask;

			const report = await executeTask(taskContent);
			const reportName = file.replace(".json", "-report.md");
			const reportPath = join(AMALFA_DIRS.tasks.completed, reportName);
			await Bun.write(reportPath, report);

			await rename(processingPath, join(AMALFA_DIRS.tasks.completed, file));
			log.info({ file }, "✅ Task completed");

			if (taskContent.notify !== false) {
				await sendNotification("Sonar Agent", `Task Complete: ${file}`);
			}
		} catch (error) {
			log.error({ file, error }, "❌ Task failed");
			const failedReport = join(
				AMALFA_DIRS.tasks.completed,
				file.replace(".json", "-FAILED.md"),
			);
			await Bun.write(failedReport, `# Task Failed\n\nError: ${error}`);
			if (existsSync(processingPath)) {
				await rename(processingPath, join(AMALFA_DIRS.tasks.completed, file));
			}
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

	const taskModel = task.model || (await getTaskModel(task.type));
	if (taskModel)
		output += `> **Routing:** Task assigned to model \`${taskModel}\`\n\n`;

	const context: SonarContext = { db, graphEngine, gardener, chatSessions };

	try {
		if (task.type === "synthesis") {
			output += await handleSynthesisTask(task, context, taskModel);
		} else if (task.type === "timeline") {
			output += await handleTimelineTask(task, context, taskModel);
		} else if (task.type === "garden") {
			output += await handleGardenTask(task, context, taskModel);
		} else if (task.type === "research") {
			output += await handleResearchTask(task, context, taskModel);
		} else if (task.type === "enhance_batch") {
			const result = await handleBatchEnhancement(task.limit || 10, context);
			output += `## Results\n- Successful: ${result.successful}\n- Failed: ${result.failed}\n- Total: ${result.total}\n`;
		} else {
			output += `⚠️ Unknown task type: ${task.type}\n`;
		}
	} catch (error) {
		output += `❌ Error during task execution: ${error}\n`;
		throw error;
	}

	output += `\n---\n**Duration:** ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`;
	return output;
}

// Run service lifecycle dispatcher
await lifecycle.run(command, main);
