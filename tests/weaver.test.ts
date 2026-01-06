import { describe, expect, test } from "bun:test";
import { EdgeWeaver } from "@src/core/EdgeWeaver";
import type { ResonanceDB } from "@src/resonance/db";

// Mock ResonanceDB
interface MockEdge {
	sourceId: string;
	targetId: string;
	type: string;
}

class MockDB {
	public edges: MockEdge[] = [];
	insertEdge(sourceId: string, targetId: string, type: string) {
		this.edges.push({ sourceId, targetId, type });
	}
}

describe("EdgeWeaver", () => {
	// Mock Lexicon: "Circular Logic" -> "term-circular-logic"
	const lexiconItems = [
		{ id: "term-circular-logic", title: "Circular Logic", aliases: ["Loops"] },
		{ id: "term-michelle", title: "Michelle Robertson", aliases: [] },
	];

	test("Weave 'tag-circular-logic' (Match by Slug)", () => {
		const mockDb = new MockDB();
		const weaver = new EdgeWeaver(
			mockDb as unknown as ResonanceDB,
			lexiconItems,
		);

		const content =
			"This is a letter about tag-circular-logic and its effects.";
		const sourceId = "file-1#section-1";

		weaver.weave(sourceId, content);

		expect(mockDb.edges).toHaveLength(1);
		expect(mockDb.edges[0]).toEqual({
			sourceId: "file-1#section-1",
			targetId: "term-circular-logic",
			type: "EXEMPLIFIES",
		});
	});

	test("Weave 'tag-loops' (Match by Alias)", () => {
		const mockDb = new MockDB();
		const weaver = new EdgeWeaver(
			mockDb as unknown as ResonanceDB,
			lexiconItems,
		);

		const content = "Avoid tag-loops in your thinking.";
		const sourceId = "file-1#section-2";

		weaver.weave(sourceId, content);

		expect(mockDb.edges).toHaveLength(1);
		expect(mockDb.edges[0]).toEqual({
			sourceId: "file-1#section-2",
			targetId: "term-circular-logic", // Mapped to canonical ID
			type: "EXEMPLIFIES",
		});
	});

	test("Weave '[[Circular Logic]]' (WikiLink to Concept)", () => {
		const mockDb = new MockDB();
		const weaver = new EdgeWeaver(
			mockDb as unknown as ResonanceDB,
			lexiconItems,
		);

		const content = "See also [[Circular Logic]].";
		const sourceId = "file-1#section-3";

		weaver.weave(sourceId, content);

		expect(mockDb.edges).toHaveLength(1);
		expect(mockDb.edges[0]).toEqual({
			sourceId: "file-1#section-3",
			targetId: "term-circular-logic",
			type: "CITES", // WikiLinks are Citations
		});
	});

	test("Mixed Tags and Links", () => {
		const mockDb = new MockDB();
		const weaver = new EdgeWeaver(
			mockDb as unknown as ResonanceDB,
			lexiconItems,
		);

		// "Michelle Robertson" -> slug "michelle-robertson"
		const content =
			"A tag-michelle-robertson post regarding [[Circular Logic]].";
		const sourceId = "file-1#section-4";

		weaver.weave(sourceId, content);

		expect(mockDb.edges).toHaveLength(2);

		// Sort or check for containment since order may vary
		const exemplifies = mockDb.edges.find((e) => e.type === "EXEMPLIFIES");
		const cites = mockDb.edges.find((e) => e.type === "CITES");

		expect(exemplifies).toEqual({
			sourceId: "file-1#section-4",
			targetId: "term-michelle",
			type: "EXEMPLIFIES",
		});

		expect(cites).toEqual({
			sourceId: "file-1#section-4",
			targetId: "term-circular-logic",
			type: "CITES",
		});
	});
});
