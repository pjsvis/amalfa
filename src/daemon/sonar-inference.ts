import { loadConfig } from "@src/config/defaults";
import { getLogger } from "@src/utils/Logger";
import type { Message, RequestOptions } from "./sonar-types";

const log = getLogger("SonarInference");

/**
 * Shared state for inference
 */
export const inferenceState = {
	ollamaAvailable: false,
	ollamaModel: "phi3:latest",
};

/**
 * Call Ollama HTTP API for inference
 * Supports both local Ollama and OpenRouter (cloud) providers.
 */
export async function callOllama(
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
		inferenceState.ollamaModel ||
		hostArgs.model ||
		"qwen2.5:1.5b";

	// Build headers
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	// API key: prefer env var (OPENROUTER_API_KEY) over config
	const apiKey = process.env.OPENROUTER_API_KEY || cloudConfig?.apiKey;
	if (useCloud && apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
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
		endpoint = "https://openrouter.ai/api/v1/chat/completions";
		body = JSON.stringify({
			model,
			messages,
			stream: false,
			...modelOptions,
		});
	} else {
		// Local Ollama
		const host = hostArgs.host || "localhost:11434";
		endpoint = `http://${host}/api/chat`;
		body = JSON.stringify({
			model,
			messages,
			stream: false,
			format,
			options: modelOptions,
		});
	}

	try {
		const response = await fetch(endpoint, {
			method: "POST",
			headers,
			body,
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Inference failed (${response.status}): ${error}`);
		}

		const result = await response.json();

		if (provider === "openrouter") {
			const openAIResult = result as { choices: Array<{ message: Message }> };
			if (!openAIResult.choices?.[0]?.message) {
				throw new Error("Invalid OpenRouter response format");
			}
			return {
				message: openAIResult.choices[0].message,
			};
		}
		const ollamaResult = result as { message: Message };
		return {
			message: ollamaResult.message,
		};
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		log.error({ error: errorMsg, endpoint, model }, "Ollama inference failed");
		throw error;
	}
}
