// --- CONFIGURATION ---
const PORTS = {
	SCOUT: 8082, // Phi-3.5 (Fast Entity Extraction)
	ARCHITECT: 8083, // Llama-3 (Strict Logic/JSON)
	AUDITOR: 8084, // Olmo-3 (Deep Thinking)
};

interface AuditResult {
	passed: boolean;
	verdict: string;
	thought_trace: string;
}

export class EnlightenedTriad {
	/**
	 * THE SCOUT (Phi-3.5)
	 * "The Bouncer"
	 * Task: Fast, cheap filtering.
	 */
	async scout(context: string, extractionTask: string): Promise<string> {
		return this.callAgent(PORTS.SCOUT, [
			{
				role: "system",
				content:
					"You are a precise data extractor. Return only the requested data. No filler.",
			},
			{
				role: "user",
				content: `Context: ${context}\n\nTask: ${extractionTask}`,
			},
		]);
	}

	/**
	 * THE ARCHITECT (Llama-3 + Accountant Vector)
	 * "The Builder"
	 * Task: Structure raw text into strict JSON.
	 */
	async architect(unstructuredData: string): Promise<unknown> {
		const response = await this.callAgent(PORTS.ARCHITECT, [
			{ role: "system", content: "Output JSON only." },
			{
				role: "user",
				content: `Convert to Causal Graph JSON: ${unstructuredData}`,
			},
		]);

		try {
			// Strip markdown code blocks if present
			const cleanJson = response
				.replace(/```json/g, "")
				.replace(/```/g, "")
				.trim();
			return JSON.parse(cleanJson);
		} catch (_e) {
			console.error("❌ Architect JSON Error. Raw output:", response);
			return null;
		}
	}

	/**
	 * THE AUDITOR (Olmo-3-Think)
	 * "The QA Department"
	 * Task: Think for 2 minutes, then vote Yes/No.
	 */
	async audit(claim: string): Promise<AuditResult> {
		// High temp for creative debugging/thinking
		const rawOutput = await this.callAgent(
			PORTS.AUDITOR,
			[
				{
					role: "user",
					content: `Analyze the validity of this logical claim. \n\nClaim: "${claim}"\n\nShow your thinking process wrapped in <think> tags like this: <think> ... </think>, then end with 'VERDICT: PASS' or 'VERDICT: FAIL'.`,
				},
			],
			{ temperature: 0.6, max_tokens: 2048 },
		);

		// --- THE PARSER ---
		// Olmo uses <think> tags. We split the "Raj" monologue from the Answer.
		let thoughtTrace = "";
		let finalAnswer = "";

		const thinkMatch = rawOutput.match(/<think>([\s\S]*?)<\/think>/);

		if (thinkMatch?.[1]) {
			// case 1: structured output
			thoughtTrace = thinkMatch[1].trim();
			finalAnswer = rawOutput.replace(thinkMatch[0], "").trim();
		} else if (rawOutput.includes("VERDICT:")) {
			// case 2: implicit separation (fallback)
			const parts = rawOutput.split("VERDICT:");
			thoughtTrace = parts[0]?.trim() ?? "";
			// Reconstruct the verdict part
			finalAnswer = `VERDICT:${parts.slice(1).join("VERDICT:")}`.trim();
		} else {
			// case 3: total failure to structure
			thoughtTrace = rawOutput;
			finalAnswer = "VERDICT: FAIL (Parse Error)";
		}

		const passed = finalAnswer.includes("VERDICT: PASS");

		return {
			passed,
			verdict: finalAnswer, // The short answer for UI
			thought_trace: thoughtTrace, // The monologue for DB/Audit
		};
	}

	// --- UTILS (Bun Native Fetch) ---
	private async callAgent(
		port: number,
		messages: { role: string; content: string }[],
		options: { temperature?: number; max_tokens?: number } = {},
	): Promise<string> {
		try {
			const response = await fetch(
				`http://127.0.0.1:${port}/v1/chat/completions`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						messages,
						temperature: options.temperature || 0.1,
						n_predict: options.max_tokens || 512,
					}),
				},
			);

			if (!response.ok) {
				throw new Error(
					`HTTP Error ${response.status}: ${response.statusText}`,
				);
			}

			const data = (await response.json()) as {
				choices: { message: { content: string } }[];
			};
			return data.choices?.[0]?.message?.content || "";
		} catch (_error) {
			console.error(`❌ Agent at Port ${port} is offline/unreachable.`);
			return "AGENT_OFFLINE";
		}
	}
}
