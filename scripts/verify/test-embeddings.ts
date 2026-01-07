import { describe, expect, test } from "bun:test";

const VECTOR_PORT = 3010;
const BASE_URL = `http://localhost:${VECTOR_PORT}`;

describe("Vector Daemon Tests", () => {
	test("Health check should return ok", async () => {
		try {
			const res = await fetch(`${BASE_URL}/health`);
			expect(res.status).toBe(200);
			const data = await res.json();
			console.log("Health:", data);
			expect(data).toHaveProperty("status", "ok");
		} catch (e) {
			console.warn("⚠️ Vector daemon not running? Run: amalfa vector start");
			throw e;
		}
	});

	test("Embeddings generation should be fast (<500ms)", async () => {
		const start = performance.now();
		const res = await fetch(`${BASE_URL}/embed`, {
			method: "POST",
			body: JSON.stringify({
				text: "The quick brown fox jumps over the lazy dog.",
			}),
		});

		expect(res.status).toBe(200);
		const data = (await res.json()) as any;
		const duration = performance.now() - start;

		console.log(`Embedding generation took: ${duration.toFixed(2)}ms`);
		expect(data.vector).toBeDefined();
		expect(data.dimensions).toBe(384); // BGE-Small dimension
		expect(duration).toBeLessThan(500); // Should be very fast on cached model
	});
});
