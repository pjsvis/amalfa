import { existsSync } from "node:fs";
import { GraphEngine } from "@src/core/GraphEngine";
import { ResonanceDB } from "@src/resonance/db";
import { getDbPath } from "../utils";

export async function cmdEnhance(args: string[]) {
	// Parse args
	const strategyArg = args.find((a) => a.startsWith("--strategy="));
	const strategy = strategyArg ? strategyArg.split("=")[1] : "help";
	const limitArg = args.find((a) => a.startsWith("--limit="));
	const limitStr = limitArg ? limitArg.split("=")[1] : "10";
	const limit = limitStr ? Number.parseInt(limitStr, 10) : 10;

	if (strategy === "help" || !strategy) {
		console.log(`
Enhance your knowledge graph with structural analysis strategies.

Usage:
  amalfa enhance --strategy=[strategy] [--limit=N]

Strategies:
  adamic-adar   Find "Friend-of-a-Friend" connections (missing links)
  pagerank      Identify "Pillar Content" (high authority nodes)
  communities   List "Global Context" clusters (Louvain communities)

Examples:
  amalfa enhance --strategy=adamic-adar --limit=5
  amalfa enhance --strategy=pagerank
`);
		return;
	}

	// Load DB
	const dbPath = await getDbPath();
	if (!existsSync(dbPath)) {
		console.error("❌ Database not found. Run 'amalfa init' first.");
		process.exit(1);
	}

	const db = new ResonanceDB(dbPath);
	const graph = new GraphEngine();

	try {
		await graph.load(db.getRawDb());

		if (strategy === "adamic-adar") {
			console.log(`🔍 Finding structural gaps (Adamic-Adar)...`);
			const candidates = graph.findStructuralCandidates(limit);

			if (candidates.length === 0) {
				console.log("✅ No significant structural gaps found.");
			} else {
				console.log("\nProposed Edges (based on shared neighbors):");
				console.log("Score | Source <-> Target");
				console.log("-".repeat(40));
				for (const c of candidates) {
					console.log(`${c.score.toFixed(2)}  | ${c.source} <-> ${c.target}`);
				}
			}
		} else if (strategy === "pagerank") {
			console.log(`🏛️  Identifying Pillar Content (PageRank)...`);
			const pillars = graph.findPillars(limit);

			console.log("\nTop Authority Nodes:");
			console.log("Score  | Degree | ID");
			console.log("-".repeat(40));
			for (const p of pillars) {
				console.log(
					`${p.score.toFixed(4)} | ${p.degree.toString().padEnd(6)} | ${p.id}`,
				);
			}
		} else if (strategy === "communities") {
			console.log(`🌍 Identifying Global Context (Louvain)...`);
			const communities = graph.getCommunities();
			const clusterIds = Object.keys(communities)
				.sort(
					(a, b) =>
						(communities[b]?.length || 0) - (communities[a]?.length || 0),
				)
				.slice(0, limit);

			console.log("\nTop Communities:");
			for (const id of clusterIds) {
				const members = communities[id] || [];
				console.log(`\nCluster ${id} (${members.length} nodes):`);
				console.log(
					members.slice(0, 5).join(", ") + (members.length > 5 ? "..." : ""),
				);
			}
		} else {
			console.error(`❌ Unknown strategy: ${strategy}`);
			process.exit(1);
		}
	} catch (error) {
		console.error("❌ Enhancement failed:", error);
		process.exit(1);
	} finally {
		db.close();
	}
}
