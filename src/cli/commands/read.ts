import { GraphEngine } from "@src/core/GraphEngine";
import { GraphGardener } from "@src/core/GraphGardener";
import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";
import { checkDatabase, getDbPath } from "../utils";

export async function cmdRead(args: string[]) {
	// Parse arguments
	const nodeId = args.find((arg) => !arg.startsWith("--"));
	const jsonOutput = args.includes("--json");

	// Validate
	if (!nodeId) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: "Missing node ID argument",
					usage: "amalfa read <node-id> [--json]",
				}),
			);
		} else {
			console.error("❌ Error: Missing node ID argument");
			console.error("\nUsage: amalfa read <node-id> [--json]");
			console.error("\nExamples:");
			console.error("  amalfa read docs/README.md");
			console.error('  amalfa read "playbooks/oauth-patterns.md"');
			console.error("  amalfa read docs/README.md --json");
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
	const vectorEngine = new VectorEngine(db.getRawDb());
	const graphEngine = new GraphEngine();

	try {
		await graphEngine.load(db.getRawDb());
		const gardener = new GraphGardener(db, graphEngine, vectorEngine);

		// Get content
		const content = await gardener.getContent(nodeId);

		if (!content) {
			if (jsonOutput) {
				console.error(
					JSON.stringify({
						error: "Node not found",
						node_id: nodeId,
						suggestion:
							"Check the node ID. Use 'amalfa search' to find documents.",
					}),
				);
			} else {
				console.error(`❌ Node not found: ${nodeId}`);
				console.error(
					"\n💡 Tip: Use 'amalfa search <query>' to find documents",
				);
			}
			process.exit(1);
		}

		// Output
		if (jsonOutput) {
			console.log(
				JSON.stringify({
					id: nodeId,
					content,
				}),
			);
		} else {
			// Human-readable output with header
			console.log(`\n📄 ${nodeId}`);
			console.log("─".repeat(80));
			console.log(content);
			console.log("─".repeat(80));
			console.log(
				`\n💡 Tip: Use 'amalfa explore ${nodeId}' to see related documents\n`,
			);
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
				"❌ Read failed:",
				error instanceof Error ? error.message : error,
			);
		}
		process.exit(1);
	} finally {
		db.close();
	}
}
