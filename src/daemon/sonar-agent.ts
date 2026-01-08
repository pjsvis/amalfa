#!/usr/bin/env bun

/**
 * AMALFA Sonar Multi-Purpose Sub-Agent
 * Main Entry Point & Daemon Controller
 */

import {
	existsSync,
	mkdirSync,
	readdirSync,
	renameSync,
	writeFileSync,
} from "node:fs";
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
import { TagInjector } from "@src/utils/TagInjector";

import { inferenceState } from "./sonar-inference";
import {
	handleBatchEnhancement,
	handleChat,
	handleContextExtraction,
	handleMetadataEnhancement,
	handleResultReranking,
	handleSearchAnalysis,
	type SonarContext,
} from "./sonar-logic";
import {
	extractDate,
	getTaskModel,
	judgeRelationship,
	summarizeCommunity,
} from "./sonar-strategies";
import type { ChatSession, SonarTask } from "./sonar-types";

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

	// Start HTTP API if serve mode
	if (command === "serve") {
		startServer(config.sonar.port || 3030);
	}

	// Task Watcher Loop
	log.info(
		"Watcher started: Listening for tasks in .amalfa/agent/tasks/pending",
	);
	while (true) {
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
				return Response.json(
					{ status: "ok", ollama: inferenceState.ollamaAvailable },
					{ headers: corsHeaders },
				);
			}

			// Chat endpoint
			if (url.pathname === "/chat" && req.method === "POST") {
				try {
					const body = (await req.json()) as any;
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
					const body = (await req.json()) as any;
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
					const body = (await req.json()) as any;
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
					const body = (await req.json()) as any;
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
					const body = (await req.json()) as any;
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

	const files = readdirSync(pendingDir).filter((f) => f.endsWith(".json"));

	for (const file of files) {
		const pendingPath = join(pendingDir, file);
		const processingPath = join(AMALFA_DIRS.tasks.processing, file);

		try {
			renameSync(pendingPath, processingPath);
			const taskContent = JSON.parse(
				await Bun.file(processingPath).text(),
			) as SonarTask;

			const report = await executeTask(taskContent);
			const reportName = file.replace(".json", "-report.md");
			const reportPath = join(AMALFA_DIRS.tasks.completed, reportName);
			writeFileSync(reportPath, report);

			renameSync(processingPath, join(AMALFA_DIRS.tasks.completed, file));
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
			writeFileSync(failedReport, `# Task Failed\n\nError: ${error}`);
			if (existsSync(processingPath)) {
				renameSync(processingPath, join(AMALFA_DIRS.tasks.completed, file));
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

	if (task.type === "synthesis") {
		const minSize = task.minSize || 5;
		const validClusters = gardener
			.analyzeCommunities()
			.filter((c) => c.nodes.length >= minSize);

		for (const cluster of validClusters) {
			const reps = gardener.getClusterRepresentatives(cluster.nodes, 4);
			const nodeData = [];
			for (const id of reps) {
				const content = await gardener.getContent(id);
				if (content) nodeData.push({ id, content });
			}

			if (nodeData.length > 0) {
				const synthesis = await summarizeCommunity(nodeData, taskModel);
				const slug = synthesis.label
					.toLowerCase()
					.replace(/[^a-z0-9]/g, "-")
					.replace(/-+/g, "-");
				const filename = `synthesis-${cluster.clusterId}-${slug}.md`;

				output += `#### Community: ${synthesis.label}\n- **Members:** ${cluster.nodes.length} nodes\n- **Summary:** ${synthesis.summary}\n\n`;

				if (task.autoApply) {
					const synthDir = join(process.cwd(), "docs/synthesis");
					if (!existsSync(synthDir)) mkdirSync(synthDir, { recursive: true });
					writeFileSync(
						join(synthDir, filename),
						`---\ntitle: "${synthesis.label}"\ntype: synthesis\nnodes: [${cluster.nodes.join(", ")}]\n---\n\n# ${synthesis.label}\n\n${synthesis.summary}\n\n## Cluster Members\n${cluster.nodes.map((id) => `- [[${id}]]`).join("\n")}\n`,
					);
					output += `- **Action:** 📝 Created synthesis node at \`${join("docs/synthesis", filename)}\`\n\n`;
				}
			}
		}
	} else if (task.type === "timeline") {
		const limit = task.limit || 50;
		const nodes = db.getNodes({ limit, excludeContent: true });
		let updatedCount = 0;

		for (const node of nodes) {
			if (node.date) continue;
			const content = await gardener.getContent(node.id);
			if (!content) continue;
			const date = await extractDate(node.id, content, taskModel);
			if (date) {
				if (task.autoApply) db.updateNodeDate(node.id, date);
				output += `- ${task.autoApply ? "✅" : "🔍"} **${node.id}**: Anchored to ${date}\n`;
				updatedCount++;
			}
		}
		output += `\n**Total Updated:** ${updatedCount} nodes\n`;
	} else if (task.type === "garden") {
		const limit = task.limit || 5;
		const suggestions = await gardener.findGaps(limit);
		const temporal = gardener.weaveTimeline();

		for (const sug of suggestions) {
			const sourceContent = await gardener.getContent(sug.sourceId);
			const targetContent = await gardener.getContent(sug.targetId);
			if (sourceContent && targetContent) {
				const judgment = await judgeRelationship(
					{ id: sug.sourceId, content: sourceContent },
					{ id: sug.targetId, content: targetContent },
					taskModel,
				);
				if (judgment.related) {
					const relType = judgment.type || "SEE_ALSO";
					const sourcePath = gardener.resolveSource(sug.sourceId);
					if (task.autoApply && sourcePath)
						TagInjector.injectTag(sourcePath, relType, sug.targetId);
					output += `- ${task.autoApply ? "💉" : "⚖️"} **${sug.sourceId} ↔ ${sug.targetId}**: ${relType} (${judgment.reason})\n`;
				}
			}
		}

		for (const sug of temporal) {
			const sourcePath = gardener.resolveSource(sug.sourceId);
			if (task.autoApply && sourcePath)
				TagInjector.injectTag(sourcePath, "FOLLOWS", sug.targetId);
			output += `- ${task.autoApply ? "💉" : "🕒"} **${sug.sourceId} → ${sug.targetId}**: FOLLOWS (${sug.reason})\n`;
		}
	} else if (task.type === "research") {
		const contextResult: SonarContext = {
			db,
			graphEngine,
			gardener,
			chatSessions,
		};
		const result = await handleChat(
			`research-${Date.now()}`,
			task.query || "",
			contextResult,
			taskModel,
		);
		output += `## Analysis\n${result.message.content}\n`;
	} else if (task.type === "enhance_batch") {
		const contextResult: SonarContext = {
			db,
			graphEngine,
			gardener,
			chatSessions,
		};
		const result = await handleBatchEnhancement(
			task.limit || 10,
			contextResult,
		);
		output += `## Results\n- Successful: ${result.successful}\n- Failed: ${result.failed}\n- Total: ${result.total}\n`;
	}

	output += `\n---\n**Duration:** ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`;
	return output;
}

// Run service lifecycle dispatcher
await lifecycle.run(command, main);
