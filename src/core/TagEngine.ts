import { LLMClient } from "./LLMClient";

interface TagResponse {
	entities: string[];
	concepts: string[];
}

export interface TagResult {
	hardTags: string[]; // High confidence / Existing CL terms
	softTokens: string[]; // Exploratory / New terms
}

export class TagEngine {
	private llm: LLMClient | null = null;
	private static instance: TagEngine;

	private constructor() {}

	public static async getInstance(): Promise<TagEngine> {
		if (!TagEngine.instance) {
			TagEngine.instance = new TagEngine();
			TagEngine.instance.llm = await LLMClient.getInstance();
		}
		return TagEngine.instance;
	}

	public async generateTags(content: string): Promise<TagResult> {
		if (!this.llm)
			throw new Error("TagEngine not initialized. Call getInstance().");

		const prompt = `
      Analyze the text below. Extract 3-5 key entities (Proper Nouns) and 3-5 key abstract concepts.
      Output ONLY a JSON object: { "entities": [], "concepts": [] }.
      
      TEXT: "${content.replace(/"/g, '\\"').slice(0, 1000)}" 
    `;

		try {
			const json = await this.llm.generateJson<TagResponse>(prompt);
			return this.processRawTags(json);
		} catch (error) {
			console.warn("TagEngine Generation Failed:", error);
			return { hardTags: [], softTokens: [] };
		}
	}

	private processRawTags(raw: TagResponse): TagResult {
		const normalize = (s: string) =>
			`tag-${s.trim().toLowerCase().replace(/\s+/g, "-")}`;

		return {
			hardTags: (raw.entities || []).map(normalize),
			softTokens: (raw.concepts || []).map(normalize),
		};
	}
}
