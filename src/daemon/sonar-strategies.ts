import { loadConfig } from "@src/config/defaults";
import { getLogger } from "@src/utils/Logger";
import { callOllama, inferenceState } from "./sonar-inference";
import type { SonarTask } from "./sonar-types";

const log = getLogger("SonarStrategies");

/**
 * Get the recommended model for a task based on configuration
 */
export async function getTaskModel(
	taskType: string,
): Promise<string | undefined> {
	const config = await loadConfig();
	const useCloud = config.sonar.cloud?.enabled === true;
	const provider = config.sonar.cloud?.provider || "ollama";

	if (useCloud && provider === "openrouter") {
		const models: Record<string, string> = {
			garden: "google/gemini-2.0-flash-exp:free",
			synthesis: "google/gemini-2.0-flash-exp:free",
			timeline: "google/gemini-2.0-flash-exp:free",
			research: "google/gemini-2.0-flash-exp:free",
		};
		return models[taskType];
	}

	return undefined;
}

/**
 * Strategy 1: The "Judge"
 * Verifies if two nodes should actually be linked and classifies the relationship.
 */
export async function judgeRelationship(
	source: { id: string; content: string },
	target: { id: string; content: string },
	model?: string,
): Promise<{ related: boolean; type?: string; reason?: string }> {
	if (!inferenceState.ollamaAvailable) return { related: false };

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
				model,
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
export async function summarizeCommunity(
	nodes: { id: string; content: string }[],
	model?: string,
): Promise<{ label: string; summary: string }> {
	if (!inferenceState.ollamaAvailable)
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
				model,
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
export async function extractDate(
	nodeId: string,
	content: string,
	model?: string,
): Promise<string | null> {
	// First try regex for common patterns
	const dateMatch =
		content.match(/Date:\*\*\s*(\d{4}-\d{2}-\d{2})/i) ||
		content.match(/date:\s*(\d{4}-\d{2}-\d{2})/i) ||
		content.match(/#\s*(\d{4}-\d{2}-\d{2})/i);

	if (dateMatch) return dateMatch[1] || null;

	if (!inferenceState.ollamaAvailable) return null;

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
			{ temperature: 0, model },
		);

		const result = response.message.content.trim();
		log.info({ nodeId, result }, "LLM Chronos result");
		if (result === "null" || !/^\d{4}-\d{2}-\d{2}$/.test(result)) return null;
		return result;
	} catch {
		return null;
	}
}
