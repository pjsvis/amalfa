export class PipelineClient {
	private baseUrl = "http://localhost:3014";
	private stepId: string;

	constructor(stepId: string) {
		this.stepId = stepId;
	}

	async start(config: any = {}) {
		await this.post("start", { config });
	}

	async update(metrics: Record<string, number | string>) {
		await this.post("update", { metrics });
	}

	async log(message: string) {
		await this.post("log", { message });
		console.log(`[${this.stepId}] ${message}`);
	}

	async complete(metrics: Record<string, number | string>) {
		await this.post("complete", { metrics });
	}

	async error(error: string) {
		await this.post("error", { error });
		console.error(`[${this.stepId}] ERROR: ${error}`);
	}

	private async post(action: string, payload: any) {
		try {
			await fetch(`${this.baseUrl}/api/step/${this.stepId}/${action}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
		} catch (_e) {
			// If dashboard is down, just ignore (or log to stderr)
			// console.warn("Dashboard unreachable");
		}
	}
}
