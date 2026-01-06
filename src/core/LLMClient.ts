import { join } from "node:path";
import OpenAI from "openai";

export interface LLMConfig {
	baseUrl: string;
	model: string;
	apiKey?: string;
}

export class LLMClient {
	private client: OpenAI;
	private model: string;
	private static instance: LLMClient;

	private constructor(config: LLMConfig) {
		this.client = new OpenAI({
			baseURL: config.baseUrl,
			apiKey: config.apiKey || "not-needed", // Local models often don't need this
		});
		this.model = config.model;
	}

	public static async getInstance(): Promise<LLMClient> {
		if (!LLMClient.instance) {
			// Load settings
			const settingsPath = join(process.cwd(), "polyvis.settings.json");
			const settingsRaw = await Bun.file(settingsPath).text();
			const settings = JSON.parse(settingsRaw);

			const llmSettings = settings.llm;
			if (!llmSettings) {
				throw new Error("Missing 'llm' configuration in polyvis.settings.json");
			}

			const activeProvider = llmSettings.active_provider;
			const providerConfig = llmSettings.providers[activeProvider];

			if (!providerConfig) {
				throw new Error(`Provider '${activeProvider}' not found in settings.`);
			}

			console.log(
				`🤖 LLM Client Initialized: ${activeProvider} (${providerConfig.model})`,
			);
			LLMClient.instance = new LLMClient(providerConfig);
		}
		return LLMClient.instance;
	}

	public async generate(
		prompt: string,
		system = "You are a helpful assistant.",
	): Promise<string> {
		try {
			const response = await this.client.chat.completions.create({
				model: this.model,
				messages: [
					{ role: "system", content: system },
					{ role: "user", content: prompt },
				],
				temperature: 0.7,
			});

			return response.choices[0]?.message?.content || "";
		} catch (error) {
			console.error("❌ LLM Generation Failed:", error);
			throw error;
		}
	}

	public async generateJson<T>(prompt: string): Promise<T> {
		try {
			const response = await this.client.chat.completions.create({
				model: this.model,
				messages: [
					{
						role: "system",
						content: "You are a JSON generator. Output only valid JSON.",
					},
					{ role: "user", content: prompt },
				],
				response_format: { type: "json_object" },
				temperature: 0.1,
			});

			const content = response.choices[0]?.message?.content || "{}";
			return JSON.parse(content) as T;
		} catch (error) {
			console.error("❌ LLM JSON Generation Failed:", error);
			throw error;
		}
	}
}
