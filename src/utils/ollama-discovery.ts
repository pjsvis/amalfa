/**
 * Ollama Discovery Utility
 * Uses CLI for model capability discovery (reliable, no dependencies)
 */

import { $ } from "bun";
import { getLogger } from "./Logger";

const log = getLogger("OllamaDiscovery");

export interface OllamaModel {
	name: string;
	id: string;
	size: string;
	modified: string;
}

export interface OllamaCapabilities {
	available: boolean;
	model?: string;
	size?: string;
	suggestedModel?: string | null;
	capabilities?: unknown;
	allModels?: OllamaModel[];
}

/**
 * Parse Ollama list output
 * Example output:
 * NAME                           ID              SIZE    MODIFIED
 * phi3:latest                    2f3c5d6e        2.2 GB  2 days ago
 * mistral:7b                     1a2b3c4d        4.1 GB  1 week ago
 */
function parseOllamaList(stdout: string): OllamaModel[] {
	const lines = stdout.trim().split("\n");
	const models: OllamaModel[] = [];

	// Skip header line
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i]?.trim();
		if (!line) continue;

		// Split by whitespace
		const parts = line.split(/\s+/);
		if (parts.length >= 4) {
			models.push({
				name: parts[0] ?? "",
				id: parts[1] ?? "",
				size: parts[2] ?? "",
				modified: parts.slice(3).join(" "),
			});
		}
	}

	return models;
}

/**
 * Parse model info from `ollama show` command
 */
function parseModelInfo(stdout: string): unknown {
	// Ollama show outputs JSON when --json flag is used
	try {
		return JSON.parse(stdout);
	} catch {
		// Fallback: parse raw output if JSON parsing fails
		const info: Record<string, string> = {};
		const lines = stdout.split("\n");
		for (const line of lines) {
			const [key, ...valueParts] = line.split(":");
			if (key && valueParts.length > 0) {
				info[key.trim()] = valueParts.join(":").trim();
			}
		}
		return info;
	}
}

/**
 * Discover Ollama capabilities via CLI
 * This is the preferred method for discovery (reliable, no dependencies)
 */
export async function discoverOllamaCapabilities(): Promise<OllamaCapabilities> {
	try {
		// Check if Ollama is installed via CLI
		const versionResult = await $`ollama --version`.quiet();
		if (versionResult.exitCode !== 0) {
			throw new Error("Ollama not found");
		}

		const versionOutput = versionResult.stdout?.toString()?.trim() ?? "unknown";
		log.info(`✅ Ollama detected: ${versionOutput}`);

		// List available models via CLI
		const listResult = await $`ollama list`.quiet();
		if (listResult.exitCode !== 0) {
			throw new Error("Failed to list Ollama models");
		}

		const models = parseOllamaList(listResult.stdout?.toString() ?? "");
		log.info(
			`📦 Found ${models.length} model(s): ${models.map((m) => m.name).join(", ")}`,
		);

		// Model priority order for search tasks (from brief)
		const modelPriority = [
			"tinydolphin:latest",
			"tinyllama:latest",
			"phi3:latest",
			"mistral:7b-instruct-v0.3-q4_K_M",
			"llama3.1:8b",
		];

		// Find the best available model
		const searchModel = modelPriority.find((m) =>
			models.some((model) => model.name === m),
		);

		if (!searchModel) {
			log.warn("⚠️  No preferred models found");
			return {
				available: true,
				suggestedModel: null,
				allModels: models,
			};
		}

		// Get model details for the selected model
		const phi3 = models.find((m) => m.name === "phi3:latest");

		let modelInfo: unknown = null;
		try {
			const showResult = await $`ollama show ${searchModel}`.quiet();
			if (showResult.exitCode === 0) {
				modelInfo = parseModelInfo(showResult.stdout?.toString() ?? "");
			}
		} catch (e) {
			log.warn(`⚠️  Could not get details for ${searchModel}`);
		}

		const selectedModel = models.find((m) => m.name === searchModel);

		log.info(
			`✅ Using ${searchModel} for search tasks (size: ${selectedModel?.size ?? "unknown"})`,
		);

		return {
			available: true,
			model: searchModel,
			size: selectedModel?.size,
			suggestedModel: searchModel,
			capabilities: modelInfo,
			allModels: models,
		};
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		log.warn(`⚠️  Ollama not available: ${errorMsg}`);
		log.info("   Install: curl -fsSL https://ollama.ai/install.sh | sh");
		log.info("   Then run: ollama pull phi3:latest");

		return {
			available: false,
			allModels: [],
		};
	}
}

/**
 * Check if Ollama is ready to serve requests
 * This performs a quick health check via CLI
 */
export async function checkOllamaHealth(): Promise<boolean> {
	try {
		const result = await $`ollama list`.quiet();
		return result.exitCode === 0;
	} catch {
		return false;
	}
}

/**
 * Get recommended model name based on availability
 */
export async function getRecommendedModel(): Promise<string | null> {
	const capabilities = await discoverOllamaCapabilities();
	if (!capabilities.available || !capabilities.suggestedModel) {
		return null;
	}
	return capabilities.suggestedModel;
}
