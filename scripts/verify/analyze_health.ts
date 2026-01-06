import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

console.log("🏥 Analyzing Graph Health...");

const db = DatabaseFactory.connectToResonance({ readonly: true });

// 1. Basic Stats via SQL (Fastest)
const N = (
	db
		.query(
			"SELECT COUNT(*) as c FROM nodes WHERE type != 'root' AND type != 'domain'",
		)
		.get() as { c: number }
).c;
const E = (db.query("SELECT COUNT(*) as c FROM edges").get() as { c: number })
	.c;
const nodes = db
	.query("SELECT id FROM nodes WHERE type != 'root' AND type != 'domain'")
	.all() as { id: string }[];
const edges = db.query("SELECT source, target FROM edges").all() as {
	source: string;
	target: string;
}[];

// 2. Metrics Calculation
const avgDegree = (2 * E) / N;
// Density = E / (N * (N - 1) / 2)
const maxEdges = (N * (N - 1)) / 2;
const density = maxEdges > 0 ? E / maxEdges : 0;

// 3. Connected Components (BFS/Union-Find)
// Simple implementation to find # of islands
const adj = new Map<string, string[]>();
nodes.forEach((n) => {
	adj.set(n.id, []);
});
edges.forEach((e) => {
	if (adj.has(e.source)) adj.get(e.source)?.push(e.target);
	if (adj.has(e.target)) adj.get(e.target)?.push(e.source); // Undirected view
});

const visited = new Set<string>();
const components: number[] = [];

for (const node of nodes) {
	if (visited.has(node.id)) continue;

	// Start DFS/BFS
	let size = 0;
	const stack = [node.id];
	visited.add(node.id);

	while (stack.length > 0) {
		const curr = stack.pop();
		if (!curr) continue;
		size++;

		const neighbors = adj.get(curr) || [];
		for (const neighbor of neighbors) {
			if (!visited.has(neighbor)) {
				visited.add(neighbor);
				stack.push(neighbor);
			}
		}
	}
	components.push(size);
}

// Sort components by size (Largest first)
components.sort((a, b) => b - a);

console.log(`\n📊 Health Report:`);
console.log(`- Nodes: ${N}`);
console.log(`- Edges: ${E}`);
console.log(`- Density: ${density.toFixed(4)} (Ideal: 0.01 - 0.1)`);
console.log(`- Avg Degree: ${avgDegree.toFixed(2)} (Ideal: 3 - 6)`);
console.log(`- Components: ${components.length} (Ideal: 1)`);

if (components.length > 1 && components[0]) {
	console.log(`\n⚠️  Graph Fracture Detected!`);
	console.log(
		`- Giant Component: ${components[0]} nodes (${((components[0] / N) * 100).toFixed(1)}%)`,
	);
	console.log(`- Orphans/Islands: ${components.length - 1} separate clusters.`);
} else {
	console.log(`\n✅ Graph is Fully Connected (1 Component).`);
}
