import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { GraphEngine } from "@src/core/GraphEngine";
import type { GraphGardener } from "@src/core/GraphGardener";
import { VectorEngine } from "@src/core/VectorEngine";
import type { ResonanceDB } from "@src/resonance/db";
import { getLogger } from "@src/utils/Logger";
import { TagInjector } from "@src/utils/TagInjector";
import { callOllama, inferenceState } from "./sonar-inference";
import {
	extractDate,
	judgeRelationship,
	summarizeCommunity,
} from "./sonar-strategies";
import type { ChatSession, Message, SonarTask } from "./sonar-types";

const log = getLogger("SonarLogic");

export interface SonarContext {
	db: ResonanceDB;
	graphEngine: GraphEngine;
	gardener: GraphGardener;
	chatSessions: Map<string, ChatSession>;
}

/**
 * Handle metadata enhancement for a single document
 */
export async function handleMetadataEnhancement(
	nodeId: string,
	context: SonarContext,
): Promise<void> {
	if (!inferenceState.ollamaAvailable) return;

	try {
		const node = context.db.getNode(nodeId);
		if (!node) return;

		const content = await context.gardener.getContent(nodeId);
		if (!content) return;

		const response = await callOllama(
			[
				{
					role: "system",
					content:
						'Extract 3-5 keywords and a 1-sentence summary from the following text. Return JSON: { "keywords": [], "summary": "" }',
				},
				{ role: "user", content },
			],
			{ temperature: 0.2, format: "json" },
		);

		const metadata = JSON.parse(response.message.content);
		context.db.updateNodeMeta(nodeId, {
			...node.meta,
			keywords: metadata.keywords,
			summary: metadata.summary,
			sonar_enhanced: true,
			enhanced_at: new Date().toISOString(),
		});
	} catch (error) {
		log.error({ nodeId, error }, "Metadata enhancement failed");
	}
}

/**
 * Handle batch enhancement of documents
 */
export async function handleBatchEnhancement(
	limit: number,
	context: SonarContext,
): Promise<{ successful: number; failed: number; total: number }> {
	const allNodes = context.db.getNodes({ excludeContent: true });
	const unenhanced = allNodes
		.filter((n: { meta?: Record<string, unknown> }) => {
			try {
				const meta = n.meta || {};
				return !meta.sonar_enhanced && !meta.phi3_enhanced;
			} catch {
				return false;
			}
		})
		.map((row: { id: string }) => ({ id: row.id }));

	const batch = unenhanced.slice(0, limit);
	log.info(`🔄 Enhancing ${batch.length} docs with Sonar...`);

	const results = await Promise.allSettled(
		batch.map((node: { id: string }) =>
			handleMetadataEnhancement(node.id, context),
		),
	);

	const successful = results.filter((r) => r.status === "fulfilled").length;
	const failed = results.filter((r) => r.status === "rejected").length;

	return { successful, failed, total: batch.length };
}

/**
 * Handle chat request
 */
export async function handleChat(
	sessionId: string,
	userMessage: string,
	context: SonarContext,
	modelOverride?: string,
): Promise<{ message: Message; sessionId: string }> {
	if (!inferenceState.ollamaAvailable) {
		throw new Error("Sonar is not available");
	}

	let session = context.chatSessions.get(sessionId);
	if (!session) {
		session = {
			id: sessionId,
			messages: [
				{
					role: "system",
					content: `You are AMALFA Corpus Assistant. Help users understand and explore their knowledge base.
Current Date: ${new Date().toISOString().split("T")[0]}`,
				},
			],
			startedAt: new Date(),
		};
		context.chatSessions.set(sessionId, session);
	}

	const vectors = new VectorEngine(context.db.getRawDb());
	try {
		const results = await vectors.search(userMessage, 3);
		const directNodeIds = new Set(results.map((r) => r.id));
		const relatedNodeIds = new Set<string>();

		for (const r of results) {
			const neighbors = context.graphEngine.getNeighbors(r.id);
			for (const neighborId of neighbors) {
				if (!directNodeIds.has(neighborId)) {
					relatedNodeIds.add(neighborId);
				}
			}
		}

		let augmentContext = "\n\nRELEVANT CONTEXT FROM KNOWLEDGE BASE:\n";
		if (results.length > 0) {
			augmentContext += `\n--- [DIRECT SEARCH RESULTS] ---\n`;
			results.forEach((r) => {
				const node = context.db.getNode(r.id);
				const content = node?.content ?? "";
				augmentContext += `[Document: ${r.id}] (Similarity: ${r.score.toFixed(2)})\n${content.slice(0, 800)}\n\n`;
			});

			if (relatedNodeIds.size > 0) {
				augmentContext += `\n--- [RELATED NEIGHBORS (GRAPH DISCOVERY)] ---\n`;
				Array.from(relatedNodeIds)
					.slice(0, 5)
					.forEach((nrId) => {
						const node = context.db.getNode(nrId);
						augmentContext += `[Related: ${nrId}] (Via: ${node?.label || nrId})\n${(node?.content ?? "").slice(0, 400)}\n\n`;
					});
			}
		}

		const response = await callOllama(
			[
				...session.messages,
				{ role: "user", content: userMessage + augmentContext },
			],
			{ model: modelOverride },
		);

		session.messages.push({ role: "user", content: userMessage });
		session.messages.push(response.message);

		return { message: response.message, sessionId };
	} catch (error) {
		log.error({ error, userMessage }, "Chat failed");
		throw error;
	}
}

