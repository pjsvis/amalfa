import { describe, expect, test } from "bun:test";
import { $ } from "bun";

const PORT = 3012;
const BASE_URL = `http://localhost:${PORT}`;

describe("Phi3 Agent Integration", () => {
	test("Health Check", async () => {
		try {
			const res = await fetch(`${BASE_URL}/health`);
			expect(res.status).toBe(200);
			const data = await res.json();
			console.log("Health:", data);
			expect(data).toHaveProperty("status");
		} catch (e) {
			console.warn(
				"⚠️ Phi3 Agent not running? Run: bun run src/daemon/phi3-agent.ts start",
			);
			throw e;
		}
	});

	test(
		"Search Analysis",
		async () => {
			const res = await fetch(`${BASE_URL}/search/analyze`, {
				method: "POST",
				body: JSON.stringify({ query: "how to implement authentication" }),
			});

			expect(res.status).toBe(200);
			const data = (await res.json()) as any;
			console.log("Analysis:", data);
			expect(data).toHaveProperty("intent");
		},
		{ timeout: 30000 },
	);
});
