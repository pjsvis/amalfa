import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

console.log("--- Starting Node Connection Debugger ---");

// --- Configuration ---
const searchTerm = "OH-106: Forced Stubbornness Protocol (FSP)"; // The problematic term

// --- Database Connection ---
const db = DatabaseFactory.connectToResonance({ readonly: true });

try {
	// 1. Find the exact node ID for the given label
	console.log(`Searching for node with label: "${searchTerm}"`);
	const nodeQuery = db.query(
		`SELECT id, label FROM nodes WHERE label = ? LIMIT 1`,
	);
	const nodeResult = nodeQuery.get(searchTerm) as {
		id: string;
		label: string;
	} | null;

	if (!nodeResult) {
		console.error("❌ Node not found in the database.");
		process.exit(1);
	}

	const nodeId = nodeResult.id;
	console.log(`✅ Found Node -> ID: ${nodeId}, Label: ${nodeResult.label}`);

	// 2. Find all edges connected to this node
	console.log(`\nSearching for all edges connected to ID: "${nodeId}"`);
	const edgeQuery = db.query(
		`SELECT * FROM edges WHERE source = ? OR target = ?`,
	);
	const edgeResults = edgeQuery.all(nodeId, nodeId);

	if (edgeResults.length === 0) {
		console.log("-> ⚠️  No edges found for this node.");
	} else {
		console.log(`-> ✅ Found ${edgeResults.length} edge(s):`);
		console.table(edgeResults);
	}

	// 3. Re-run the logic from extract_terms.ts for just this one node
	console.log(
		`\nRe-running the 'neighbor_count' query from extract_terms.ts...`,
	);
	const validationQuery = db.query(`
    SELECT
        id,
        COUNT(DISTINCT neighbor) as neighbor_count
    FROM (
        SELECT source as id, target as neighbor FROM edges
        UNION
        SELECT target as id, source as neighbor FROM edges
    )
    WHERE id = ?
    GROUP BY id
  `);

	const validationResult = validationQuery.get(nodeId) as {
		id: string;
		neighbor_count: number;
	} | null;

	if (validationResult) {
		console.log("-> Validation Query Result:");
		console.table([validationResult]);
		if (validationResult.neighbor_count < 2) {
			console.log(
				`-> 🧐 ANALYSIS: The query correctly identifies this node has only ${validationResult.neighbor_count} neighbor(s). This is less than the required 2.`,
			);
		} else {
			console.log(
				`-> 🤔 ANALYSIS: The query thinks this node has ${validationResult.neighbor_count} neighbors, which is >= 2.`,
			);
		}
	} else {
		console.log(
			`-> 🧐 ANALYSIS: The validation query returned no results for this node, meaning it has 0 neighbors.`,
		);
	}
} catch (error) {
	console.error("\n❌ An unexpected error occurred:", error);
} finally {
	db.close();
	console.log("\n--- Debugger Finished ---");
}
