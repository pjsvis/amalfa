import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { ResonanceDB } from "@src/resonance/db";
import { EdgeWeaver } from "../../src/core/EdgeWeaver";

// Mock Data Generation
function generateMockData(count: number) {
	const nodes: { id: string; type: string; title: string; content?: string }[] =
		[];
	for (let i = 0; i < count; i++) {
		// Create a "Super Node" candidate (e.g., 'concept-core')
		// and many "Leaf Nodes"
		if (i === 0) {
			nodes.push({
				id: "concept-core",
				type: "concept",
				title: "Core Concept",
			});
		} else {
			nodes.push({
				id: `note-${i}`,
				type: "note",
				title: `Note ${i}`,
				content: `This refers to [[Core Concept]]`,
			});
		}
	}
	return nodes;
}

async function verify() {
	const dbPath = join(process.cwd(), "test-graph-integrity.db");
	if (existsSync(dbPath)) rmSync(dbPath);

	const db = new ResonanceDB(dbPath);
	const lexicon = [{ id: "concept-core", title: "Core Concept", aliases: [] }];
	const weaver = new EdgeWeaver(db, lexicon);

	console.log("🧪 Starting Graph Integrity Check...");

	// 1. Ingest nodes
	const nodes = generateMockData(100);

	// Insert 'concept-core' first
	const coreNode = nodes[0];
	if (!coreNode) throw new Error("Mock generation failed");
	db.insertNode(coreNode);

	// Insert 100 notes that all link to 'concept-core'
	// Without gating, 'concept-core' would have degree 99.
	// With gating (threshold 50 + neighbor check), it should stop growing after 50 unless they share neighbors.
	// Since these are new notes with no other connections, they share 0 neighbors.
	// So we expect degree to cap at ~50.

	let linksAttempted = 0;
	for (let i = 1; i < nodes.length; i++) {
		const node = nodes[i];
		if (!node) continue;
		db.insertNode(node);
		weaver.weave(node.id, node.content || "");
		linksAttempted++;
	}

	// Check Degree of 'concept-core'
	const edges = db.getStats().edges;
	// We can't easily get degree of specific node from getStats,
	// let's query DB directly or assume total edges = degree of concept-core (since only that being linked)

	// Actually, getting degree of concept-core:
	// ResonanceDB doesn't expose raw SQL easily outside, but we can rely on verifying edges count.
	// In this specific topology, all edges are source->concept-core.

	console.log(`Submitted ${linksAttempted} links to 'concept-core'.`);
	console.log(`Total Edges in DB: ${edges}`);

	// Expectation: Edges should be around 51 (threshold)
	// The implementation in ResonanceDB uses threshold=50 (default).
	// So roughly 50 edges allowed.

	// Wait, the logic is: if (isSuperNode(target)) -> check neighbor.
	// isSuperNode checks count > threshold.
	// So distinct edges will grow until > 50.
	// So we expect ~51 edges.

	if (edges > 60) {
		console.error(
			`FAIL: Hairball detected! 'concept-core' has ${edges} edges (expected <= ~51).`,
		);
		process.exit(1);
	} else if (edges < 40) {
		console.warn(
			`WARNING: Too few edges? (${edges}). Logic might be too aggressive or something else is wrong.`,
		);
	} else {
		console.log(`PASS: Super-node contained. Edges: ${edges}.`);
	}

	// Cleanup
	db.close();
	rmSync(dbPath);
}

verify().catch((e) => {
	console.error(e);
	process.exit(1);
});