/**
 * Handle search query analysis
 */
export async function handleSearchAnalysis(
	query: string,
	_context: SonarContext, // Reserved for future graph-aware analysis
): Promise<unknown> {
	if (!inferenceState.ollamaAvailable) {
		throw new Error("Sonar is not available");
	}

	try {
		const response = await callOllama(
			[
				{
					role: "system",
					content:
						'Analyze search queries and extract intent, entities and suggested filters. Return JSON: { "intent": "", "entities": [], "filters": {} }',
				},
				{ role: "user", content: query },
			],
			{ temperature: 0.1, format: "json" },
		);

		return JSON.parse(response.message.content);
	} catch (error) {
		log.error({ error, query }, "Query analysis failed");
		throw error;
	}
}

/**
 * Handle result re-ranking
 */
export async function handleResultReranking(
	results: Array<{ id: string; content: string; score: number }>,
	query: string,
	intent?: string,
): Promise<
	Array<{
		id: string;
		content: string;
		score: number;
		relevance_score: number;
	}>
> {
	if (!inferenceState.ollamaAvailable) {
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
					}\n\nResults:\n${results.map((r, i) => `${i + 1}. ${r.content.slice(0, 200)}`).join("\n")}\n\nReturn JSON array with relevance scores (0.0 to 1.0): [{"index": 1, "relevance": 0.95, "reason": ""}]`,
				},
			],
			{ temperature: 0.2, format: "json" },
		);

		const content = response.message.content;
		try {
			const rankings = JSON.parse(content);
			return results.map((result, idx) => {
				const ranking = rankings.find(
					(r: { index: number }) => r.index === idx + 1,
				);
				return { ...result, relevance_score: ranking?.relevance || 0.5 };
			});
		} catch {
			return results.map((r) => ({ ...r, relevance_score: r.score }));
		}
	} catch (error) {
		log.error({ error, query }, "Result re-ranking failed");
		throw error;
	}
}

/**
 * Handle context extraction (smart snippets)
 */
export async function handleContextExtraction(
	result: { id: string; content: string },
	query: string,
): Promise<unknown> {
	if (!inferenceState.ollamaAvailable) {
		throw new Error("Sonar is not available");
	}

	try {
		const response = await callOllama(
			[
				{
					role: "system",
					content:
						"Extract the most relevant 200-300 character snippet from the document for the given query.",
				},
				{
					role: "user",
					content: `Query: ${query}\nDocument [${result.id}]:\n${result.content.slice(0, 4000)}`,
				},
			],
			{ temperature: 0 },
		);

		return {
			id: result.id,
			snippet: response.message.content.trim(),
		};
	} catch (error) {
		log.error({ error, docId: result.id }, "Context extraction failed");
		throw error;
	}
}
/**
 * Handle synthesis task (Phase 2)
 */
export async function handleSynthesisTask(
	task: SonarTask,
	context: SonarContext,
	taskModel?: string,
): Promise<string> {
	let output = "";
	const minSize = task.minSize || 5;
	const validClusters = context.gardener
		.analyzeCommunities()
		.filter((c) => c.nodes.length >= minSize);

	for (const cluster of validClusters) {
		const reps = context.gardener.getClusterRepresentatives(cluster.nodes, 4);
		const nodeData = [];
		for (const id of reps) {
			const content = await context.gardener.getContent(id);
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
				await Bun.write(
					join(synthDir, filename),
					`---\ntitle: "${synthesis.label}"\ntype: synthesis\nnodes: [${cluster.nodes.join(", ")}]\n---\n\n# ${synthesis.label}\n\n${synthesis.summary}\n\n## Cluster Members\n${cluster.nodes.map((id) => `- [[${id}]]`).join("\n")}\n`,
				);
				output += `- **Action:** 📝 Created synthesis node at \`${join("docs/synthesis", filename)}\`\n\n`;
			}
		}
	}
	return output;
}

