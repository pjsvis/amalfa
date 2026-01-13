import { describe, expect, mock, test } from "bun:test";
import type { AmalfaConfig } from "@src/config/defaults";
import { EdgeWeaver } from "@src/core/EdgeWeaver";
import { LouvainGate } from "@src/core/LouvainGate";
import type { ResonanceDB } from "@src/resonance/db";

describe("LouvainGate Configuration & Stats", () => {
	const mockDb = {
		getRawDb: () => ({}),
		insertEdge: mock(),
	} as unknown as ResonanceDB;

	const context = [{ id: "source" }, { id: "target" }];

	test("EdgeWeaver uses default threshold (50)", () => {
		const checkSpy = mock(() => ({ allowed: true }));
		const originalCheck = LouvainGate.check;
		LouvainGate.check = checkSpy;

		const weaver = new EdgeWeaver(mockDb, context);
		// @ts-expect-error - Accessing private method for test
		weaver.safeInsertEdge("source", "target", "LINKS_TO");

		expect(checkSpy).toHaveBeenCalled();
		const calls = checkSpy.mock.calls as Array<Array<unknown>>;
		expect(calls[0]?.[3]).toBe(50);

		LouvainGate.check = originalCheck;
	});

	test("EdgeWeaver uses configured threshold", () => {
		const config = {
			graph: {
				tuning: {
					louvain: {
						superNodeThreshold: 100,
					},
				},
			},
		} as AmalfaConfig;

		const checkSpy = mock(() => ({ allowed: true }));
		const originalCheck = LouvainGate.check;
		LouvainGate.check = checkSpy;

		const weaver = new EdgeWeaver(mockDb, context, config);
		// @ts-expect-error - Accessing private method for test
		weaver.safeInsertEdge("source", "target", "LINKS_TO");

		expect(checkSpy).toHaveBeenCalled();
		const calls2 = checkSpy.mock.calls as Array<Array<unknown>>;
		expect(calls2[0]?.[3]).toBe(100);

		LouvainGate.check = originalCheck;
	});

	test("EdgeWeaver tracks stats correctly", () => {
		let callCount = 0;
		const checkSpy = mock(() => {
			callCount++;
			if (callCount === 1) return { allowed: true };
			return { allowed: false, reason: "Too big" };
		});
		const originalCheck = LouvainGate.check;
		LouvainGate.check = checkSpy;

		const weaver = new EdgeWeaver(mockDb, context);

		// @ts-expect-error
		weaver.safeInsertEdge("n1", "n2", "type");

		// @ts-expect-error
		weaver.safeInsertEdge("n3", "n4", "type");

		const stats = weaver.getStats();
		expect(stats.checked).toBe(2);
		expect(stats.rejected).toBe(1);

		LouvainGate.check = originalCheck;
	});
});
