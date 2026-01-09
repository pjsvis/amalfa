import { describe, expect, mock, test } from "bun:test";
import type { SonarContext } from "../src/daemon/sonar-logic";
import { createSonarApp } from "../src/daemon/sonar-server";

// Mock dependencies
const mockGraphEngine = {
	getStats: mock(() => ({ nodes: 100, edges: 500 })),
};

const mockContext = {
	db: {},
	graphEngine: mockGraphEngine,
	gardener: {},
	chatSessions: new Map(),
} as unknown as SonarContext;

describe("Sonar Server (Hono)", () => {
	const app = createSonarApp(mockContext);

	test("GET /health returns status ok", async () => {
		const res = await app.request("/health");
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("status", "ok");
		expect(json).toHaveProperty("provider");
	});

	test("GET /graph/stats invokes graphEngine", async () => {
		const res = await app.request("/graph/stats");
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({ nodes: 100, edges: 500 });
		expect(mockGraphEngine.getStats).toHaveBeenCalled();
	});

	test("OPTIONS /chat returns CORS headers", async () => {
		const res = await app.request("/chat", {
			method: "OPTIONS",
		});
		expect(res.status).toBe(204); // Hono default for OPTIONS
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
	});

	test("404 for unknown route", async () => {
		const res = await app.request("/unknown-route");
		expect(res.status).toBe(404);
	});
});
