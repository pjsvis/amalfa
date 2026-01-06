import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ResonanceDB } from "@src/resonance/db";

// Configuration from Brief
const THRESHOLDS = {
	WORMHOLE: { dist: 3, sim: 0.92 }, // Stricter threshold for precision
	FALSE_BRIDGE: { dist: 1, sim: 0.4 },
	ECHO_CHAMBER: { sim: 0.95 },
};

interface NodeData {
	id: string;
	label: string;
	type: string;
	vec: Float32Array | null;
}

async function main() {
	console.log("🕵️  Hybrid Audit: Initializing...");

	// 1. Load Data
	const db = ResonanceDB.init();

	// Fetch Nodes
	const rawNodes = db
		.getRawDb()
		.query("SELECT id, title, type, embedding FROM nodes")
		.all() as {
		id: string;
		title: string | null;
		type: string;
		embedding: Uint8Array | null;
	}[];
	const nodes: NodeData[] = rawNodes
		.map((n) => ({
			id: n.id,
			label: n.title || n.id,
			type: n.type,
			vec: n.embedding
				? new Float32Array(
						n.embedding.buffer,
						n.embedding.byteOffset,
						n.embedding.byteLength / 4,
					)
				: null,
		}))
		.filter((n) => n.vec !== null); // Only vectorized nodes

	// Fetch Edges
	const edges = db
		.getRawDb()
		.query("SELECT source, target FROM edges")
		.all() as {
		source: string;
		target: string;
	}[];

	console.log(
		`📊 Loaded ${nodes.length} Vectorized Nodes, ${edges.length} Edges.`,
	);

	// 2. Build Adjacency List for Graph Traversal
	const adj = new Map<string, string[]>();
	nodes.forEach((n) => {
		adj.set(n.id, []);
	});
	edges.forEach((e) => {
		if (adj.has(e.source)) adj.get(e.source)?.push(e.target);
		if (adj.has(e.target)) adj.get(e.target)?.push(e.source); // Undirected for distance
	});

	const anomalies = {
		wormholes: [] as {
			source: string;
			sourceId: string;
			target: string;
			targetId: string;
			sim: number;
			dist: number;
		}[],
		falseBridges: [] as { source: string; target: string; sim: number }[],
		echoChambers: [] as { source: string; target: string; sim: number }[],
	};

	// 3. Analysis Loop (O(N^2) - Optimized by symmetry)
	console.log("🧠 Analyzing Topology vs Semantics...");

	let comparisons = 0;

	for (let i = 0; i < nodes.length; i++) {
		const A = nodes[i];

		// Calculate Shortest Paths from A (BFS)
		if (!A) continue;
		const dists = bfs(A.id, adj);

		for (let j = i + 1; j < nodes.length; j++) {
			const B = nodes[j];
			if (!B) continue;

			if (A.id === B.id) continue; // Skip self
			comparisons++;

			// Semantic Similarity (Dot Product)
			// Ensure vectors are not null before dot product
			if (A.vec && B.vec) {
				const sim = dotProduct(A.vec, B.vec);

				// Topological Distance
				const dist = dists.get(B.id) ?? Infinity;

				// CHECK 1: The Wormhole (Far but Close)
				if (dist > THRESHOLDS.WORMHOLE.dist && sim > THRESHOLDS.WORMHOLE.sim) {
					anomalies.wormholes.push({
						source: A.label,
						sourceId: A.id,
						target: B.label,
						targetId: B.id,
						sim,
						dist,
					});
				}

				// CHECK 2: The False Bridge (Connected but Different)
				if (dist === 1 && sim < THRESHOLDS.FALSE_BRIDGE.sim) {
					anomalies.falseBridges.push({
						source: A.label,
						target: B.label,
						sim,
					});
				}

				// CHECK 3: The Echo Chamber (Identical)
				if (sim > THRESHOLDS.ECHO_CHAMBER.sim) {
					anomalies.echoChambers.push({
						source: A.label,
						target: B.label,
						sim,
					});
				}
			}
		}
	}

	// 4. Report
	console.log(`✅ Analyzed ${comparisons} pairs.`);
	console.log(`\n🚨 FOUND ANOMALIES:`);
	console.log(`   - 🕳️  Wormholes: ${anomalies.wormholes.length}`);
	console.log(`   - 🌉 False Bridges: ${anomalies.falseBridges.length}`);
	console.log(`   - 🗣️  Echo Chambers: ${anomalies.echoChambers.length}`);

	// Generate JSON
	const reportDir = join(process.cwd(), "reports");
	mkdirSync(reportDir, { recursive: true });

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const reportPath = join(reportDir, `hybrid_audit_${timestamp}.json`);

	writeFileSync(reportPath, JSON.stringify(anomalies, null, 2));
	console.log(`\n📄 Report saved to: ${reportPath}`);

	db.close();
}

// Helpers
function bfs(start: string, adj: Map<string, string[]>): Map<string, number> {
	const dists = new Map<string, number>();
	const queue = [start];
	dists.set(start, 0);

	while (queue.length > 0) {
		const curr = queue.shift();
		if (!curr) continue;
		const d = dists.get(curr);
		if (d === undefined) continue;

		const neighbors = adj.get(curr) || [];
		for (const n of neighbors) {
			if (!dists.has(n)) {
				dists.set(n, d + 1);
				queue.push(n);
			}
		}
	}
	return dists;
}

function dotProduct(a: Float32Array, b: Float32Array): number {
	let sum = 0;
	for (let i = 0; i < a.length; i++) {
		// Safe access with fallback
		const valA = a[i] ?? 0;
		const valB = b[i] ?? 0;
		sum += valA * valB;
	}
	return sum;
}

main();