/**
 * Handle timeline task (Phase 3)
 */
export async function handleTimelineTask(
	task: SonarTask,
	context: SonarContext,
	taskModel?: string,
): Promise<string> {
	let output = "";
	const limit = task.limit || 50;
	const nodes = context.db.getNodes({ limit, excludeContent: true });
	let updatedCount = 0;

	for (const node of nodes) {
		if (node.date) continue;
		const content = await context.gardener.getContent(node.id);
		if (!content) continue;
		const date = await extractDate(node.id, content, taskModel);
		if (date) {
			if (task.autoApply) context.db.updateNodeDate(node.id, date);
			output += `- ${task.autoApply ? "✅" : "🔍"} **${node.id}**: Anchored to ${date}\n`;
			updatedCount++;
		}
	}
	output += `\n**Total Updated:** ${updatedCount} nodes\n`;
	return output;
}

/**
 * Handle garden task (Phase 1 & 4)
 */
export async function handleGardenTask(
	task: SonarTask,
	context: SonarContext,
	taskModel?: string,
): Promise<string> {
	let output = "";
	const limit = task.limit || 5;
	const semanticSuggestions = await context.gardener.findGaps(limit);
	const structuralSuggestions = context.gardener.findStructuralGaps(limit);
	const temporal = context.gardener.weaveTimeline();

	output += `### Semantic Gaps (Vector)\n`;
	for (const sug of semanticSuggestions) {
		const sourceContent = await context.gardener.getContent(sug.sourceId);
		const targetContent = await context.gardener.getContent(sug.targetId);
		if (sourceContent && targetContent) {
			const judgment = await judgeRelationship(
				{ id: sug.sourceId, content: sourceContent },
				{ id: sug.targetId, content: targetContent },
				taskModel,
			);
			if (judgment.related) {
				const relType = judgment.type || "SEE_ALSO";
				const sourcePath = context.gardener.resolveSource(sug.sourceId);
				if (task.autoApply && sourcePath)
					TagInjector.injectTag(sourcePath, relType, sug.targetId);
				output += `- ${task.autoApply ? "💉" : "⚖️"} **${sug.sourceId} ↔ ${sug.targetId}**: ${relType} (${judgment.reason})\n`;
			} else {
				output += `- ❌ **${sug.sourceId} ↔ ${sug.targetId}**: DISMISSED (${judgment.reason || "Not related"})\n`;
			}
			if (taskModel?.includes(":free"))
				await new Promise((r) => setTimeout(r, 1000));
		}
	}

	output += `\n### Structural Gaps (Adamic-Adar)\n`;
	for (const sug of structuralSuggestions) {
		const sourceContent = await context.gardener.getContent(sug.sourceId);
		const targetContent = await context.gardener.getContent(sug.targetId);
		if (sourceContent && targetContent) {
			const judgment = await judgeRelationship(
				{ id: sug.sourceId, content: sourceContent },
				{ id: sug.targetId, content: targetContent },
				taskModel,
			);
			if (judgment.related) {
				const relType = judgment.type || "SEE_ALSO";
				const sourcePath = context.gardener.resolveSource(sug.sourceId);
				if (task.autoApply && sourcePath)
					TagInjector.injectTag(sourcePath, relType, sug.targetId);
				output += `- ${task.autoApply ? "💉" : "⚖️"} **${sug.sourceId} ↔ ${sug.targetId}**: ${relType} (${judgment.reason})\n`;
			} else {
				output += `- ❌ **${sug.sourceId} ↔ ${sug.targetId}**: DISMISSED (${judgment.reason || "Not related"})\n`;
			}
			if (taskModel?.includes(":free"))
				await new Promise((r) => setTimeout(r, 1000));
		}
	}

	output += `\n### Temporal Sequence\n`;
	for (const sug of temporal) {
		const sourcePath = context.gardener.resolveSource(sug.sourceId);
		if (task.autoApply && sourcePath)
			TagInjector.injectTag(sourcePath, "FOLLOWS", sug.targetId);
		output += `- ${task.autoApply ? "💉" : "🕒"} **${sug.sourceId} → ${sug.targetId}**: FOLLOWS (${sug.reason})\n`;
	}

	return output;
}

