import { ResonanceDB } from "@src/resonance/db";
import { checkDatabase, getDbPath } from "../utils";

interface Edge {
	target: string;
	type: string;
}

export async function cmdExplore(args: string[]) {
	// Parse arguments
	const nodeId = args.find((arg) => !arg.startsWith("--"));
	
	// Handle both --relation=type and --relation type formats
	let relationType: string | undefined;
	const relationEqIdx = args.findIndex((arg) => arg.startsWith("--relation="));
	const relationSpaceIdx = args.findIndex((arg) => arg === "--relation");
	
	if (relationEqIdx !== -1) {
		relationType = args[relationEqIdx]?.split("=")[1];
	} else if (relationSpaceIdx !== -1 && args[relationSpaceIdx + 1]) {
		relationType = args[relationSpaceIdx + 1];
	}
	
	const jsonOutput = args.includes("--json");

	// Validate
	if (!nodeId) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: "Missing node ID argument",
					usage: "amalfa explore <node-id> [--relation type] [--json]",
				}),
			);
		} else {
			console.error("❌ Error: Missing node ID argument");
			console.error("\nUsage: amalfa explore <node-id> [--relation type] [--json]");
			console.error("\nExamples:");
			console.error("  amalfa explore docs/README.md");
			console.error('  amalfa explore "brief-auth" --relation references');
			console.error("  amalfa explore docs/README.md --json");
			console.error(
				"\n💡 Tip: Get node IDs from 'amalfa search' results",
			);
		}
		process.exit(1);
	}

	// Check database
	if (!(await checkDatabase())) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: "Database not found",
					suggestion: "Run 'amalfa init' first",
				}),
			);
		} else {
			console.error("❌ Database not found. Run 'amalfa init' first.");
		}
		process.exit(1);
	}

	// Connect to database
	const dbPath = await getDbPath();
	const db = new ResonanceDB(dbPath);

	try {
		// Get edges using raw SQL (same as MCP implementation)
		const allEdges = db
			.getRawDb()
			.query("SELECT target, type FROM edges WHERE source = ?")
			.all(nodeId) as Edge[];
		
		if (!allEdges || allEdges.length === 0) {
			if (jsonOutput) {
				console.log(JSON.stringify([]));
			} else {
				console.log(`\n🔗 No outgoing links found for: ${nodeId}\n`);
				console.log("This node either:");
				console.log("  - Has no explicit links to other documents");
				console.log("  - Doesn't exist in the graph");
				console.log("\n💡 Tip: Use 'amalfa read' to verify the node exists");
			}
			process.exit(0);
		}

		// Filter by relation type if specified
		const edges = relationType
			? allEdges.filter((e: Edge) => e.type === relationType)
			: allEdges;

		// Output
		if (jsonOutput) {
			console.log(JSON.stringify(edges, null, 2));
		} else {
			// Human-readable output
			if (edges.length === 0 && relationType) {
				console.log(
					`\n🔗 No links of type "${relationType}" found for: ${nodeId}\n`,
				);
				console.log("Available relation types:");
				const types = new Set(allEdges.map((e: Edge) => e.type));
				for (const type of types) {
					console.log(`  - ${type}`);
				}
				console.log();
			} else {
				const title = relationType
					? `Links (${relationType})`
					: "All Links";
				console.log(`\n🔗 ${title} from: ${nodeId}\n`);

				// Group by type
				const byType = new Map<string, Edge[]>();
				for (const edge of edges) {
					const e = edge as Edge;
					if (!byType.has(e.type)) {
						byType.set(e.type, []);
					}
					byType.get(e.type)?.push(e);
				}

				for (const [type, typeEdges] of byType) {
					console.log(`${type.toUpperCase()}:`);
					for (const edge of typeEdges) {
						console.log(`  → ${edge.target}`);
					}
					console.log();
				}

				console.log(
					`💡 Tip: Use 'amalfa read <target>' to view linked documents\n`,
				);
			}
		}
	} catch (error) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: error instanceof Error ? error.message : String(error),
					node_id: nodeId,
				}),
			);
		} else {
			console.error(
				"❌ Explore failed:",
				error instanceof Error ? error.message : error,
			);
		}
		process.exit(1);
	} finally {
		db.close();
	}
}
