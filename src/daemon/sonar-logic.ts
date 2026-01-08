import type { GraphEngine } from "@src/core/GraphEngine";
import type { GraphGardener } from "@src/core/GraphGardener";
import { VectorEngine } from "@src/core/VectorEngine";
import type { ResonanceDB } from "@src/resonance/db";
import { getLogger } from "@src/utils/Logger";
import { callOllama, inferenceState } from "./sonar-inference";
import type { ChatSession, Message } from "./sonar-types";

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
		.filter((n) => {
			try {
				const meta = n.meta || {};
				return !meta.sonar_enhanced && !meta.phi3_enhanced;
			} catch {
				return false;
			}
		})
		.map((row) => ({ id: row.id }));

	const batch = unenhanced.slice(0, limit);
	log.info(`🔄 Enhancing ${batch.length} docs with Sonar...`);

	const results = await Promise.allSettled(
		batch.map((node) => handleMetadataEnhancement(node.id, context)),
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
			results.forEach((r: { id: string; score: number }) => {
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
	Array<{ id: string; content: string; score: number; relevance_score: number }>
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