/**
 * Handle autonomous research task (Phase 5)
 */
export async function handleResearchTask(
	task: SonarTask,
	context: SonarContext,
	taskModel?: string,
): Promise<string> {
	if (!task.query) return "❌ Error: Research task requires a query.";

	let output = `## Recursive Discovery: "${task.query}"\n\n`;
	const maxSteps = 5;
	const findings: string[] = [];
	const visitedNodes = new Set<string>();

	log.info({ query: task.query }, "🕵️‍♂️ Starting recursive research");

	for (let step = 1; step <= maxSteps; step++) {
		output += `### Step ${step}: Analysis\n`;

		// 1. Analyze findings and decide next move
		const prompt = `
You are the AMALFA Research Agent. Your goal is to answer this query: "${task.query}"
Graph Context: ${context.graphEngine.getStats().nodes} nodes available.
Current Findings:
${findings.length > 0 ? findings.join("\n") : "None yet."}

Based on these findings, what is your next step? 
You can:
- "SEARCH": Provide a vector search query to find more docs.
- "READ": Provide a specific Node ID to read its full content.
- "FINISH": Provide the final comprehensive answer.

IMPORTANT: Return ONLY raw JSON. No preamble, no explanation outside JSON.
Return JSON: { "action": "SEARCH"|"READ"|"FINISH", "query": "...", "nodeId": "...", "reasoning": "...", "answer": "..." }
`;

		try {
			const actionResponse = await callOllama(
				[{ role: "user", content: prompt }],
				{ model: taskModel, temperature: 0.1, format: "json" },
			);

			const content = actionResponse.message.content;
			let decision: {
				action: "SEARCH" | "READ" | "FINISH";
				query?: string;
				nodeId?: string;
				reasoning: string;
				answer?: string;
			};
			try {
				decision = JSON.parse(content);
			} catch {
				// Try to extract JSON from markdown blocks
				const match = content.match(/\{[\s\S]*\}/);
				if (match) {
					decision = JSON.parse(match[0]);
				} else {
					throw new Error("Could not parse JSON from response");
				}
			}
			output += `> **Reasoning:** ${decision.reasoning}\n\n`;

			if (decision.action === "FINISH") {
				output += `### Final Conclusion\n${decision.answer}\n`;
				break;
			}

			if (decision.action === "SEARCH") {
				const searchQuery = decision.query || task.query;
				output += `🔍 **Action:** Searching for \`${searchQuery}\`\n`;
				const results = await context.gardener.findRelated(searchQuery, 3);
				const summaries = results
					.map((r) => `- [[${r.id}]] (Score: ${r.score.toFixed(2)})`)
					.join("\n");
				findings.push(`Search results for "${searchQuery}":\n${summaries}`);
				output += `${summaries}\n\n`;
			} else if (decision.action === "READ") {
				const nodeId = decision.nodeId;
				if (!nodeId || visitedNodes.has(nodeId)) {
					findings.push(`Already visited or invalid node: ${nodeId}`);
					continue;
				}
				output += `📖 **Action:** Reading node \`${nodeId}\`\n`;
				const content = await context.gardener.getContent(nodeId);
				visitedNodes.add(nodeId);
				if (content) {
					findings.push(`Content of ${nodeId}:\n${content.slice(0, 1000)}...`);
					output += `Successfully read ${nodeId} (${content.length} chars)\n\n`;
				} else {
					findings.push(`Node not found: ${nodeId}`);
					output += `⚠️ Node not found: ${nodeId}\n\n`;
				}
			}

			// Throttling for free tiers
			if (taskModel?.includes(":free"))
				await new Promise((r) => setTimeout(r, 1000));
		} catch (error) {
			output += `❌ Step failed: ${error}\n`;
			break;
		}
	}

	// Final summary if we didn't FINISH explicitly
	if (!output.includes("### Final Conclusion")) {
		output += `### Final Conclusion (Auto-Summarized)\n`;
		const finalPrompt = `Summarize the findings for: "${task.query}"\n\nFindings:\n${findings.join("\n")}`;
		try {
			const summary = await callOllama(
				[{ role: "user", content: finalPrompt }],
				{ model: taskModel, temperature: 0.2 },
			);
			output += summary.message.content;
		} catch (e) {
			output += `⚠️ Failed to generate final summary: ${e}`;
		}
	}

	return output;
}
