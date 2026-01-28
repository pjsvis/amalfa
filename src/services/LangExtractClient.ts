import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadConfig } from "@src/config/defaults";
import { getLogger } from "@src/utils/Logger";
import {
	checkOllamaHealth,
	discoverOllamaCapabilities,
	type OllamaCapabilities,
} from "@src/utils/ollama-discovery";
import { z } from "zod";

// Zod Schemas for Structural Validation
const EntitySchema = z.object({
	name: z.string(),
	type: z.string(),
	description: z.string().optional(),
});

const RelationshipSchema = z.object({
	source: z.string(),
	target: z.string(),
	type: z.string(),
	description: z.string().optional(),
});

const GraphDataSchema = z.object({
	entities: z.array(EntitySchema),
	relationships: z.array(RelationshipSchema),
});

export type ExtractedGraph = z.infer<typeof GraphDataSchema>;

export class LangExtractClient {
	private client: Client | null = null;
	private transport: StdioClientTransport | null = null;
	private sidecarPath: string;
	private log = getLogger("LangExtractClient");
	private ollamaCapabilities: OllamaCapabilities | null = null;

	constructor() {
		this.sidecarPath = resolve(process.cwd(), "src/sidecars/lang-extract");
	}
	/**
	 * Checks if the Sidecar environment is ready (uv installed, venv exists)
	 */
	public async isAvailable(): Promise<boolean> {
		// 1. Check if uv is in PATH
		const uvCheck = Bun.spawnSync(["which", "uv"]);
		if (uvCheck.exitCode !== 0) return false;

		// 2. Check if the sidecar directory exists
		if (!existsSync(this.sidecarPath)) return false;

		// 3. Check if server.py exists
		if (!existsSync(join(this.sidecarPath, "server.py"))) return false;

		// Note: We assume "uv run" handles the venv creation if missing,
		// but ideally we'd check for a lockfile or .venv too.
		return true;
	}

	/**
	 * Determine the optimal provider based on availability and configuration
	 * Priority: Local Ollama > Cloud Ollama > Gemini > OpenRouter
	 */
	private async getOptimalProvider(
		config: Awaited<ReturnType<typeof loadConfig>>,
	): Promise<string> {
		const configuredProvider = config.langExtract?.provider || "gemini";

		// If user explicitly configured a provider, respect it
		if (configuredProvider !== "ollama") {
			this.log.info(`Using configured provider: ${configuredProvider}`);
			return configuredProvider;
		}

		// For "ollama" provider, check local availability first
		const localHealthy = await checkOllamaHealth();
		if (localHealthy) {
			this.log.info("✅ Local Ollama available, using local provider");
			return "ollama";
		}

		// Fall back to cloud if configured
		if (config.langExtract?.ollama_cloud?.host) {
			this.log.info("⚠️  Local Ollama unavailable, using cloud provider");
			return "ollama_cloud";
		}

		// Fall back to Gemini
		this.log.warn("⚠️  No Ollama available, falling back to Gemini");
		return "gemini";
	}

	/**
	 * Discover and cache Ollama capabilities
	 */
	private async discoverOllama(): Promise<void> {
		if (this.ollamaCapabilities) return; // Already cached

		this.ollamaCapabilities = await discoverOllamaCapabilities();

		if (this.ollamaCapabilities.available) {
			this.log.info(
				`📦 Ollama models: ${this.ollamaCapabilities.allModels?.map((m) => m.name).join(", ")}`,
			);
			if (this.ollamaCapabilities.suggestedModel) {
				this.log.info(
					`✅ Suggested model: ${this.ollamaCapabilities.suggestedModel}`,
				);
			}
		}
	}

	public async connect() {
		if (this.client) return;

		const config = await loadConfig();

		// Discover Ollama capabilities
		await this.discoverOllama();

		// Determine optimal provider
		const optimalProvider = await this.getOptimalProvider(config);

		const langExtractConfig = config.langExtract || {
			provider: "gemini" as const,
			gemini: { model: "gemini-flash-latest" },
			ollama: { host: "http://localhost:11434", model: "qwen2.5:1.5b" },
			ollama_cloud: { host: "", model: "qwen2.5:7b" },
			openrouter: { model: "qwen/qwen-2.5-72b-instruct" },
		};

		this.transport = new StdioClientTransport({
			command: "uv",
			args: ["run", "server.py"],
			cwd: this.sidecarPath,
			env: {
				...process.env,
				LANGEXTRACT_PROVIDER:
					optimalProvider || process.env.LANGEXTRACT_PROVIDER || "gemini",
				GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
				GEMINI_MODEL: langExtractConfig.gemini?.model || "gemini-flash-latest",
				OLLAMA_HOST:
					langExtractConfig.ollama?.host ||
					process.env.OLLAMA_HOST ||
					"http://localhost:11434",
				OLLAMA_MODEL:
					this.ollamaCapabilities?.suggestedModel ||
					langExtractConfig.ollama?.model ||
					process.env.OLLAMA_MODEL ||
					"qwen2.5:1.5b",
				OLLAMA_CLOUD_HOST:
					langExtractConfig.ollama_cloud?.host ||
					process.env.OLLAMA_CLOUD_HOST ||
					"",
				OLLAMA_CLOUD_API_KEY:
					langExtractConfig.ollama_cloud?.apiKey ||
					process.env.OLLAMA_CLOUD_API_KEY ||
					"",
				OLLAMA_CLOUD_MODEL:
					langExtractConfig.ollama_cloud?.model ||
					process.env.OLLAMA_CLOUD_MODEL ||
					"qwen2.5:7b",
				OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
				OPENROUTER_MODEL:
					langExtractConfig.openrouter?.model ||
					process.env.OPENROUTER_MODEL ||
					"qwen/qwen-2.5-72b-instruct",
			},
		});

		this.client = new Client(
			{ name: "amalfa-host", version: "1.0.0" },
			{ capabilities: {} },
		);

		await this.client.connect(this.transport);
	}

	public async extract(text: string): Promise<ExtractedGraph | null> {
		if (!this.client) {
			await this.connect();
		}

		try {
			const result = (await this.client?.callTool({
				name: "extract_graph",

				arguments: { text },
				// biome-ignore lint/suspicious/noExplicitAny: mcp sdk typing issue
			})) as any;

			// Parse the JSON string returned by the Python tool

			// The tool returns a string that IS a JSON object, wrapped in the MCP content
			// usually result.content[0].text
			if (!result?.content || result.content.length === 0) return null;

			const contentBlock = result.content[0];
			if (contentBlock.type !== "text") return null;

			const responseText = contentBlock.text;
			if (responseText.startsWith("Error")) {
				this.log.error({ responseText }, "Sidecar returned error");
				return null;
			}

			let rawJson: unknown;
			try {
				rawJson = JSON.parse(responseText);
			} catch (_e) {
				// Try to strip markdown code blocks if present
				const cleanText = responseText.replace(/```json\n?|\n?```/g, "").trim();
				try {
					rawJson = JSON.parse(cleanText);
				} catch (_e2) {
					this.log.error({ responseText }, "Failed to parse sidecar JSON");
					return null;
				}
			}

			// Validate with Zod
			return GraphDataSchema.parse(rawJson);
		} catch (error) {
			this.log.error({ err: error }, "Sidecar extraction failed");
			return null;
		}
	}
	public async close() {
		if (this.transport) {
			// Stdio transport doesn't have a close method exposed efficiently in all versions
			// but closing the client usually triggers it
			await this.transport.close();
		}
		this.client = null;
		this.transport = null;
	}
}
