import { describe, expect, it } from "bun:test";
import {
	adaptEdge,
	adaptNode,
} from "../src/js/components/sigma-explorer/adapter.js";

// Define shape for the JS adapter output to satisfy TS
interface SigmaNode {
	id: string;
	label: string;
	definition: string;
	domain?: string;
	secret_field?: string;
	external_refs?: { url?: string; [key: string]: unknown }[];
}

interface SigmaEdge {
	source: string;
	target: string;
	label: string;
}

describe("Sigma Data Adapter", () => {
	describe("adaptNode", () => {
		it("should map title to label", () => {
			const row = { id: "1", title: "My Document" };
			const node = adaptNode(row) as SigmaNode;
			expect(node.label).toBe("My Document");
		});

		it("should fallback to label if title is missing", () => {
			const row = { id: "1", label: "Legacy Label" };
			const node = adaptNode(row) as SigmaNode;
			expect(node.label).toBe("Legacy Label");
		});

		it("should fallback to id if title and label are missing", () => {
			const row = { id: "term-123" };
			const node = adaptNode(row) as SigmaNode;
			expect(node.label).toBe("term-123");
		});

		it("should truncate long content", () => {
			const longContent = "a".repeat(1000);
			const row = { id: "1", title: "Doc", content: longContent };
			const node = adaptNode(row) as SigmaNode;
			expect(node.definition.length).toBeLessThan(600);
			expect(node.definition).toEndWith("...");
		});

		it("should allowlist safe attributes", () => {
			const row = {
				id: "1",
				title: "Doc",
				domain: "persona",
				secret_field: "hidden",
			};
			const node = adaptNode(row) as SigmaNode;
			expect(node.domain).toBe("persona");
			expect(node.secret_field).toBeUndefined();
		});

		it("should parse valid JSON external_refs", () => {
			const row = { id: "1", external_refs: '[{"url":"http://example.com"}]' };
			const node = adaptNode(row) as SigmaNode;
			expect(node.external_refs).toHaveLength(1);
			expect(node.external_refs?.[0]?.url).toBe("http://example.com");
		});

		it("should handle invalid JSON external_refs safely", () => {
			const row = { id: "1", external_refs: "INVALID_JSON" };
			const node = adaptNode(row) as SigmaNode;
			expect(node.external_refs).toEqual([]);
		});
	});

	describe("adaptEdge", () => {
		it("should adapt valid edge row", () => {
			const row = { source: "a", target: "b", type: "related_to" };
			const edge = adaptEdge(row) as SigmaEdge;
			expect(edge.source).toBe("a");
			expect(edge.target).toBe("b");
			expect(edge.label).toBe("related_to");
		});

		it("should return null for invalid edge", () => {
			expect(adaptEdge({ source: "a" })).toBeNull();
		});
	});
});
