import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";

async function verifyMatrix() {
	console.log("🧩 MCP Capability Bingo - Diagnostic Sequence");
	console.log("==========================================");

	const db = ResonanceDB.init();
	const vectorEngine = new VectorEngine(db.getRawDb());

	const report: Record<string, string> = {};

	// --- CELL A2: SQL / Read Node ---
	console.log("\n[A2] Testing SQL/Read Node (getNodes)...");
	try {
		const nodes = db.getNodes({ domain: "test" }); // Get first few
		if (nodes.length > 0) {
			report.A2 = `✅ PASS (${nodes.length} nodes found)`;
			console.log(`   Success: Found node ${nodes[0]?.id}`);
		} else {
			report.A2 = "❌ FAIL (No nodes returned)";
		}
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		report.A2 = `❌ FAIL (${msg})`;
	}

	// --- CELL B3: Graph / Explore Links ---
	console.log("\n[B3] Testing Graph/Explore Links (SQL Join)...");
	try {
		// Find a node that has edges
		const seed = db
			.getRawDb()
			.query("SELECT source FROM edges LIMIT 1")
			.get() as { source: string };
		if (seed) {
			const edges = db
				.getRawDb()
				.query("SELECT target, type FROM edges WHERE source = ?")
				.all(seed.source) as Array<{ target: string; type: string }>;
			if (edges.length > 0) {
				report.B3 = `✅ PASS (Traversed ${edges.length} edges from ${seed.source})`;
				console.log(`   Success: Found edges for ${seed.source}`);
			} else {
				report.B3 = "⚠️ WARN (Node found but no edges?)";
			}
		} else {
			report.B3 = "⚠️ SKIP (No edges in DB)";
		}
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		report.B3 = `❌ FAIL (${msg})`;
	}

	// --- CELL C1: Vector Search ---
	console.log("\n[C1] Testing Vector Search...");
	try {
		// We assume "pipeline" is a good term based on previous context
		const results = await vectorEngine.search("pipeline", 5);
		if (results.length > 0) {
			report.C1 = `✅ PASS (Found ${results.length} matches)`;
			console.log(
				`   Top match: ${results[0]?.id} (${results[0]?.score.toFixed(3)})`,
			);
		} else {
			report.C1 = "❌ FAIL (Empty results)";
			// Dig deeper: Are there vectors?
			const vecCount = (
				db
					.getRawDb()
					.query("SELECT COUNT(*) as c FROM nodes WHERE embedding IS NOT NULL")
					.get() as { c: number }
			).c;
			console.log(`   Diagnostic: DB has ${vecCount} vectors.`);
		}
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		report.C1 = `❌ FAIL (${msg})`;
		console.error(e);
	}

	// --- CELL D1: FTS Search ---
	// [REMOVED] Feature removed in Hollow Node migration.
	// Vector + Graph is the new reality.

	// --- CELL B4: Stats ---
	console.log("\n[B4] Testing Stats Resource...");
	try {
		const stats = db.getStats();
		if (stats.nodes > 0) {
			report.B4 = `✅ PASS (Nodes: ${stats.nodes}, Edges: ${stats.edges})`;
		} else {
			report.B4 = "❌ FAIL (Zero stats)";
		}
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		report.B4 = `❌ FAIL (${msg})`;
	}

	console.log("\n==========================================");
	console.log("BINGO CARD RESULTS:");
	console.table(report);
}

verifyMatrix().catch(console.error);
