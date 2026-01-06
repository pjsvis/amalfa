// src/llm/EnlightenedProvider.ts

export interface Message {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface EnlightenmentConfig {
	port?: number;
	modelAlias?: string;
	temperature?: number;
	maxTokens?: number;
}

/**
 * THE ENLIGHTENED PROVIDER
 * A specialized adapter for the "Kirkcaldy Accountant" vector-steered model.
 * Default Port: 8083
 */
export class EnlightenedProvider {
	private baseUrl: string;
	private modelAlias: string;
	private defaultTemp: number;

	constructor(config: EnlightenmentConfig = {}) {
		this.baseUrl = `http://127.0.0.1:${config.port || 8083}/v1`;
		this.modelAlias = config.modelAlias || "enlightened-llama";
		this.defaultTemp = config.temperature || 0.1; // Keep it cold for logic
	}

	/**
	 * THE RATIONALITY CHECK
	 * Pings the server to ensure the Enlightenment engine is online.
	 */
	async isOnline(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/models`);
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * THE THINK METHOD
	 * Sends the prompt to the vector-clamped model.
	 */
	async think(messages: Message[]): Promise<string> {
		try {
			const response = await fetch(`${this.baseUrl}/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer sk-dummy-key", // Required by protocol, ignored by server
				},
				body: JSON.stringify({
					model: this.modelAlias,
					messages: messages,
					temperature: this.defaultTemp,
					max_tokens: 1024,
					stream: false,
				}),
			});

			if (!response.ok) {
				throw new Error(
					`Enlightenment Error: ${response.status} ${response.statusText}`,
				);
			}

			const data = (await response.json()) as {
				choices: { message: { content: string } }[];
			};
			return data?.choices?.[0]?.message?.content?.trim() || "";
		} catch (error) {
			console.error("🏴󠁧󠁢󠁳󠁣󠁴󠁿 The Philosopher is silent (Connection Error).", error);
			throw error;
		}
	}

	/**
	 * SPECIALIST METHOD: DE-FLUFF
	 * A pre-configured routine to strip buzzwords from text.
	 */
	async defluff(inputText: string): Promise<string> {
		return this.think([
			{
				role: "system",
				content:
					"You are a ruthless editor. Rewrite the following text to be concise, factual, and free of corporate buzzwords. Return ONLY the rewritten text.",
			},
			{ role: "user", content: inputText },
		]);
	}
}
