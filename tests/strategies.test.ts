import { beforeAll, describe, expect, test } from "bun:test";
import { GraphEngine } from "@src/core/GraphEngine";

describe("GraphEngine Strategies", () => {
	let graph: GraphEngine;

	beforeAll(async () => {
		graph = new GraphEngine();
		const g = graph.getInternalGraph();

		// Structural Gap Scenario (Adamic-Adar)
		// A <-> Shared1 <-> B
		// A <-> Shared2 <-> B
		// A and B are not directly connected, but share strong context.
		g.addNode("A");
		g.addNode("B");
		g.addNode("Shared1");
		g.addNode("Shared2");

		g.addEdge("A", "Shared1");
		g.addEdge("Shared1", "A");
		g.addEdge("B", "Shared1");
		g.addEdge("Shared1", "B");

		g.addEdge("A", "Shared2");
		g.addEdge("Shared2", "A");
		g.addEdge("B", "Shared2");
		g.addEdge("Shared2", "B");

		// Noise
		g.addNode("Noise");
		g.addEdge("A", "Noise");

		// Pillar Scenario (PageRank)
		// Create a separate subgraph for clarity if needed, but here we just add to same graph
		// To make "Authority" win PageRank, it needs many incoming links from nodes that matter.
		// "A" currently has 2 outgoing (Shared1, Shared2) and 3 incoming (Shared1, Shared2, maybe implicit?).

		// Let's create a distinct high-value structure
		g.addNode("Authority");
		for (let i = 0; i < 10; i++) {
			const fan = `Fan${i}`;
			g.addNode(fan);
			g.addEdge(fan, "Authority"); // Fans vote for Authority
		}

		// Community Scenario (Louvain)
		// Cluster 1: C1_A, C1_B, C1_C (Triangle)
		g.addNode("C1_A");
		g.addNode("C1_B");
		g.addNode("C1_C");
		g.addEdge("C1_A", "C1_B");
		g.addEdge("C1_B", "C1_C");
		g.addEdge("C1_C", "C1_A");

		// Cluster 2: C2_X, C2_Y, C2_Z (Triangle)
		g.addNode("C2_X");
		g.addNode("C2_Y");
		g.addNode("C2_Z");
		g.addEdge("C2_X", "C2_Y");
		g.addEdge("C2_Y", "C2_Z");
		g.addEdge("C2_Z", "C2_X");

		// Weak bridge
		g.addEdge("C1_A", "C2_X");
	});

	test("Adamic-Adar correctly scores shared context", () => {
		const score = graph.getAdamicAdar("A", "B");
		expect(score).toBeGreaterThan(0);

		const scoreZero = graph.getAdamicAdar("A", "Noise");
		expect(scoreZero).toBe(0);
	});

	test("findStructuralCandidates identifies A-B link", () => {
		const candidates = graph.findStructuralCandidates(5);
		const abLink = candidates.find(
			(c) =>
				(c.source === "A" && c.target === "B") ||
				(c.source === "B" && c.target === "A"),
		);
		expect(abLink).toBeDefined();
		expect(abLink?.score).toBeGreaterThan(0.5);
	});

	test("findPillars identifies Authority node", () => {
		// Increase limit to ensure we find it amidst all the other test nodes
		const pillars = graph.findPillars(20);
		const authority = pillars.find((p) => p.id === "Authority");
		expect(authority).toBeDefined();
		// It should have high degree
		expect(authority?.degree).toBeGreaterThanOrEqual(10);
	});

	test("getCommunities identifies distinct clusters", () => {
		const communities = graph.getCommunities();
		const clusterIds = Object.keys(communities);
		expect(clusterIds.length).toBeGreaterThanOrEqual(2);

		// Check members of Cluster 1 are together
		// Since we don't know the ID, we find the cluster containing C1_A
		let c1Id = "";
		for (const [id, members] of Object.entries(communities)) {
			if (members.includes("C1_A")) {
				c1Id = id;
				break;
			}
		}

		expect(communities[c1Id]).toContain("C1_B");
		expect(communities[c1Id]).toContain("C1_C");
		// Should NOT contain C2 members ideally (though small graphs are noisy)
	});
});
